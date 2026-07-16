# Stage 1: Build Frontend static assets
FROM node:18-alpine AS frontend-builder
WORKDIR /build
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
# Run Next.js static build export
RUN npm run build

# Stage 2: Final Production Runner
FROM python:3.11-slim
WORKDIR /app/backend

# Create non-root unprivileged user and group
RUN groupadd -g 10001 readynest && \
    useradd -u 10001 -g readynest -m -s /bin/bash readynest

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and install
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application
COPY backend/ ./

# Copy compiled static frontend assets from Stage 1 builder
COPY --from=frontend-builder /build/out /app/frontend/out

# Ensure the unprivileged user has ownership over app files
RUN chown -R readynest:readynest /app

# Switch to the non-root user
USER readynest

EXPOSE 8000

ENV PRODUCTION_MODE=true

# Start backend serving API and static files
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
