#!/bin/bash
# Start FastAPI backend server on port 8000
cd "$(dirname "$0")/backend"
if [ ! -d ".venv" ]; then
    echo "Error: Virtual environment (.venv) not found. Please wait for setup to complete."
    exit 1
fi
source .venv/bin/activate
echo "Starting FastAPI Backend on http://localhost:8000..."
python -m uvicorn backend:app --host 0.0.0.0 --port 8000 --reload
