#!/bin/bash

# Parallel video transcription script
# Transcribes multiple videos up to 5 in parallel until all are processed

# Source the transcription library
source "$(dirname "$0")/transcribe_lib.sh"

# Configuration
MAX_PARALLEL_JOBS="${MAX_PARALLEL_JOBS:-5}"
DRY_RUN=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            echo "DRY RUN MODE: Will show what would be processed without running WhisperX"
            shift
            ;;
        --max-jobs)
            MAX_PARALLEL_JOBS="$2"
            shift 2
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --dry-run        Show what would be processed without running WhisperX"
            echo "  --max-jobs N     Maximum number of parallel jobs (default: 5)"
            echo "  -h, --help       Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Function to wait for a job slot to become available
wait_for_job_slot() {
    while [ $(jobs -r | wc -l) -ge $MAX_PARALLEL_JOBS ]; do
        sleep 1
    done
}

# Function to transcribe a video in background
transcribe_video_async() {
    local video_file="$1"
    local job_id="$2"
    
    echo "[Job $job_id] Starting transcription of: $video_file"
    
    if transcribe_video "$video_file" "$DRY_RUN"; then
        echo "[Job $job_id] ✓ Completed: $video_file"
    else
        local exit_code=$?
        if [ $exit_code -eq 2 ]; then
            echo "[Job $job_id] ⏭ Skipped: $video_file (already transcribed)"
        else
            echo "[Job $job_id] ✗ Failed: $video_file"
        fi
    fi
}

# Main execution
main() {
    echo "Starting parallel transcription (max $MAX_PARALLEL_JOBS jobs)"
    echo "=========================================="
    
    # Initialize transcription environment
    if ! init_transcription; then
        echo "Failed to initialize transcription environment"
        exit 1
    fi
    
    # Get all video files
    videos_temp_file=$(get_video_files)
    if [ $? -ne 0 ]; then
        echo "No video files found in $VIDEOS_DIR"
        exit 0
    fi
    
    # Get videos that need transcription
    pending_videos_file=$(get_videos_needing_transcription "$videos_temp_file")
    
    # Count total videos to process
    total_videos=$(wc -l < "$pending_videos_file")
    
    if [ $total_videos -eq 0 ]; then
        echo "All videos have already been transcribed"
        cleanup_temp_file "$videos_temp_file"
        cleanup_temp_file "$pending_videos_file"
        exit 0
    fi
    
    echo "Found $total_videos videos to transcribe"
    echo "=========================================="
    
    # Process videos in parallel
    job_counter=1
    processed_count=0
    
    while IFS= read -r video_file; do
        # Wait for a job slot to become available
        wait_for_job_slot
        
        # Start transcription in background
        transcribe_video_async "$video_file" "$job_counter" &
        
        job_counter=$((job_counter + 1))
        processed_count=$((processed_count + 1))
        
        echo "Queued $processed_count/$total_videos videos for processing"
        
        # Small delay to prevent overwhelming the system
        sleep 0.1
    done < "$pending_videos_file"
    
    # Wait for all background jobs to complete
    echo "=========================================="
    echo "Waiting for all transcription jobs to complete..."
    wait
    
    # Clean up temporary files
    cleanup_temp_file "$videos_temp_file"
    cleanup_temp_file "$pending_videos_file"
    
    echo "=========================================="
    echo "Parallel transcription completed!"
    echo "All $total_videos videos have been processed"
}

# Handle script interruption gracefully
trap 'echo "Interrupted! Waiting for current jobs to complete..."; wait; exit 130' INT TERM

# Run main function
main