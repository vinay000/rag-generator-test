import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { addChunks, clearAll } from '../src/services/vectorStore.js';
import { retrieve } from '../src/retrieval/retriever.js';
import { config } from '../src/config.js';

describe('Similarity Retriever', () => {
  beforeEach(() => {
    clearAll();
  });

  it('should refuse queries if collection was created with a mismatched provider or model', async () => {
    // Add collection with legacy/different settings
    addChunks('mismatched-col', {
      chunks: [{ id: 'c1', text: 'sample text', vector: [0.1, 0.2, 0.3] }],
      provider: 'legacy-provider',
      model: 'old-model',
      dimension: 3
    });

    await assert.rejects(
      async () => {
        await retrieve('mismatched-col', 'What is this?');
      },
      (err) => {
        assert.equal(err.statusCode, 409);
        assert.ok(err.message.includes('This collection was indexed with'));
        assert.ok(err.message.includes('Re-upload the documents'));
        return true;
      }
    );
  });

  it('should throw 400 for empty query', async () => {
    await assert.rejects(
      async () => {
        await retrieve('any-col', '   ');
      },
      (err) => {
        assert.equal(err.statusCode, 400);
        assert.equal(err.message, 'Question must not be empty');
        return true;
      }
    );
  });

  it('should throw 404 for non-existent collection', async () => {
    await assert.rejects(
      async () => {
        await retrieve('non-existent-col', 'How does RAG work?');
      },
      (err) => {
        assert.equal(err.statusCode, 404);
        assert.equal(err.message, 'Collection "non-existent-col" not found');
        return true;
      }
    );
  });
});
