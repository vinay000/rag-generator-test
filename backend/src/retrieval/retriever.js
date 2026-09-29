import { config } from '../config.js';
import { getCollection, search } from '../services/vectorStore.js';
import { embedQuery, getEmbeddingInfo } from '../services/embedder.js';
import { AppError } from '../utils/errors.js';

export async function retrieve(collectionId, question, topK = config.topK) {
  if (!question?.trim()) throw new AppError('Question must not be empty', 400);

  const col = getCollection(collectionId);
  if (!col) throw new AppError(`Collection "${collectionId}" not found`, 404);

  const current = getEmbeddingInfo();
  if (col.provider !== current.provider || col.model !== current.model) {
    throw new AppError(
      `This collection was indexed with ${col.provider} (${col.model}), but .env now uses ${current.provider} (${current.model}). Re-upload the documents or switch .env back.`,
      409
    );
  }

  const { embedding } = await embedQuery(question);
  return search(collectionId, embedding, topK); // top chunks with scores, unfiltered
}