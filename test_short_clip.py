#!/usr/bin/env python3
"""
Test script that creates a short clip and transcribes it for quick testing.
"""

import sys
import subprocess
from pathlib import Path

def create_short_clip():
    """Create a 3-minute clip from the original video for testing"""
    
    video_file = "2025-05-25 08-18-12.mov"
    videos_dir = Path("videos")
    original_path = videos_dir / video_file
    short_clip_path = videos_dir / "test_3min_clip.mov"
    
    if not original_path.exists():
        print(f"ERROR: Original video not found at {original_path}")
        return None
        
    if short_clip_path.exists():
        print(f"3-minute clip already exists: {short_clip_path}")
        return short_clip_path
    
    print(f"Creating 3-minute clip from {original_path}")
    
    try:
        # Use ffmpeg to create a 3-minute clip starting from 0 seconds
        cmd = [
            "ffmpeg",
            "-i", str(original_path),
            "-t", "180",  # 180 seconds (3 minutes) duration
            "-c", "copy",  # Copy streams without re-encoding for speed
            str(short_clip_path)
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            print(f"3-minute clip created successfully: {short_clip_path}")
            print(f"Size: {short_clip_path.stat().st_size / (1024*1024):.2f} MB")
            return short_clip_path
        else:
            print(f"Error creating clip: {result.stderr}")
            return None
            
    except Exception as e:
        print(f"Error: {e}")
        return None

def test_transcribe_short_clip():
    """Test transcription with diarization on the 3-minute clip"""
    
    # Create 3-minute clip first
    clip_path = create_short_clip()
    if not clip_path:
        return False
    
    print(f"\nTesting transcription with diarization on 3-minute clip: {clip_path}")
    
    try:
        import whisperx
        from whisperx.diarize import DiarizationPipeline
        import os
        import torch
        from dotenv import load_dotenv
        
        # Load environment variables
        load_dotenv()
        
        print("Successfully imported whisperx")
        
        # Force CPU usage (MPS disabled for compatibility)
        if torch.cuda.is_available():
            device = "cuda"
            compute_type = "float16"
            batch_size = 16
        else:
            device = "cpu"
            compute_type = "float32"
            batch_size = 16
        
        print(f"Using device: {device}, compute_type: {compute_type}, batch_size: {batch_size}")
        
        # Get model name from environment
        model_name = os.getenv('WHISPER_MODEL', 'large-v3')
        print(f"Loading Whisper model: {model_name} with faster-whisper backend...")
        
        # Use faster-whisper as ASR backend for better performance
        model = whisperx.load_model(
            model_name, 
            device, 
            compute_type=compute_type,
            language="en",
            # asr_options={
            #     "beam_size": 5,
            #     "best_of": 5,
            #     "compression_ratio_threshold": 2.4,
            #     "log_prob_threshold": -1.0,
            #     "no_speech_threshold": 0.6,
            #     "condition_on_previous_text": False
            # },
            # vad_options={
            #     "vad_onset": 0.500, 
            #     "vad_offset": 0.363
            # }
        )
        print("Whisper model loaded successfully")
        
        print("Loading diarization model...")
        hf_token = os.getenv('HUGGINGFACE_TOKEN')
        # Use CPU for diarization pipeline
        diarize_device = "cpu"
        diarize_model = DiarizationPipeline(use_auth_token=hf_token, device=diarize_device)
        print("Diarization model loaded successfully")
        
        # Load audio
        print("Loading audio...")
        audio = whisperx.load_audio(str(clip_path))
        print(f"Audio loaded: {len(audio) / 16000:.2f} seconds")
        
        # Transcribe with English language specified
        print("Starting transcription...")
        result = model.transcribe(audio, batch_size=batch_size, language="en")
        print("Transcription completed!")
        
        # Align whisper output
        print("Aligning transcription...")
        model_a, metadata = whisperx.load_align_model(language_code="en", device=device)
        result = whisperx.align(result["segments"], model_a, metadata, audio, device, return_char_alignments=False)
        print("Alignment completed!")
        
        # Clean up alignment model
        del model_a
        
        # Diarize (speaker identification)
        print("Running speaker diarization...")
        diarize_segments = diarize_model(audio)
        result = whisperx.assign_word_speakers(diarize_segments, result)
        print("Diarization completed!")
        
        # Show results
        if 'segments' in result:
            num_segments = len(result['segments'])
            total_duration = max([seg.get('end', 0) for seg in result['segments']], default=0)
            
            print(f"\nTranscription Summary:")
            print(f"- Number of segments: {num_segments}")
            print(f"- Total duration: {total_duration:.2f} seconds")
            print(f"- Language detected: {result.get('language', 'unknown')}")
            
            # Show first 10 segments with speaker info
            print(f"\nFirst 10 segments with speakers:")
            for i, segment in enumerate(result['segments'][:10]):
                start = segment.get('start', 0)
                end = segment.get('end', 0)
                text = segment.get('text', '').strip()
                speaker = segment.get('speaker', 'UNKNOWN')
                print(f"  {i+1}. [{start:.2f}-{end:.2f}s] {speaker}: {text}")
                
            if len(result['segments']) > 10:
                print(f"  ... and {len(result['segments']) - 10} more segments")
        
        # Save the result
        import json
        clip_name = clip_path.stem
        transcripts_dir = Path("transcripts")
        transcripts_dir.mkdir(exist_ok=True)
        
        # Format for our app
        formatted_transcript = {
            "video_name": clip_name,
            "segments": []
        }
        
        for segment in result['segments']:
            formatted_segment = {
                "start": segment.get("start", 0),
                "end": segment.get("end", 0),
                "text": segment.get("text", ""),
                "speaker": segment.get("speaker", "SPEAKER_00")  # Use actual speaker from diarization
            }
            formatted_transcript["segments"].append(formatted_segment)
        
        transcript_file = transcripts_dir / f"{clip_name}.json"
        with open(transcript_file, 'w', encoding='utf-8') as f:
            json.dump(formatted_transcript, f, indent=2, ensure_ascii=False)
        
        print(f"\nTranscript saved to: {transcript_file}")
        
        return True
        
    except Exception as e:
        print(f"ERROR during transcription: {e}")
        print(f"Error type: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("3-Minute Clip Transcription Test with Diarization")
    print("=" * 60)
    
    success = test_transcribe_short_clip()
    
    print("\n" + "=" * 60)
    if success:
        print("Test completed successfully!")
    else:
        print("Test failed!")
    print("=" * 60)