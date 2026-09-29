import React from 'react';

export default function CitedSources({ sources, msgId, expandedSources, onToggleSource }) {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="sources-container">
      <div className="sources-label">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
        <span>Cited Sources ({sources.length})</span>
      </div>

      <div className="sources-cards-grid">
        {sources.map((source, sIdx) => {
          const sourceKey = `${msgId}-${sIdx}`;
          const isExpanded = !!expandedSources[sourceKey];

          return (
            <div
              key={sIdx}
              className={`source-card-compact ${isExpanded ? 'is-expanded' : ''}`}
              onClick={() => onToggleSource(sourceKey)}
              title="Click to toggle full excerpt"
            >
              <div className="source-meta-row">
                <div className="source-file-badge">
                  <span className="source-num">[{sIdx + 1}]</span>
                  <span className="source-filename" title={source.filename}>
                    {source.filename}
                  </span>
                </div>
                <div className="source-tags-group">
                  {source.pageNumber !== undefined && (
                    <span className="source-page-tag">
                      p. {source.pageNumber}
                    </span>
                  )}
                  {source.score !== undefined && (
                    <span className="source-score-tag">
                      {Math.round(source.score * 100)}%
                    </span>
                  )}
                </div>
              </div>
              <div className={`source-snippet ${isExpanded ? 'expanded' : ''}`}>
                {source.text}
              </div>
              <div className="source-card-footer">
                <span>{isExpanded ? '▴ Collapse excerpt' : '▾ View full excerpt'}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
