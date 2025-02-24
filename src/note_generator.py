from typing import List, Dict
import openai
from markdown import markdown
import re

class NoteGenerator:
    def __init__(self, api_key: str, base_url: str = None, model: str = "gpt-4"):
        """Initialize the note generator with API configuration.
        
        Args:
            api_key (str): API key for the service
            base_url (str, optional): Base URL for API endpoint. Defaults to OpenAI's.
            model (str, optional): Model to use. Defaults to "gpt-4".
        """
        self.model = model
        if base_url:
            openai.api_base = base_url
        openai.api_key = api_key
        
    def generate_notes(self, transcript: Dict, slides: List[Dict]) -> str:
        """Generate structured notes from transcript and slides.
        
        Args:
            transcript (Dict): Whisper transcription output
            slides (List[Dict]): Extracted slide contents
            
        Returns:
            str: Markdown formatted notes
        """
        # Combine slide content with transcript for context
        combined_content = self._combine_content(transcript, slides)
        
        # Generate structured notes using the specified model
        prompt = self._create_note_prompt(combined_content)
        
        try:
            response = openai.ChatCompletion.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert note-taker. Create well-structured, clear, and concise notes from lecture content."},
                    {"role": "user", "content": prompt}
                ]
            )
            return response.choices[0].message.content
            
        except Exception as e:
            raise Exception(f"Note generation failed: {str(e)}")
    
    def _combine_content(self, transcript: Dict, slides: List[Dict]) -> str:
        """Combine transcript and slide content with temporal alignment."""
        combined = []
        current_slide_idx = 0
        
        for segment in transcript["segments"]:
            # Check if we should move to next slide
            while (current_slide_idx < len(slides) and 
                   segment["start"] >= slides[current_slide_idx]["end_time"]):
                current_slide_idx += 1
            
            if current_slide_idx < len(slides):
                combined.append({
                    "time": segment["start"],
                    "text": segment["text"],
                    "slide_context": slides[current_slide_idx]["content"]
                })
            else:
                combined.append({
                    "time": segment["start"],
                    "text": segment["text"],
                    "slide_context": ""
                })
                
        return combined
    
    def _create_note_prompt(self, combined_content: List[Dict]) -> str:
        """Create a prompt for note generation."""
        prompt = "Please create well-structured notes from the following lecture content:\n\n"
        
        for item in combined_content:
            prompt += f"[{item['time']:.2f}s] {item['text']}\n"
            if item["slide_context"]:
                prompt += f"Slide context: {item['slide_context']}\n"
            prompt += "\n"
            
        prompt += "\nPlease format the notes with:\n"
        prompt += "1. Clear headings and subheadings\n"
        prompt += "2. Bullet points for key concepts\n"
        prompt += "3. Important definitions and examples\n"
        prompt += "4. Summary points at the end\n"
        
        return prompt 