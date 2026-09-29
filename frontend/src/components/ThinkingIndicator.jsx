import React from 'react';

export default function ThinkingIndicator() {
  return (
    <div className="message-row assistant">
      <div className="avatar assistant">🤖</div>
      <div className="thinking-row">
        <div className="thinking-dots">
          <span className="thinking-dot"></span>
          <span className="thinking-dot"></span>
          <span className="thinking-dot"></span>
        </div>
        <span>Searching vector store & generating answer...</span>
      </div>
    </div>
  );
}
