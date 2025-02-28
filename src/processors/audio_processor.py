import logging
import os
from pathlib import Path
from typing import Dict, Any, List
import traceback

logger = logging.getLogger("lectura.processors.audio")

class AudioProcessor:
    def __init__(self):
        """Initialize the audio processor with Whisper-large-v3-turbo model"""
        logger.info("Initializing AudioProcessor with Whisper-large-v3-turbo")
        self.model_loaded = False
        
        try:
            # Import transformers here to avoid loading it if not needed
            import transformers
            logger.info(f"Transformers version: {transformers.__version__}")
            
            # Check if CUDA is available
            try:
                import torch
                cuda_available = torch.cuda.is_available()
                logger.info(f"CUDA available: {cuda_available}")
                if cuda_available:
                    logger.info(f"CUDA device: {torch.cuda.get_device_name(0)}")
            except ImportError:
                logger.warning("PyTorch not available, CUDA status unknown")
                cuda_available = False
            
            # Create pipeline - simplified approach
            logger.info("Loading Whisper-large-v3-turbo model...")
            from transformers import pipeline
            
            try:
                # Try to load the distil-whisper model
                self.pipe = pipeline(
                    "automatic-speech-recognition", 
                    model="distil-whisper/distil-large-v3",
                )
                logger.info("Speech-recognition model loaded successfully")
                self.model_loaded = True
            except Exception as e:
                logger.error(f"Error loading distil-whisper model: {e}")
                logger.info("Falling back to smaller whisper model...")
                
                # Fall back to a smaller model
                try:
                    self.pipe = pipeline(
                        "automatic-speech-recognition", 
                        model="openai/whisper-small",
                    )
                    logger.info("Fallback whisper-small model loaded successfully")
                    self.model_loaded = True
                except Exception as e2:
                    logger.error(f"Error loading fallback model: {e2}")
                    raise Exception(f"Failed to load any whisper model: {e2}")
            
        except ImportError as e:
            logger.error(f"Could not import required dependencies: {e}")
            logger.error(traceback.format_exc())
            raise ImportError(f"Failed to import required dependencies: {e}")
        except Exception as e:
            logger.error(f"Error initializing Whisper model: {e}")
            logger.error(traceback.format_exc())
            raise Exception(f"Failed to initialize Whisper model: {e}")
    
    def transcribe_audio(self, audio_path: str, language: str = "en") -> Dict[str, Any]:
        """Transcribe audio file using Whisper model
        
        Args:
            audio_path (str): Path to the audio file
            language (str): Language code (e.g., "en" for English)
            
        Returns:
            Dict: Transcription results with format:
            {
                "text": "Full transcription text",
                "language": "en",
                "chunks": [
                    {"timestamp": (0.0, 5.5), "text": "Text segment 1"},
                    {"timestamp": (5.5, 10.5), "text": "Text segment 2"},
                    ...
                ]
            }
        """
        logger.info(f"Transcribing audio file: {audio_path}")
        
        if not self.model_loaded:
            logger.error("Model not loaded. Cannot transcribe audio.")
            raise RuntimeError("Model not loaded. Cannot transcribe audio.")
        
        audio_path = Path(audio_path)
        if not audio_path.exists():
            logger.error(f"Audio file not found: {audio_path}")
            raise FileNotFoundError(f"Audio file not found: {audio_path}")
        
        try:
            # Check file size
            file_size_mb = audio_path.stat().st_size / (1024 * 1024)
            logger.info(f"Audio file size: {file_size_mb:.2f} MB")
            
            # For very large files, we might want to use a different approach
            if file_size_mb > 50:
                logger.warning(f"Large audio file detected ({file_size_mb:.2f} MB). Processing may take a while.")
            
            # Use the pipeline with return_timestamps=True to get segment information
            logger.info("Starting transcription with Whisper model...")
            result = self.pipe(str(audio_path), return_timestamps=True)
            logger.info("Transcription with Whisper model completed")
            
            # Format result to match the expected structure
            # The output should match the example format with "text" and "chunks"
            transcript = {
                "text": result["text"],
                "language": 'en'
            }
            
            # Add chunks if available
            if "chunks" in result:
                transcript["chunks"] = result["chunks"]
                logger.info(f"Transcription completed with {len(transcript['chunks'])} chunks")
            else:
                # If no chunks are provided, create a single chunk with the full text
                transcript["chunks"] = [
                    {"timestamp": (0.0, 0.0), "text": result["text"]}
                ]
                logger.info("Transcription completed without chunks")
            
            logger.info(f"Transcription completed: {len(transcript['text'])} characters")
            return transcript
            
        except Exception as e:
            logger.error(f"Error during audio transcription: {e}")
            logger.error(traceback.format_exc())
            raise Exception(f"Audio transcription failed: {e}")

if __name__ == "__main__":
    # Configure logging for standalone testing
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Test with a sample audio file if available
    import sys
    if len(sys.argv) > 1:
        audio_file = sys.argv[1]
        processor = AudioProcessor()
        result = processor.transcribe_audio(audio_file)
        
        # Print the full text
        print("\nFull Transcription:")
        print(result["text"])
        
        # Print chunks with timestamps
        print("\nChunks with timestamps:")
        for chunk in result["chunks"]:
            start, end = chunk["timestamp"]
            print(f"[{start:.1f}s - {end:.1f}s]: {chunk['text']}") 