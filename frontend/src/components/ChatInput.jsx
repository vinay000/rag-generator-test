import React, { useState } from 'react';

export default function ChatInput({
  collectionName,
  isThinking,
  chatError,
  onSendMessage,
  onClearChatError
}) {
  const [question, setQuestion] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    const query = question.trim();
    if (!query || isThinking) return;

    onSendMessage(query);
    setQuestion('');
  }

  return (
    <div className="chat-input-wrapper">
      {chatError && (
        <div className="error-banner">
          <span>{chatError}</span>
          <button
            onClick={onClearChatError}
            style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
      )}

      <form className="chat-input-form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="chat-input"
          placeholder={`Ask a question about ${collectionName || 'this collection'}...`}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          disabled={isThinking}
        />
        <button
          type="submit"
          className="send-btn"
          disabled={isThinking || !question.trim()}
          title="Send Question"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </form>
    </div>
  );
}
