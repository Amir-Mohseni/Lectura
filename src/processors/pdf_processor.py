import torch
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
            
            # Check if CUDA is available and has enough memory
            cuda_available = torch.cuda.is_available()
            logger.info(f"CUDA available: {cuda_available}")
            
            use_gpu = False
            if cuda_available:
                try:
                    # Check GPU memory
                    gpu_memory = torch.cuda.get_device_properties(0).total_memory / (1024**3)  # Convert to GB
                    logger.info(f"GPU memory: {gpu_memory:.2f} GB")
                    
                    # Only use GPU if it has enough memory (at least 8GB)
                    if gpu_memory >= 8.0:
                        use_gpu = True
                        logger.info("Using GPU for OlmOCR model")
                    else:
                        logger.warning(f"GPU has insufficient memory ({gpu_memory:.2f} GB). Using CPU instead.")
                except Exception as e:
                    logger.warning(f"Error checking GPU memory: {e}. Using CPU instead.")
            
            self.device = torch.device("cuda" if use_gpu else "cpu")
            
            # Set appropriate dtype based on device
            if use_gpu:
                dtype = torch.bfloat16 if torch.cuda.is_bf16_supported() else torch.float16
            else:
                # Use float32 for CPU to avoid precision issues
                dtype = torch.float32
            
            logger.info(f"Using device: {self.device}, dtype: {dtype}")
            
            # Initialize the model with appropriate settings
            logger.info("Loading OlmOCR model...")
            
            # Load model with appropriate settings
            self.model = Qwen2VLForConditionalGeneration.from_pretrained(
                "allenai/olmOCR-7B-0225-preview", 
                torch_dtype=dtype,
                low_cpu_mem_usage=True,
                device_map="auto" if use_gpu else None
            ).eval()
            
            self.processor = AutoProcessor.from_pretrained("Qwen/Qwen2-VL-7B-Instruct")
            
            # Only move to device if not using device_map="auto"
            if not use_gpu:
                self.model.to(self.device)
                
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
                inputs = {key: value.to(self.device) for (key, value) in inputs.items()}
                
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