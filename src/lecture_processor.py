from typing import Optional, List, Dict
import whisper
from pathlib import Path
import logging
import torch

logger = logging.getLogger("lectura.lecture_processor")

class LectureProcessor:
    def __init__(self, model_type: str = "base"):
        """Initialize the lecture processor with specified Whisper model.
        
        Args:
            model_type (str): Whisper model size ("tiny", "base", "small", "medium", "large")
        """
        logger.info(f"Initializing LectureProcessor with model_type: {model_type}")
        try:
            # Check if CUDA is available
            cuda_available = torch.cuda.is_available()
            logger.info(f"CUDA available: {cuda_available}")
            
            # Load the model
            self.model = whisper.load_model(model_type)
            logger.info(f"Successfully loaded Whisper model: {model_type}")
            
            self.transcript = None
            self.slides = None
        except Exception as e:
            logger.error(f"Error loading Whisper model: {str(e)}", exc_info=True)
            raise Exception(f"Failed to load Whisper model: {str(e)}")
        
    def process_audio(self, audio_path: str) -> Dict:
        """Process lecture audio and return transcription with timestamps.
        
        Args:
            audio_path (str): Path to the audio file
            
        Returns:
            Dict: Transcription results including text and timestamps
        """
        logger.info(f"Processing audio file: {audio_path}")
        audio_path = Path(audio_path)
        if not audio_path.exists():
            logger.error(f"Audio file not found: {audio_path}")
            raise FileNotFoundError(f"Audio file not found: {audio_path}")
        
        try:
            logger.info("Starting transcription with Whisper")
            result = self.model.transcribe(str(audio_path))
            self.transcript = result
            
            # Log some basic stats about the transcript
            segments = result.get("segments", [])
            total_duration = result.get("duration", 0)
            logger.info(f"Transcription completed: {len(segments)} segments, {total_duration:.2f} seconds")
            
            return result
        except Exception as e:
            logger.error(f"Error during audio transcription: {str(e)}", exc_info=True)
            raise Exception(f"Audio transcription failed: {str(e)}")
    
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
            from src.pdf_processor import PDFProcessor
            
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
        
if __name__ == "__main__":
    lecture_processor = LectureProcessor()
    