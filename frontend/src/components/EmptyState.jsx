import React from 'react';

export default function EmptyState({ type = 'no-messages' }) {
  if (type === 'no-collection') {
    return (
      <div className="empty-state">
        <div className="empty-icon-glow">📂</div>
        <h2 className="empty-heading">No Collection Selected</h2>
        <p className="empty-desc">
          Upload a document (PDF, TXT, or MD) in the sidebar or select an existing collection to begin asking grounded questions.
        </p>
      </div>
    );
  }

  return (
    <div className="empty-state">
      <div className="empty-icon-glow">💬</div>
      <h2 className="empty-heading">Ask anything about this collection</h2>
      <p className="empty-desc">
        Questions are answered strictly using retrieved document context with bracketed citations.
      </p>
    </div>
  );
}
