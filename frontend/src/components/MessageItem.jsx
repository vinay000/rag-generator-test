import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CitedSources from './CitedSources.jsx';

export default function MessageItem({ msg, expandedSources, onToggleSource }) {
  const isUser = msg.sender === 'user';

  return (
    <div className={`message-row ${msg.sender}`}>
      <div className={`avatar ${msg.sender}`}>
        {isUser ? '👤' : '🤖'}
      </div>

      {msg.isMismatch ? (
        <div className="bubble mismatch-error">
          <div className="mismatch-header">
            <span>⚡ Provider / Model Mismatch</span>
          </div>
          <div style={{ fontSize: '13.5px', lineHeight: '1.5' }}>{msg.text}</div>
          <div className="mismatch-tip">
            💡 <strong>Action:</strong> Re-upload your documents to index them with the active provider, or restore the matching provider settings in <code>.env</code>.
          </div>
        </div>
      ) : msg.isError ? (
        <div className="bubble error">
          <div style={{ fontWeight: 700, marginBottom: 4 }}>⚠️ Error</div>
          <div style={{ fontSize: '13.5px' }}>{msg.text}</div>
        </div>
      ) : msg.found === false ? (
        <div className="bubble not-found">
          <div className="not-found-header">
            <span>🔍 No Relevant Information Found</span>
          </div>
          <div>{msg.text}</div>
          {msg.topScore !== undefined && (
            <div className="not-found-score-tag">
              Top match score: {msg.topScore.toFixed(3)} (Min threshold: {msg.minScore ?? 0.5})
            </div>
          )}
        </div>
      ) : (
        <div className={`bubble ${msg.sender}`}>
          {isUser ? (
            <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
          ) : (
            <div className="markdown-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {msg.text}
              </ReactMarkdown>
            </div>
          )}

          <CitedSources
            sources={msg.sources}
            msgId={msg.id}
            expandedSources={expandedSources}
            onToggleSource={onToggleSource}
          />
        </div>
      )}
    </div>
  );
}
