import React, { useEffect, useRef } from 'react';
import TranscriptSegment from './TranscriptSegment.js';

const TranscriptPanel = ({ transcript, currentTime, onTranscriptClick, selectedVideo, showHeader = true, onGenerateTranscript, isGeneratingTranscript }) => {
  const activeSegmentRef = useRef(null);

  const findActiveSegmentIndex = () => {
    if (!transcript || !transcript.segments) return -1;
    return transcript.segments.findIndex(segment => 
      currentTime >= segment.start && currentTime <= segment.end
    );
  };

  const activeSegmentIndex = findActiveSegmentIndex();

  // Scroll active segment into view when currentTime changes
  useEffect(() => {
    if (activeSegmentRef.current && activeSegmentIndex >= 0) {
      activeSegmentRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [activeSegmentIndex]);

  const transcriptHeader = showHeader ? React.createElement('div', { className: 'transcript-header' },
    React.createElement('h2', null, 'Video Transcript')
  ) : null;

  if (!selectedVideo) {
    return React.createElement(React.Fragment, null,
      transcriptHeader,
      React.createElement('div', { className: 'transcript-content' },
        React.createElement('div', { className: 'no-transcript' },
          'Select a video to view its transcript'
        )
      )
    );
  }

  if (!transcript) {
    return React.createElement(React.Fragment, null,
      transcriptHeader,
      React.createElement('div', { className: 'transcript-content' },
        React.createElement('div', { className: 'no-transcript' },
          'No transcript available for this video.',
          React.createElement('br'),
          React.createElement('br'),
          React.createElement('button', {
            className: 'generate-transcript-btn',
            onClick: () => onGenerateTranscript && onGenerateTranscript(selectedVideo.stem),
            disabled: !selectedVideo || isGeneratingTranscript
          }, isGeneratingTranscript ? 'Generating...' : 'Generate Transcript'),
          React.createElement('div', { className: 'help-text' },
            'This will use WhisperX to transcribe the video audio.'
          )
        )
      )
    );
  }

  return React.createElement(React.Fragment, null,
    transcriptHeader,
    React.createElement('div', { className: 'transcript-content' },
      transcript.segments.map((segment, index) =>
        React.createElement(TranscriptSegment, {
          key: index,
          ref: index === activeSegmentIndex ? activeSegmentRef : null,
          segment: segment,
          isActive: index === activeSegmentIndex,
          onClick: () => onTranscriptClick(segment.start)
        })
      )
    )
  );
};

export default TranscriptPanel;