import React from 'react';

const TranscriptSegment = React.forwardRef(({ segment, isActive, onClick }, ref) => {
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return React.createElement('div', {
    ref: ref,
    className: `transcript-segment ${isActive ? 'active' : ''}`,
    onClick: onClick
  },
    React.createElement('span', { className: 'timestamp' }, formatTime(segment.start)),
    React.createElement('span', { className: 'text' }, segment.text)
  );
});

export default TranscriptSegment;