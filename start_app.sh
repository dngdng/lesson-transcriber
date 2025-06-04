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

echo "Activating virtual environment..."
source venv/bin/activate

echo "Installing Python dependencies..."
pip install -r requirements.txt

# Check if nodemon is installed globally, if not install it
if ! command -v nodemon &> /dev/null; then
    echo "📦 Installing nodemon globally..."
    npm install -g nodemon
fi

echo "🔄 Starting Python server with auto-reload (no frontend build needed)..."
echo "🌐 Frontend will be served directly from /static/ with native ES modules"
echo "📝 Edit files in /static/js/ and refresh browser to see changes instantly"

# Run Python app with auto-reload
nodemon --watch app.py --watch config.py --exec 'python app.py'