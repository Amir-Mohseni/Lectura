import torch
import logging
import os
from pathlib import Path
from typing import Dict, Any

logger = logging.getLogger("lectura.processors.audio")

class AudioProcessor:
    def __init__(self):
        """Initialize the audio processor with Whisper-large-v3-turbo model"""
        logger.info("Initializing AudioProcessor with Whisper-large-v3-turbo")
        try:
            # Import required libraries
            from transformers import AutoModelForSpeechSeq2Seq, AutoProcessor, pipeline
            
            # Check if CUDA is available
            cuda_available = torch.cuda.is_available()
            logger.info(f"CUDA available: {cuda_available}")
            
            # Set device and dtype
            self.device = "cuda:0" if cuda_available else "cpu"
            self.torch_dtype = torch.float16 if cuda_available else torch.float32
            
            logger.info(f"Device set to use {self.device}")
            
            # Initialize the model
            logger.info("Loading Whisper-large-v3-turbo model...")
            model_id = "openai/whisper-large-v3-turbo"
            
            # Load model with appropriate settings
            model = AutoModelForSpeechSeq2Seq.from_pretrained(
                model_id, 
                torch_dtype=self.torch_dtype, 
                low_cpu_mem_usage=True, 
                use_safetensors=True
            )
            model.to(self.device)
            
            processor = AutoProcessor.from_pretrained(model_id)
            
            # Create pipeline
            self.pipe = pipeline(
                "automatic-speech-recognition",
                model=model,
                tokenizer=processor.tokenizer,
                feature_extractor=processor.feature_extractor,
                torch_dtype=self.torch_dtype,
                device=self.device,
            )
            
            logger.info("Whisper-large-v3-turbo model loaded successfully")
            self.model_loaded = True
            
            # Store the processor for potential direct use
            self.processor = processor
            self.model = model
            
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
            Dict: Transcription results
        """
        logger.info(f"Transcribing audio file: {audio_path}")
        
        audio_path = Path(audio_path)
        if not audio_path.exists():
            logger.error(f"Audio file not found: {audio_path}")
            raise FileNotFoundError(f"Audio file not found: {audio_path}")
        
        try:
            # Try different approaches to handle different versions of the transformers library
            
            # Approach 1: Direct call without parameters
            try:
                logger.info("Attempting direct transcription without parameters")
                result = self.pipe(str(audio_path))
                logger.info("Direct transcription successful")
            except Exception as e1:
                logger.warning(f"Direct transcription failed: {e1}")
                
                # Approach 2: Using generate_kwargs
                try:
                    logger.info("Attempting transcription with generate_kwargs")
                    result = self.pipe(
                        str(audio_path),
                        generate_kwargs={"task": "transcribe", "language": language if language else None}
                    )
                    logger.info("Transcription with generate_kwargs successful")
                except Exception as e2:
                    logger.warning(f"Transcription with generate_kwargs failed: {e2}")
                    
                    # Approach 3: Using task parameter
                    try:
                        logger.info("Attempting transcription with task parameter")
                        result = self.pipe(str(audio_path), task="transcribe")
                        logger.info("Transcription with task parameter successful")
                    except Exception as e3:
                        logger.error(f"All transcription approaches failed: {e1} / {e2} / {e3}")
                        raise Exception(f"Audio transcription failed after multiple attempts")
            
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