import argparse
from pathlib import Path
from src.lecture_processor import LectureProcessor
from src.note_generator import NoteGenerator
import os
import json
import logging
import sys
from fastapi import FastAPI, Request, File, UploadFile, Form
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import tempfile
import shutil
from typing import Optional

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("lectura")

app = FastAPI()

# Create output directory if it doesn't exist
output_dir = Path("/app/output")
output_dir.mkdir(exist_ok=True)

# Mount static files directory - update path for Docker environment
app.mount("/static", StaticFiles(directory="/app/src/static"), name="static")

# Mount output directory to serve generated files
app.mount("/output", StaticFiles(directory="/app/output"), name="output")

# Configure templates - update path for Docker environment
templates = Jinja2Templates(directory="/app/src/templates")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def read_root(request: Request):
    return templates.TemplateResponse(
        "index.html", 
        {
            "request": request,
            # Add base URL for static files
            "static_url": "/static"
        }
    )

def transcribe_audio(audio_path, language="en"):
    """Transcribe audio file using Whisper model"""
    logger.info(f"Transcribing audio file: {audio_path}")
    whisper_model = os.getenv("WHISPER_MODEL", "base")
    processor = LectureProcessor(model_type=whisper_model)
    transcript = processor.process_audio(audio_path)
    return transcript

def generate_notes_from_transcript(transcript, model="gpt-4o"):
    """Generate notes from transcript without slides"""
    logger.info("Generating notes from transcript")
    note_generator = NoteGenerator(
        api_key=os.getenv("API_KEY"),
        model=os.getenv("API_MODEL", model),
        base_url=os.getenv("API_BASE_URL")
    )
    slides = []  # Empty slides
    notes = note_generator.generate_notes(transcript, slides)
    return notes

def generate_notes_from_transcript_and_slides(transcript, slides_path, model="gpt-4o"):
    """Generate notes from transcript and slides"""
    logger.info(f"Generating notes from transcript and slides: {slides_path}")
    note_generator = NoteGenerator(
        api_key=os.getenv("API_KEY"),
        model=os.getenv("API_MODEL", model),
        base_url=os.getenv("API_BASE_URL")
    )
    # Process slides if needed
    processor = LectureProcessor()
    slides = processor.extract_slides_from_pdf(slides_path)
    notes = note_generator.generate_notes(transcript, slides)
    return notes

@app.post("/generate")
async def generate_notes(
    recording: UploadFile,
    slides: Optional[UploadFile] = None,
    language: str = "en",
    model: str = "gpt-4o",
):
    # Create a temporary directory for processing
    temp_dir = tempfile.mkdtemp()
    
    # Determine file extension from the uploaded file
    file_extension = os.path.splitext(recording.filename)[1].lower() if recording.filename else ".mp3"
    if not file_extension:
        file_extension = ".mp3"  # Default to mp3 if no extension
    
    # Save the recording with proper extension
    recording_path = os.path.join(temp_dir, f"recording{file_extension}")
    logger.info(f"Saving uploaded audio to {recording_path}")
    
    try:
        # Save the recording
        with open(recording_path, "wb") as buffer:
            buffer.write(await recording.read())
        
        # Save the slides if provided
        slides_path = None
        if slides and slides.filename:
            slides_path = os.path.join(temp_dir, "slides.pdf")
            with open(slides_path, "wb") as buffer:
                buffer.write(await slides.read())
        
        # Process the recording
        transcript = transcribe_audio(recording_path, language)
        
        # Generate notes using the transcript and slides if available
        if slides_path:
            notes = generate_notes_from_transcript_and_slides(transcript, slides_path, model)
        else:
            notes = generate_notes_from_transcript(transcript, model)
        
        # Clean up temporary files
        shutil.rmtree(temp_dir)
        
        return {"notes": notes}
    
    except Exception as e:
        # Clean up temporary files in case of error
        shutil.rmtree(temp_dir)
        logger.error(f"Error in generate_notes: {str(e)}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"error": f"Failed to process recording: {str(e)}"}
        )

def main():
    parser = argparse.ArgumentParser(description="Process lecture audio and generate notes")
    parser.add_argument("audio_path", help="Path to the lecture audio file")
    parser.add_argument("--output", "-o", help="Output directory for generated notes", default="output")
    parser.add_argument("--model", "-m", help="Whisper model size", default="base")
    parser.add_argument("--openai-model", help="OpenAI model to use", default="gpt-4")
    parser.add_argument("--base-url", help="Base URL for API endpoint", default=None)
    args = parser.parse_args()
    
    # Create output directory
    output_dir = Path(args.output)
    output_dir.mkdir(exist_ok=True)
    
    # Initialize processors
    processor = LectureProcessor(model_type=args.model)
    note_generator = NoteGenerator(
        api_key=os.getenv("OPENAI_API_KEY"), 
        model=args.openai_model,
        base_url=args.base_url
    )
    
    # Process audio
    print("Transcribing audio...")
    transcript = processor.process_audio(args.audio_path)
    
    # Extract slides
    print("Extracting slide information...")
    slides = processor.extract_slides(transcript)
    
    # Generate notes
    print("Generating structured notes...")
    notes = note_generator.generate_notes(transcript, slides)
    
    # Save outputs
    audio_name = Path(args.audio_path).stem
    
    # Save transcript
    with open(output_dir / f"{audio_name}_transcript.json", "w") as f:
        json.dump(transcript, f, indent=2)
    
    # Save slides
    with open(output_dir / f"{audio_name}_slides.json", "w") as f:
        json.dump(slides, f, indent=2)
    
    # Save notes
    with open(output_dir / f"{audio_name}_notes.md", "w") as f:
        f.write(notes)
    
    print(f"Processing complete. Output files saved to {output_dir}")

if __name__ == "__main__":
    main() 