FROM python:3.9

WORKDIR /app

# Install system dependencies for whisper
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first to leverage Docker cache
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Set environment variables
ENV PYTHONPATH=/app

# Command to run the application
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--reload"] 