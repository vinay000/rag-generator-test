import React, { useState, useEffect, useRef } from 'react';
import {
  fetchCollections,
  uploadFiles,
  deleteCollection,
  queryCollection
} from './api.js';

import Sidebar from './components/Sidebar.jsx';
import ChatHeader from './components/ChatHeader.jsx';
import MessageItem from './components/MessageItem.jsx';
import ThinkingIndicator from './components/ThinkingIndicator.jsx';
import ChatInput from './components/ChatInput.jsx';
import EmptyState from './components/EmptyState.jsx';

export default function App() {
  // Collections State
  const [collections, setCollections] = useState([]);
  const [activeCollectionId, setActiveCollectionId] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  // Chat State
  const [messages, setMessages] = useState([]);
  const [isThinking, setIsThinking] = useState(false);
  const [chatError, setChatError] = useState(null);
  const [expandedSources, setExpandedSources] = useState({});

  const messagesEndRef = useRef(null);

  // Load collections on initial mount
  useEffect(() => {
    loadCollections();
  }, []);

  // Auto-scroll chat to bottom on new message or thinking status change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  async function loadCollections() {
    try {
      const list = await fetchCollections();
      setCollections(list);
      if (list.length > 0 && !activeCollectionId) {
        setActiveCollectionId(list[0].id);
      }
    } catch (err) {
      console.error('Failed to load collections:', err);
    }
  }

  // Handle Document Upload & Indexing
  async function handleUpload(files, collectionName) {
    setUploadError(null);
    setIsUploading(true);

    try {
      const result = await uploadFiles(files, collectionName);
      await loadCollections();
      setActiveCollectionId(result.collectionId);
      setMessages([]);
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setIsUploading(false);
    }
  }

  // Handle Collection Deletion
  async function handleDeleteCollection(id) {
    try {
      await deleteCollection(id);
      const remaining = collections.filter((c) => c.id !== id);
      setCollections(remaining);
      if (activeCollectionId === id) {
        setActiveCollectionId(remaining[0]?.id || null);
        setMessages([]);
      }
    } catch (err) {
      alert(`Could not delete collection: ${err.message}`);
    }
  }

  // Handle Collection Selection
  function handleSelectCollection(id) {
    if (id !== activeCollectionId) {
      setActiveCollectionId(id);
      setMessages([]);
      setChatError(null);
    }
  }

  // Handle Sending a Question to the RAG backend
  async function handleSendMessage(query) {
    if (!query || !activeCollectionId || isThinking) return;

    setChatError(null);

    // Append user message
    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: query
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsThinking(true);

    try {
      const response = await queryCollection(activeCollectionId, query);
      const assistantMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: response.answer,
        found: response.found,
        topScore: response.topScore,
        minScore: response.minScore,
        sources: response.sources || []
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setChatError(err.message);
      const isMismatch =
        err.message.includes('indexed with') ||
        err.message.includes('mismatched') ||
        err.message.includes('switch .env back') ||
        err.message.includes('Re-upload');

      const errorMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: err.message,
        isError: true,
        isMismatch
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsThinking(false);
    }
  }

  // Toggle full excerpt on a source card
  function handleToggleSource(sourceKey) {
    setExpandedSources((prev) => ({
      ...prev,
      [sourceKey]: !prev[sourceKey]
    }));
  }

  const activeCollection = collections.find((c) => c.id === activeCollectionId);

  return (
    <div className="app-container">
      {/* Sidebar with upload dropzone and collections */}
      <Sidebar
        collections={collections}
        activeCollectionId={activeCollectionId}
        isUploading={isUploading}
        uploadError={uploadError}
        onUpload={handleUpload}
        onClearUploadError={() => setUploadError(null)}
        onSelectCollection={handleSelectCollection}
        onDeleteCollection={handleDeleteCollection}
      />

      {/* Main Chat Area */}
      <main className="chat-area">
        {activeCollection ? (
          <>
            <ChatHeader
              activeCollection={activeCollection}
              hasMessages={messages.length > 0}
              onClearChat={() => setMessages([])}
            />

            <div className="messages-container">
              {messages.length === 0 ? (
                <EmptyState type="no-messages" />
              ) : (
                messages.map((msg) => (
                  <MessageItem
                    key={msg.id}
                    msg={msg}
                    expandedSources={expandedSources}
                    onToggleSource={handleToggleSource}
                  />
                ))
              )}

              {isThinking && <ThinkingIndicator />}
              <div ref={messagesEndRef} />
            </div>

            <ChatInput
              collectionName={activeCollection.name || activeCollection.id}
              isThinking={isThinking}
              chatError={chatError}
              onSendMessage={handleSendMessage}
              onClearChatError={() => setChatError(null)}
            />
          </>
        ) : (
          <EmptyState type="no-collection" />
        )}
      </main>
    </div>
  );
}
