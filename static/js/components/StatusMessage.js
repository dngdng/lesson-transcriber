import React from 'react';

const StatusMessage = ({ status }) => {
  if (!status.message) return null;

  return React.createElement('div', {
    className: `status-message ${status.type}`
  }, status.message);
};

export default StatusMessage;