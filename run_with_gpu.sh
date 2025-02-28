#!/bin/bash

# Function to handle errors
handle_error() {
    echo "Error: Docker command failed with exit code $1"
    echo "Please check the error messages above for details."
    echo ""
    echo "If you're encountering build issues, try rebuilding with:"
    echo "  ./rebuild_docker.sh"
    exit $1
}

# Check if nvidia-smi is available (indicates GPU presence)
if command -v nvidia-smi &> /dev/null; then
    echo "NVIDIA GPU detected. Running with GPU support..."
    
    # Check if the image exists
    if [[ "$(docker images -q lectura_web 2> /dev/null)" == "" ]]; then
        echo "Docker image not found. Building first..."
        docker-compose -f docker-compose.gpu.yml build
        
        # Check if build was successful
        if [ $? -ne 0 ]; then
            echo "Build failed. Trying to rebuild with no cache..."
            ./rebuild_docker.sh
            exit $?
        fi
    fi
    
    # Run with GPU support
    echo "Starting Lectura with GPU support..."
    docker-compose -f docker-compose.gpu.yml up
    
    # Check if run was successful
    if [ $? -ne 0 ]; then
        handle_error $?
    fi
else
    echo "No NVIDIA GPU detected. Running with CPU support..."
    
    # Check if the image exists
    if [[ "$(docker images -q lectura_web 2> /dev/null)" == "" ]]; then
        echo "Docker image not found. Building first..."
        docker-compose build
        
        # Check if build was successful
        if [ $? -ne 0 ]; then
            echo "Build failed. Trying to rebuild with no cache..."
            ./rebuild_docker.sh
            exit $?
        fi
    fi
    
    # Run with CPU support
    echo "Starting Lectura with CPU support..."
    docker-compose up
    
    # Check if run was successful
    if [ $? -ne 0 ]; then
        handle_error $?
    fi
fi 