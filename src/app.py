from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from pathlib import Path
import shutil
import os
import uuid
import logging
from src.processors.lecture_processor import LectureProcessor
from src.generators.note_generator import NoteGenerator
from fastapi import Request
from dotenv import load_dotenv

load_dotenv(override=True)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("lectura.app")

# Check if we should use mock processor for testing
USE_MOCK = os.getenv("USE_MOCK_PROCESSOR", "").lower() in ("true", "1", "yes")
if USE_MOCK:
    logger.info("Using mock processor for testing")
else:
    logger.info("Using real processor")

app = FastAPI(title="Lectura")

# Setup static and template directories
BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

# Mount static files directory
app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))

@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    # Pass the static_url to the template
    return templates.TemplateResponse("index.html", {"request": request, "static_url": "/static"})

@app.post("/process")
async def process_lecture(
    audio: UploadFile = File(None),
    slides: UploadFile = File(None),
    api_base_url: str = Form(None),
    api_key: str = Form(None),
    api_model: str = Form(None)
):
    # Create unique session ID
    session_id = str(uuid.uuid4())
    session_dir = UPLOAD_DIR / session_id
    session_dir.mkdir()
    
    logger.info(f"Processing lecture with session ID: {session_id}")
    
    # Check if at least one file is provided
    if not audio and not slides:
        raise HTTPException(status_code=400, detail="You must provide either an audio file or slides")
    
    if audio:
        logger.info(f"Audio file: {audio.filename}, Content-Type: {audio.content_type}")
    if slides:
        logger.info(f"Slides file: {slides.filename}, Content-Type: {slides.content_type}")
    
    try:
        # Initialize variables
        transcript = ""
        slides_data = []
        processor = LectureProcessor(use_mock=USE_MOCK)
        
        # Process audio if provided
        if audio:
            audio_path = session_dir / audio.filename
            logger.info(f"Saving audio file to: {audio_path}")
            with audio_path.open("wb") as f:
                shutil.copyfileobj(audio.file, f)
            logger.info(f"Audio file saved successfully")
            
            # Process audio
            logger.info(f"Processing audio file...")
            transcript = processor.process_audio(str(audio_path))
            logger.info(f"Audio processing completed")
        
        # Process slides if provided
        if slides:
            logger.info(f"Processing slides file...")
            slides_path = session_dir / slides.filename
            with slides_path.open("wb") as f:
                shutil.copyfileobj(slides.file, f)
            slides_data = processor.extract_slides_from_pdf(str(slides_path))
            logger.info(f"Slides processing completed: {len(slides_data)} slides extracted")
        
        # Use provided API settings or fall back to environment variables
        logger.info(f"Generating notes...")
        note_generator = NoteGenerator(
            api_key=os.getenv("API_KEY"),
            base_url=os.getenv("API_BASE_URL"),
            model=os.getenv("API_MODEL")
        )
        notes = note_generator.generate_notes(transcript, slides_data)
        logger.info(f"Notes generation completed: {len(notes)} characters")
        
        # Return the markdown notes as the primary content with additional data in the response
        logger.info(f"Returning response")
        return JSONResponse(content={
            "markdown_notes": notes,  # Primary content - the markdown notes
            "data": {  # Additional data in a nested structure
                "transcript": transcript,
                "slides": slides_data
            }
        })
        
    except Exception as e:
        logger.error(f"Error processing lecture: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Cleanup
        logger.info(f"Cleaning up session directory: {session_dir}")
        shutil.rmtree(session_dir) 