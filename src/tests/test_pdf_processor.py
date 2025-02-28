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
logger = logging.getLogger("test_pdf_processor")

def test_pdf_processing():
    """Test PDF processing with OlmOCR"""
    try:
        # Import the PDFProcessor
        from src.processors.pdf_processor import PDFProcessor
        
        # Create a temporary directory
        temp_dir = tempfile.mkdtemp()
        pdf_path = os.path.join(temp_dir, "sample.pdf")
        
        # Download a sample PDF
        logger.info("Downloading sample PDF...")
        urllib.request.urlretrieve("https://molmo.allenai.org/paper.pdf", pdf_path)
        
        # Initialize the PDF processor
        logger.info("Initializing PDF processor...")
        pdf_processor = PDFProcessor()
        
        # Process the PDF
        logger.info(f"Processing PDF: {pdf_path}")
        slides = pdf_processor.process_pdf(pdf_path)
        
        # Print the results
        logger.info(f"Successfully processed {len(slides)} slides")
        for i, slide in enumerate(slides[:2]):  # Print first 2 slides only
            print(f"\n--- Slide {slide['slide_number']} ---")
            # Print first 200 characters of content
            content = slide['content']
            print(f"{content[:200]}..." if len(content) > 200 else content)
        
        return True
    except Exception as e:
        logger.error(f"Error testing PDF processor: {e}", exc_info=True)
        return False
    finally:
        # Clean up
        if 'temp_dir' in locals():
            import shutil
            shutil.rmtree(temp_dir)
            logger.info("Cleaned up temporary files")

if __name__ == "__main__":
    success = test_pdf_processing()
    if success:
        logger.info("PDF processing test completed successfully!")
    else:
        logger.error("PDF processing test failed!")
        sys.exit(1) 