#!/bin/bash

# Transcribe the latest video file that hasn't been transcribed yet
# Uses the modular transcription library

# Source the transcription library
source "$(dirname "$0")/transcribe_lib.sh"

DRY_RUN=false

# Check for dry-run flag
if [ "$1" = "--dry-run" ]; then
    DRY_RUN=true
    echo "DRY RUN MODE: Will show what would be processed without running WhisperX"
fi

# Initialize transcription environment
if ! init_transcription; then
    echo "Failed to initialize transcription environment"
    exit 1
fi

# Get all video files sorted by modification time (newest first)
temp_file=$(get_video_files)
if [ $? -ne 0 ]; then
    echo "No video files found in $VIDEOS_DIR"
    exit 0
fi

# Process each video file starting with the latest
while IFS= read -r -d '' video_file; do
    if ! has_transcript "$video_file"; then
        exit_code=0
        if transcribe_video "$video_file" "$DRY_RUN"; then
            echo "Processing completed successfully"
        else
            exit_code=$?
            if [ $exit_code -ne 2 ]; then  # 2 means already exists
                echo "Processing failed"
            fi
        fi
        
        # Clean up and exit after processing the first video that needs transcription
        cleanup_temp_file "$temp_file"
        exit $exit_code
    else
        echo "Transcript already exists for: $video_file (skipping)"
    fi
done < "$temp_file"

# Clean up temporary file
cleanup_temp_file "$temp_file"

echo "All video files have been transcribed or no available files to process"
exit 0