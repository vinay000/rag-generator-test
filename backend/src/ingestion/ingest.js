import { nanoid } from 'nanoid';
import { parseDocument } from './parser.js';
import { chunkDocument } from './chunker.js';
import { embedTexts } from '../services/embedder.js';
import { addChunks } from '../services/vectorStore.js';
import { AppError } from '../utils/errors.js';

/**
 * Ingests one or more documents into a collection.
 * Complete Pipeline: Parse -> Chunk -> Embed -> Store
 *
 * @param {Object} params
 * @param {Array<{buffer: Buffer, filename: string}>|{buffer: Buffer, filename: string}} params.files - Single file or array of files
 * @param {string} [params.collectionId] - Optional collection ID (auto-generated if omitted)
 * @param {string} [params.collectionName] - Optional display name for collection
 * @returns {Promise<{collectionId: string, name: string, provider: string, model: string, dimension: number, totalChunks: number, documentCount: number, files: Array<{filename: string, pages: number, chunks: number}>}>}
 */
export async function ingestDocuments({ files, collectionId, collectionName }) {
  const fileList = Array.isArray(files) ? files : [files].filter(Boolean);

  if (fileList.length === 0) {
    throw new AppError('No files provided for ingestion', 400);
  }

  const id = collectionId || nanoid(10);
  const name = collectionName || fileList[0]?.filename || id;

  const allChunks = [];
  const fileSummaries = [];

  // Step 1 & 2: Parse and Chunk each document
  for (const file of fileList) {
    const parsedDoc = await parseDocument({
      buffer: file.buffer,
      filename: file.filename
    });

    const docChunks = chunkDocument(parsedDoc);
    allChunks.push(...docChunks);

    fileSummaries.push({
      filename: parsedDoc.filename,
      pages: parsedDoc.pages.length,
      chunks: docChunks.length
    });
  }

  if (allChunks.length === 0) {
    throw new AppError('No text content found across provided documents to ingest', 400);
  }

  // Step 3: Embed all chunks in batches via the configured provider
  const texts = allChunks.map((c) => c.text);
  const { embeddings, dimension, provider, model } = await embedTexts(texts);

  // Step 4: Attach generated vectors to each chunk
  const chunksWithVectors = allChunks.map((chunk, index) => ({
    ...chunk,
    vector: embeddings[index]
  }));

  // Step 5: Save chunks and collection metadata into the vector store
  const storeResult = addChunks(id, {
    chunks: chunksWithVectors,
    provider,
    model,
    dimension,
    name
  });

  return {
    collectionId: storeResult.id,
    name: storeResult.name,
    provider: storeResult.provider,
    model: storeResult.model,
    dimension: storeResult.dimension,
    totalChunks: storeResult.totalChunks,
    documentCount: fileList.length,
    files: fileSummaries
  };
}
