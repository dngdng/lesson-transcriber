import React from 'react';
import ReactMarkdown from "react-markdown";

const SummaryPanel = ({ summary, selectedVideo, onGenerateSummary, isGeneratingSummary }) => {


  const handleGenerateClick = () => {
    if (selectedVideo && onGenerateSummary) {
      onGenerateSummary(selectedVideo.stem);
    }
  };

  if (!selectedVideo) {
    return React.createElement('div', { className: 'summary-content' },
      React.createElement('div', { className: 'no-summary' },
        'Select a video to view its AI summary'
      )
    );
  }

  if (!summary) {
    return React.createElement('div', { className: 'summary-content' },
      React.createElement('div', { className: 'summary-generate' },
        React.createElement('div', { className: 'no-summary' },
          'No AI summary available for this video.',
          React.createElement('br'),
          selectedVideo?.has_transcript ?
            'Generate an AI summary to get key takeaways and insights.' :
            'Generate a transcript first to create an AI summary.'
        ),
        selectedVideo?.has_transcript && React.createElement('button', {
          className: 'generate-summary-btn',
          onClick: handleGenerateClick,
          disabled: isGeneratingSummary
        }, isGeneratingSummary ? 'Generating AI Summary...' : 'Generate AI Summary')
      )
    );
  }

  return React.createElement('div', { className: 'summary-content' },
    React.createElement('div', { className: 'summary-header-actions' },
      React.createElement('button', {
        className: 'regenerate-summary-btn',
        onClick: handleGenerateClick,
        disabled: isGeneratingSummary
      }, isGeneratingSummary ? 'Regenerating...' : 'Regenerate AI Summary')
    ),
    React.createElement('div', { className: 'summary-markdown' },
      React.createElement(ReactMarkdown, {
        components: {
          a: ({ node, ...props }) => {
            // Handle seekVideo hash links
            if (props.href && props.href.startsWith('#seekVideo(')) {
              return React.createElement('a', {
                ...props,
                href: '#',
                onClick: (e) => {
                  console.log('[markdown clicked] Seek video to time:', props.href);
                  e.preventDefault();
                  // Extract time from #seekVideo(TIME_IN_SECONDS)
                  const match = props.href.match(/#seekVideo\((\d+(?:\.\d+)?)\)/);
                  if (match) {
                    const timeInSeconds = parseFloat(match[1]);
                    if (window.seekVideo) {
                      window.seekVideo(timeInSeconds);
                    }
                  }
                },
                style: { 
                  cursor: 'pointer',
                  color: '#007acc',
                  textDecoration: 'underline'
                }
              });
            }
            // Regular links
            return React.createElement('a', props);
          }
        }
      }, summary.content)
    )
  );
};

export default SummaryPanel;