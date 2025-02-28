import os
import openai
import logging

logger = logging.getLogger("lectura.generators.note")

class NoteGenerator:
    def __init__(self, api_key=None, model=None, base_url=None):
        # Use provided values or fall back to environment variables
        self.api_key = api_key or os.getenv("API_KEY")
        self.model = model or os.getenv("API_MODEL", "meta-llama/Llama-3.2-3B-Instruct")
        self.base_url = base_url or os.getenv("API_BASE_URL")
        
        if not self.api_key:
            logger.warning("No API key provided. API calls will fail.")
        
        # Configure OpenAI client
        if self.base_url:
            self.client = openai.OpenAI(
                api_key=self.api_key,
                base_url=self.base_url
            )
        else:
            self.client = openai.OpenAI(api_key=self.api_key)
    
    def generate_notes(self, transcript, slides):
        """Generate structured notes from transcript and slides"""
        logger.info(f"Generating notes using model: {self.model}")
        
        # Extract text from transcript
        if isinstance(transcript, dict) and "text" in transcript:
            transcript_text = transcript["text"]
        else:
            transcript_text = str(transcript)
        
        # Prepare slides content if available
        slides_content = ""
        if slides and len(slides) > 0:
            slides_content = "Slide information:\n"
            for slide in slides:
                slide_num = slide.get("slide_number", "unknown")
                content = slide.get("content", "")
                slides_content += f"Slide {slide_num}: {content}\n\n"
        
        # Create prompt
        prompt = f"""
        You are an expert note-taker. Create comprehensive, well-structured notes from the following lecture transcript.
        
        {slides_content}
        
        Transcript:
        {transcript_text}
        
        Please organize the notes with:
        1. A clear title
        2. Main topics with headings
        3. Key points under each topic
        4. Important definitions or concepts
        5. A brief summary at the end
        
        Format the notes in Markdown.
        """
        
        try:
            # Generate notes using the API
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert note-taking assistant."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=2000
            )
            
            # Extract and return the generated notes
            notes = response.choices[0].message.content
            return notes
            
        except Exception as e:
            logger.error(f"Error generating notes: {e}")
            return f"Error generating notes: {str(e)}" 