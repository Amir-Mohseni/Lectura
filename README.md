# Lectura - AI-Powered Lecture Notes Generator

Lectura is an advanced tool that automatically generates comprehensive, well-structured notes from lecture recordings and slides. It uses state-of-the-art AI models for audio transcription and note generation.

## Features

- **Audio Transcription**: Uses OpenAI's Whisper-large-v3-turbo model for accurate speech-to-text conversion
- **PDF Slide Processing**: Extracts text from PDF slides using OlmOCR, a powerful OCR model
- **Note Generation**: Creates well-structured, comprehensive notes using LLMs
- **GPU Acceleration**: Supports GPU acceleration for faster processing
- **Docker Support**: Easy deployment with Docker, including GPU support
- **Modern UI**: Clean, responsive interface with dark mode support

## Requirements

- Python 3.10+
- PyTorch 2.0+
- 8GB+ RAM (16GB+ recommended)
- NVIDIA GPU with 8GB+ VRAM (optional, for GPU acceleration)
- NVIDIA Container Toolkit (for Docker GPU support)

## Installation

### Option 1: Using Docker (Recommended)

1. Clone the repository:
   ```bash
   git clone https://github.com/Amir-Mohseni/lectura.git
   cd lectura
   ```

2. Create a `.env` file with your API credentials:
   ```
   API_BASE_URL="https://router.huggingface.co/hf-inference/v1"
   API_KEY=your_huggingface_api_key
   API_MODEL=meta-llama/Llama-3.2-3B-Instruct
   PORT=8000
   DEBUG=False
   ```

3. Make the run script executable:
   ```bash
   chmod +x run_with_gpu.sh
   ```

4. Run the application:
   ```bash
   ./run_with_gpu.sh
   ```
   This script will automatically detect if you have a GPU and use the appropriate Docker configuration.

### Option 2: Manual Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Amir-Mohseni/lectura.git
   cd lectura
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file with your API credentials (as shown above)

5. Run the application:
   ```bash
   uvicorn src.main:app --host 0.0.0.0 --port 8000
   ```

## Usage

1. Open your browser and navigate to `http://localhost:8000`

2. Upload a lecture recording (MP3, WAV, M4A, OGG formats supported)

3. Optionally upload lecture slides (PDF format)

4. Click "Generate Notes" and wait for the processing to complete

5. View and download your generated notes in Markdown format

## Project Structure

```
lectura/
├── src/                      # Source code
│   ├── processors/           # Input processing modules
│   │   ├── audio_processor.py  # Audio transcription with Whisper
│   │   ├── pdf_processor.py    # PDF processing with OlmOCR
│   │   └── lecture_processor.py # Coordinates processing
│   ├── generators/           # Content generation modules
│   │   └── note_generator.py   # Notes generation with LLMs
│   ├── tests/                # Test modules
│   │   ├── test_audio_processor.py
│   │   ├── test_pdf_processor.py
│   │   ├── test_api.py
│   │   └── test_note_generator.py
│   ├── static/               # Static assets (CSS, JS)
│   ├── templates/            # HTML templates
│   └── main.py               # FastAPI application
├── docker-compose.yml        # Docker Compose configuration
├── docker-compose.gpu.yml    # GPU-enabled Docker configuration
├── Dockerfile                # Docker configuration
├── Dockerfile.gpu            # GPU-enabled Docker configuration
├── requirements.txt          # Python dependencies
├── .env                      # Environment variables (create this)
└── README.md                 # This file
```

## Advanced Configuration

### GPU Support

For GPU acceleration, ensure you have:
- NVIDIA GPU with CUDA support
- NVIDIA drivers installed
- NVIDIA Container Toolkit (for Docker)

The application will automatically detect and use your GPU if available. For Docker, use:
```bash
docker-compose -f docker-compose.gpu.yml up --build
```

### API Configuration

Lectura uses the Hugging Face API for note generation. You can configure:
- `API_BASE_URL`: The Hugging Face API endpoint
- `API_KEY`: Your Hugging Face API key
- `API_MODEL`: The model to use for note generation (default: meta-llama/Llama-3.2-3B-Instruct)

### Testing

Several test scripts are provided to verify your installation:

```bash
# Make test scripts executable
bash make_scripts_executable.sh

# Test API connection
./test_api.sh

# Test PDF processing
./test_pdf.sh

# Test audio processing
./test_audio.sh

# Test note generation
./test_notes.sh
```

## Architecture

Lectura consists of several components:

1. **AudioProcessor**: Transcribes lecture recordings using Whisper-large-v3-turbo
2. **PDFProcessor**: Extracts text from PDF slides using OlmOCR
3. **NoteGenerator**: Generates structured notes using LLMs
4. **Web Interface**: FastAPI backend with a responsive frontend

## Troubleshooting

### Common Issues

1. **GPU Memory Error**: If you encounter GPU memory errors, try:
   - Using a smaller model
   - Running on CPU instead
   - Increasing your Docker container's memory limit

2. **Installation Errors**: If you encounter errors installing dependencies:
   - Ensure you have the latest pip: `pip install --upgrade pip`
   - Install PyTorch separately following instructions at pytorch.org
   - Install system dependencies: `apt-get install ffmpeg build-essential git`

3. **API Errors**: If you encounter API errors:
   - Verify your API key is correct
   - Check your internet connection
   - Ensure the model you're using is available in the Hugging Face API

## License

[MIT License](LICENSE)

## Acknowledgements

- [OpenAI Whisper](https://github.com/openai/whisper)
- [OlmOCR](https://github.com/allenai/olmocr)
- [Hugging Face Transformers](https://github.com/huggingface/transformers)
- [FastAPI](https://fastapi.tiangolo.com/)
- [PyTorch](https://pytorch.org/)
