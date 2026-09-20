# syntax=docker/dockerfile:1
FROM python:3.12-slim

WORKDIR /app

# Install system dependencies for GIS libraries
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    gdal-bin \
    libgdal-dev \
    libproj-dev \
    proj-data \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for layer caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create data directory for runtime artifacts
RUN mkdir -p data && chmod 777 data

# Expose port for the API (default 8000 for FastAPI)
EXPOSE 8000

# Run the FastAPI application with uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]