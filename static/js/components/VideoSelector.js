import React from 'react';
import { sortVideos } from '../utils/videoUtils.js';

const VideoSelector = ({ videos, selectedVideo, onVideoSelect }) => {
  const handleSelectChange = (e) => {
    const selectedValue = e.target.value;
    if (!selectedValue) {
      onVideoSelect(null);
      return;
    }

    const video = videos.find(v => v.stem === selectedValue);
    onVideoSelect(video);
  };

  return React.createElement('div', { className: 'video-selector' },
    React.createElement('label', { htmlFor: 'videoSelect' }, 'Select Video:'),
    React.createElement('select', {
      id: 'videoSelect',
      value: selectedVideo?.stem || '',
      onChange: handleSelectChange
    },
      React.createElement('option', { value: '' }, '-- Choose a video --'),
      sortVideos(videos).map(video =>
        React.createElement('option', {
          key: video.stem,
          value: video.stem
        }, `${video.name} ${!video.has_transcript ? '(No transcript)' : ''}`)
      )
    )
  );
};

export default VideoSelector;