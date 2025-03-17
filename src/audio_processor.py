import mlx_whisper
from typing import Optional, Dict, Any, Union


def transcribe_audio(
    audio_path: str,
    path_or_hf_repo: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Transcribe audio using mlx-whisper.
    
    Args:
        audio_path: Path to the audio file to transcribe
        path_or_hf_repo: Optional path or Hugging Face repo for the model
                         If None, uses the default model
    
    Returns:
        Dictionary containing transcription results with keys like 'text', 'segments', etc.
    
    Note:
        In future improvements, we could:
        - Support different model options/sizes
        - Add language selection
        - Implement batch processing for multiple files
        - Add options for timestamp generation
    """
    # If path_or_hf_repo is provided, pass it to the transcribe function
    # Otherwise, use the default model
    if path_or_hf_repo:
        result = mlx_whisper.transcribe(
            audio_path,
            path_or_hf_repo=path_or_hf_repo,
        )
    else:
        result = mlx_whisper.transcribe(audio_path)
    
    return result


def get_transcription_text(
    audio_path: str,
    path_or_hf_repo: Optional[str] = None,
) -> str:
    """
    Get just the text from an audio transcription.
    
    Args:
        audio_path: Path to the audio file to transcribe
        path_or_hf_repo: Optional path or Hugging Face repo for the model
    
    Returns:
        The transcribed text as a string
    """
    result = transcribe_audio(audio_path, path_or_hf_repo)
    return result["text"] 