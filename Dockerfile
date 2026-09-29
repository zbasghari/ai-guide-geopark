# Railway detects this file and builds with Docker (skips the failing
# railpack/nixpacks auto-detect step).

FROM python:3.11-slim

WORKDIR /app

# Install Python dependencies first (better layer caching on rebuilds)
COPY backend/requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt

# backend/ is self-contained: it holds main.py plus knowledge/ and frontend/.
# Copy its contents directly into /app so the app root == /app.
COPY backend/ ./

# Railway injects PORT at runtime (defaults to 8080 if absent)
ENV PORT=8080
EXPOSE 8080

# From /app, `main:app` resolves; config.py finds /app/knowledge + /app/frontend.
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}"]
