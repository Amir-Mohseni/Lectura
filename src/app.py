from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from pathlib import Path
import shutil
import os
import uuid
from src.processors.lecture_processor import LectureProcessor
from src.generators.note_generator import NoteGenerator
from fastapi import Request

app = FastAPI(title="Lectura")

# Setup static and template directories
BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))

@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/process")
async def process_lecture(
    audio: UploadFile = File(...),
    slides: UploadFile = None,
    api_base_url: str = Form(None),
    api_key: str = Form(None),
    api_model: str = Form(None)
):
    # Create unique session ID
    session_id = str(uuid.uuid4())
    session_dir = UPLOAD_DIR / session_id
    session_dir.mkdir()
    
    try:
        # Save audio file
        audio_path = session_dir / audio.filename
        with audio_path.open("wb") as f:
            shutil.copyfileobj(audio.file, f)
            
        # Process audio
        processor = LectureProcessor()
        transcript = processor.process_audio(str(audio_path))
        
        # Process slides if provided
        slides_data = []
        if slides:
            slides_path = session_dir / slides.filename
            with slides_path.open("wb") as f:
                shutil.copyfileobj(slides.file, f)
            slides_data = processor.extract_slides_from_pdf(str(slides_path))
        
        # Use provided API settings or fall back to environment variables
        note_generator = NoteGenerator(
            api_key=api_key or os.getenv("API_KEY"),
            base_url=api_base_url or os.getenv("API_BASE_URL"),
            model=api_model or os.getenv("API_MODEL")
        )
        notes = note_generator.generate_notes(transcript, slides_data)
        
        # Save results
        results = {
            "notes": notes,
            "transcript": transcript,
            "slides": slides_data
        }
        
        return JSONResponse(content=results)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Cleanup
        shutil.rmtree(session_dir) 