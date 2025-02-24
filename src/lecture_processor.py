from typing import Optional, List, Dict
import whisper
from pathlib import Path
import torch

class LectureProcessor:
    def __init__(self, model_type: str = "base"):
        """Initialize the lecture processor with specified Whisper model.
        
        Args:
            model_type (str): Whisper model size ("tiny", "base", "small", "medium", "large")
        """
        self.model = whisper.load_model(model_type)
        self.transcript = None
        self.slides = None
        
    def process_audio(self, audio_path: str) -> Dict:
        """Process lecture audio and return transcription with timestamps.
        
        Args:
            audio_path (str): Path to the audio file
            
        Returns:
            Dict: Transcription results including text and timestamps
        """
        audio_path = Path(audio_path)
        if not audio_path.exists():
            raise FileNotFoundError(f"Audio file not found: {audio_path}")
            
        result = self.model.transcribe(str(audio_path))
        self.transcript = result
        return result
    
    def extract_slides(self, transcript: Dict) -> List[Dict]:
        """Extract potential slide content from transcript.
        
        Args:
            transcript (Dict): Whisper transcription output
            
        Returns:
            List[Dict]: List of extracted slide contents with timestamps
        """
        slides = []
        current_slide = {"content": "", "start_time": 0, "end_time": 0}
        
        # Simple heuristic for slide detection based on phrases and pauses
        slide_indicators = [
            "next slide",
            "moving on to",
            "let's look at",
            "on this slide",
        ]
        
        for segment in transcript["segments"]:
            text = segment["text"].lower()
            
            # Check for slide transitions
            for indicator in slide_indicators:
                if indicator in text:
                    if current_slide["content"]:
                        current_slide["end_time"] = segment["start"]
                        slides.append(current_slide.copy())
                    
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
            current_slide["end_time"] = transcript["segments"][-1]["end"]
            slides.append(current_slide)
            
        self.slides = slides
        return slides 