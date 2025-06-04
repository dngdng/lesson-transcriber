#!/bin/bash

# Transcription library for reusable WhisperX functionality

# Initialize transcription environment
init_transcription() {
    # Load environment variables from .env file
    if [ -f .env ]; then
        source .env
    fi
    
    # Set default directories
    VIDEOS_DIR="${VIDEO_DIR:-videos}"
    TRANSCRIPTS_DIR="${TRANSCRIPTS_DIR:-transcripts}"
    WHISPERX_COMMAND="${WHISPERX_COMMAND:-whisperx --model small --highlight_words True --compute float32 --language en --output_format all}"
    
    # Check if videos directory exists
    if [ ! -d "$VIDEOS_DIR" ]; then
        echo "Error: $VIDEOS_DIR directory not found"
        return 1
    fi
    
    # Create transcripts directory if it doesn't exist
    mkdir -p "$TRANSCRIPTS_DIR"
    
    return 0
}

# Check if a video file already has a transcript
has_transcript() {
    local video_file="$1"
    local basename_no_ext=$(basename "$video_file" | sed 's/\.[^.]*$//')
    local transcript_file="$TRANSCRIPTS_DIR/${basename_no_ext}.txt"
    
    [ -f "$transcript_file" ]
}

# Get all video files sorted by modification time (newest first)
get_video_files() {
    local temp_file=$(mktemp)
    find "$VIDEOS_DIR" -type f \( -name "*.mov" -o -name "*.mp4" -o -name "*.avi" -o -name "*.mkv" -o -name "*.webm" \) -print0 | xargs -0 ls -t | tr '\n' '\0' > "$temp_file" 2>/dev/null
    
    if [ ! -s "$temp_file" ]; then
        rm -f "$temp_file"
        return 1
    fi
    
    echo "$temp_file"
}

# Transcribe a single video file
transcribe_video() {
    local video_file="$1"
    local dry_run="${2:-false}"
    local basename_no_ext=$(basename "$video_file" | sed 's/\.[^.]*$//')
    local transcript_file="$TRANSCRIPTS_DIR/${basename_no_ext}.txt"
    
    # Check if transcript already exists
    if [ -f "$transcript_file" ]; then
        echo "Transcript already exists for: $video_file (skipping)"
        return 2  # Special return code for "already exists"
    fi
    
    echo "Processing: $video_file"
    echo "Output will be: $transcript_file"
    
    if [ "$dry_run" = true ]; then
        echo "DRY RUN: Would run WhisperX on $video_file"
        return 0
    fi
    
    # Check for HuggingFace token
    if [ -z "$HUGGINGFACE_TOKEN" ]; then
        echo "Error: HUGGINGFACE_TOKEN environment variable not set"
        return 1
    fi
    
    # Run WhisperX command using configuration
    $WHISPERX_COMMAND \
        --hf_token="$HUGGINGFACE_TOKEN" \
        --output_dir "$TRANSCRIPTS_DIR" \
        "$video_file"
    
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        echo "Successfully transcribed: $video_file"
        return 0
    else
        echo "Failed to transcribe: $video_file"
        return 1
    fi
}

# Get videos that need transcription
get_videos_needing_transcription() {
    local videos_file="$1"
    local output_file=$(mktemp)
    
    while IFS= read -r -d '' video_file; do
        if ! has_transcript "$video_file"; then
            echo "$video_file" >> "$output_file"
        fi
    done < "$videos_file"
    
    echo "$output_file"
}

# Clean up temporary files
cleanup_temp_file() {
    local temp_file="$1"
    rm -f "$temp_file"
}