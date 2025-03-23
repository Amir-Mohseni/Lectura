/**
 * Processing Service
 * Orchestrates the flow from audio file to transcription to notes generation
 */

const path = require('path');
const fs = require('fs');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const fsPromises = require('fs').promises;
const os = require('os');
const transcriptionService = require('./transcriptionService');
const fileStorageService = require('./fileStorageService');

class ProcessingService {
  /**
   * Process an audio file to generate notes
   * 
   * @param {string} audioFilePath - Path to the audio file
   * @param {object} options - Processing options
   * @param {string} options.apiProvider - API provider to use for note generation
   * @param {string} options.model - Model to use for note generation
   * @param {string} options.apiKey - API key for the provider
   * @param {string} options.apiEndpoint - Custom API endpoint URL
   * @param {string} options.apiModelName - Custom model name
   * @param {string} options.whisperModel - Whisper model to use for transcription
   * @param {string} options.audioId - Optional existing audio ID for regeneration
   * @returns {Promise<object>} Object containing transcription, notes, and audioId
   */
  async processAudio(audioFilePath, options = {}) {
    try {
      console.log(`Processing audio file: ${audioFilePath}`);
      
      let transcriptionText;
      let audioId = options.audioId;
      let rawTitle = path.basename(audioFilePath, path.extname(audioFilePath));
      
      // Clean up the title by removing timestamps and other noise
      let title = this.cleanTitle(rawTitle);
      
      // If audioId is provided, this is a regeneration request
      if (audioId) {
        console.log(`Regenerating notes for audio ID: ${audioId}`);
        // Get the existing transcription
        transcriptionText = await fileStorageService.getTranscription(audioId);
        const metadata = await fileStorageService.getMetadata(audioId);
        title = metadata.title || title;
        
        console.log(`Retrieved existing transcription for ${title}`);
      } else {
        // Step 1: Transcribe the audio file
        const whisperModel = options.whisperModel === 'default' ? null : options.whisperModel;
        console.log(`Using whisper model: ${whisperModel || 'default'}`);
        
        const transcriptionResult = await transcriptionService.transcribeAudio(
          audioFilePath, 
          whisperModel
        );
        
        // Step 2: Extract the text from the transcription
        transcriptionText = transcriptionResult.text || '';
        
        if (!transcriptionText) {
          throw new Error('Transcription failed or returned empty text');
        }
        
        console.log(`Transcription complete: ${transcriptionText.substring(0, 50)}...`);
        
        // Save the transcription to our data store
        const storageResult = await fileStorageService.saveTranscription(
          audioFilePath,
          transcriptionText,
          title
        );
        
        audioId = storageResult.audioId;
        console.log(`Saved transcription with audio ID: ${audioId}`);
      }
      
      // Step 3: Generate notes from the transcription using Python
      // Create a temporary file to store the transcription text
      const tempTranscriptionPath = path.join(
        os.tmpdir(), 
        `temp_transcription_${Date.now()}.txt`
      );
      
      await fsPromises.writeFile(tempTranscriptionPath, transcriptionText);
      
      try {
        // Create a temporary Python script for generating notes
        const tempScriptPath = path.join(os.tmpdir(), `generate_notes_${Date.now()}.py`);
        
        // Prepare the script content
        const scriptContent = `
import sys
import os
import dotenv

# Load environment variables
dotenv.load_dotenv()

# Add project root to Python path
sys.path.append("${process.cwd().replace(/\\/g, '\\\\')}")
sys.path.append("src")

# Import the notes generator
import notes_generator

# Read the transcription from file
with open("${tempTranscriptionPath.replace(/\\/g, '\\\\')}", "r") as f:
    transcription = f.read()

# Set parameters for notes generation
title = """${title.replace(/"/g, '\\"')}"""
api_provider = "${options.apiProvider || 'default'}"
${options.model ? `model = "${options.model}"` : 'model = None'}
${options.apiKey ? `api_key = "${options.apiKey}"` : 'api_key = None'}
${options.apiEndpoint ? `api_endpoint = "${options.apiEndpoint}"` : 'api_endpoint = None'}
${options.apiModelName ? `api_model_name = "${options.apiModelName}"` : 'api_model_name = None'}

try:
    # Generate notes
    notes = notes_generator.generate_notes(
        transcription, 
        title, 
        api_provider, 
        model, 
        api_key, 
        api_endpoint, 
        api_model_name
    )
    
    # Print the notes to stdout
    print(notes)
except Exception as e:
    print(f"Error generating notes: {str(e)}", file=sys.stderr)
    sys.exit(1)
`;
        
        // Write the script to a temporary file
        await fsPromises.writeFile(tempScriptPath, scriptContent);
        
        // Execute the Python script
        console.log(`Generating notes with provider: ${options.apiProvider || 'default'}`);
        const { stdout, stderr } = await exec(`python "${tempScriptPath}"`);
        
        if (stderr) {
          // Log stderr but don't treat it as an error unless it contains "Error:"
          if (stderr.includes("Error:")) {
            console.error(`Notes generation error: ${stderr}`);
            throw new Error(stderr);
          } else {
            // Just log informational stderr messages
            console.log(`Notes generation info: ${stderr}`);
          }
        }
        
        const notes = stdout.trim();
        
        // Save the generated notes to our data store
        await fileStorageService.saveNotes(audioId, notes);
        console.log(`Saved notes for audio ID: ${audioId}`);
        
        // Clean up temporary files
        await fsPromises.unlink(tempScriptPath).catch(err => {
          console.warn(`Warning: Could not delete temporary script ${tempScriptPath}:`, err);
        });
        
        await fsPromises.unlink(tempTranscriptionPath).catch(err => {
          console.warn(`Warning: Could not delete temporary file ${tempTranscriptionPath}:`, err);
        });
        
        return {
          transcription: transcriptionText,
          notes,
          audioId
        };
      } catch (error) {
        console.error('Error generating notes:', error);
        
        // Clean up the temporary file even if there was an error
        await fsPromises.unlink(tempTranscriptionPath).catch(() => {});
        
        // Create basic fallback notes
        const fallbackNotes = `# Notes: ${title}\n\n## Transcription\n\n${transcriptionText.substring(0, 500)}...\n\n(Note: Automated note generation failed. This is the raw transcription.)`;
        
        // Still save the fallback notes
        await fileStorageService.saveNotes(audioId, fallbackNotes).catch(err => {
          console.warn(`Warning: Could not save fallback notes:`, err);
        });
        
        // Return a basic fallback if notes generation fails
        return {
          transcription: transcriptionText,
          notes: fallbackNotes,
          audioId
        };
      }
    } catch (error) {
      console.error('Error in processing service:', error);
      throw error;
    }
  }
  
