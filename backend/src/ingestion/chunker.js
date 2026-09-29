import { config } from '../config.js';

/**
 * Splits text into overlapping word chunks using a sliding window.
 * @param {string} text
 * @param {number} chunkSize
 * @param {number} chunkOverlap
 * @returns {string[]}
 */
export function chunkText(text, chunkSize = config.chunkSize, chunkOverlap = config.chunkOverlap) {
  if (!text || !text.trim()) return [];

  const words = text.trim().split(/\s+/);
  if (words.length <= chunkSize) {
    return [words.join(' ')];
  }

  const step = Math.max(1, chunkSize - chunkOverlap);
  const chunks = [];

  for (let i = 0; i < words.length; i += step) {
    const chunkWords = words.slice(i, i + chunkSize);
    chunks.push(chunkWords.join(' '));

    // Stop if the current window reached or passed the end
    if (i + chunkSize >= words.length) break;
  }

  return chunks;
}

/**
 * Chunks a parsed document (with page attribution).
 * @param {Object} parsedDoc
 * @param {string} parsedDoc.filename
 * @param {Array<{pageNumber: number, text: string}>} parsedDoc.pages
 * @param {Object} [options]
 * @param {number} [options.chunkSize]
 * @param {number} [options.chunkOverlap]
 * @returns {Array<{id: string, filename: string, chunkNumber: number, pageNumber: number, text: string, wordCount: number}>}
 */
export function chunkDocument(
  { filename, pages = [] },
  { chunkSize = config.chunkSize, chunkOverlap = config.chunkOverlap } = {}
) {
  const allChunks = [];
  let globalChunkNumber = 1;

  for (const page of pages) {
    const textChunks = chunkText(page.text, chunkSize, chunkOverlap);

    for (const text of textChunks) {
      allChunks.push({
        id: `${filename}-p${page.pageNumber}-c${globalChunkNumber}`,
        filename,
        chunkNumber: globalChunkNumber,
        pageNumber: page.pageNumber,
        text,
        wordCount: text.split(/\s+/).length
      });
      globalChunkNumber++;
    }
  }

  return allChunks;
}
