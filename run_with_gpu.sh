#!/bin/bash

# Check if nvidia-smi is available (indicates GPU presence)
if command -v nvidia-smi &> /dev/null; then
    echo "NVIDIA GPU detected. Running with GPU support..."
    
    # Build and run with GPU support
    docker-compose -f docker-compose.gpu.yml up --build
else
    echo "No NVIDIA GPU detected. Running with CPU support..."
    
    # Build and run with CPU support
    docker-compose up --build
fi 