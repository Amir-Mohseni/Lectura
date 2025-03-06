/**
 * API Routes
 * Handles API endpoints for transcription and note generation
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const transcriptionService = require('../services/transcriptionService');
const notesGenerationService = require('../services/notesGenerationService');
const processingService = require('../services/processingService');

// Set up storage for uploaded files
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        const uploadDir = path.join(__dirname, '../../uploads');
        
        // Create uploads directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function(req, file, cb) {
        // Generate a unique filename with original extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

// Filter for accepted file types
const fileFilter = (req, file, cb) => {
    // Only accept audio files for now
    if (file.fieldname === 'audio') {
        // Check if the file is an audio file
        const mimeType = file.mimetype;
        if (mimeType.startsWith('audio/') || 
            mimeType === 'application/octet-stream') {
            cb(null, true);
        } else {
            cb(new Error('Only audio files are allowed for audio uploads'), false);
        }
    } else if (file.fieldname === 'slides') {
        // Check if the file is a PDF or PowerPoint
        const mimeType = file.mimetype;
        if (mimeType === 'application/pdf' || 
            mimeType === 'application/vnd.ms-powerpoint' ||
            mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF and PowerPoint files are allowed for slides'), false);
        }
    } else {
        cb(new Error('Unexpected file field'), false);
    }
};

// Set up multer middleware
const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100 MB limit
    }
});

/**
 * @route POST /api/upload
 * @description Upload audio file and optionally slides
 * @access Public
 */
router.post('/upload', upload.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'slides', maxCount: 1 }
]), async (req, res) => {
    try {
        // Check if audio file was uploaded
        if (!req.files || !req.files.audio) {
            return res.status(400).json({
                success: false,
                message: 'No audio file uploaded'
            });
        }
        
        const audioFile = req.files.audio[0];
        const slidesFile = req.files.slides ? req.files.slides[0] : null;
        
        // Return the file information
        res.json({
            success: true,
            files: {
                audio: {
                    filename: audioFile.filename,
                    originalName: audioFile.originalname,
                    path: audioFile.path,
                    size: audioFile.size
                },
                slides: slidesFile ? {
                    filename: slidesFile.filename,
                    originalName: slidesFile.originalname,
                    path: slidesFile.path,
                    size: slidesFile.size
                } : null
            }
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            message: 'File upload failed',
            error: error.message
        });
    }
});

/**
 * @route POST /api/transcribe
 * @description Transcribe an uploaded audio file
 * @access Public
 */
router.post('/transcribe', async (req, res) => {
    try {
        const { audioPath, whisperModel } = req.body;
        
        if (!audioPath) {
            return res.status(400).json({
                success: false,
                message: 'Audio path is required'
            });
        }
        
        // Ensure the audio file exists
        if (!fs.existsSync(audioPath)) {
            return res.status(404).json({
                success: false,
                message: 'Audio file not found'
            });
        }
        
        // Transcribe the audio
        const transcription = await transcriptionService.transcribeAudio(audioPath, whisperModel || 'default');
        
        res.json({
            success: true,
            audioPath,
            transcription
        });
    } catch (error) {
        console.error('Transcription error:', error);
        res.status(500).json({
            success: false,
            message: 'Transcription failed',
            error: error.message
        });
    }
});

/**
 * @route POST /api/generate-notes
 * @description Generate notes from a transcription
 * @access Public
 */
router.post('/generate-notes', async (req, res) => {
    try {
        const {
            transcription,
            title,
            apiProvider,
            model,
            apiKey,
            apiEndpoint,
            apiModelName
        } = req.body;

        // Check for required fields
        if (!transcription) {
            return res.status(400).json({
                success: false,
                message: 'Transcription is required'
            });
        }

        console.log(`Generating notes for "${title || 'Untitled'}" using provider: ${apiProvider || 'default'}`);

        // Generate notes from the transcription
        const notes = await notesGenerationService.generateNotes(transcription, {
            title: title || 'Lecture Notes',
            apiProvider,
            model,
            apiKey,
            apiEndpoint,
            apiModelName
        });

        res.json({
            success: true,
            notes
        });
    } catch (error) {
        console.error('Error generating notes:', error);
        res.status(500).json({
            success: false,
            message: `Error generating notes: ${error.message}`
        });
    }
});

/**
 * @route POST /api/process
 * @description Process audio file: upload, transcribe, and generate notes
 * @access Public
 */
router.post('/process', upload.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'slides', maxCount: 1 }
]), async (req, res) => {
    try {
        console.log('Received processing request');
        
        const {
            apiProvider,
            model,
            apiKey,
            apiEndpoint,
            apiModelName,
            whisperModel
        } = req.body;

        // Check if audio file was uploaded
        if (!req.files || !req.files.audio || !req.files.audio[0]) {
            return res.status(400).json({
                success: false,
                message: 'Audio file is required'
            });
        }

        const audioFile = req.files.audio[0];
        const slidesFile = req.files.slides ? req.files.slides[0] : null;

        console.log(`Processing audio file: ${audioFile.path}`);
        console.log(`Using whisper model: ${whisperModel || 'default'}`);
        
        // Process the audio file (and slides if available)
        let result;
        
        try {
            if (slidesFile) {
                // For future implementation
                console.log(`Processing with slides: ${slidesFile.path}`);
                result = await processingService.processAudioAndPdf(
                    audioFile.path,
                    slidesFile.path,
                    {
                        apiProvider,
                        model,
                        apiKey,
                        apiEndpoint,
                        apiModelName,
                        whisperModel
                    }
                );
            } else {
                result = await processingService.processAudio(
                    audioFile.path,
                    {
                        apiProvider,
                        model,
                        apiKey,
                        apiEndpoint,
                        apiModelName,
                        whisperModel
                    }
                );
            }
            
            console.log('Processing completed successfully');
            
            res.json({
                success: true,
                transcription: result.transcription,
                notes: result.notes
            });
        } catch (processingError) {
            console.error('Error during processing:', processingError);
            
            // Try to clean up the uploaded files
            try {
                if (audioFile && audioFile.path) {
                    fs.unlinkSync(audioFile.path);
                }
                if (slidesFile && slidesFile.path) {
                    fs.unlinkSync(slidesFile.path);
                }
            } catch (cleanupError) {
                console.warn('Error cleaning up files:', cleanupError);
            }
            
            throw processingError;
        }
    } catch (error) {
        console.error('Error processing files:', error);
        res.status(500).json({
            success: false,
            message: `Error processing files: ${error.message}`
        });
    }
});

module.exports = router; 