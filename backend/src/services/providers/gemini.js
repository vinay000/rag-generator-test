import { config } from '../../config.js';
import { AppError } from '../../utils/errors.js';
import { withRetry } from './retry.js';

/**
 * Normalizes Gemini model name ensuring 'models/' prefix is handled.
 * @param {string} modelName
 * @returns {string}
 */
function cleanModelName(modelName) {
  return modelName.replace(/^models\//, '');
}

/**
 * Embeds an array of texts in batches using Google Gemini.
 * @param {string[]} texts
 * @returns {Promise<{embeddings: number[][], dimension: number}>}
 */
export async function embed(texts) {
  if (!config.geminiApiKey) {
    throw new AppError('[Gemini] Missing GEMINI_API_KEY in environment configuration', 400);
  }

  if (!texts || texts.length === 0) {
    return { embeddings: [], dimension: 0 };
  }

  const model = cleanModelName(config.geminiEmbeddingModel);
  // Gemini batchEmbedContents max is 100 requests per call
  const batchSize = Math.min(100, Math.max(1, config.embeddingBatchSize));
  const allEmbeddings = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);

    const batchEmbeddings = await withRetry(async () => {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:batchEmbedContents?key=${config.geminiApiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: batch.map((text) => ({
            model: `models/${model}`,
            content: { parts: [{ text }] }
          }))
        })
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`HTTP ${response.status} ${response.statusText}: ${errorBody}`);
      }

      const data = await response.json();
      if (!data.embeddings || !Array.isArray(data.embeddings)) {
        throw new Error('Malformed response from Gemini embedding API');
      }

      return data.embeddings.map((e) => e.values);
    }, 'Gemini');

    allEmbeddings.push(...batchEmbeddings);
  }

  // Determine dimension dynamically from first vector
  const dimension = allEmbeddings[0]?.length || 0;

  return {
    embeddings: allEmbeddings,
    dimension
  };
}

/**
 * Generates text completion using Google Gemini model.
 * @param {string} prompt
 * @param {Object} [options]
 * @returns {Promise<string>}
 */
export async function generate(prompt, options = {}) {
  if (!config.geminiApiKey) {
    throw new AppError('[Gemini] Missing GEMINI_API_KEY in environment configuration', 400);
  }

  const model = cleanModelName(config.geminiChatModel);

  return await withRetry(async () => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.geminiApiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: options.temperature ?? 0.2
        }
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`HTTP ${response.status} ${response.statusText}: ${errorBody}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }, 'Gemini');
}
