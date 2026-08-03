#!/bin/bash
# Start standalone Gradio UI
cd "$(dirname "$0")/backend"
if [ ! -d ".venv" ]; then
    echo "Error: Virtual environment (.venv) not found. Please wait for setup to complete."
    exit 1
fi
source .venv/bin/activate
echo "Starting Gradio UI..."
python app.py
