import { config } from '../../config.js';
import { AppError } from '../../utils/errors.js';
import { withRetry } from './retry.js';

const BASE_URL = 'https://api.openai.com/v1';

function requireKey() {
  if (!config.openaiApiKey) {
    throw new AppError('[OpenAI] OPENAI_API_KEY is missing', 500);
  }
}

async function post(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.openaiApiKey}`
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000)
  });

  if (!res.ok) {
    const err = new Error(`HTTP ${res.status}: ${await res.text()}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export async function embed(texts) {
  requireKey();
  if (!texts || texts.length === 0) {
    return { embeddings: [], dimension: 0 };
  }

  const model = config.openaiEmbeddingModel;
  const batchSize = Math.max(1, config.embeddingBatchSize);
  const embeddings = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const data = await withRetry(
      () =>
        post('/embeddings', {
          model,
          input: batch
        }),
      'OpenAI'
    );

    if (data.data?.length !== batch.length) {
      throw new AppError('[OpenAI] Embedding count did not match the number of chunks', 502);
    }
    embeddings.push(...data.data.map((item) => item.embedding));
  }

  return { embeddings, dimension: embeddings[0]?.length ?? 0 };
}

export async function generate(prompt) {
  requireKey();
  const data = await withRetry(
    () =>
      post('/chat/completions', {
        model: config.openaiChatModel,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2
      }),
    'OpenAI'
  );

  const text = data.choices?.[0]?.message?.content;
  if (!text) {
    throw new AppError('[OpenAI] Empty response from model', 502);
  }
  return text;
}