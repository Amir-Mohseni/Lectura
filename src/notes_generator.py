import json
import sys
import os
import requests
from typing import Dict, Any, Optional

def generate_notes(
    transcription: str, 
    title: str = "Lecture",
    api_provider: str = "default",
    model: Optional[str] = None,
    api_key: Optional[str] = None,
    api_endpoint: Optional[str] = None,
    api_model_name: Optional[str] = None
) -> str:
    """
    Generate structured notes from a transcription
    
    Args:
        transcription: The transcribed text to generate notes from
        title: Title of the lecture or audio
        api_provider: API provider to use (default, openai, anthropic, local, ollama, custom)
        model: Model name to use for the selected provider
        api_key: API key for the selected provider
        api_endpoint: Custom API endpoint URL
        api_model_name: Custom model name
        
    Returns:
        Generated notes in markdown format
    """
    # Only log to stderr, don't include in output
    print(f"Generating notes using provider: {api_provider}", file=sys.stderr)
    
    # Load environment variables if not explicitly provided
    if api_provider == "default":
        if not api_key and "API_KEY" in os.environ:
            api_key = os.environ.get("API_KEY")
        if not model and "API_MODEL" in os.environ:
            model = os.environ.get("API_MODEL", "gemini-2.0-flash")
        if not api_endpoint and "API_BASE_URL" in os.environ:
            api_endpoint = os.environ.get("API_BASE_URL")
    
    # Select the appropriate generation method based on the API provider
    if api_provider == "default" or api_provider == "custom":
        return generate_with_custom_api(
            transcription, 
            title,
            api_key,
            api_endpoint or "https://generativelanguage.googleapis.com/v1beta/openai/",
            model or api_model_name or "gemini-2.0-flash"
        )
    elif api_provider == "openai":
        return generate_with_openai(transcription, title, model or "gpt-4o", api_key)
    elif api_provider == "anthropic":
        return generate_with_anthropic(transcription, title, model or "claude-3.7-sonnet", api_key)
    elif api_provider == "local":
        return generate_with_local(transcription, title, model or "mixtral-8x7b")
    elif api_provider == "ollama":
        return generate_with_ollama(transcription, title, model or "llama3")
    else:
        return mock_notes(transcription, title)

def generate_with_custom_api(
    transcription: str,
    title: str,
    api_key: str,
    api_endpoint: str,
    model_name: str
) -> str:
    """Generate notes using a custom API with OpenAI-compatible API"""
    try:
        # Create the system prompt
        system_prompt = """You are a professional note-taker specialized in creating organized, concise, and comprehensive notes 
from lecture transcriptions. For this transcription, create well-structured notes in Markdown format.

Guidelines:
- Begin with a clear title and introduction
- Use appropriate headings (##, ###) to organize the content
- Create bullet points for key ideas
- Include numbered lists for sequential information
- Highlight important terms, concepts, or definitions
- Use emojis where appropriate to enhance readability and engagement (e.g., 📝, 💡, ⚠️, 🔑, etc.)
- Create a brief summary at the end
- Keep the notes concise but comprehensive"""
        
        # Create the user prompt with the transcription
        user_prompt = f"Here is a transcription of a lecture titled '{title}'. Please transform it into well-organized notes:\n\n{transcription}"
        
        # Make the API request
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}"
        }
        
        payload = {
            "model": model_name,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.5
        }
        
        response = requests.post(
            f"{api_endpoint.rstrip('/')}/chat/completions",
            headers=headers,
            json=payload
        )
        
        # Parse response
        if response.status_code != 200:
            print(f"API error: {response.status_code}")
            print(response.text)
            return mock_notes(transcription, title)
        
        data = response.json()
        notes = data.get("choices", [{}])[0].get("message", {}).get("content", "")
        
        if not notes:
            return mock_notes(transcription, title)
        
        return notes
    
    except Exception as e:
        print(f"Error generating notes with custom API: {str(e)}")
        return mock_notes(transcription, title)

def generate_with_openai(
    transcription: str,
    title: str,
    model: str,
    api_key: str
) -> str:
    """Generate notes using OpenAI API"""
    try:
        import openai
        
        # Configure the client
        client = openai.OpenAI(api_key=api_key)
        
        # Create the system prompt
        system_prompt = """You are a professional note-taker specialized in creating organized, concise, and comprehensive notes 
from lecture transcriptions. For this transcription, create well-structured notes in Markdown format.

Guidelines:
- Begin with a clear title and introduction
- Use appropriate headings (##, ###) to organize the content
- Create bullet points for key ideas
- Include numbered lists for sequential information
- Highlight important terms, concepts, or definitions
- Use emojis where appropriate to enhance readability (e.g., 📝, 💡, ⚠️, 🔑, etc.)
- Create a brief summary at the end
- Keep the notes concise but comprehensive"""
        
        # Create the user prompt with the transcription
        user_prompt = f"Here is a transcription of a lecture titled '{title}'. Please transform it into well-organized notes:\n\n{transcription}"
        
        # Make the API request
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.3
        )
        
        return response.choices[0].message.content
    
    except Exception as e:
        print(f"Error generating notes with OpenAI API: {str(e)}")
        return mock_notes(transcription, title)

