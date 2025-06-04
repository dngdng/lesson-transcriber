import React, { useRef, useEffect } from 'react';

const VideoPlayer = React.memo(({ selectedVideo, lastClickedTime, seekTimestamp, onTimeUpdate }) => {
  const videoRef = useRef(null);
  const lastSeekTimestamp = useRef(null);

  useEffect(() => {
    // Use seekTimestamp to force seeking even to the same time
    if (videoRef.current && lastSeekTimestamp.current !== seekTimestamp && lastClickedTime !== 0) {
      console.log(`Seeking to: ${lastClickedTime} seconds (timestamp: ${seekTimestamp})`);
      videoRef.current.currentTime = lastClickedTime;
      lastSeekTimestamp.current = seekTimestamp;
    }
  }, [lastClickedTime, seekTimestamp]);

  useEffect(() => {
    // Listen for play video events from markdown links
    const handlePlayVideo = () => {
      if (videoRef.current) {
        videoRef.current.play().catch(error => {
          console.log('Auto-play prevented by browser:', error);
        });
      }
    };

    window.addEventListener('playVideo', handlePlayVideo);

    return () => {
      window.removeEventListener('playVideo', handlePlayVideo);
    };
  }, []);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      onTimeUpdate(videoRef.current.currentTime);
    }
  };

  if (!selectedVideo) {
    return React.createElement('div', { className: 'video-container' },
      React.createElement('div', { className: 'no-video' },
        'Select a video from the dropdown above to begin'
      )
    );
  }

  return React.createElement('div', { className: 'video-container' },
    React.createElement('video', {
      ref: videoRef,
      controls: true,
      onTimeUpdate: handleTimeUpdate,
      src: `/videos/${selectedVideo.name}`,
      className: 'video-player'
    }, 'Your browser does not support the video tag.')
  );
}, (prevProps, nextProps) => {

  for (let key in nextProps) {
    if (nextProps[key] !== prevProps[key]) {
      console.log(`Prop ${key} changed`);
    }
  }
  return prevProps.selectedVideo?.stem === nextProps.selectedVideo?.stem &&
         prevProps.onTimeUpdate === nextProps.onTimeUpdate &&
         prevProps.lastClickedTime === nextProps.lastClickedTime &&
         prevProps.seekTimestamp === nextProps.seekTimestamp;
});

export default VideoPlayer;