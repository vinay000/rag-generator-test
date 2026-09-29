import React from 'react';
import UploadCard from './UploadCard.jsx';
import CollectionList from './CollectionList.jsx';

export default function Sidebar({
  collections,
  activeCollectionId,
  isUploading,
  uploadError,
  onUpload,
  onClearUploadError,
  onSelectCollection,
  onDeleteCollection
}) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="brand">
          <div className="brand-icon">⚡</div>
          <span className="brand-title">RAG Generator</span>
        </div>
        <span className="brand-badge">v1.0</span>
      </div>

      <div className="sidebar-content">
        <UploadCard
          isUploading={isUploading}
          uploadError={uploadError}
          onUpload={onUpload}
          onClearError={onClearUploadError}
        />

        <CollectionList
          collections={collections}
          activeCollectionId={activeCollectionId}
          onSelectCollection={onSelectCollection}
          onDeleteCollection={onDeleteCollection}
        />
      </div>
    </aside>
  );
}
