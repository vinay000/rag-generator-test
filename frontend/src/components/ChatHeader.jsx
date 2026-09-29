import React from 'react';

export default function ChatHeader({ activeCollection, hasMessages, onClearChat }) {
  if (!activeCollection) return null;

  return (
    <header className="chat-header">
      <div className="active-col-details">
        <div className="active-col-icon">📚</div>
        <div>
          <div className="active-col-title">{activeCollection.name || activeCollection.id}</div>
          <div className="active-col-sub">
            <span className="col-badge">
              {activeCollection.provider?.toUpperCase()} ({activeCollection.model})
            </span>
            <span>• {activeCollection.totalChunks} indexed chunks</span>
          </div>
        </div>
      </div>

      {hasMessages && (
        <button className="clear-btn" onClick={onClearChat}>
          Clear Chat
        </button>
      )}
    </header>
  );
}
