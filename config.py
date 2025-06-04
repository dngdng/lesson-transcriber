"""
Simple configuration management for Whisper Video Analyzer.
"""

import os
from pathlib import Path

class Config:
    """Simple configuration class using environment variables with defaults."""
    
    # Directory paths
    @property
    def video_dir(self) -> Path:
        return Path(os.getenv('VIDEO_DIR', 'videos'))
    
    @property
    def transcripts_dir(self) -> Path:
        return Path(os.getenv('TRANSCRIPTS_DIR', 'transcripts'))
    
    @property
    def summaries_dir(self) -> Path:
        return Path(os.getenv('SUMMARIES_DIR', 'summaries'))
    
    # Video settings
    @property
    def video_extensions(self) -> set:
        return {'.mp4', '.avi', '.mov', '.mkv', '.webm', '.flv'}
    
    # WhisperX command (used in shell scripts)
    @property
    def whisperx_command(self) -> str:
        return os.getenv('WHISPERX_COMMAND', 
            'whisperx --model small --highlight_words True --compute float32 --language en --output_format all')
    
    # OpenAI settings
    @property
    def openai_model(self) -> str:
        return os.getenv('OPENAI_MODEL', 'gpt-4.1-mini')
    
    @property
    def openai_max_tokens(self) -> int:
        return int(os.getenv('OPENAI_MAX_TOKENS', '10000'))
    
    @property
    def openai_temperature(self) -> float:
        return float(os.getenv('OPENAI_TEMPERATURE', '0.0'))
    
    @property
    def openai_timeout(self) -> int:
        return int(os.getenv('OPENAI_TIMEOUT', '300'))
    
    @property
    def openai_api_url(self) -> str:
        return "https://api.openai.com/v1/chat/completions"
    
    # Load summary prompt from file
    @property
    def summary_prompt(self) -> str:
        prompt_file = Path('summary_prompt.txt')
        if prompt_file.exists():
            return prompt_file.read_text(encoding='utf-8').strip()
        return self._default_summary_prompt()
    
    def _default_summary_prompt(self) -> str:
        return """You are an AI assistant that analyzes piano lesson transcripts and creates structured summaries.

Please analyze this piano lesson transcript and provide a comprehensive summary with the following structure:

## Key Topics Covered
- List the main musical concepts, techniques, or pieces discussed

## Technical Focus Areas
- Specific piano techniques practiced (scales, arpeggios, pedaling, etc.)
- Hand positioning and fingering discussed
- Rhythm and timing work

## Repertoire
- Pieces mentioned or worked on
- Composers discussed
- Musical styles or periods covered

## Student Progress & Feedback
- Areas where the student showed improvement
- Challenges identified that need continued work
- Specific feedback given by the instructor

## Practice Recommendations
- Specific practice suggestions mentioned
- Exercises or drills recommended
- Goals for next lesson or week

## Musical Concepts
- Music theory topics discussed
- Interpretation and musical expression guidance
- Performance tips shared

Please keep the summary concise but comprehensive, focusing on actionable insights for the student's continued development."""

# Global configuration instance
config = Config()