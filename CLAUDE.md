# Project Instructions

## Key Architecture Decisions
- Native ES modules frontend (no build process) - edit files in `/static/js/` and refresh browser
- Python Flask backend serves static files directly from `/static/` directory
- Environment variable `VIDEO_DIR` for configurable video directory (supports spaces in paths)
- OpenAI GPT-4o-mini integration for piano lesson summaries
- WhisperX transcription via bash script `transcribe_latest.sh`
- Responsive design with mobile-first approach and sticky video player
- Shared utility functions for consistent video sorting across components

## Development Workflow
- Use `./dev-no-build.sh` to start development server with auto-reload
- Frontend changes are instant - just refresh browser
- Backend changes auto-reload via nodemon

## File Organization
- Videos: Configurable via `VIDEO_DIR` environment variable
- Transcripts: `/transcripts/` - multiple formats (JSON, TSV, SRT, VTT, TXT)
- Summaries: `/summaries/` - AI-generated piano lesson summaries
- Frontend: `/static/` - served directly, no build step

## Important Notes
- Allow Python packages in requirements.txt for WhisperX functionality
- Video preference: MP4 over MOV files in dropdowns
- AI summaries are structured for piano lesson analysis
- React components use React.memo for performance optimization
- Environment variables loaded from `.env` file

## UI/UX Features
- Auto-selection of most recent video on page load (excludes "_" prefixed test files)
- Reverse chronological video sorting with test files at bottom
- Responsive breakpoints: desktop (>1000px), mobile (<1000px)
- Mobile sticky video player on tall screens (>800px height)
- Vertical layout flow on mobile: header → video → sidebar
- Video aspect ratio maintained at 16:9 on mobile to optimize space
- Shared video sorting utility in `/static/js/utils/videoUtils.js`