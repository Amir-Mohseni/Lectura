/**
 * File Storage Service
 * Handles persistent storage of transcriptions and generated notes
 */

const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

class FileStorageService {
  constructor() {
    this.dataDir = path.join(__dirname, '../../src/data');
  }

  /**
   * Initialize the data directory
   */
  async init() {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
    } catch (error) {
      console.error('Error initializing data directory:', error);
      throw error;
    }
  }

  /**
   * Generate a unique ID for an audio file
   * 
   * @param {string} audioFilePath - Path to the audio file
   * @param {string} title - Optional title for the audio
   * @returns {string} - Unique ID
   */
  generateAudioId(audioFilePath, title = '') {
    const basename = path.basename(audioFilePath);
    const timestamp = Date.now();
    const hash = crypto.createHash('md5').update(`${basename}-${timestamp}`).digest('hex').substring(0, 8);
    
    // Create a sanitized version of the title for the folder name
    let sanitizedTitle = '';
    if (title) {
      sanitizedTitle = title.toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 30);
      sanitizedTitle = `-${sanitizedTitle}`;
    }
    
    return `${hash}${sanitizedTitle}`;
  }

  /**
   * Get the data directory for an audio file
   * 
   * @param {string} audioId - Unique ID for the audio file
   * @returns {string} - Path to the data directory
   */
  getAudioDataDir(audioId) {
    return path.join(this.dataDir, audioId);
  }

  /**
   * Save transcription for an audio file
   * 
   * @param {string} audioFilePath - Path to the audio file
   * @param {string} transcription - Transcription text
   * @param {string} title - Optional title for better identification
   * @returns {Promise<object>} - Object containing the audio ID and directory path
   */
  async saveTranscription(audioFilePath, transcription, title = '') {
    try {
      await this.init();
      
      const audioId = this.generateAudioId(audioFilePath, title);
      const audioDataDir = this.getAudioDataDir(audioId);
      
      // Create directory for this audio file
      await fs.mkdir(audioDataDir, { recursive: true });
      
      // Save metadata
      const metadata = {
        originalFilePath: audioFilePath,
        originalFileName: path.basename(audioFilePath),
        title: title || path.basename(audioFilePath, path.extname(audioFilePath)),
        dateProcessed: new Date().toISOString(),
        audioId
      };
      
      await fs.writeFile(
        path.join(audioDataDir, 'metadata.json'),
        JSON.stringify(metadata, null, 2)
      );
      
      // Save transcription
      await fs.writeFile(
        path.join(audioDataDir, 'transcription.txt'),
        transcription
      );
      
      return {
        audioId,
        directory: audioDataDir
      };
    } catch (error) {
      console.error('Error saving transcription:', error);
      throw error;
    }
  }

  /**
   * Save generated notes for an audio file
   * 
   * @param {string} audioId - Unique ID for the audio file
   * @param {string} notes - Generated notes in markdown format
   * @returns {Promise<string>} - Path to the saved notes file
   */
  async saveNotes(audioId, notes) {
    try {
      const audioDataDir = this.getAudioDataDir(audioId);
      
      // Ensure directory exists
      await fs.mkdir(audioDataDir, { recursive: true });
      
      // Save notes
      const notesPath = path.join(audioDataDir, 'notes.md');
      await fs.writeFile(notesPath, notes);
      
      // Update metadata with notes timestamp
      try {
        const metadataPath = path.join(audioDataDir, 'metadata.json');
        const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));
        metadata.lastNotesGenerated = new Date().toISOString();
        await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
      } catch (error) {
        console.warn('Error updating metadata with notes timestamp:', error);
      }
      
      return notesPath;
    } catch (error) {
      console.error('Error saving notes:', error);
      throw error;
    }
  }

  /**
   * Get transcription for an audio file
   * 
   * @param {string} audioId - Unique ID for the audio file
   * @returns {Promise<string>} - Transcription text
   */
  async getTranscription(audioId) {
    try {
      const transcriptionPath = path.join(this.getAudioDataDir(audioId), 'transcription.txt');
      return await fs.readFile(transcriptionPath, 'utf-8');
    } catch (error) {
      console.error(`Error retrieving transcription for audio ID ${audioId}:`, error);
      throw error;
    }
  }

  /**
   * Get generated notes for an audio file
   * 
   * @param {string} audioId - Unique ID for the audio file
   * @returns {Promise<string>} - Generated notes
   */
  async getNotes(audioId) {
    try {
      const notesPath = path.join(this.getAudioDataDir(audioId), 'notes.md');
      return await fs.readFile(notesPath, 'utf-8');
    } catch (error) {
      console.error(`Error retrieving notes for audio ID ${audioId}:`, error);
      throw error;
    }
  }

  /**
   * Get metadata for an audio file
   * 
   * @param {string} audioId - Unique ID for the audio file
   * @returns {Promise<object>} - Metadata object
   */
  async getMetadata(audioId) {
    try {
      const metadataPath = path.join(this.getAudioDataDir(audioId), 'metadata.json');
      return JSON.parse(await fs.readFile(metadataPath, 'utf-8'));
    } catch (error) {
      console.error(`Error retrieving metadata for audio ID ${audioId}:`, error);
      throw error;
    }
  }

  /**
   * List all processed audio files
   * 
   * @returns {Promise<Array>} - Array of metadata objects
   */
  async listProcessedAudios() {
    try {
      await this.init();
      
      const directories = await fs.readdir(this.dataDir);
      const metadataList = [];
      
      for (const dir of directories) {
        try {
          const metadataPath = path.join(this.dataDir, dir, 'metadata.json');
          const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));
          metadataList.push(metadata);
        } catch (error) {
          console.warn(`Error reading metadata from directory ${dir}:`, error);
        }
      }
      
      return metadataList;
    } catch (error) {
      console.error('Error listing processed audios:', error);
      return [];
    }
  }
}

module.exports = new FileStorageService(); 