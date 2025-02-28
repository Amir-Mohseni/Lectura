import os
import sys
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("test_note_generator")

def test_note_generation():
    """Test note generation with the configured API settings"""
    # Get API settings from environment variables
    api_key = os.getenv("API_KEY")
    api_base_url = os.getenv("API_BASE_URL")
    api_model = os.getenv("API_MODEL")
    
    if not api_key or not api_base_url or not api_model:
        logger.error("Missing required environment variables: API_KEY, API_BASE_URL, or API_MODEL")
        return False
    
    logger.info(f"Testing note generation with model: {api_model}")
    logger.info(f"API base URL: {api_base_url}")
    
    # Initialize the note generator with environment variables
    from src.generators.note_generator import NoteGenerator
    note_generator = NoteGenerator(
        api_key=api_key,
        model=api_model,
        base_url=api_base_url
    )
    
    # Load transcript from samples folder
    samples_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "samples")
    transcript_path = os.path.join(samples_dir, "transcript.txt")
    
    # Check if the file exists
    if not os.path.exists(transcript_path):
        logger.error(f"Sample transcript file not found at: {transcript_path}")
        return False
    
    # Read the transcript file
    try:
        with open(transcript_path, 'r', encoding='utf-8') as f:
            transcript = f.read()
        logger.info(f"Loaded transcript from: {transcript_path}")
    except Exception as e:
        logger.error(f"Error reading transcript file: {e}")
        return False
    
    # Generate notes
    try:
        logger.info("Generating notes...")
        notes = note_generator.generate_notes(transcript=transcript, slides=[])
        
        # Print the generated notes
        logger.info("Notes generated successfully!")
        print("\n" + "="*50 + " GENERATED NOTES " + "="*50)
        print(notes)
        print("="*120 + "\n")
        
        return True
    except Exception as e:
        logger.error(f"Error generating notes: {str(e)}", exc_info=True)
        return False

if __name__ == "__main__":
    success = test_note_generation()
    if success:
        logger.info("Note generation test completed successfully!")
    else:
        logger.error("Note generation test failed!")
        sys.exit(1) 