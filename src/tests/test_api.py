import os
import sys
import logging
from openai import OpenAI

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("test_api")

def test_api_connection():
    """Test the API connection without using Whisper"""
    # Get API settings from environment variables
    api_key = os.getenv("API_KEY")
    api_base_url = os.getenv("API_BASE_URL")
    api_model = os.getenv("API_MODEL")
    
    if not api_key or not api_base_url or not api_model:
        logger.error("Missing required environment variables: API_KEY, API_BASE_URL, or API_MODEL")
        return False
    
    logger.info(f"Testing API connection with model: {api_model}")
    logger.info(f"API base URL: {api_base_url}")
    
    # Initialize the OpenAI client
    try:
        client = OpenAI(
            api_key=api_key,
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
        
        # Create a simple prompt
        prompt = f"""
        You are an expert note-taker. Create comprehensive, well-structured notes from the following lecture transcript.
        
        Transcript:
        {transcript}
        
        Please organize the notes with:
        1. A clear title
        2. Main topics with headings
        3. Key points under each topic
        
        Format the notes in Markdown.
        """
        
        logger.info("Sending request to API...")
        response = client.chat.completions.create(
            model=api_model,
            messages=[
                {"role": "system", "content": "You are an expert note-taking assistant."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=1000
        )
        
        # Log the raw response for debugging
        logger.info(f"Response type: {type(response)}")
        
        # Extract the generated notes - handle different API response structures
        try:
            # Try standard OpenAI format
            if hasattr(response, 'choices') and response.choices and hasattr(response.choices[0], 'message'):
                notes = response.choices[0].message.content
            # Try OpenRouter format
            elif hasattr(response, 'choices') and response.choices and isinstance(response.choices[0], dict):
                notes = response.choices[0].get('message', {}).get('content', '')
            # Try raw dictionary format
            elif isinstance(response, dict) and 'choices' in response:
                notes = response['choices'][0].get('message', {}).get('content', '')
            else:
                # Last resort: convert to string
                logger.warning("Unexpected response format. Converting to string.")
                notes = str(response)
                
            if not notes:
                logger.warning("Could not extract notes from response. Using raw response.")
                notes = str(response)
        except Exception as e:
            logger.warning(f"Error extracting notes from response: {e}")
            notes = f"Error extracting notes: {str(e)}\nRaw response: {str(response)}"
        
        logger.info("API request successful!")
        print("\n" + "="*50 + " GENERATED NOTES " + "="*50)
        print(notes)
        print("="*120 + "\n")
        
        return True
    except Exception as e:
        logger.error(f"Error connecting to API: {str(e)}", exc_info=True)
        return False

if __name__ == "__main__":
    success = test_api_connection()
    if success:
        logger.info("API test completed successfully!")
    else:
        logger.error("API test failed!")
        sys.exit(1) 