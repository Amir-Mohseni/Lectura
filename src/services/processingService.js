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
   * @returns {Promise<object>} Object containing transcription and notes
   */
  async processAudio(audioFilePath, options = {}) {
    try {
      console.log(`Processing audio file: ${audioFilePath}`);
      
      // Step 1: Transcribe the audio file
      const whisperModel = options.whisperModel === 'default' ? null : options.whisperModel;
      console.log(`Using whisper model: ${whisperModel || 'default'}`);
      
      const transcriptionResult = await transcriptionService.transcribeAudio(
        audioFilePath, 
        whisperModel
      );
      
      // Step 2: Extract the text from the transcription
      const transcriptionText = transcriptionResult.text || '';
      
      if (!transcriptionText) {
        throw new Error('Transcription failed or returned empty text');
      }
      
      console.log(`Transcription complete: ${transcriptionText.substring(0, 50)}...`);
      
      // Step 3: Generate notes from the transcription using Python
      const title = path.basename(audioFilePath, path.extname(audioFilePath));
      
      // Create a temporary file to store the transcription text
      const tempTranscriptionPath = path.join(
        path.dirname(audioFilePath), 
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
title = "${title}"
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
        
        // Clean up temporary files
        await fsPromises.unlink(tempScriptPath).catch(err => {
          console.warn(`Warning: Could not delete temporary script ${tempScriptPath}:`, err);
        });
        
        await fsPromises.unlink(tempTranscriptionPath).catch(err => {
          console.warn(`Warning: Could not delete temporary file ${tempTranscriptionPath}:`, err);
        });
        
        return {
          transcription: transcriptionText,
          notes
        };
      } catch (error) {
        console.error('Error generating notes:', error);
        
        // Clean up the temporary file even if there was an error
        await fsPromises.unlink(tempTranscriptionPath).catch(() => {});
        
        // Return a basic fallback if notes generation fails
        return {
          transcription: transcriptionText,
          notes: `# Notes: ${title}\n\n## Transcription\n\n${transcriptionText.substring(0, 500)}...\n\n(Note: Automated note generation failed. This is the raw transcription.)`
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
    const { transcription, notes: audioNotes } = await this.processAudio(audioFilePath, options);
    
    // Step 2: Extract content from PDF (to be implemented)
    const pdfContent = "PDF processing will be implemented in the future";
    
    // Step 3: Generate enhanced notes using both sources
    // This is a placeholder for future implementation
    const enhancedNotes = audioNotes + "\n\n## From Slides\n\nSlide content will be integrated in future updates.";
    
    return {
      transcription,
      pdfContent,
      notes: enhancedNotes
    };
  }
}

module.exports = new ProcessingService(); 