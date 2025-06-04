#!/bin/bash

# Exit on any error
set -e

echo "🚀 Starting development server (no build required)..."

# Set up Python virtual environment
echo "📦 Setting up Python virtual environment..."
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

echo "Installing Python dependencies..."
./venv/bin/pip install -r requirements.txt

echo "✅ Verifying virtual environment..."
echo "Python executable: $(./venv/bin/python --version)"
echo "Pip executable: $(./venv/bin/pip --version)"

# Check if nodemon is installed globally, if not install it
if ! command -v nodemon &> /dev/null; then
    echo "📦 Installing nodemon globally..."
    npm install -g nodemon
fi

echo "🔄 Starting Python server with auto-reload (no frontend build needed)..."
echo "🌐 Frontend will be served directly from /static/ with native ES modules"
echo "📝 Edit files in /static/js/ and refresh browser to see changes instantly"

# Verify we're using the correct Python before starting
echo "🔍 Starting with Python: $(./venv/bin/python --version)"
echo "🔍 From path: $(./venv/bin/python -c 'import sys; print(sys.executable)')"

# Run Python app with auto-reload
nodemon --watch app.py --watch config.py --exec './venv/bin/python app.py'