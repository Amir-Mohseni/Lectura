#!/bin/bash

# Load environment variables from .env file
if [ -f .env ]; then
    echo "Loading environment variables from .env file..."
    export $(grep -v '^#' .env | xargs)
else
    echo "No .env file found. Make sure environment variables are set."
fi

# Run the API connection test
echo "Running API connection test..."
python -m src.tests.test_api

# Exit with the same status as the Python script
exit $? 