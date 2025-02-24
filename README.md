# Lectura 🎓

Lectura is an AI-powered lecture processing system that automatically converts lecture audio into well-structured study notes. Using advanced speech recognition and language models, it transcribes audio, detects slide transitions, and generates comprehensive notes in markdown format.

## 🌟 Features

- 🎙️ Audio transcription using Whisper
- 📊 Automatic slide content detection and integration
- 🤖 AI-powered note generation with customizable LLM support
- 📝 Clean web interface for file uploads
- ⬇️ Downloadable markdown-formatted notes
- 🔄 Support for multiple AI providers

## 🚀 Quick Start

### Using Docker (Recommended)

1. Clone and navigate to the repository:
```bash
git clone https://github.com/Amir-Mohseni/lectura
cd lectura
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your API settings
```

3. Launch the application:
```bash
docker-compose up --build
```

4. Open `http://localhost:8000` in your browser

### Manual Setup

1. Install system dependencies:
```bash
# Ubuntu/Debian
sudo apt-get update && sudo apt-get install -y ffmpeg

# macOS
brew install ffmpeg
```

2. Install Python packages:
```bash
pip install -r requirements.txt
```

3. Configure environment:
```bash
cp .env.example .env
# Edit .env with your settings
```

4. Start the server:
```bash
cd src
uvicorn app:app --reload
```

## 🛠️ Configuration

### Environment Variables
```env
# API Configuration
API_BASE_URL=https://api.openai.com/v1
API_KEY=your-api-key-here
API_MODEL=gpt-4

# Whisper Configuration
WHISPER_MODEL=base  # tiny, base, small, medium, large

# Server Configuration
PORT=8000
DEBUG=False
```

## 📁 Project Structure
```
lectura/
├── src/
│   ├── app.py                # FastAPI web application
│   ├── lecture_processor.py  # Audio processing & transcription
│   ├── note_generator.py     # Note generation with LLMs
│   ├── static/              # Frontend assets
│   └── templates/           # HTML templates
├── docker-compose.yml        # Docker configuration
├── Dockerfile               # Container definition
├── requirements.txt         # Python dependencies
└── README.md               # Documentation
```

## 🔍 Usage

1. Upload lecture audio (supported: mp3, wav, m4a)
2. Optionally upload lecture slides (PDF, PPT, PPTX)
3. Choose Whisper model size:
   - `base`: Balanced speed/accuracy
   - `small`: Faster processing
   - `medium`: Better accuracy
   - `large`: Highest quality
4. Click "Generate Notes"
5. Download or view the generated markdown notes

## 🔧 Troubleshooting

- **Audio Processing Issues**
  - Verify audio format compatibility
  - Check FFmpeg installation
  - Ensure adequate storage space

- **Note Generation Problems**
  - Verify API key and permissions
  - Check API rate limits
  - Confirm internet connectivity

- **Docker-related Issues**
  - Verify Docker installation
  - Check port 8000 availability
  - Ensure sufficient system resources

## 📄 License

MIT License - See LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---
Created by [Amir Mohseni](https://github.com/Amir-Mohseni)
