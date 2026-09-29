import { config } from '../config.js';
import { AppError } from '../utils/errors.js';
import * as openaiProvider from './providers/openai.js';
import * as geminiProvider from './providers/gemini.js';

const providers = {
  openai: openaiProvider,
  gemini: geminiProvider
};

/**
 * Returns the active chat provider implementation.
 */
function getChatProvider() {
  const providerName = config.chatProvider.toLowerCase();
  const provider = providers[providerName];

  if (!provider) {
    throw new AppError(
      `Unsupported chat provider "${config.chatProvider}". Choose "openai" or "gemini".`,
      400
    );
  }

  return { name: providerName, provider };
}

/**
 * Generates an answer from a prompt using the configured chat provider.
 * @param {string} prompt
 * @param {Object} [options]
 * @returns {Promise<{text: string, provider: string, model: string}>}
 */
export async function generateAnswer(prompt, options = {}) {
  const { name, provider } = getChatProvider();
  const text = await provider.generate(prompt, options);

  return {
    text,
    provider: name,
    model: name === 'openai' ? config.openaiChatModel : config.geminiChatModel
  };
}