def generate_with_anthropic(
    transcription: str,
    title: str,
    model: str,
    api_key: str
) -> str:
    """Generate notes using Anthropic API"""
    try:
        import anthropic
        
        # Configure the client
        client = anthropic.Anthropic(api_key=api_key)
        
        # Create the system prompt
        system_prompt = """You are a professional note-taker specialized in creating organized, concise, and comprehensive notes 
from lecture transcriptions. For this transcription, create well-structured notes in Markdown format.

Guidelines:
- Begin with a clear title and introduction
- Use appropriate headings (##, ###) to organize the content
- Create bullet points for key ideas
- Include numbered lists for sequential information
- Highlight important terms, concepts, or definitions
- Use emojis where appropriate to enhance readability (e.g., 📝, 💡, ⚠️, 🔑, etc.)
- Create a brief summary at the end
- Keep the notes concise but comprehensive"""
        
        # Create the user prompt with the transcription
        user_prompt = f"Here is a transcription of a lecture titled '{title}'. Please transform it into well-organized notes:\n\n{transcription}"
        
        # Make the API request
        response = client.messages.create(
            model=model,
            system=system_prompt,
            max_tokens=4000,
            messages=[
                {"role": "user", "content": user_prompt}
            ]
        )
        
        return response.content[0].text
    
    except Exception as e:
        print(f"Error generating notes with Anthropic API: {str(e)}")
        return mock_notes(transcription, title)

def generate_with_local(
    transcription: str,
    title: str,
    model: str
) -> str:
    """Generate notes using a local LLM server"""
    # This is a placeholder - implement according to your local setup
    return mock_notes(transcription, title)

def generate_with_ollama(
    transcription: str,
    title: str,
    model: str
) -> str:
    """Generate notes using Ollama"""
    try:
        # Make a request to the Ollama server
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": model,
                "prompt": f"""You are a professional note-taker. Create organized, concise, and comprehensive notes in Markdown format for this lecture transcription titled '{title}'. 

Use appropriate headings, bullet points, and numbered lists. Highlight important terms and use emojis where appropriate to enhance readability (e.g., 📝, 💡, ⚠️, 🔑, etc.).

Transcription:
{transcription}""",
                "stream": False
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            return data.get("response", "")
        else:
            return mock_notes(transcription, title)
    
    except Exception as e:
        print(f"Error generating notes with Ollama: {str(e)}")
        return mock_notes(transcription, title)

def mock_notes(transcription: str, title: str) -> str:
    """Generate mock notes when API calls fail"""
    # Extract the first few sentences for a summary
    sentences = transcription.split('.')[:5]
    summary = '. '.join(sentences) + '.'
    
    # Create a basic structure with the title and summary
    return f"""# 📝 Notes: {title}

## 📋 Summary
{summary}

## 🔑 Key Points
- First key point extracted from the lecture
- Second key point extracted from the lecture
- Third key point extracted from the lecture

## 📚 Details
The details of the lecture would be organized here based on the content.

### 🔍 Subtopic 1
Information about the first subtopic would be here.

### 🔍 Subtopic 2
Information about the second subtopic would be here.

## 💡 Conclusion
A brief conclusion based on the lecture content.
"""

if __name__ == "__main__":
    # This allows the script to be called directly from command line
    # Example: python notes_generator.py "transcription.txt" "Lecture Title" "default" "gemini-2.0-flash"
    if len(sys.argv) < 2:
        print("Usage: python notes_generator.py <transcription_file> [title] [api_provider] [model] [api_key] [api_endpoint] [api_model_name]")
        sys.exit(1)
    
    # Read the transcription from file
    try:
        with open(sys.argv[1], 'r') as f:
            transcription = f.read()
    except Exception as e:
        print(f"Error reading transcription file: {str(e)}")
        sys.exit(1)
    
    # Parse optional arguments
    title = sys.argv[2] if len(sys.argv) > 2 else "Lecture"
    api_provider = sys.argv[3] if len(sys.argv) > 3 else "default"
    model = sys.argv[4] if len(sys.argv) > 4 else None
    api_key = sys.argv[5] if len(sys.argv) > 5 else None
    api_endpoint = sys.argv[6] if len(sys.argv) > 6 else None
    api_model_name = sys.argv[7] if len(sys.argv) > 7 else None
    
    # Generate notes
    notes = generate_notes(
        transcription, 
        title, 
        api_provider, 
        model, 
        api_key, 
        api_endpoint, 
        api_model_name
    )
    
    # Print the notes
    print(notes) 