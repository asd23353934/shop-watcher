# Application runs in a Docker container based on the official Playwright Python image
# No persistent volume declared — stateless Worker design
FROM mcr.microsoft.com/playwright/python:v1.44.0-focal

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY src/ ./src/
COPY main.py .

# Environment variables (set via docker run -e or Fly.io secrets)
ENV PYTHONUNBUFFERED=1
ENV TZ=Asia/Taipei

ENTRYPOINT ["python", "main.py"]
