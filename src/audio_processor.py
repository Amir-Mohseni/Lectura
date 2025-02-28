import logging
import os
from pathlib import Path
from typing import Dict, Any
from transformers import pipeline

logger = logging.getLogger("lectura.audio_processor")

class AudioProcessor:
    def __init__(self):
        """Initialize the audio processor with Whisper-large-v3-turbo model"""
        logger.info("Initializing AudioProcessor with Whisper-large-v3-turbo")
        self.model_loaded = False
        
        try:
            # Initialize the model using pipeline directly
            logger.info("Loading Whisper-large-v3-turbo model...")
            self.pipe = pipeline(
                "automatic-speech-recognition", 
                model="openai/whisper-large-v3-turbo",
                device="auto"
            )
            
            logger.info("Whisper-large-v3-turbo model loaded successfully")
            self.model_loaded = True
            
        except ImportError as e:
            logger.error(f"Could not import required dependencies: {e}")
            raise ImportError(f"Failed to import required dependencies: {e}")
        except Exception as e:
            logger.error(f"Error initializing Whisper model: {e}", exc_info=True)
            raise Exception(f"Failed to initialize Whisper model: {e}")
    
    def transcribe_audio(self, audio_path: str, language: str = "en") -> Dict[str, Any]:
        """Transcribe audio file using Whisper-large-v3-turbo model
        
        Args:
            audio_path (str): Path to the audio file
            language (str): Language code (e.g., "en" for English)
            
        Returns:
            Dict: Transcription results
        """
        logger.info(f"Transcribing audio file: {audio_path} (language: {language})")
        
        audio_path = Path(audio_path)
        if not audio_path.exists():
            logger.error(f"Audio file not found: {audio_path}")
            raise FileNotFoundError(f"Audio file not found: {audio_path}")
        
        try:
            # Set language if provided
            pipe_kwargs = {"return_timestamps": True, "task": "transcribe", "language": "en"}
            
            # Transcribe audio
            result = self.pipe(str(audio_path), **pipe_kwargs)
            
            # Format result to match the expected structure
            transcript = {
                "text": result["text"],
                "language": language,
                "segments": []
            }
            
            # If chunks are available, add them as segments
            if "chunks" in result:
                for i, chunk in enumerate(result["chunks"]):
                    segment = {
                        "id": i,
                        "start": chunk.get("timestamp", [0, 0])[0],
                        "end": chunk.get("timestamp", [0, 0])[1],
                        "text": chunk.get("text", "")
                    }
                    transcript["segments"].append(segment)
            
            logger.info(f"Transcription completed: {len(transcript['text'])} characters")
            return transcript
            
        except Exception as e:
            logger.error(f"Error during audio transcription: {e}", exc_info=True)
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
        print(result["text"]) 