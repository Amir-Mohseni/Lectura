# Lectura - AI-Powered Lecture Notes Generator

Lectura is an advanced tool that automatically generates comprehensive, well-structured notes from lecture recordings and slides. It uses state-of-the-art AI models for audio transcription and note generation.

## Features

- **Audio Transcription**: Utilizes Whisper-large-v3-turbo for accurate speech-to-text conversion
- **PDF Slide Processing**: Extracts text from PDF slides using OlmOCR
- **Note Generation**: Creates structured notes from lecture content
- **Modern Web Interface**: Clean, responsive design for easy interaction
- **Transformers Integration**: Leverages Hugging Face Transformers for state-of-the-art AI models
- **GPU Acceleration**: Supports GPU acceleration for faster processing
- **Docker Support**: Easy deployment with Docker, including GPU support
- **Modern UI**: Clean, responsive interface with dark mode support

## Requirements

- Python 3.10+
- FFmpeg (for audio processing)
- Transformers 4.36.0+
- Git (for OlmOCR installation)
- 8GB+ RAM (16GB+ recommended)
- NVIDIA GPU with 8GB+ VRAM (optional, for GPU acceleration)
- NVIDIA Container Toolkit (for Docker GPU support)
- System dependencies:
  - poppler-utils (for PDF processing)
  - build-essential (for compiling dependencies)

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

3. Build and run with Docker:

   **Option A: Using the run script (easiest)**
   ```bash
   chmod +x rebuild_docker.sh
   ./rebuild_docker.sh
   docker-compose up
   ```
   
   The script will automatically detect if you have a GPU and use the appropriate configuration.

   **Option B: Manual Docker commands**
   
   For CPU:
   ```bash
   docker-compose build
   docker-compose up
   ```
   
   For GPU (requires NVIDIA Container Toolkit):
   ```bash
   docker-compose -f docker-compose.gpu.yml build
   docker-compose -f docker-compose.gpu.yml up
   ```

4. Access the application at http://localhost:8000

### Option 2: Manual Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Amir-Mohseni/lectura.git
   cd lectura
   ```

2. Install FFmpeg and other system dependencies:
   
   **Ubuntu/Debian:**
   ```bash
   sudo apt-get update
   sudo apt-get install -y ffmpeg poppler-utils build-essential
   ```
   
   **macOS:**
   ```bash
   brew install ffmpeg poppler
   ```

3. Create a virtual environment and install dependencies:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

4. Set up environment variables:
   ```bash
   export API_BASE_URL="https://router.huggingface.co/hf-inference/v1"
   export API_KEY=your_huggingface_api_key
   export API_MODEL=meta-llama/Llama-3.2-3B-Instruct
   ```

5. Run the application:
   ```bash
   uvicorn src.app:app --reload
   ```

6. Access the application at http://localhost:8000

### Option 3: Running in Google Colab

You can run Lectura directly in Google Colab, which provides free GPU access:

You can manually set up Colab:

1. Create a new Colab notebook at [colab.research.google.com](https://colab.research.google.com)

2. Enable GPU acceleration as described above

3. Clone the repository and install dependencies:
   ```python
   !git clone https://github.com/Amir-Mohseni/lectura.git
   %cd lectura
   !pip install -r requirements.txt
   ```

4. Create a `.env` file with your API credentials:
   ```python
   %%writefile .env
   API_BASE_URL="https://router.huggingface.co/hf-inference/v1"
   API_KEY=your_huggingface_api_key
   API_MODEL=meta-llama/Llama-3.2-3B-Instruct
   PORT=8000
   DEBUG=False
   ```

5. Run the application with ngrok for public access:
   ```python
   !pip install pyngrok
   from pyngrok import ngrok
   
   # Start the FastAPI app in the background
   !nohup uvicorn src.main:app --host 0.0.0.0 --port 8000 &
   
   # Create a tunnel to the app
   public_url = ngrok.connect(8000)
   print(f"Lectura is now available at: {public_url}")
   ```

6. Access the application using the ngrok URL provided

7. When you're done, stop the ngrok tunnel:
   ```python
   ngrok.kill()
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
│   │   ├── audio_processor.py  # Audio transcription with Whisper-large-v3-turbo
│   │   ├── pdf_processor.py    # PDF processing with OlmOCR
│   │   └── lecture_processor.py # Coordinates processing and note generation
│   ├── static/               # Static assets (CSS, JS)
│   ├── templates/            # HTML templates
│   └── app.py                # FastAPI application
├── docker-compose.yml        # Docker Compose configuration
├── docker-compose.gpu.yml    # GPU-enabled Docker configuration
├── Dockerfile                # Docker configuration
├── Dockerfile.gpu            # GPU-enabled Docker configuration
├── rebuild_docker.sh         # Script to rebuild Docker containers
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

