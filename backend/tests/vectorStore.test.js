import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  addChunks,
  search,
  deleteCollection,
  getCollection,
  listCollections,
  clearAll,
  cosineSimilarity
} from '../src/services/vectorStore.js';

describe('Vector Store (In-Memory)', () => {
  beforeEach(() => {
    clearAll();
  });

  it('should calculate cosine similarity correctly', () => {
    // Identical vectors -> score 1.0
    const a = [1, 0, 0];
    const b = [1, 0, 0];
    assert.equal(Math.round(cosineSimilarity(a, b)), 1);

    // Orthogonal vectors -> score 0.0
    const c = [1, 0, 0];
    const d = [0, 1, 0];
    assert.equal(cosineSimilarity(c, d), 0);

    // Opposite vectors -> score -1.0
    const e = [1, 0];
    const f = [-1, 0];
    assert.equal(cosineSimilarity(e, f), -1);
  });

  it('Action 1 (Add Chunks): should initialize collection and remember provider, model, dimension', () => {
    const chunks = [
      {
        id: 'chunk-1',
        filename: 'handbook.pdf',
        chunkNumber: 1,
        pageNumber: 1,
        text: 'RAG introduction text',
        vector: [0.1, 0.2, 0.3, 0.4]
      },
      {
        id: 'chunk-2',
        filename: 'handbook.pdf',
        chunkNumber: 2,
        pageNumber: 2,
        text: 'Pipeline architecture text',
        vector: [0.2, 0.3, 0.4, 0.5]
      }
    ];

    const result = addChunks('col-123', {
      chunks,
      provider: 'gemini',
      model: 'text-embedding-004',
      dimension: 4,
      name: 'Tech Handbook'
    });

    assert.equal(result.id, 'col-123');
    assert.equal(result.name, 'Tech Handbook');
    assert.equal(result.provider, 'gemini');
    assert.equal(result.model, 'text-embedding-004');
    assert.equal(result.dimension, 4);
    assert.equal(result.totalChunks, 2);

    const stored = getCollection('col-123');
    assert.equal(stored.provider, 'gemini');
    assert.equal(stored.model, 'text-embedding-004');
    assert.equal(stored.dimension, 4);
    assert.equal(stored.totalChunks, 2);
  });

  it('Action 1 (Add Chunks): should reject chunks with dimension mismatch', () => {
    addChunks('col-abc', {
      chunks: [{ id: 'c1', text: 'hello', vector: [1, 2, 3] }],
      provider: 'openai',
      model: 'text-embedding-3-small',
      dimension: 3
    });

    // Attempt to add a 4-dimensional vector to a 3-dimensional collection
    assert.throws(
      () => {
        addChunks('col-abc', {
          chunks: [{ id: 'c2', text: 'world', vector: [1, 2, 3, 4] }],
          provider: 'openai',
          model: 'text-embedding-3-small',
          dimension: 4
        });
      },
      (err) => {
        assert.ok(err.message.includes('Vector dimension mismatch'));
        return true;
      }
    );
  });

  it('Action 2 (Search): should retrieve ranked chunks based on cosine similarity', () => {
    const chunks = [
      { id: 'c1', text: 'North direction', vector: [1, 0, 0] },
      { id: 'c2', text: 'North-East direction', vector: [0.707, 0.707, 0] },
      { id: 'c3', text: 'East direction', vector: [0, 1, 0] },
      { id: 'c4', text: 'South direction', vector: [-1, 0, 0] }
    ];

    addChunks('geo-col', {
      chunks,
      provider: 'openai',
      model: 'text-embedding-3-small',
      dimension: 3
    });

    // Query targeting North [1, 0, 0]
    const queryVector = [1, 0, 0];
    const results = search('geo-col', queryVector, { topK: 2 });

    assert.equal(results.length, 2);
    assert.equal(results[0].id, 'c1');
    assert.ok(results[0].score > 0.99); // closest match
    assert.equal(results[1].id, 'c2');
    assert.ok(results[1].score > 0.7);
  });

  it('Action 3 (Delete Collection): should remove collection and all associated chunks', () => {
    addChunks('temp-col', {
      chunks: [{ id: 'c1', text: 'temp text', vector: [0.5, 0.5] }],
      provider: 'gemini',
      model: 'text-embedding-004',
      dimension: 2
    });

    assert.ok(getCollection('temp-col') !== null);

    const deleted = deleteCollection('temp-col');
    assert.equal(deleted, true);
    assert.equal(getCollection('temp-col'), null);

    // Searching deleted collection should throw 404
    assert.throws(
      () => search('temp-col', [0.5, 0.5]),
      (err) => {
        assert.ok(err.message.includes('not found'));
        assert.equal(err.statusCode, 404);
        return true;
      }
    );
  });
});
