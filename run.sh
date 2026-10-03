#!/usr/bin/env bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "=========================================================="
echo "    🚀 Starting NexusIntel OSINT Intelligence Platform    "
echo "=========================================================="

# Detect best Python environment
VENV_DIR="venv"
if [ -d "venv311" ]; then
    VENV_DIR="venv311"
elif [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    if command -v python3.11 >/dev/null 2>&1; then
        python3.11 -m venv venv311
        VENV_DIR="venv311"
    else
        python3 -m venv venv
    fi
    ./${VENV_DIR}/bin/pip install -r backend/requirements.txt
fi

# Check frontend build
if [ ! -d "frontend/dist" ]; then
    echo "Building frontend..."
    cd frontend && npm install && npm run build && cd ..
fi

echo ""
echo "Server starting on: http://localhost:8000"
echo "Interactive Swagger API: http://localhost:8000/docs"
echo "Hit Ctrl+C to terminate."
echo ""

PYTHONPATH=backend ./${VENV_DIR}/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
