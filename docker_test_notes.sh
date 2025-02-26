#!/bin/bash

# Run the test inside the Docker container
echo "Running note generator test inside Docker container..."
docker-compose run --rm web python -m src.test_note_generator

# Exit with the same status as the Docker command
exit $? 