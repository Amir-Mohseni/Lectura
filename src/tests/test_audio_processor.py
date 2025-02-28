import os
import sys
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("test_audio_processor")

def test_audio_processing():
    """Test audio processing with Whisper-large-v3-turbo"""
    try:
        # Use the sample audio file from the samples folder
        samples_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "samples")
        audio_path = os.path.join(samples_dir, "How Google's Transformer 2.0 Might Be The AI Breakthrough We Need.mp3")
        
        # Check if the file exists
        if not os.path.exists(audio_path):
            logger.error(f"Sample audio file not found at: {audio_path}")
            logger.error("Please ensure the sample audio file exists in the samples directory.")
            return False
        
        logger.info(f"Using sample audio file: {audio_path} ({os.path.getsize(audio_path)} bytes)")
        
        # Try to import the AudioProcessor
        try:
            # Import the AudioProcessor
            from src.processors.audio_processor import AudioProcessor
        except ImportError as e:
            logger.error(f"Failed to import AudioProcessor: {e}")
            logger.error("Please ensure all dependencies are installed. Run: pip install -r requirements.txt")
            return False
        
        # Initialize the audio processor
        try:
            logger.info("Initializing audio processor...")
            audio_processor = AudioProcessor()
        except Exception as e:
            logger.error(f"Failed to initialize AudioProcessor: {e}")
            return False
        
        # Process the audio
        try:
            logger.info(f"Transcribing audio: {audio_path}")
            transcript = audio_processor.transcribe_audio(audio_path)
            
            # Print the results
            logger.info("Transcription completed successfully")
            print("\n" + "="*50 + " TRANSCRIPTION " + "="*50)
            # Print first 500 characters of transcript
            text = transcript["text"]
            print(f"{text[:500]}..." if len(text) > 500 else text)
            print("="*120 + "\n")
            
            return True
        except Exception as e:
            logger.error(f"Error during transcription: {e}", exc_info=True)
            return False
            
    except Exception as e:
        logger.error(f"Error testing audio processor: {e}", exc_info=True)
        return False

if __name__ == "__main__":
    success = test_audio_processing()
    if success:
        logger.info("Audio processing test completed successfully!")
    else:
        logger.error("Audio processing test failed!")
        sys.exit(1) 