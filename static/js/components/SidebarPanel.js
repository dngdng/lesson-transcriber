import React from 'react';
import TranscriptPanel from './TranscriptPanel.js';
import SummaryPanel from './SummaryPanel.js';

const SidebarPanel = ({ 
  sidebarView, 
  setSidebarView, 
  transcript, 
  summary, 
  currentTime, 
  onTranscriptClick, 
  selectedVideo,
  onGenerateSummary,
  isGeneratingSummary,
  onGenerateTranscript,
  isGeneratingTranscript
}) => {
  const sidebarHeader = React.createElement('div', { className: 'sidebar-header' },
    React.createElement('div', { className: 'sidebar-tabs' },
      React.createElement('button', {
        className: `sidebar-tab ${sidebarView === 'transcript' ? 'active' : ''}`,
        onClick: () => setSidebarView('transcript')
      }, 'Transcript'),
      React.createElement('button', {
        className: `sidebar-tab ${sidebarView === 'summary' ? 'active' : ''}`,
        onClick: () => setSidebarView('summary')
      }, 'AI Summary')
    )
  );

  const content = sidebarView === 'transcript' 
    ? React.createElement(TranscriptPanel, {
        transcript: transcript,
        currentTime: currentTime,
        onTranscriptClick: onTranscriptClick,
        selectedVideo: selectedVideo,
        showHeader: false, // Don't show header since we have tabs
        onGenerateTranscript: onGenerateTranscript,
        isGeneratingTranscript: isGeneratingTranscript
      })
    : React.createElement(SummaryPanel, {
        summary: summary,
        selectedVideo: selectedVideo,
        onGenerateSummary: onGenerateSummary,
        isGeneratingSummary: isGeneratingSummary
      });

  return React.createElement(React.Fragment, null,
    sidebarHeader,
    content
  );
};

export default SidebarPanel;