import os
import sys
import logging
import tempfile
import urllib.request
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
        # Import the AudioProcessor
        from src.audio_processor import AudioProcessor
        
        # Create a temporary directory
        temp_dir = tempfile.mkdtemp()
        audio_path = os.path.join(temp_dir, "sample.mp3")
        
        # Download a sample audio file
        logger.info("Downloading sample audio file...")
        # Using a Creative Commons sample from LibriVox
        urllib.request.urlretrieve(
            "https://ia800601.us.archive.org/13/items/hamlet_shakespeare_librivox/hamlet_act1_shakespeare.mp3",
            audio_path
        )
        
        # Initialize the audio processor
        logger.info("Initializing audio processor...")
        audio_processor = AudioProcessor()
        
        # Process the audio
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
        logger.error(f"Error testing audio processor: {e}", exc_info=True)
        return False
    finally:
        # Clean up
        if 'temp_dir' in locals():
            import shutil
            shutil.rmtree(temp_dir)
            logger.info("Cleaned up temporary files")

if __name__ == "__main__":
    success = test_audio_processing()
    if success:
        logger.info("Audio processing test completed successfully!")
    else:
        logger.error("Audio processing test failed!")
        sys.exit(1) 