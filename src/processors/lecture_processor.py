from typing import Optional, List, Dict
import logging
import torch
from pathlib import Path

logger = logging.getLogger("lectura.processors.lecture")

class LectureProcessor:
    def __init__(self, model_type: str = "base"):
        """Initialize the lecture processor with specified Whisper model.
        
        Args:
            model_type (str): Whisper model size ("tiny", "base", "small", "medium", "large")
        """
        logger.info(f"Initializing LectureProcessor with model_type: {model_type}")
        self.model_type = model_type
        self.transcript = None
        self.slides = None
        
        # Note: We're not loading the Whisper model here anymore
        # as we're using the AudioProcessor for transcription
    
    def process_audio(self, audio_path: str) -> Dict:
        """Process lecture audio and return transcription with timestamps.
        
        Args:
            audio_path (str): Path to the audio file
            
        Returns:
            Dict: Transcription results including text and timestamps
        """
        logger.info(f"Processing audio file: {audio_path}")
        
        # Use the AudioProcessor instead
        from src.processors.audio_processor import AudioProcessor
        processor = AudioProcessor()
        transcript = processor.transcribe_audio(audio_path)
        self.transcript = transcript
        return transcript
    
    def extract_slides(self, transcript: Dict) -> List[Dict]:
        """Extract potential slide content from transcript.
        
        Args:
            transcript (Dict): Whisper transcription output
            
        Returns:
            List[Dict]: List of extracted slide contents with timestamps
        """
        logger.info("Extracting slide information from transcript")
        slides = []
        current_slide = {"content": "", "start_time": 0, "end_time": 0}
        
        # Simple heuristic for slide detection based on phrases and pauses
        slide_indicators = [
            "next slide",
            "moving on to",
            "let's look at",
            "on this slide",
        ]
        
        try:
            segments = transcript.get("segments", [])
            logger.debug(f"Processing {len(segments)} segments for slide extraction")
            
            for segment in segments:
                text = segment["text"].lower()
                
                # Check for slide transitions
                for indicator in slide_indicators:
                    if indicator in text:
                        if current_slide["content"]:
                            current_slide["end_time"] = segment["start"]
                            slides.append(current_slide.copy())
                            logger.debug(f"Detected slide transition at {segment['start']:.2f}s")
                        
                        current_slide = {
                            "content": segment["text"],
                            "start_time": segment["start"],
                            "end_time": 0
                        }
                        break
                else:
                    current_slide["content"] += " " + segment["text"]
            
            # Add the last slide
            if current_slide["content"]:
                if segments:
                    current_slide["end_time"] = segments[-1]["end"]
                slides.append(current_slide)
                
            self.slides = slides
            logger.info(f"Extracted {len(slides)} potential slides from transcript")
            return slides
            
        except Exception as e:
            logger.error(f"Error during slide extraction: {str(e)}", exc_info=True)
            raise Exception(f"Slide extraction failed: {str(e)}")
    
    def extract_slides_from_pdf(self, pdf_path):
        """Extract slide information from a PDF file using OlmOCR if available"""
        try:
            # Import the PDFProcessor
            from src.processors.pdf_processor import PDFProcessor
            
            # Initialize the PDF processor
            pdf_processor = PDFProcessor()
            
            # Process the PDF
            slides = pdf_processor.process_pdf(pdf_path)
            
            return slides
        except ImportError:
            logger.warning("PDFProcessor not available, falling back to basic extraction")
            return self._basic_pdf_extraction(pdf_path)
        except Exception as e:
            logger.error(f"Error extracting slides from PDF: {e}", exc_info=True)
            return self._basic_pdf_extraction(pdf_path)
    
    def _basic_pdf_extraction(self, pdf_path):
        """Basic fallback method for PDF text extraction"""
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
                    "content": text,
                    "timestamp": None  # We don't have timestamp info from PDF
                })
            
            return slides
        except ImportError:
            # If PyMuPDF is not installed, return empty slides
            logger.error("PyMuPDF not installed. Cannot extract slides from PDF.")
            return []
        except Exception as e:
            logger.error(f"Error in basic PDF extraction: {e}", exc_info=True)
            return [] 