  /**
   * Process both audio and PDF files to generate enhanced notes (for future use)
   * 
   * @param {string} audioFilePath - Path to the audio file
   * @param {string} pdfFilePath - Path to the PDF file
   * @param {object} options - Processing options
   * @returns {Promise<object>} Object containing transcription, pdf content, and notes
   */
  async processAudioAndPdf(audioFilePath, pdfFilePath, options = {}) {
    // For future implementation
    // Step 1: Process the audio as usual
    const { transcription, notes: audioNotes, audioId } = await this.processAudio(audioFilePath, options);
    
    // Step 2: Extract content from PDF (to be implemented)
    const pdfContent = "PDF processing will be implemented in the future";
    
    // Step 3: Generate enhanced notes using both sources
    // This is a placeholder for future implementation
    const enhancedNotes = audioNotes + "\n\n## From Slides\n\nSlide content will be integrated in future updates.";
    
    // Save the enhanced notes
    await fileStorageService.saveNotes(audioId, enhancedNotes);
    
    return {
      transcription,
      pdfContent,
      notes: enhancedNotes,
      audioId
    };
  }
  
  /**
   * Regenerate notes for an existing audio file
   * 
   * @param {string} audioId - The unique audio ID for regeneration
   * @param {object} options - Processing options
   * @returns {Promise<object>} Object containing transcription and notes
   */
  async regenerateNotes(audioId, options = {}) {
    try {
      console.log(`Regenerating notes for audio ID: ${audioId}`);
      
      // Get the metadata for the audio file
      const metadata = await fileStorageService.getMetadata(audioId);
      
      // Check if the original file still exists
      const audioFilePath = metadata.originalFilePath;
      
      // Combine options with the audioId
      const regenerateOptions = {
        ...options,
        audioId
      };
      
      // Use the processAudio method with the audioId option
      return await this.processAudio(audioFilePath, regenerateOptions);
    } catch (error) {
      console.error(`Error regenerating notes for audio ID ${audioId}:`, error);
      throw error;
    }
  }

  /**
   * Clean a title extracted from a filename
   * 
   * @param {string} rawTitle - The raw title extracted from the filename
   * @returns {string} - A cleaned title
   */
  cleanTitle(rawTitle) {
    let title = rawTitle;
    
    // Remove numeric IDs like Audio-1742743650086-257886662
    title = title.replace(/(-|_)\d{10,16}(-|_)\d+/g, ""); // Removes long numeric IDs
    title = title.replace(/\d{10,16}(-|_)\d+/g, ""); // Removes IDs without separator
    title = title.replace(/(-|_)\d{10,16}/g, ""); // Removes just the ID
    
    // Remove other timestamp-like patterns
    title = title.replace(/(-|_)\d{6,}(-|_)\d+/g, ""); // Removes any sequence of 6+ digits
    title = title.replace(/\d{6,}(-|_)\d+/g, ""); // Without separator
    title = title.replace(/(-|_)\d{6,}/g, ""); // Just the digits with separator
    
    // Remove common audio recording prefixes
    title = title.replace(/^(audio|recording|voice|sound|lecture)(-|_|\.)/i, "");
    
    // Remove any leading numbers and separators
    title = title.replace(/^\d+(-|_|\.)/g, "");
    
    // Replace underscores and hyphens with spaces
    title = title.replace(/[_-]/g, " ");
    
    // Remove multiple spaces and trim
    title = title.replace(/\s{2,}/g, " ").trim();
    
    // If title is empty after cleaning, use a default title
    if (!title || title.length < 2) {
      title = "Lecture Notes";
    }
    
    // Capitalize first letter of each word
    title = title.replace(/\b\w/g, l => l.toUpperCase());
    
    return title;
  }
}

module.exports = new ProcessingService(); 