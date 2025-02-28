from typing import Optional, List, Dict
import logging
from pathlib import Path

logger = logging.getLogger("lectura.processors.lecture")

class LectureProcessor:
    def __init__(self):
        """Initialize the lecture processor.
        
        Note: We now use Whisper-large-v3-turbo exclusively via the AudioProcessor
        """
        logger.info("Initializing LectureProcessor")
        self.transcript = None
        self.slides = None
    
    def process_audio(self, audio_path: str) -> Dict:
        """Process lecture audio and return transcription.
        
        Args:
            audio_path (str): Path to the audio file
            
        Returns:
            Dict: Transcription results
        """
        logger.info(f"Processing audio file: {audio_path}")
        
        # Use the AudioProcessor instead
        from src.processors.audio_processor import AudioProcessor
        processor = AudioProcessor()
        transcript = processor.transcribe_audio(audio_path)
        self.transcript = transcript
        return transcript
    
    def extract_slides_from_pdf(self, pdf_path):
        """Extract slide information from a PDF file
        
        Args:
            pdf_path (str): Path to the PDF file
            
        Returns:
            List[Dict]: List of extracted slide contents
        """
        logger.info(f"Extracting slides from PDF: {pdf_path}")
        try:
            # Try to use PyMuPDF for extraction
            return self._basic_pdf_extraction(pdf_path)
        except Exception as e:
            logger.error(f"Error extracting slides from PDF: {e}", exc_info=True)
            return []
    
    def _basic_pdf_extraction(self, pdf_path):
        """Basic method for PDF text extraction
        
        Args:
            pdf_path (str): Path to the PDF file
            
        Returns:
            List[Dict]: List of extracted slide contents
        """
        try:
            import fitz  # PyMuPDF
            slides = []
            
            # Open the PDF
            doc = fitz.open(pdf_path)
            
            # Process each page
            for page_num, page in enumerate(doc):
                text = page.get_text()
                slides.append({
                    "slide_number": page_num + 1,
                    "content": text
                })
            
            logger.info(f"Extracted {len(slides)} slides from PDF")
            return slides
        except ImportError:
            # If PyMuPDF is not installed, return empty slides
            logger.error("PyMuPDF not installed. Cannot extract slides from PDF.")
            return []
        except Exception as e:
            logger.error(f"Error in PDF extraction: {e}", exc_info=True)
            return [] 