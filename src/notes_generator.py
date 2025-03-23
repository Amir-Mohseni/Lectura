import json
import sys
import os
import requests
from typing import Dict, Any, Optional

def generate_notes(
    transcription: str, 
    title: str = "Lecture Notes",
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
- Do not include any IDs, timestamps, or file information in the title
- Use appropriate headings (##, ###) to organize the content
- Create bullet points for key ideas
- Try to include all the information from the lecture in the notes and if some information is not present, do your best to fill it in using the context of the lecture
- If something is mispelled or not clear, do your best to fix it
- Highlight important terms, concepts, or definitions
- Use emojis where appropriate to enhance readability and engagement (e.g., 📝, 💡, ⚠️, 🔑, etc.)
- Ensure good spacing between sections with blank lines between headings and content
- Create a brief summary at the end
- Keep the notes comprehensive"""
        
        # Create the user prompt with the transcription
        user_prompt = f"Here is a transcription of a lecture. Please transform it into well-organized notes with a title based on the content of the lecture. Make the title concise and to the point. Here is the transcription: \n\n{transcription}"
        
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
        
        # Fix endpoint URLs
        endpoint = api_endpoint.rstrip('/')
        if not endpoint.endswith('/chat/completions'):
            endpoint = f"{endpoint}/chat/completions"
            
        response = requests.post(
            endpoint,
            headers=headers,
            json=payload,
            timeout=120  # Extended timeout for large transcripts
        )
        
        # Parse response
        if response.status_code != 200:
            print(f"API error {response.status_code}: {response.text}", file=sys.stderr)
            return mock_notes(transcription, title)
        
        data = response.json()
        notes = data.get("choices", [{}])[0].get("message", {}).get("content", "")
        
        if not notes:
            print("API returned empty content", file=sys.stderr)
            return mock_notes(transcription, title)
        
        # Ensure notes start with correct title if not already present
        if not notes.startswith(f"# {title}"):
            notes = f"# {title}\n\n{notes}"
            
        return notes
    
    except Exception as e:
        print(f"Error generating notes with custom API: {str(e)}", file=sys.stderr)
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
        
        # Set the API key
        openai_client = openai.OpenAI(api_key=api_key)
        
        # Create the system prompt
        system_prompt = """You are a professional note-taker specialized in creating organized, concise, and comprehensive notes 
from lecture transcriptions. For this transcription, create well-structured notes in Markdown format.

Guidelines:
- Begin with a title using exactly this format: '# {TITLE}' where {TITLE} is the title I provide - DO NOT modify the title
- Do not include any IDs, timestamps, or file information in the title
- Use appropriate headings (##, ###) to organize the content
- Create bullet points for key ideas
- Include numbered lists for sequential information
- Highlight important terms, concepts, or definitions
- Use emojis where appropriate to enhance readability and engagement (e.g., 📝, 💡, ⚠️, 🔑, etc.)
- Ensure good spacing between sections with blank lines between headings and content
- Create a brief summary at the end
- Keep the notes concise but comprehensive"""
        
        # Create the user prompt with the transcription
        user_prompt = f"Here is a transcription of a lecture titled '{title}'. Please transform it into well-organized notes starting with exactly '# {title}'\n\n{transcription}"
        
        # Make the API request
        response = openai_client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.5
        )
        
        # Extract the content from the response
        notes = response.choices[0].message.content.strip()
        
        # Ensure notes start with correct title if not already present
        if not notes.startswith(f"# {title}"):
            notes = f"# {title}\n\n{notes}"
            
        return notes
        
    except Exception as e:
        print(f"Error using OpenAI API: {str(e)}", file=sys.stderr)
        # Fallback to mock notes
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
        
        # Create the Anthropic client
        client = anthropic.Anthropic(api_key=api_key)
        
        # Create the system prompt
        system_prompt = """You are a professional note-taker specialized in creating organized, concise, and comprehensive notes 
from lecture transcriptions. For this transcription, create well-structured notes in Markdown format."""
        
        # Create the user prompt with the transcription
        user_prompt = f"""Here is a transcription of a lecture titled '{title}'. Please transform it into well-organized notes.

Guidelines:
- Begin with a title using exactly this format: '# {title}' - DO NOT modify the title
- Do not include any IDs, timestamps, or file information in the title
- Use appropriate headings (##, ###) to organize the content
- Create bullet points for key ideas
- Include numbered lists for sequential information
- Highlight important terms, concepts, or definitions
- Use emojis where appropriate to enhance readability and engagement (e.g., 📝, 💡, ⚠️, 🔑, etc.)
- Ensure good spacing between sections with blank lines between headings and content
- Create a brief summary at the end
- Keep the notes concise but comprehensive

Here's the transcription:

{transcription}"""
        
        # Make the API request
        response = client.messages.create(
            model=model,
            system=system_prompt,
            max_tokens=4000,
            temperature=0.5,
            messages=[
                {"role": "user", "content": user_prompt}
            ]
        )
        
        # Extract the content from the response
        notes = response.content[0].text.strip()
        
        # Ensure notes start with correct title if not already present
        if not notes.startswith(f"# {title}"):
            notes = f"# {title}\n\n{notes}"
            
        return notes
        
    except Exception as e:
        print(f"Error using Anthropic API: {str(e)}", file=sys.stderr)
        # Fallback to mock notes
        return mock_notes(transcription, title)

def generate_with_local(
    transcription: str,
    title: str,
    model: str
) -> str:
    """Generate notes using local LLM API (placeholder)"""
    print(f"Local LLM API not implemented yet. Using mock notes with title '{title}'", file=sys.stderr)
    return mock_notes(transcription, title)

def generate_with_ollama(
    transcription: str,
    title: str,
    model: str
) -> str:
    """Generate notes using Ollama API"""
    try:
        import requests
        
        # Create the prompt
        prompt = f"""You are creating organized and comprehensive notes from a lecture transcription.

Create well-structured notes in Markdown format according to these guidelines:
- Begin with a title using exactly this format: '# {title}' - DO NOT modify the title
- Do not include any IDs, timestamps, or file information in the title
- Use appropriate headings (##, ###) to organize the content
- Create bullet points for key ideas
- Include numbered lists for sequential information
- Highlight important terms, concepts, or definitions
- Use emojis where appropriate for readability
- Ensure good spacing between sections with blank lines
- Create a brief summary at the end

Here's the transcription:

{transcription}"""
        
        # Make the API request
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": model,
                "prompt": prompt,
                "stream": False
            },
            timeout=120  # Extended timeout for large transcripts
        )
        
        # Check if the request was successful
        if response.status_code == 200:
            notes = response.json().get("response", "").strip()
            
            # Ensure notes start with correct title if not already present
            if not notes.startswith(f"# {title}"):
                notes = f"# {title}\n\n{notes}"
                
            return notes
        else:
            print(f"Error using Ollama API: {response.text}", file=sys.stderr)
            return mock_notes(transcription, title)
            
    except Exception as e:
        print(f"Error using Ollama API: {str(e)}", file=sys.stderr)
        # Fallback to mock notes
        return mock_notes(transcription, title)

def mock_notes(transcription: str, title: str) -> str:
    """Generate mock notes when API calls fail"""
    # Extract the first few sentences for a summary
    sentences = transcription.split('.')[:5]
    summary = '. '.join(sentences) + '.'
    
    # Create a basic structure with the title and summary
    return f"""# {title}

## Introduction
{summary}

## Key Points
- First important concept from the lecture
- Second key point discussed
- Third significant idea presented

## Details

### Topic 1
- Detail about the first topic
- Supporting information
- Examples mentioned

### Topic 2
- Analysis of the second topic
- Related concepts
- Practical applications

## Summary

This lecture covered several important concepts related to {title}. The main takeaways include understanding the core principles, their applications, and how they relate to the broader field.

---
*Notes generated by Lectura*
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