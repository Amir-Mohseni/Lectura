#!/bin/bash

# Run the API test inside the Docker container
echo "Running API connection test inside Docker container..."
docker-compose run --rm web python -m src.test_api_only

# Exit with the same status as the Docker command
exit $? 