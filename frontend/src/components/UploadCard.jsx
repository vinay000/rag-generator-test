import React, { useRef, useState } from 'react';

export default function UploadCard({ isUploading, uploadError, onUpload, onClearError }) {
  const [collectionName, setCollectionName] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  function handleDrag(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  }

  function handleFileInputChange(e) {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  }

  async function handleFiles(files) {
    await onUpload(files, collectionName.trim() || undefined);
    setCollectionName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  return (
    <div className="upload-card">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.txt,.md"
        style={{ display: 'none' }}
        onChange={handleFileInputChange}
      />

      {isUploading ? (
        <div className="indexing-spinner">
          <div className="spinner"></div>
          <div className="spinner-text">Indexing Documents...</div>
          <div className="spinner-subtext">Chunking & generating vector embeddings</div>
        </div>
      ) : (
        <>
          <div
            className={`drop-zone ${dragActive ? 'drag-active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="drop-icon-box">📁</div>
            <div className="drop-title">Drop documents here</div>
            <div className="drop-subtitle">or click to browse from device</div>
            <div className="drop-formats">PDF, TXT, MD (Max 10MB)</div>
          </div>

          <input
            type="text"
            className="collection-input"
            placeholder="Collection name (optional)"
            value={collectionName}
            onChange={(e) => setCollectionName(e.target.value)}
          />

          <button
            type="button"
            className="upload-button"
            onClick={() => fileInputRef.current?.click()}
          >
            <span>Upload & Index</span>
          </button>
        </>
      )}

      {uploadError && (
        <div className="error-banner">
          <span>{uploadError}</span>
          <button
            onClick={onClearError}
            style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
