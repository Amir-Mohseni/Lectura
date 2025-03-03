# Lectura - AI-Powered Lecture Notes Generator

Lectura is a streamlined tool that automatically generates comprehensive, well-structured notes from lecture recordings and slides using local AI models.

## Features

- **Audio Transcription**: Transcribe lecture audio using MLX Whisper (locally)
- **Notes Generation**: Generate comprehensive, well-structured notes from transcriptions using AI
- **Multiple AI Providers**: Support for OpenAI, Anthropic, local models, and Ollama
- **Clean UI**: Modern, responsive web interface with drag-and-drop file uploads
- **Dark/Light Mode**: Theme toggle with system default option
- **Coming Soon**: Slides processing (PDF, PPT, PPTX) integration

## Screenshots

![Lectura UI](docs/screenshots/main-screen.png)

## Requirements

- Node.js 14+
- Python 3.8+
- MLX Whisper (for audio transcription)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Amir-Mohseni/lectura.git
   cd lectura
   ```

2. Install dependencies:
   ```bash
   npm run setup
   ```
   This will install both Node.js and Python dependencies.

3. Copy the example environment file and update it with your settings:
   ```bash
   cp .env.example .env
   ```

4. Start the server:
   ```bash
   npm start
   ```

5. Access the application at http://localhost:8000

## Usage

1. Open the application in your web browser
2. Upload a lecture audio file (MP3, WAV, M4A, OGG)
3. Click "Generate Notes"
4. Wait for processing to complete (transcription followed by notes generation)
5. View and download your generated notes in Markdown format

## Configuration

You can configure the application using environment variables in the `.env` file:

- `PORT`: The port to run the server on (default: 8000)
- `NODE_ENV`: Environment mode (development or production)
- `OPENAI_API_KEY`: Your OpenAI API key (for note generation)
- `ANTHROPIC_API_KEY`: Your Anthropic API key (for note generation)
- `WHISPER_MODEL`: The Whisper model to use (default is MLX Whisper default)

## Project Structure

```
lectura/
├── src/
│   ├── routes/           # Express route definitions
│   ├── services/         # Business logic services
│   ├── static/           # Static assets (HTML, CSS, JS)
│   │   ├── css/          # Stylesheets
│   │   ├── js/           # Client-side JavaScript
│   │   └── images/       # Images and icons
│   ├── audio_processor.py # Python script for audio transcription
│   └── server.js         # Main Express server
├── uploads/              # Uploaded files (created at runtime)
├── .env                  # Environment variables
├── package.json          # Node.js dependencies
└── requirements.txt      # Python dependencies
```

## Developing

For development with auto-restart:

```bash
npm run dev
```

## API Endpoints

### Upload Files

```
POST /api/upload
```

Upload audio files and optionally slides.

### Transcribe Audio

```
POST /api/transcribe
```

Transcribe an already uploaded audio file.

### Generate Notes

```
POST /api/generate-notes
```

Generate notes from a transcription.

### Process (All-in-one)

```
POST /api/process
```

Upload, transcribe, and generate notes in a single request.

## Technologies Used

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express
- **Transcription**: MLX Whisper
- **Notes Generation**: OpenAI/Anthropic/Local models

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
