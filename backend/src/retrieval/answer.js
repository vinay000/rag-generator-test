import { config } from '../config.js';
import { getCollection } from '../services/vectorStore.js';
import { retrieve } from './retriever.js';
import { buildPrompt } from './promptBuilder.js';
import { generateAnswer } from '../services/llm.js';
import { AppError } from '../utils/errors.js';

/**
 * Generates a grounded answer for a question against a collection.
 * If the best matching chunk's score is below minSimilarity, returns not found immediately without calling the LLM.
 *
 * @param {string} collectionId - Target collection ID
 * @param {string} question - User question
 * @returns {Promise<{answer: string, found: boolean, topScore: number, minScore: number, sources: Array<Object>}>}
 */
export async function generateAnswerForQuery(collectionId, question) {
  const col = getCollection(collectionId);
  if (!col) {
    throw new AppError(`Collection "${collectionId}" not found`, 404);
  }

  const chunks = await retrieve(collectionId, question);
  const minScore = config.minSimilarity[col.provider] ?? 0.5;

  // Short-circuit if top match is below provider's minimum similarity threshold
  if (!chunks.length || chunks[0].score < minScore) {
    return {
      answer: "I couldn't find this in your documents.",
      found: false,
      topScore: chunks[0]?.score ?? 0,
      minScore,
      sources: []
    };
  }

  // Build prompt and generate answer using LLM
  const prompt = buildPrompt(question, chunks);
  const { text: answerText } = await generateAnswer(prompt);

  // Parse cited chunk numbers from answer (e.g. [1], [2])
  const citedMatches = answerText.match(/\[(\d+)\]/g);
  let finalSources = chunks.map((c, idx) => ({
    id: c.id,
    filename: c.filename,
    pageNumber: c.pageNumber,
    chunkNumber: c.chunkNumber,
    score: c.score,
    text: c.text,
    index: idx + 1
  }));

  if (citedMatches && citedMatches.length > 0) {
    const citedIndices = new Set(
      citedMatches.map((m) => parseInt(m.replace(/[\[\]]/g, ''), 10))
    );
    const filtered = finalSources.filter((s) => citedIndices.has(s.index));
    if (filtered.length > 0) {
      finalSources = filtered;
    }
  } else {
    // If no citations are in the text (e.g., greeting / conversational response), omit citations
    const isGreetingOrCasual = /^(hi|hello|hey|heya|howdy|greetings|how\s+are\s+you|thank\s*you|thanks|bye|goodbye|what\s+can\s+you\s+do)/i.test(
      question.trim()
    );
    if (isGreetingOrCasual) {
      finalSources = [];
    }
  }

  return {
    answer: answerText,
    found: true,
    topScore: chunks[0].score,
    minScore,
    sources: finalSources
  };
}