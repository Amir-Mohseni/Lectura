/**
 * Transcription Service
 * Handles audio file transcription using the audio_processor module
 */

const path = require('path');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const fs = require('fs');
const fsPromises = require('fs').promises;
const os = require('os');

class TranscriptionService {
    /**
     * Transcribe an audio file using the audio_processor module
     * 
     * @param {string} audioFilePath - Path to the audio file
     * @param {string|null} whisperModel - Optional whisper model to use
     * @param {number} retryCount - Number of retry attempts (default: 3)
     * @returns {Promise<object>} Transcription result
     */
    async transcribeAudio(audioFilePath, whisperModel = null, retryCount = 3) {
        try {
            console.log(`Transcribing audio file: ${audioFilePath}`);
            
            // Create a temporary file to store the transcription result
            const tempOutputPath = path.join(
                path.dirname(audioFilePath), 
                `transcription_${Date.now()}.json`
            );
            
            // Create a temporary Python script instead of using -c
            const tempScriptPath = path.join(os.tmpdir(), `transcribe_${Date.now()}.py`);
            
            // Create the Python script content
            const scriptContent = `
import json
import sys
import os
import dotenv

# Load environment variables
dotenv.load_dotenv()

# Add project root to Python path
sys.path.append("${process.cwd().replace(/\\/g, '\\\\')}")
sys.path.append("src")

# Import the audio processor module
from audio_processor import get_transcription_text, transcribe_audio

# Define file paths
audio_path = "${audioFilePath.replace(/\\/g, '\\\\')}"
output_path = "${tempOutputPath.replace(/\\/g, '\\\\')}"

# Transcribe with the specified model or default
try:
    ${whisperModel 
        ? `result = transcribe_audio(audio_path, "${whisperModel}")
    text = get_transcription_text(audio_path, "${whisperModel}")`
        : `result = transcribe_audio(audio_path)
    text = get_transcription_text(audio_path)`}
    
    # Check for NaN values in the result to avoid JSON parsing issues
    import re
    import json as json_lib
    
    # Convert result to JSON string
    result_str = json_lib.dumps(result)
    
    # Fix any NaN values (which aren't valid JSON)
    result_str = re.sub(r':\\s*NaN', ': null', result_str)
    
    # Convert back to dict
    result = json_lib.loads(result_str)
    
    # Output the results
    output = {"full_result": result, "text": text}
    with open(output_path, "w") as f:
        json.dump(output, f)
    
    print(f"Transcription completed successfully")
except Exception as e:
    print(f"Error: {str(e)}", file=sys.stderr)
    sys.exit(1)
`;
            
            // Write the script to a temporary file
            await fsPromises.writeFile(tempScriptPath, scriptContent);
            
            // Execute the Python script
            console.log(`Executing transcription script: ${tempScriptPath}`);
            const { stdout, stderr } = await exec(`python "${tempScriptPath}"`);
            
            if (stdout) console.log('Transcription stdout:', stdout);
            if (stderr) {
                // Log stderr but don't treat it as an error unless it contains "Error:"
                if (stderr.includes("Error:")) {
                    console.error(`Transcription error: ${stderr}`);
                    throw new Error(stderr);
                } else {
                    // Just log informational stderr messages
                    console.log(`Transcription info: ${stderr}`);
                }
            }
            
            // Read the transcription result
            const transcriptionData = await fsPromises.readFile(tempOutputPath, 'utf8');
            const result = JSON.parse(transcriptionData);
            
            // Clean up temporary files
            await fsPromises.unlink(tempScriptPath).catch(err => {
                console.warn(`Warning: Could not delete temporary script ${tempScriptPath}:`, err);
            });
            
            await fsPromises.unlink(tempOutputPath).catch(err => {
                console.warn(`Warning: Could not delete temporary output ${tempOutputPath}:`, err);
            });
            
            return result.full_result;
        } catch (error) {
            console.error(`Transcription attempt failed: ${error.message}`);
            
            // Check for JSON parsing errors with "NaN" or other conditions that warrant a retry
            const isJsonNaNError = 
                error.message.includes('Unexpected token') && 
                (error.message.includes('NaN') || error.message.includes('is not valid JSON'));
                
            // If it's a retryable error and we have retries left
            if ((isJsonNaNError) && retryCount > 0) {
                console.log(`Retrying transcription, ${retryCount} attempts left...`);
                // Wait a short delay before retrying
                await new Promise(resolve => setTimeout(resolve, 1000));
                // Retry with one less retry count
                return this.transcribeAudio(audioFilePath, whisperModel, retryCount - 1);
            }
            
            throw new Error(`Failed to transcribe audio: ${error.message}`);
        }
    }
    
    /**
     * Get information about a transcription
     * @param {string} audioFilePath - Path to the audio file
     * @returns {Promise<object>} - Information about the transcription
     */
    async getTranscriptionInfo(audioFilePath) {
        try {
            // For demonstration, we're just returning basic info about the file
            const stats = fs.statSync(audioFilePath);
            
            return {
                fileName: path.basename(audioFilePath),
                fileSize: stats.size,
                lastModified: stats.mtime
            };
        } catch (error) {
            console.error('Error getting transcription info:', error);
            throw new Error(`Failed to get transcription info: ${error.message}`);
        }
    }
}

module.exports = new TranscriptionService();