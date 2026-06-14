FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY backend/requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend and root source engine components
COPY backend/ /app/backend/
COPY agents/ /app/agents/
COPY detectors/ /app/detectors/
COPY data/ /app/data/
COPY evaluation/ /app/evaluation/
COPY knowledge/ /app/knowledge/
COPY knowledge_base/ /app/knowledge_base/
COPY orchestrator/ /app/orchestrator/
COPY samples/ /app/samples/

# Setup python path to discover root components
ENV PYTHONPATH=/app

EXPOSE 8000

# Run FastAPI backend server
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
