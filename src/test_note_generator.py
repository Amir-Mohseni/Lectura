import os
import sys
import logging
from src.note_generator import NoteGenerator

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
        return
    
    logger.info(f"Testing note generation with model: {api_model}")
    logger.info(f"API base URL: {api_base_url}")
    
    # Initialize the note generator with environment variables
    note_generator = NoteGenerator(
        api_key=api_key,
        model=api_model,
        base_url=api_base_url
    )
    
    # Sample transcript for testing
    transcript = """
    Lecture Title: Introduction to Machine Learning

Professor: Good morning, everyone. Today, we'll introduce the basic concepts of machine learning. Machine learning is a subset of artificial intelligence that enables systems to learn patterns from data and make predictions or decisions without being explicitly programmed.

There are three main types of machine learning: supervised learning, unsupervised learning, and reinforcement learning.
	•	Supervised Learning: In this approach, we train models on labeled data. For example, if we want to classify emails as spam or not spam, we provide examples of both categories to the algorithm. Common algorithms include decision trees, support vector machines, and neural networks.
	•	Unsupervised Learning: Here, the data is unlabeled, and the algorithm must find patterns or groupings by itself. Clustering and dimensionality reduction techniques fall under this category—like k-means clustering and principal component analysis (PCA).
	•	Reinforcement Learning: This is based on an agent interacting with an environment and learning from feedback in the form of rewards. A famous example is AlphaGo, which learned to play Go at a superhuman level.

Machine learning models require data preprocessing, including cleaning, normalization, and feature selection. Choosing the right model and tuning hyperparameters are also crucial for achieving good performance.

That's a brief overview. In the next session, we'll dive deeper into model evaluation techniques like cross-validation and bias-variance tradeoff. Any questions?"""
    
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
    test_note_generation() 