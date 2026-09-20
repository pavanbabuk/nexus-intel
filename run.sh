#!/usr/bin/env bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "=========================================================="
echo "    🚀 Starting NexusIntel OSINT Intelligence Platform    "
echo "=========================================================="

# Check virtual environment
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
    ./venv/bin/pip install -r backend/requirements.txt
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

PYTHONPATH=backend ./venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
