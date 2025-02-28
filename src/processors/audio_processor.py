import torch
import logging
import os
from pathlib import Path
from typing import Dict, Any, List

logger = logging.getLogger("lectura.processors.audio")

class AudioProcessor:
    def __init__(self):
        """Initialize the audio processor with Whisper-large-v3-turbo model"""
        logger.info("Initializing AudioProcessor with Whisper-large-v3-turbo")
        try:
            # Import required libraries
            from transformers import pipeline
            
            # Check if CUDA is available
            cuda_available = torch.cuda.is_available()
            logger.info(f"CUDA available: {cuda_available}")
            
            # Set device
            self.device = "cuda:0" if cuda_available else "cpu"
            logger.info(f"Device set to use {self.device}")
            
            # Create pipeline - simplified approach
            logger.info("Loading Whisper-large-v3-turbo model...")
            self.pipe = pipeline(
                "automatic-speech-recognition", 
                model="openai/whisper-large-v3-turbo",
                device=self.device
            )
            
            logger.info("Whisper-large-v3-turbo model loaded successfully")
            self.model_loaded = True
            
        except ImportError as e:
            logger.error(f"Could not import required dependencies: {e}")
            self.model_loaded = False
            raise ImportError(f"Failed to import required dependencies: {e}")
        except Exception as e:
            logger.error(f"Error initializing Whisper model: {e}", exc_info=True)
            self.model_loaded = False
            raise Exception(f"Failed to initialize Whisper model: {e}")
    
    def transcribe_audio(self, audio_path: str, language: str = "en") -> Dict[str, Any]:
        """Transcribe audio file using Whisper-large-v3-turbo model
        
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
        
        audio_path = Path(audio_path)
        if not audio_path.exists():
            logger.error(f"Audio file not found: {audio_path}")
            raise FileNotFoundError(f"Audio file not found: {audio_path}")
        
        try:
            # Use the pipeline with return_timestamps=True to get segment information
            result = self.pipe(str(audio_path), return_timestamps=True)
            
            # Format result to match the expected structure
            # The output should match the example format with "text" and "chunks"
            transcript = {
                "text": result["text"],
                "language": language
            }
            
            # Add chunks if available
            if "chunks" in result:
                transcript["chunks"] = result["chunks"]
            else:
                # If no chunks are provided, create a single chunk with the full text
                transcript["chunks"] = [
                    {"timestamp": (0.0, 0.0), "text": result["text"]}
                ]
            
            logger.info(f"Transcription completed: {len(transcript['text'])} characters, {len(transcript['chunks'])} chunks")
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
        
        # Print the full text
        print("\nFull Transcription:")
        print(result["text"])
        
        # Print chunks with timestamps
        print("\nChunks with timestamps:")
        for chunk in result["chunks"]:
            start, end = chunk["timestamp"]
            print(f"[{start:.1f}s - {end:.1f}s]: {chunk['text']}") 