#!/bin/bash

echo "Rebuilding Docker containers with no cache to ensure all dependencies are properly installed..."

# Function to handle errors
handle_error() {
    echo "Error: Docker build failed with exit code $1"
    echo "Please check the error messages above for details."
    echo "Common issues:"
    echo "  - PyMuPDF installation failures (especially on ARM architectures)"
    echo "  - Network connectivity issues when downloading dependencies"
    echo "  - Insufficient disk space"
    echo ""
    echo "For PyMuPDF issues, you can try:"
    echo "  1. Manually building with: docker build --no-cache -t lectura:latest ."
    echo "  2. Or for GPU: docker build --no-cache -f Dockerfile.gpu -t lectura:gpu ."
    exit $1
}

# Check if nvidia-smi is available (indicates GPU presence)
if command -v nvidia-smi &> /dev/null; then
    echo "NVIDIA GPU detected. Rebuilding with GPU support..."
    
    # Build with GPU support and no cache
    echo "Running: docker-compose -f docker-compose.gpu.yml build --no-cache"
    docker-compose -f docker-compose.gpu.yml build --no-cache
    
    # Check if build was successful
    if [ $? -ne 0 ]; then
        handle_error $?
    fi
    
    echo "GPU build complete. Run with: docker-compose -f docker-compose.gpu.yml up"
else
    echo "No NVIDIA GPU detected. Rebuilding with CPU support..."
    
    # Build with CPU support and no cache
    echo "Running: docker-compose build --no-cache"
    docker-compose build --no-cache
    
    # Check if build was successful
    if [ $? -ne 0 ]; then
        handle_error $?
    fi
    
    echo "CPU build complete. Run with: docker-compose up"
fi

echo "Rebuild complete. You can now start the application." 