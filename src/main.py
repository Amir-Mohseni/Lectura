import argparse
from pathlib import Path
from lecture_processor import LectureProcessor
from note_generator import NoteGenerator
import os
import json

def main():
    parser = argparse.ArgumentParser(description="Process lecture audio and generate notes")
    parser.add_argument("audio_path", help="Path to the lecture audio file")
    parser.add_argument("--output", "-o", help="Output directory for generated notes", default="output")
    parser.add_argument("--model", "-m", help="Whisper model size", default="base")
    args = parser.parse_args()
    
    # Create output directory
    output_dir = Path(args.output)
    output_dir.mkdir(exist_ok=True)
    
    # Initialize processors
    processor = LectureProcessor(model_type=args.model)
    note_generator = NoteGenerator(api_key=os.getenv("OPENAI_API_KEY"))
    
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