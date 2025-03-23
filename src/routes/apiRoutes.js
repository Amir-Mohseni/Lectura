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
const fileStorageService = require('../services/fileStorageService');

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
        
        // Store the transcription
        const title = path.basename(audioPath, path.extname(audioPath));
        const storageResult = await fileStorageService.saveTranscription(
            audioPath,
            transcription.text,
            title
        );
        
        res.json({
            success: true,
            audioPath,
            transcription,
            audioId: storageResult.audioId
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
            apiModelName,
            audioId,
            audioPath
        } = req.body;

        // If audioId is provided, use it to regenerate notes
        if (audioId) {
            console.log(`Regenerating notes for audio ID: ${audioId}`);
            const result = await processingService.regenerateNotes(audioId, {
                apiProvider,
                model,
                apiKey,
                apiEndpoint,
                apiModelName
            });
            
            return res.json({
                success: true,
                notes: result.notes,
                audioId
            });
        }

        // Check for required fields
        if (!transcription) {
            return res.status(400).json({
                success: false,
                message: 'Transcription is required'
            });
        }

        console.log(`Generating notes for "${title || 'Untitled'}" using provider: ${apiProvider || 'default'}`);

        // If we have an audioPath but no audioId, save the transcription
        let savedAudioId = audioId;
        if (audioPath && !audioId) {
            const storageResult = await fileStorageService.saveTranscription(
                audioPath,
                transcription,
                title
            );
            savedAudioId = storageResult.audioId;
        }

        // Generate notes from the transcription
        const notes = await notesGenerationService.generateNotes(transcription, {
            title: title || 'Lecture Notes',
            apiProvider,
            model,
            apiKey,
            apiEndpoint,
            apiModelName
        });

        // Save the notes if we have an audioId
        if (savedAudioId) {
            await fileStorageService.saveNotes(savedAudioId, notes);
        }

        res.json({
            success: true,
            notes,
            audioId: savedAudioId
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
 * @route POST /api/regenerate-notes
 * @description Regenerate notes for an existing audio file
 * @access Public
 */
router.post('/regenerate-notes', async (req, res) => {
    try {
        const { audioId, apiProvider, model, apiKey, apiEndpoint, apiModelName } = req.body;
        
        if (!audioId) {
            return res.status(400).json({
                success: false,
                message: 'Audio ID is required'
            });
        }
        
        // Get processing options
        const options = {
            apiProvider: apiProvider || 'default',
            model: model || process.env.API_MODEL,
            apiKey: apiKey || process.env.API_KEY
        };
        
        // Add custom API settings if provided
        if (apiProvider === 'custom') {
            options.apiEndpoint = apiEndpoint;
            options.apiModelName = apiModelName;
        }
        
        // Regenerate notes
        try {
            const result = await processingService.regenerateNotes(audioId, options);
            
            // Return the results
            res.json({
                success: true,
                transcription: result.transcription,
                notes: result.notes,
                audioId: result.audioId
            });
        } catch (processingError) {
            console.error('Regeneration error:', processingError);
            res.status(500).json({
                success: false,
                message: 'Failed to regenerate notes',
                error: processingError.message
            });
        }
    } catch (error) {
        console.error('API error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

/**
 * @route POST /api/process
 * @description Process an audio file, transcribe it and generate notes
 * @access Public
 */
router.post('/process', upload.fields([
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
        
        // Get processing options
        const options = {
            apiProvider: req.body.apiProvider || 'default',
            model: req.body.model || process.env.API_MODEL,
            apiKey: req.body.apiKey || process.env.API_KEY,
            whisperModel: req.body.whisperModel || 'default'
        };
        
        // Add custom API settings if provided
        if (req.body.apiProvider === 'custom') {
            options.apiEndpoint = req.body.apiEndpoint;
            options.apiModelName = req.body.apiModelName;
        }
        
        // Process the audio file
        try {
            const result = await processingService.processAudio(audioFile.path, options);
            
            // Return the results
            res.json({
                success: true,
                transcription: result.transcription,
                notes: result.notes,
                audioId: result.audioId
            });
        } catch (processingError) {
            console.error('Processing error:', processingError);
            
            // Check if it's a transcription error with NaN
            if (processingError.message.includes('NaN') && processingError.message.includes('JSON')) {
                return res.status(500).json({
                    success: false,
                    message: 'Transcription failed with JSON parsing error. Please try again, as this is often a temporary issue with the ML model output.',
                    error: processingError.message,
                    retryable: true
                });
            }
            
            // Otherwise, return a generic error
            res.status(500).json({
                success: false,
                message: 'Processing failed',
                error: processingError.message
            });
        }
    } catch (error) {
        console.error('API error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

/**
 * @route GET /api/processed-audios
 * @description Get a list of all processed audio files
 * @access Public
 */
router.get('/processed-audios', async (req, res) => {
    try {
        const processedAudios = await fileStorageService.listProcessedAudios();
        
        res.json({
            success: true,
            audios: processedAudios
        });
    } catch (error) {
        console.error('Error listing processed audios:', error);
        res.status(500).json({
            success: false,
            message: `Error listing processed audios: ${error.message}`
        });
    }
});

module.exports = router; 