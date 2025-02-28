#!/bin/bash

echo "Rebuilding Docker containers with no cache to ensure all dependencies are properly installed..."

# Check if nvidia-smi is available (indicates GPU presence)
if command -v nvidia-smi &> /dev/null; then
    echo "NVIDIA GPU detected. Rebuilding with GPU support..."
    
    # Build with GPU support and no cache
    docker-compose -f docker-compose.gpu.yml build --no-cache
    
    echo "GPU build complete. Run with: docker-compose -f docker-compose.gpu.yml up"
else
    echo "No NVIDIA GPU detected. Rebuilding with CPU support..."
    
    # Build with CPU support and no cache
    docker-compose build --no-cache
    
    echo "CPU build complete. Run with: docker-compose up"
fi

echo "Rebuild complete. You can now start the application." 