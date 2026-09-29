import dotenv from 'dotenv';
import path from 'node:path';

// Try loading from current dir and parent dir
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

export const config = {
  port: parseInt(process.env.PORT, 10) || 5001,
  nodeEnv: process.env.NODE_ENV || 'development',

  // Provider selections ('openai' | 'gemini')
  embeddingProvider: (process.env.EMBEDDING_PROVIDER || 'openai').toLowerCase(),
  chatProvider: (process.env.CHAT_PROVIDER || 'openai').toLowerCase(),

  // API Keys
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  geminiApiKey: process.env.GEMINI_API_KEY || '',

  // Model names
  openaiEmbeddingModel: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
  openaiChatModel: process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini',
  geminiEmbeddingModel: process.env.GEMINI_EMBEDDING_MODEL || 'text-embedding-004',
  geminiChatModel: process.env.GEMINI_CHAT_MODEL || 'gemini-1.5-flash',

  // Batching & Chunking
  embeddingBatchSize: parseInt(process.env.EMBEDDING_BATCH_SIZE, 10) || 50,
  chunkSize: parseInt(process.env.CHUNK_SIZE, 10) || 300,
  chunkOverlap: parseInt(process.env.CHUNK_OVERLAP, 10) || 50,

  // Retrieval
  topK: parseInt(process.env.TOP_K, 10) || 4,
  minSimilarity: {
    openai: parseFloat(process.env.OPENAI_MIN_SIMILARITY) || 0.5,
    gemini: parseFloat(process.env.GEMINI_MIN_SIMILARITY) || 0.5
  }
};
