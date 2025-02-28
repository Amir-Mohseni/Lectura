#!/bin/bash

# Set error handling
set -e

# Check if samples directory exists
if [ ! -d "samples" ]; then
    echo "Error: 'samples' directory not found. Please ensure you're running this script from the project root."
    exit 1
fi

# Check if the sample audio file exists
if [ ! -f "samples/How Google's Transformer 2.0 Might Be The AI Breakthrough We Need.mp3" ]; then
    echo "Error: Sample audio file not found in the samples directory."
    echo "Please ensure the file 'How Google's Transformer 2.0 Might Be The AI Breakthrough We Need.mp3' exists in the samples directory."
    exit 1
fi

# Load environment variables from .env file
if [ -f .env ]; then
    echo "Loading environment variables from .env file..."
    export $(grep -v '^#' .env | xargs)
else
    echo "No .env file found. Make sure environment variables are set."
fi

# Check for required dependencies
echo "Checking for required dependencies..."
python -c "import transformers" 2>/dev/null || { 
    echo "Error: transformers package not found. Please install it with: pip install transformers"; 
    echo "If you're using a virtual environment, make sure it's activated.";
    exit 1; 
}

# Run the audio processor test
echo "Running audio processor test using sample from samples directory..."
python -m src.tests.test_audio_processor

# Capture the exit code
EXIT_CODE=$?

# Exit with the same status as the Python script
if [ $EXIT_CODE -ne 0 ]; then
    echo "Audio test failed. Please check the error messages above."
    exit $EXIT_CODE
fi

echo "Audio test completed successfully!"
exit 0 