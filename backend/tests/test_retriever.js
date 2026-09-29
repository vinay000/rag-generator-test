import fs from 'node:fs/promises';
import path from 'node:path';
import { parseDocument } from '../src/ingestion/parser.js';
import { chunkDocument } from '../src/ingestion/chunker.js';
import { addChunks, clearAll } from '../src/services/vectorStore.js';
import { retrieve } from '../src/retrieval/retriever.js';
import { config } from '../src/config.js';

async function runRetrieverTest() {
  clearAll();
  console.log('=== TESTING SIMILARITY RETRIEVER ===\n');

  const filePath = path.resolve('../sample-docs/tech/rag_handbook.pdf');
  const buffer = await fs.readFile(filePath);
  const parsedDoc = await parseDocument({ buffer, filename: 'rag_handbook.pdf' });
  const chunks = chunkDocument(parsedDoc);

  const activeProvider = config.embeddingProvider;
  const activeModel =
    activeProvider === 'openai' ? config.openaiEmbeddingModel : config.geminiEmbeddingModel;

  // For testing, let's create realistic distinct vector embeddings for the 3 chunks
  // Vector 1 (Intro): high on dim 0
  // Vector 2 (Ingestion Pipeline): high on dim 1
  // Vector 3 (Query Workflow): high on dim 2
  const dim = activeProvider === 'gemini' ? 768 : 1536;

  const makeVector = (hotIdx) => {
    const v = new Array(dim).fill(0.01);
    v[hotIdx] = 0.95;
    return v;
  };

  const chunksWithVectors = [
    { ...chunks[0], vector: makeVector(0) }, // Page 1: Intro
    { ...chunks[1], vector: makeVector(1) }, // Page 2: Ingestion Pipeline
    { ...chunks[2], vector: makeVector(2) }  // Page 3: Query Workflow
  ];

  const collectionId = 'tech-handbook';
  addChunks(collectionId, {
    chunks: chunksWithVectors,
    provider: activeProvider,
    model: activeModel,
    dimension: dim,
    name: 'RAG Handbook'
  });

  console.log(`Collection "${collectionId}" initialized with ${chunks.length} chunks.`);
  console.log(`Provider: ${activeProvider} | Model: ${activeModel} | Dimension: ${dim}\n`);

  // --- Test 1: Query targeting Page 2 (Ingestion Pipeline) ---
  const query = 'How does the ingestion pipeline slice documents and save vector embeddings?';
  console.log(`🔎 Test Query: "${query}"`);

  // Mocking query embedding vector aligned with Ingestion Pipeline (hot on dim 1)
  // (In live mode with API key, embedQuery(query) automatically calls the embedding model)
  const queryVector = makeVector(1);

  // Directly test vector search / retrieve
  const { search: vectorSearch } = await import('../src/services/vectorStore.js');
  const topResults = vectorSearch(collectionId, queryVector, { topK: 5 });

  console.log(`\n--- TOP ${topResults.length} CLOSEST CHUNKS BY COSINE SIMILARITY ---`);
  topResults.forEach((c, i) => {
    console.log(`\n#${i + 1} [Score: ${c.score.toFixed(4)}] | Chunk #${c.chunkNumber} (Page ${c.pageNumber}) | File: ${c.filename}`);
    console.log(`   Text: "${c.text}"`);
  });

  // --- Test 2: Provider / Model Mismatch Check ---
  console.log('\n--- Test 2: Provider/Model Mismatch Refusal Check ---');
  // Add a collection created with a different provider
  addChunks('old-collection', {
    chunks: [{ id: 'c1', text: 'old text', vector: new Array(768).fill(0.1) }],
    provider: 'different-provider',
    model: 'legacy-model-v1',
    dimension: 768
  });

  try {
    await retrieve('old-collection', 'any test question');
    console.log('❌ Failed: Should have refused mismatched provider/model');
  } catch (err) {
    console.log(`✅ Refused with clear message [${err.statusCode}]:`);
    console.log(`   "${err.message}"`);
  }

  console.log('\n=== RETRIEVER VERIFICATION COMPLETE ===');
}

runRetrieverTest().catch(console.error);
