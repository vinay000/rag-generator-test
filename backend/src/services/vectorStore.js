import { AppError } from '../utils/errors.js';

/**
 * Calculates cosine similarity between two numerical vectors.
 * @param {number[]} a
 * @param {number[]} b
 * @returns {number} Value between -1.0 and 1.0
 */
export function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length || a.length === 0) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}

// In-memory collections storage: Map<collectionId, CollectionObject>
const collections = new Map();

/**
 * 1. ADD CHUNKS
 * Adds chunks to a collection. Initializes collection metadata on first add.
 *
 * @param {string} collectionId - Unique collection identifier
 * @param {Object} params
 * @param {Array<{id: string, text: string, vector: number[], filename?: string, chunkNumber?: number, pageNumber?: number, wordCount?: number}>} params.chunks
 * @param {string} params.provider - Embedding provider ('openai' | 'gemini')
 * @param {string} params.model - Embedding model name
 * @param {number} params.dimension - Vector dimension (e.g. 1536, 768)
 * @param {string} [params.name] - Optional friendly collection name
 * @returns {Object} Collection summary
 */
export function addChunks(collectionId, { chunks = [], provider, model, dimension, name }) {
  if (!collectionId) {
    throw new AppError('collectionId is required', 400);
  }

  if (!Array.isArray(chunks) || chunks.length === 0) {
    throw new AppError('chunks array must not be empty', 400);
  }

  const detectedDim = dimension || chunks[0]?.vector?.length || 0;
  if (!detectedDim) {
    throw new AppError('Chunks must contain valid vector embeddings with non-zero dimension', 400);
  }

  let col = collections.get(collectionId);

  if (!col) {
    // Initialize new collection with metadata
    col = {
      id: collectionId,
      name: name || collectionId,
      provider: provider || 'unknown',
      model: model || 'unknown',
      dimension: detectedDim,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      chunks: []
    };
    collections.set(collectionId, col);
  } else {
    // Validate dimension consistency on existing collection
    if (detectedDim !== col.dimension) {
      throw new AppError(
        `Vector dimension mismatch for collection "${collectionId}": expected ${col.dimension} (${col.provider}/${col.model}), received ${detectedDim}`,
        400
      );
    }
  }

  // Validate and append chunks
  for (const chunk of chunks) {
    if (!chunk.vector || chunk.vector.length !== col.dimension) {
      throw new AppError(
        `Chunk "${chunk.id || 'unnamed'}" vector length ${chunk.vector?.length} does not match collection dimension ${col.dimension}`,
        400
      );
    }

    col.chunks.push({
      id: chunk.id,
      filename: chunk.filename || 'unknown',
      chunkNumber: chunk.chunkNumber || col.chunks.length + 1,
      pageNumber: chunk.pageNumber || 1,
      text: chunk.text,
      wordCount: chunk.wordCount || (chunk.text ? chunk.text.split(/\s+/).length : 0),
      vector: chunk.vector
    });
  }

  col.updatedAt = new Date().toISOString();

  return {
    id: col.id,
    name: col.name,
    provider: col.provider,
    model: col.model,
    dimension: col.dimension,
    totalChunks: col.chunks.length
  };
}

/**
 * 2. SEARCH
 * Searches a collection using cosine similarity against a query vector.
 *
 * @param {string} collectionId - Target collection identifier
 * @param {number[]} queryVector - Vector representation of the query
 * @param {Object} [options]
 * @param {number} [options.topK=4] - Maximum number of results to return
 * @param {number} [options.minScore=0.0] - Minimum similarity threshold (-1.0 to 1.0)
 * @returns {Array<{score: number, id: string, filename: string, chunkNumber: number, pageNumber: number, text: string, wordCount: number}>}
 */
export function search(collectionId, queryVector, { topK = 4, minScore = 0.0 } = {}) {
  const col = collections.get(collectionId);
  if (!col) {
    throw new AppError(`Collection "${collectionId}" not found`, 404);
  }

  if (!queryVector || queryVector.length !== col.dimension) {
    throw new AppError(
      `Query vector length (${queryVector?.length || 0}) does not match collection dimension (${col.dimension})`,
      400
    );
  }

  const scoredResults = [];

  for (const chunk of col.chunks) {
    const score = cosineSimilarity(queryVector, chunk.vector);
    if (score >= minScore) {
      scoredResults.push({
        score,
        id: chunk.id,
        filename: chunk.filename,
        chunkNumber: chunk.chunkNumber,
        pageNumber: chunk.pageNumber,
        text: chunk.text,
        wordCount: chunk.wordCount
      });
    }
  }

  // Sort descending by similarity score
  scoredResults.sort((a, b) => b.score - a.score);

  return scoredResults.slice(0, topK);
}

/**
 * 3. DELETE A COLLECTION
 * Removes a collection and all its chunks from memory.
 *
 * @param {string} collectionId - Collection identifier to delete
 * @returns {boolean} True if deleted, false if collection was not found
 */
export function deleteCollection(collectionId) {
  if (!collections.has(collectionId)) {
    throw new AppError(`Collection "${collectionId}" not found`, 404);
  }
  return collections.delete(collectionId);
}

/**
 * Helper: Gets collection metadata.
 * @param {string} collectionId
 * @returns {Object|null}
 */
export function getCollection(collectionId) {
  const col = collections.get(collectionId);
  if (!col) return null;
  return {
    id: col.id,
    name: col.name,
    provider: col.provider,
    model: col.model,
    dimension: col.dimension,
    totalChunks: col.chunks.length,
    createdAt: col.createdAt,
    updatedAt: col.updatedAt
  };
}

/**
 * Helper: Lists all collections in memory.
 * @returns {Array<Object>}
 */
export function listCollections() {
  return Array.from(collections.values()).map((col) => ({
    id: col.id,
    name: col.name,
    provider: col.provider,
    model: col.model,
    dimension: col.dimension,
    totalChunks: col.chunks.length,
    createdAt: col.createdAt,
    updatedAt: col.updatedAt
  }));
}

/**
 * Helper: Clears all in-memory collections (useful for unit testing).
 */
export function clearAll() {
  collections.clear();
}
