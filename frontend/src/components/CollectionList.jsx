import React from 'react';

export default function CollectionList({
  collections,
  activeCollectionId,
  onSelectCollection,
  onDeleteCollection
}) {
  return (
    <div className="collections-section">
      <div className="section-header">
        <span className="section-title">Collections</span>
        <span className="collections-count">{collections.length}</span>
      </div>

      <div className="collections-list">
        {collections.length === 0 ? (
          <div className="empty-collections">
            No collections yet. Upload a document to create your first collection.
          </div>
        ) : (
          collections.map((col) => {
            const isActive = col.id === activeCollectionId;
            return (
              <div
                key={col.id}
                className={`collection-item ${isActive ? 'active' : ''}`}
                onClick={() => onSelectCollection(col.id)}
              >
                <div className="col-info">
                  <span className="col-name">{col.name || col.id}</span>
                  <div className="col-meta">
                    <span className="col-badge">
                      {col.provider?.toUpperCase()} • {col.dimension}d
                    </span>
                    <span>{col.totalChunks} chunks</span>
                  </div>
                </div>

                <button
                  className="delete-btn"
                  title="Delete collection"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteCollection(col.id);
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                  </svg>
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
