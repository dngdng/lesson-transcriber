#!/bin/bash

# Single video transcription script
# Usage: ./transcribe_single.sh /path/to/video/file.mp4

# Source the transcription library
source "$(dirname "$0")/transcribe_lib.sh"

# Check if video file argument is provided
if [ $# -eq 0 ]; then
    echo "Usage: $0 <video_file>"
    echo "Example: $0 /path/to/video.mp4"
    exit 1
fi

VIDEO_FILE="$1"

# Check if file exists
if [ ! -f "$VIDEO_FILE" ]; then
    echo "Error: Video file '$VIDEO_FILE' does not exist"
    exit 1
fi

# Initialize transcription environment
if ! init_transcription; then
    echo "Failed to initialize transcription environment"
    exit 1
fi

echo "Transcribing single video: $VIDEO_FILE"
echo "=========================================="

# Transcribe the video
if transcribe_video "$VIDEO_FILE"; then
    echo "✓ Successfully transcribed: $VIDEO_FILE"
    exit 0
else
    exit_code=$?
    if [ $exit_code -eq 2 ]; then
        echo "⏭ Transcript already exists for: $VIDEO_FILE"
        exit 0
    else
        echo "✗ Failed to transcribe: $VIDEO_FILE"
        exit 1
    fi
fi