The application will automatically detect and use your GPU if available. 

**Using GPU with Docker:**
```bash
# Build with no cache (recommended for first run or after updates)
docker-compose -f docker-compose.gpu.yml build --no-cache

# Run with GPU support
docker-compose -f docker-compose.gpu.yml up
```

**Troubleshooting Docker Builds:**

If you encounter issues with Docker builds, especially related to PyMuPDF or other dependencies:

1. Use the rebuild script to clean and rebuild:
   ```bash
   ./rebuild_docker.sh
   ```

2. This script will:
   - Detect if you have a GPU
   - Rebuild the Docker image with `--no-cache` to ensure all dependencies are properly installed
   - Use the appropriate Docker configuration based on your hardware

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

1. **AudioProcessor**: Transcribes lecture recordings using Whisper-large-v3-turbo via Transformers
2. **LectureProcessor**: Extracts text from PDF slides using PyMuPDF and coordinates processing
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
   - Install system dependencies: `apt-get install ffmpeg git poppler-utils libffi-dev libssl-dev`

3. **Docker Build Errors**: If you encounter errors during Docker build:
   - Use the rebuild script: `./rebuild_docker.sh`
   - This script rebuilds with `--no-cache` to ensure clean installation
   - For PyMuPDF specific errors, we now use a pre-built wheel (version 1.22.3) to avoid build issues
   - If you're on ARM architecture (Apple M1/M2/M3), PyMuPDF build issues are common and should be resolved by our updated Dockerfile
   - If you still encounter issues, try manually building with:
     ```bash
     # For CPU
     docker build --no-cache -t lectura:latest .
     
     # For GPU
     docker build --no-cache -f Dockerfile.gpu -t lectura:gpu .
     ```

4. **API Errors**: If you encounter API errors:
   - Verify your API key is correct
   - Check your internet connection
   - Ensure the model you're using is available in the Hugging Face API

5. **PDF Processing Errors**: If you see `FileNotFoundError: [Errno 2] No such file or directory: 'pdfinfo'`:
   - This means the `poppler-utils` package is missing
   - Install it with:
     ```bash
     # Ubuntu/Debian
     sudo apt-get install poppler-utils
     
     # macOS
     brew install poppler
     
     # Windows
     # Download from https://github.com/oschwartz10612/poppler-windows/releases
     # and add the bin directory to your PATH
     ```
   - In Docker, rebuild your image after updating the Dockerfile
   - In Colab, run: `!apt-get update && apt-get install -y poppler-utils`

## License

[MIT License](LICENSE)

## Acknowledgements

- [OpenAI Whisper](https://github.com/openai/whisper)
- [OlmOCR](https://github.com/allenai/olmocr)
- [Hugging Face Transformers](https://github.com/huggingface/transformers)
- [FastAPI](https://fastapi.tiangolo.com/)

## Technologies

- [Python](https://www.python.org/)
- [FastAPI](https://fastapi.tiangolo.com/)
- [Transformers](https://github.com/huggingface/transformers)
- [Docker](https://www.docker.com/)

### Static Files Not Loading (404 Errors)

If you encounter 404 errors for static files (CSS, JavaScript, icons), ensure you're using the correct entry point:

- For Docker: The application should use `src.main:app` as the entry point
- For manual installation: Use `src.app:app` as the entry point

The Docker configuration has been updated to use `src.main:app` which has the correct paths for static files in the Docker environment.

### PyMuPDF Installation Issues

If you encounter issues with PyMuPDF installation, especially on ARM architectures:

1. Try installing with the pre-built wheel:
   ```bash
   pip install --only-binary :all: pymupdf==1.22.3
   ```

2. If that fails, install from source:
   ```bash
   pip install pymupdf==1.22.3
   ```

3. For Docker, the Dockerfile has been updated to try both methods.
