import logging
import sys
from src.processors.audio_processor import AudioProcessor

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("test_audio")

def test_audio_processor(audio_path):
    """Test the AudioProcessor with a given audio file"""
    try:
        logger.info(f"Testing AudioProcessor with file: {audio_path}")
        
        # Initialize the AudioProcessor
        logger.info("Initializing AudioProcessor...")
        processor = AudioProcessor()
        logger.info("AudioProcessor initialized successfully")
        
        # Transcribe the audio
        logger.info(f"Transcribing audio file...")
        transcript = processor.transcribe_audio(audio_path)
        logger.info(f"Transcription completed")
        
        # Print the transcript
        print("\nTranscript:")
        print(transcript["text"])
        
        # Print chunks if available
        if "chunks" in transcript:
            print("\nChunks:")
            for i, chunk in enumerate(transcript["chunks"]):
                print(f"Chunk {i+1}: {chunk}")
        
        return True
    except Exception as e:
        logger.error(f"Error testing AudioProcessor: {e}", exc_info=True)
        return False

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python test_audio.py <audio_file_path>")
        sys.exit(1)
    
    audio_path = sys.argv[1]
    success = test_audio_processor(audio_path)
    
    if success:
        print("\nTest completed successfully!")
    else:
        print("\nTest failed!")
        sys.exit(1) 