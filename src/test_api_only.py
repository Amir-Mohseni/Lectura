import os
import sys
import logging
import openai

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("test_api_only")

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
        client = openai.OpenAI(
            api_key=api_key,
            base_url=api_base_url
        )
        
        # Sample transcript for testing
        transcript = """
        Lecture Title: Introduction to Machine Learning

        Machine learning is a subset of artificial intelligence that enables systems to learn patterns 
        from data and make predictions or decisions without being explicitly programmed.

        There are three main types of machine learning: supervised learning, unsupervised learning, 
        and reinforcement learning.
        """
        
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
        
        # Print the generated notes
        notes = response.choices[0].message.content
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