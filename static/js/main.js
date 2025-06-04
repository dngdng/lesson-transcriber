import React from 'react';
import {createRoot} from 'react-dom';
import App from './App.js';

const root = createRoot(document.getElementById('root'));

// Create an app instance reference for global access
let appInstance = null;

// App wrapper component that stores reference for global access
const AppWrapper = () => {
  const appRef = React.useRef(null);
  
  React.useEffect(() => {
    appInstance = appRef.current;
  }, []);
  
  return React.createElement(App, { ref: appRef });
};

root.render(React.createElement(AppWrapper));

// Global function for seeking video from markdown links
// This will be set by the App component when it mounts
window.seekVideo = function(timeInSeconds) {
  // Fallback to event system if direct function not available yet
  const event = new CustomEvent('seekVideo', { 
    detail: { time: timeInSeconds, shouldPlay: true } 
  });
  window.dispatchEvent(event);
};

//ReactDOM.render(React.createElement(App), document.getElementById('root'));