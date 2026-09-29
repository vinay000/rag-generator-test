import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { chunkText, chunkDocument } from '../src/ingestion/chunker.js';

describe('Chunker: chunkText', () => {
  it('should handle empty or whitespace-only text gracefully', () => {
    assert.deepEqual(chunkText(''), []);
    assert.deepEqual(chunkText('   \n\t  '), []);
    assert.deepEqual(chunkText(null), []);
    assert.deepEqual(chunkText(undefined), []);
  });

  it('should return a single chunk for very short text', () => {
    const singleWord = 'Hello';
    const singleResult = chunkText(singleWord, 300, 50);
    assert.equal(singleResult.length, 1);
    assert.equal(singleResult[0], 'Hello');

    const shortSentence = 'The quick brown fox jumps over the lazy dog.';
    const sentenceResult = chunkText(shortSentence, 300, 50);
    assert.equal(sentenceResult.length, 1);
    assert.equal(sentenceResult[0], shortSentence);
  });

  it('should return a single chunk when text length equals chunkSize exactly', () => {
    const exactWords = Array.from({ length: 300 }, (_, i) => `w${i + 1}`).join(' ');
    const result = chunkText(exactWords, 300, 50);
    assert.equal(result.length, 1);
    assert.equal(result[0].split(' ').length, 300);
  });

  it('should create 2 chunks with accurate overlap when text exceeds chunkSize by 1 word', () => {
    const words301 = Array.from({ length: 301 }, (_, i) => `w${i + 1}`).join(' ');
    const result = chunkText(words301, 300, 50);
    assert.equal(result.length, 2);

    // First chunk has 300 words (w1..w300)
    const chunk1Words = result[0].split(' ');
    assert.equal(chunk1Words.length, 300);
    assert.equal(chunk1Words[0], 'w1');
    assert.equal(chunk1Words[299], 'w300');

    // Second chunk starts at index 250 (w251..w301) -> 51 words
    const chunk2Words = result[1].split(' ');
    assert.equal(chunk2Words.length, 51);
    assert.equal(chunk2Words[0], 'w251');
    assert.equal(chunk2Words[50], 'w301');

    // Overlap verification: last 50 words of chunk 1 == first 50 words of chunk 2
    const chunk1Tail = chunk1Words.slice(250, 300).join(' ');
    const chunk2Head = chunk2Words.slice(0, 50).join(' ');
    assert.equal(chunk1Tail, chunk2Head);
  });

  it('should verify exact overlap across multiple consecutive chunks in a large text', () => {
    const totalWords = 1000;
    const chunkSize = 200;
    const chunkOverlap = 40;
    const fullText = Array.from({ length: totalWords }, (_, i) => `word_${i + 1}`).join(' ');

    const chunks = chunkText(fullText, chunkSize, chunkOverlap);
    // Step = 200 - 40 = 160
    // Chunks: 0..200, 160..360, 320..520, 480..680, 640..840, 800..1000 => 6 chunks
    assert.equal(chunks.length, 6);

    for (let i = 0; i < chunks.length - 1; i++) {
      const currentChunkWords = chunks[i].split(' ');
      const nextChunkWords = chunks[i + 1].split(' ');

      const tailOverlap = currentChunkWords.slice(-chunkOverlap).join(' ');
      const headOverlap = nextChunkWords.slice(0, chunkOverlap).join(' ');

      assert.equal(
        tailOverlap,
        headOverlap,
        `Overlap mismatch between chunk ${i + 1} and chunk ${i + 2}`
      );
    }
  });

  it('should handle small window sizes (e.g., 6 words, 2 overlap)', () => {
    const text = 'The quick brown fox jumps over the lazy dog in the park';
    const chunks = chunkText(text, 6, 2);

    assert.equal(chunks.length, 3);
    assert.equal(chunks[0], 'The quick brown fox jumps over');
    assert.equal(chunks[1], 'jumps over the lazy dog in');
    assert.equal(chunks[2], 'dog in the park');
  });
});

describe('Chunker: chunkDocument', () => {
  it('should attach correct filename, chunkNumber, pageNumber, and wordCount metadata', () => {
    const parsedDoc = {
      filename: 'guidelines.pdf',
      pages: [
        {
          pageNumber: 1,
          text: 'Introduction to guidelines. This is a very short first page.'
        },
        {
          pageNumber: 2,
          text: Array.from({ length: 400 }, (_, i) => `term_${i + 1}`).join(' ')
        }
      ]
    };

    const docChunks = chunkDocument(parsedDoc, { chunkSize: 300, chunkOverlap: 50 });

    // Page 1: 9 words <= 300 -> 1 chunk
    // Page 2: 400 words -> 2 chunks (0..300, 250..400)
    // Total chunks: 3
    assert.equal(docChunks.length, 3);

    // Chunk 1 (Page 1)
    assert.equal(docChunks[0].id, 'guidelines.pdf-p1-c1');
    assert.equal(docChunks[0].filename, 'guidelines.pdf');
    assert.equal(docChunks[0].chunkNumber, 1);
    assert.equal(docChunks[0].pageNumber, 1);
    assert.equal(docChunks[0].wordCount, 10);
    assert.equal(docChunks[0].text, parsedDoc.pages[0].text);

    // Chunk 2 (Page 2)
    assert.equal(docChunks[1].id, 'guidelines.pdf-p2-c2');
    assert.equal(docChunks[1].filename, 'guidelines.pdf');
    assert.equal(docChunks[1].chunkNumber, 2);
    assert.equal(docChunks[1].pageNumber, 2);
    assert.equal(docChunks[1].wordCount, 300);

    // Chunk 3 (Page 2)
    assert.equal(docChunks[2].id, 'guidelines.pdf-p2-c3');
    assert.equal(docChunks[2].filename, 'guidelines.pdf');
    assert.equal(docChunks[2].chunkNumber, 3);
    assert.equal(docChunks[2].pageNumber, 2);
    assert.equal(docChunks[2].wordCount, 150);
  });

  it('should return empty array for empty pages document', () => {
    const result = chunkDocument({ filename: 'empty.txt', pages: [] });
    assert.deepEqual(result, []);
  });
});
