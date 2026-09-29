import { AppError } from '../../utils/errors.js';

function isRetryable(err) {
  const s = err.status;
  return s === undefined || s === 429 || s >= 500;
}

export async function withRetry(fn, providerName, maxRetries = 3, baseDelayMs = 500) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (!isRetryable(err)) {
        throw new AppError(`[${providerName}] ${err.message}`, err.status === 401 || err.status === 403 ? 500 : 502);
      }
      if (attempt >= maxRetries) {
        throw new AppError(`[${providerName}] Failed after ${attempt} attempts: ${err.message}`, 502);
      }
      await new Promise((r) => setTimeout(r, baseDelayMs * 2 ** (attempt - 1)));
    }
  }
}