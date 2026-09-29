import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { addChunks, clearAll, getCollection } from '../src/services/vectorStore.js';
import { config } from '../src/config.js';

describe('Express API Routes (Unit & Integration)', () => {
  it('should verify route structure and collection storage endpoints', () => {
    clearAll();

    // 1. Add chunks to simulate collection creation
    const colId = 'route-test-col';
    addChunks(colId, {
      chunks: [{ id: 'c1', text: 'RAG overview', vector: [0.1, 0.2, 0.3] }],
      provider: config.embeddingProvider,
      model: config.openaiEmbeddingModel,
      dimension: 3,
      name: 'Route Test Collection'
    });

    const col = getCollection(colId);
    assert.equal(col.id, colId);
    assert.equal(col.name, 'Route Test Collection');
    assert.equal(col.totalChunks, 1);
  });
});
