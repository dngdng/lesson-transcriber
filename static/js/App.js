import React, { useState, useEffect } from 'react';
import VideoSelector from './components/VideoSelector.js';
import VideoPlayer from './components/VideoPlayer.js';
import SidebarPanel from './components/SidebarPanel.js';
import StatusMessage from './components/StatusMessage.js';
import { sortVideos } from './utils/videoUtils.js';

function App() {
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [transcript, setTranscript] = useState(null);
  const [summary, setSummary] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [lastClickedTime, setLastClickedTime] = useState(0);
  const [seekTimestamp, setSeekTimestamp] = useState(0);
  const [status, setStatus] = useState({ message: '', type: '' });
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isGeneratingTranscript, setIsGeneratingTranscript] = useState(false);
  const [sidebarView, setSidebarView] = useState('transcript'); // 'transcript' or 'summary'

  // Shared video seeking function for both transcript clicks and summary links
  const seekVideoAndPlay = React.useCallback((timeInSeconds, source = 'unknown') => {
    console.log(`Video seek from ${source}: ${timeInSeconds} seconds`);
    setLastClickedTime(timeInSeconds);
    setSeekTimestamp(Date.now());
    
    // Auto-play after seeking
    setTimeout(() => {
      const playEvent = new CustomEvent('playVideo');
      window.dispatchEvent(playEvent);
    }, 150);
  }, []);

  useEffect(() => {
    fetchVideos();
    
    // Set global seekVideo function to use shared logic directly
    window.seekVideo = (timeInSeconds) => {
      seekVideoAndPlay(timeInSeconds, 'summary-link');
    };
    
    // Listen for global seekVideo events as fallback
    const handleSeekVideo = (event) => {
      const timeInSeconds = event.detail.time;
      const shouldPlay = event.detail.shouldPlay;
      
      if (shouldPlay) {
        seekVideoAndPlay(timeInSeconds, 'summary-link');
      } else {
        console.log(`Video seek from summary-link: ${timeInSeconds} seconds`);
        setLastClickedTime(timeInSeconds);
        setSeekTimestamp(Date.now());
      }
    };
    
    window.addEventListener('seekVideo', handleSeekVideo);
    
    return () => {
      window.removeEventListener('seekVideo', handleSeekVideo);
      // Reset to fallback function on cleanup
      window.seekVideo = function(timeInSeconds) {
        const event = new CustomEvent('seekVideo', { 
          detail: { time: timeInSeconds, shouldPlay: true } 
        });
        window.dispatchEvent(event);
      };
    };
  }, [seekVideoAndPlay]);

  const fetchVideos = async () => {
    try {
      const response = await fetch('/api/videos');
      const data = await response.json();
      setVideos(data);
      
      // Auto-select the first video (which will be the most recent after reverse sorting)
      // Skip videos with "_" prefix
      if (data.length > 0 && !selectedVideo) {
        const sortedVideos = sortVideos(data);
        const firstNonUnderscoreVideo = sortedVideos.find(video => !video.name.startsWith('_'));
        if (firstNonUnderscoreVideo) {
          handleVideoSelect(firstNonUnderscoreVideo);
        }
      }
    } catch (error) {
      showStatus('Error loading videos: ' + error.message, 'error');
    }
  };

  const showStatus = (message, type = 'info') => {
    setStatus({ message, type });
    setTimeout(() => setStatus({ message: '', type: '' }), 5000);
  };

  const handleVideoSelect = async (video) => {
    setSelectedVideo(video);
    setTranscript(null);
    setSummary(null);
    setCurrentTime(0);
    setLastClickedTime(0);
    setSeekTimestamp(0);
    //setSidebarView('summary');

    if (video && video.has_transcript) {
      try {
        const response = await fetch(`/api/transcript/${video.stem}`);
        if (response.ok) {
          const transcriptData = await response.json();
          setTranscript(transcriptData);
        } else {
          throw new Error('Failed to load transcript');
        }
      } catch (error) {
        showStatus('Error loading transcript: ' + error.message, 'error');
      }

      // Check if summary exists
      try {
        const summaryResponse = await fetch(`/api/summary/${video.stem}`);
        if (summaryResponse.ok) {
          const summaryData = await summaryResponse.json();
          setSummary(summaryData);
        }
      } catch (error) {
        // Summary doesn't exist, that's okay
      }
    }
  };

  const handleGenerateSummary = async (videoName) => {
    setIsGeneratingSummary(true);
    showStatus('Generating AI summary... This may take a minute.', 'info');

    try {
      const response = await fetch(`/api/generate-summary/${videoName}`, {
        method: 'POST'
      });
      const data = await response.json();

      if (data.success) {
        showStatus('AI summary generated successfully!', 'success');
        setSummary(data.summary);
        setSidebarView('summary');
      } else {
        showStatus(`Error: ${data.error}`, 'error');
      }
    } catch (error) {
      showStatus(`Error generating summary: ${error.message}`, 'error');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleGenerateTranscript = async (videoName) => {
    setIsGeneratingTranscript(true);
    showStatus('Generating transcript... This may take several minutes.', 'info');

    try {
      const response = await fetch(`/api/generate-transcript/${videoName}`, {
        method: 'POST'
      });
      const data = await response.json();

      if (data.success) {
        showStatus('Transcript generated successfully!', 'success');
        // Refresh videos list to get updated has_transcript status
        const response = await fetch('/api/videos');
        const updatedVideos = await response.json();
        setVideos(updatedVideos);
        
        // Find the updated video object and reload it
        const updatedVideo = updatedVideos.find(v => v.stem === selectedVideo.stem);
        if (updatedVideo) {
          await handleVideoSelect(updatedVideo);
        }
      } else {
        showStatus(`Error: ${data.error}`, 'error');
      }
    } catch (error) {
      showStatus(`Error generating transcript: ${error.message}`, 'error');
    } finally {
      setIsGeneratingTranscript(false);
    }
  };

  const handleTimeUpdate = React.useCallback((time) => {
    setCurrentTime(time);
  }, [setCurrentTime]);

  const handleTranscriptClick = (startTime) => {
    seekVideoAndPlay(startTime, 'transcript');
  };

  return React.createElement('div', { className: 'app' },
    React.createElement('div', { className: 'container' },
      React.createElement('div', { className: 'main-content' },
        React.createElement('div', { className: 'video-panel' },
          React.createElement('div', { className: 'header' },
            React.createElement('h1', null, 'Video Transcription Viewer'),
            React.createElement(VideoSelector, {
              videos: videos,
              selectedVideo: selectedVideo,
              onVideoSelect: handleVideoSelect
            }),
            React.createElement(StatusMessage, { status: status })
          ),
          React.createElement('div', { className: 'video-content' },
            React.createElement(VideoPlayer, {
              selectedVideo: selectedVideo,
              lastClickedTime: lastClickedTime,
              seekTimestamp: seekTimestamp,
              onTimeUpdate: handleTimeUpdate
            })
          )
        ),
        React.createElement('div', { className: 'sidebar-panel' },
          React.createElement(SidebarPanel, {
            sidebarView: sidebarView,
            setSidebarView: setSidebarView,
            transcript: transcript,
            summary: summary,
            currentTime: currentTime,
            onTranscriptClick: handleTranscriptClick,
            selectedVideo: selectedVideo,
            onGenerateSummary: handleGenerateSummary,
            isGeneratingSummary: isGeneratingSummary,
            onGenerateTranscript: handleGenerateTranscript,
            isGeneratingTranscript: isGeneratingTranscript
          })
        )
      )
    )
  );
}

export default App;