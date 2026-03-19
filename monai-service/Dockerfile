# MONAI Inference Service – Dockerfile
# ──────────────────────────────────────────────────────────────────────────────
# Build:  docker build -t medichain-monai .
# Run:    docker run -p 8000:8000 medichain-monai
# ──────────────────────────────────────────────────────────────────────────────

FROM python:3.11-slim

# System deps needed by some MONAI / nibabel / pydicom dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies first (layer cacheable)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Create a persistent volume mount point for downloaded model bundles
RUN mkdir -p /app/.model_cache
VOLUME ["/app/.model_cache"]

# Expose FastAPI port
EXPOSE 8000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"

# Start uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
