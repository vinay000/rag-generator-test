import { config } from '../config.js';
import { AppError } from '../utils/errors.js';
import * as openaiProvider from './providers/openai.js';
import * as geminiProvider from './providers/gemini.js';

const providers = {
  openai: openaiProvider,
  gemini: geminiProvider
};

export function getEmbeddingInfo() {
  const provider = config.embeddingProvider.toLowerCase();
  const model = provider === 'openai' ? config.openaiEmbeddingModel : config.geminiEmbeddingModel;
  return { provider, model };
}

/**
 * Returns the active embedding provider implementation.
 */
function getEmbeddingProvider() {
  const providerName = config.embeddingProvider.toLowerCase();
  const provider = providers[providerName];

  if (!provider) {
    throw new AppError(
      `Unsupported embedding provider "${config.embeddingProvider}". Choose "openai" or "gemini".`,
      400
    );
  }

  return { name: providerName, provider };
}

/**
 * Embeds an array of texts using the configured embedding provider.
 * @param {string[]} texts
 * @returns {Promise<{embeddings: number[][], dimension: number, provider: string, model: string}>}
 */
export async function embedTexts(texts) {
  const { name, provider } = getEmbeddingProvider();
  const result = await provider.embed(texts);

  return {
    embeddings: result.embeddings,
    dimension: result.dimension,
    provider: name,
    model: name === 'openai' ? config.openaiEmbeddingModel : config.geminiEmbeddingModel
  };
}

/**
 * Embeds a single query string.
 * @param {string} query
 * @returns {Promise<{embedding: number[], dimension: number, provider: string, model: string}>}
 */
export async function embedQuery(query) {
  const result = await embedTexts([query]);
  return {
    embedding: result.embeddings[0] || [],
    dimension: result.dimension,
    provider: result.provider,
    model: result.model
  };
}
