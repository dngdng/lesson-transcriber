from flask import Flask, jsonify, request, send_from_directory, send_file, Response
from flask_cors import CORS
import json
import os
import requests
import pandas as pd
from pathlib import Path
from dotenv import load_dotenv
from config import config

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__, static_folder='static')
CORS(app)

def get_available_videos():
    """Get list of available video files"""
    if not config.video_dir.exists():
        return []
    
    videos = []
    
    for video_file in config.video_dir.iterdir():
        if video_file.suffix.lower() in config.video_extensions:
            # Check if transcript exists
            transcript_file = config.transcripts_dir / f"{video_file.stem}.json"
            videos.append({
                'name': video_file.name,
                'stem': video_file.stem,
                'has_transcript': transcript_file.exists()
            })
    
    return sorted(videos, key=lambda x: x['name'])

def generate_summary_from_tsv(video_stem):
    """Generate AI summary from TSV transcript file using OpenAI"""
    
    # Check if TSV file exists
    tsv_file = config.transcripts_dir / f"{video_stem}.tsv"
    if not tsv_file.exists():
        return {"error": "TSV transcript file not found"}
    
    try:
        # Read TSV file
        df = pd.read_csv(tsv_file, sep='\t')
        
        # Create JSON structure from TSV
        transcript_segments = []
        for _, row in df.iterrows():
            if pd.notna(row['start']) and pd.notna(row['text']):
                # Convert milliseconds to seconds
                time_seconds = float(row['start']) / 1000
                transcript_segments.append({
                    "timeInSeconds": time_seconds,
                    "speech": str(row['text'])
                })
        
        # Convert to JSON string for the prompt
        transcript_json = json.dumps(transcript_segments, indent=2)
        
        # Use prompt from configuration
        prompt = f"{config.summary_prompt}\n\nTRANSCRIPT JSON (with time in seconds and speech content):\n{transcript_json}\n\nSUMMARY:"

        # Call OpenAI API
        api_key = os.getenv('OPENAI_API_KEY')
        if not api_key:
            return {"error": "OpenAI API key not configured"}
        
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {api_key}'
        }
        
        payload = {
            "model": config.openai_model,
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "max_tokens": config.openai_max_tokens,
            "temperature": config.openai_temperature
        }
        
        response = requests.post(
            config.openai_api_url,
            headers=headers,
            json=payload,
            timeout=config.openai_timeout
        )
        
        if not response.ok:
            error_text = response.text
            print(f"OpenAI API error: {response.status_code} - {error_text}")
            return {"error": f"OpenAI API error: {response.status_code}"}
        
        response_data = response.json()
        content = response_data.get('choices', [{}])[0].get('message', {}).get('content', 'Summary unavailable')
        
        # Save summary to JSON file
        summary_data = {
            "video_stem": video_stem,
            "content": content,
            "generated_at": pd.Timestamp.now().isoformat()
        }
        
        summary_file = config.summaries_dir / f"{video_stem}.json"
        with open(summary_file, 'w', encoding='utf-8') as f:
            json.dump(summary_data, f, ensure_ascii=False, indent=2)
        
        return {"success": True, "summary": summary_data}
        
    except Exception as e:
        print(f"Error generating summary: {e}")
        return {"error": f"Error generating summary: {str(e)}"}

@app.route('/api/videos')
def api_videos():
    """API endpoint to get available videos"""
    return jsonify(get_available_videos())

@app.route('/api/transcript/<video_name>')
def get_transcript(video_name):
    """Get transcript for a specific video"""
    transcript_file = config.transcripts_dir / f"{video_name}.json"
    
    if not transcript_file.exists():
        return jsonify({'error': 'Transcript not found'}), 404
    
    try:
        with open(transcript_file, 'r', encoding='utf-8') as f:
            transcript_data = json.load(f)
        return jsonify(transcript_data)
    except Exception as e:
        return jsonify({'error': f'Error loading transcript: {str(e)}'}), 500

@app.route('/api/summary/<video_name>')
def get_summary(video_name):
    """Get summary for a specific video"""
    summary_file = config.summaries_dir / f"{video_name}.json"
    
    if not summary_file.exists():
        return jsonify({'error': 'Summary not found'}), 404
    
    try:
        with open(summary_file, 'r', encoding='utf-8') as f:
            summary_data = json.load(f)
        return jsonify(summary_data)
    except Exception as e:
        return jsonify({'error': f'Error loading summary: {str(e)}'}), 500

@app.route('/api/generate-summary/<video_name>', methods=['POST'])
def generate_summary(video_name):
    """Generate AI summary for a specific video"""
    
    # Check if transcript exists first
    transcript_file = config.transcripts_dir / f"{video_name}.json"
    tsv_file = config.transcripts_dir / f"{video_name}.tsv"
    
    if not tsv_file.exists():
        return jsonify({'error': 'TSV transcript file not found. Cannot generate summary without transcript.'}), 400
    
    try:
        result = generate_summary_from_tsv(video_name)
        
        if "error" in result:
            return jsonify(result), 500
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': f'Error generating summary: {str(e)}'}), 500

@app.route('/api/generate-transcript/<video_name>', methods=['POST'])
def generate_transcript(video_name):
    """Generate transcript for a specific video using WhisperX"""
    
    # Check if video file exists
    video_file = None
    for ext in config.video_extensions:
        potential_file = config.video_dir / f"{video_name}{ext}"
        if potential_file.exists():
            video_file = potential_file
            break
    
    if not video_file:
        return jsonify({'error': 'Video file not found'}), 404
    
    # Check if transcript already exists
    transcript_file = config.transcripts_dir / f"{video_name}.json"
    if transcript_file.exists():
        return jsonify({'error': 'Transcript already exists for this video'}), 400
    
    try:
        import subprocess
        import os
        
        # Get the directory of the current script
        script_dir = Path(__file__).parent
        transcribe_script = script_dir / "transcribe_single.sh"
        
        # Run the transcription script
        result = subprocess.run(
            [str(transcribe_script), str(video_file)],
            capture_output=True,
            text=True,
            timeout=3600  # 1 hour timeout
        )
        
        if result.returncode == 0:
            return jsonify({'success': True, 'message': 'Transcript generated successfully'})
        else:
            error_msg = result.stderr or result.stdout or 'Unknown error occurred'
            return jsonify({'error': f'Transcription failed: {error_msg}'}), 500
            
    except subprocess.TimeoutExpired:
        return jsonify({'error': 'Transcription timed out (took longer than 1 hour)'}), 500
    except Exception as e:
        return jsonify({'error': f'Error running transcription: {str(e)}'}), 500

@app.route('/videos/<path:filename>')
def serve_video(filename):
    """Serve video files with range request support"""
    file_path = config.video_dir / filename
    response = send_file(file_path)
    return response

@app.route('/')
def index():
    """Serve the React frontend"""
    return send_file('static/index.html')

# @app.route('/static/<path:filename>')
# def serve_static(filename):
#     """Serve static files"""
#     return send_from_directory('static', filename)

if __name__ == '__main__':
    # Print configuration
    print(f"📁 Video directory: {config.video_dir}")
    print(f"📁 Transcripts: {config.transcripts_dir}")
    print(f"📁 Summaries: {config.summaries_dir}")
    
    # Ensure local directories exist (but not VIDEO_DIR)
    config.transcripts_dir.mkdir(exist_ok=True)
    config.summaries_dir.mkdir(exist_ok=True)
    
    app.run(debug=True, host='0.0.0.0', port=5001)