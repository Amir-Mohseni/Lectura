import base64
import os
import tempfile
import logging
from io import BytesIO
from PIL import Image
from pathlib import Path
from typing import List, Dict, Any, Optional

logger = logging.getLogger("lectura.processors.pdf")

class PDFProcessor:
    def __init__(self):
        """Initialize the PDF processor with OlmOCR model"""
        logger.info("Initializing PDFProcessor with OlmOCR")
        try:
            # Import required libraries
            from transformers import AutoProcessor, Qwen2VLForConditionalGeneration
            from olmocr.data.renderpdf import render_pdf_to_base64png
            from olmocr.prompts import build_finetuning_prompt
            from olmocr.prompts.anchor import get_anchor_text
            
            # Store the imported functions for later use
            self.render_pdf_to_base64png = render_pdf_to_base64png
            self.build_finetuning_prompt = build_finetuning_prompt
            self.get_anchor_text = get_anchor_text
            
            logger.info("Loading OlmOCR model...")
            
            # Load model with appropriate settings
            self.model = Qwen2VLForConditionalGeneration.from_pretrained(
                "allenai/olmOCR-7B-0225-preview", 
                device_map="auto"
            ).eval()
            
            self.processor = AutoProcessor.from_pretrained("Qwen/Qwen2-VL-7B-Instruct")
                
            logger.info("OlmOCR model loaded successfully")
            
            self.model_loaded = True
        except ImportError as e:
            logger.warning(f"Could not import OlmOCR dependencies: {e}")
            logger.warning("Falling back to basic PDF text extraction")
            self.model_loaded = False
        except Exception as e:
            logger.error(f"Error initializing OlmOCR model: {e}", exc_info=True)
            logger.warning("Falling back to basic PDF text extraction")
            self.model_loaded = False
    
    def process_pdf(self, pdf_path: str) -> List[Dict[str, Any]]:
        """Process a PDF file and extract text from each page using OlmOCR"""
        pdf_path = Path(pdf_path)
        if not pdf_path.exists():
            logger.error(f"PDF file not found: {pdf_path}")
            raise FileNotFoundError(f"PDF file not found: {pdf_path}")
        
        slides = []
        
        try:
            if self.model_loaded:
                # Use OlmOCR for text extraction
                logger.info(f"Processing PDF with OlmOCR: {pdf_path}")
                slides = self._process_with_olmocr(str(pdf_path))
            else:
                # Fallback to basic text extraction
                logger.info(f"Processing PDF with basic extraction: {pdf_path}")
                slides = self._process_with_basic_extraction(str(pdf_path))
            
            return slides
        except Exception as e:
            logger.error(f"Error processing PDF: {e}", exc_info=True)
            # Return empty slides on error
            return []
    
    def _process_with_olmocr(self, pdf_path: str) -> List[Dict[str, Any]]:
        """Process PDF using OlmOCR model"""
        import fitz  # PyMuPDF
        
        slides = []
        doc = fitz.open(pdf_path)
        
        # Check if poppler-utils is installed
        import subprocess
        try:
            subprocess.run(['pdfinfo', '--version'], stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=False)
            poppler_installed = True
        except FileNotFoundError:
            logger.warning("poppler-utils not found. This is required for OlmOCR PDF processing.")
            logger.warning("Install with: apt-get install poppler-utils (Ubuntu/Debian) or brew install poppler (macOS)")
            logger.warning("Falling back to basic PDF extraction")
            poppler_installed = False
            return self._process_with_basic_extraction(pdf_path)
        
        for page_num in range(len(doc)):
            logger.info(f"Processing page {page_num+1} with OlmOCR")
            
            try:
                # Render page to image
                image_base64 = self.render_pdf_to_base64png(pdf_path, page_num+1, target_longest_image_dim=1024)
                
                # Get anchor text for context
                anchor_text = self.get_anchor_text(pdf_path, page_num+1, pdf_engine="pdfreport", target_length=4000)
                
                # Build the prompt
                prompt = self.build_finetuning_prompt(anchor_text)
                
                # Build the full prompt
                messages = [
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{image_base64}"}},
                        ],
                    }
                ]
                
                # Apply the chat template and processor
                text = self.processor.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
                main_image = Image.open(BytesIO(base64.b64decode(image_base64)))
                
                inputs = self.processor(
                    text=[text],
                    images=[main_image],
                    padding=True,
                    return_tensors="pt",
                )
                
                # Generate the output
                output = self.model.generate(
                    **inputs,
                    temperature=0.8,
                    max_new_tokens=1024,  # Increased for more complete extraction
                    num_return_sequences=1,
                    do_sample=True,
                )
                
                # Decode the output
                prompt_length = inputs["input_ids"].shape[1]
                new_tokens = output[:, prompt_length:]
                text_output = self.processor.tokenizer.batch_decode(
                    new_tokens, skip_special_tokens=True
                )
                
                # Extract the text content
                extracted_text = text_output[0]
                
                # Try to parse as JSON if possible
                try:
                    import json
                    result = json.loads(extracted_text)
                    content = result.get("natural_text", extracted_text)
                except:
                    content = extracted_text
                
                slides.append({
                    "slide_number": page_num + 1,
                    "content": content,
                    "timestamp": None  # We don't have timestamp info from PDF
                })
                
            except FileNotFoundError as e:
                if 'pdfinfo' in str(e):
                    logger.error(f"Error: poppler-utils not installed. Install with: apt-get install poppler-utils")
                    # Fall back to basic extraction for this and all remaining pages
                    remaining_slides = self._process_with_basic_extraction(pdf_path)
                    # Only keep slides for pages we haven't processed yet
                    remaining_slides = [s for s in remaining_slides if s["slide_number"] > page_num]
                    slides.extend(remaining_slides)
                    break
                else:
                    logger.error(f"Error processing page {page_num+1}: {e}", exc_info=True)
                    # Add basic text as fallback for this page
                    page = doc[page_num]
                    text = page.get_text()
                    slides.append({
                        "slide_number": page_num + 1,
                        "content": text,
                        "timestamp": None
                    })
            except Exception as e:
                logger.error(f"Error processing page {page_num+1}: {e}", exc_info=True)
                # Add basic text as fallback
                page = doc[page_num]
                text = page.get_text()
                slides.append({
                    "slide_number": page_num + 1,
                    "content": text,
                    "timestamp": None
                })
        
        return slides
    
    def _process_with_basic_extraction(self, pdf_path: str) -> List[Dict[str, Any]]:
        """Fallback method for basic text extraction from PDF"""
        import fitz  # PyMuPDF
        
        slides = []
        doc = fitz.open(pdf_path)
        
        for page_num in range(len(doc)):
            page = doc[page_num]
            text = page.get_text()
            
            slides.append({
                "slide_number": page_num + 1,
                "content": text,
                "timestamp": None  # We don't have timestamp info from PDF
            })
        
        return slides 