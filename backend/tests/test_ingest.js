import fs from 'node:fs/promises';
import path from 'node:path';
import { ingestDocuments } from '../src/ingestion/ingest.js';
import { getCollection, search } from '../src/services/vectorStore.js';
import { config } from '../src/config.js';

async function runIngestionTest() {
  const filePath = path.resolve('../sample-docs/tech/rag_handbook.pdf');
  const filename = path.basename(filePath);
  const buffer = await fs.readFile(filePath);

  console.log('====================================================');
  console.log('🚀 TESTING FULL INGESTION PIPELINE');
  console.log('   (Read -> Chunk -> Embed -> Store)');
  console.log('====================================================');
  console.log(`Document:            ${filename} (${buffer.length} bytes)`);
  console.log(`Configured Provider: ${config.embeddingProvider.toUpperCase()}`);
  console.log(`Configured Model:    ${config.embeddingProvider === 'openai' ? config.openaiEmbeddingModel : config.geminiEmbeddingModel}`);
  console.log('----------------------------------------------------\n');

  const hasKey = config.embeddingProvider === 'openai' ? Boolean(config.openaiApiKey) : Boolean(config.geminiApiKey);

  if (!hasKey) {
    console.log(`⚠️  ${config.embeddingProvider.toUpperCase()} API key is not set in .env.`);
    console.log(`👉 Please set ${config.embeddingProvider === 'openai' ? 'OPENAI_API_KEY' : 'GEMINI_API_KEY'} in .env to call the live API.`);
    console.log('\nSimulating ingestion with provider-specific test vectors for pipeline verification...\n');

    // Run simulated ingestion to verify the data flow
    const { parseDocument } = await import('../src/ingestion/parser.js');
    const { chunkDocument } = await import('../src/ingestion/chunker.js');
    const { addChunks } = await import('../src/services/vectorStore.js');

    const parsedDoc = await parseDocument({ buffer, filename });
    const chunks = chunkDocument(parsedDoc);
    const mockDim = config.embeddingProvider === 'gemini' ? 768 : 1536;
    const provider = config.embeddingProvider;
    const model = provider === 'gemini' ? config.geminiEmbeddingModel : config.openaiEmbeddingModel;

    const chunksWithVectors = chunks.map((c, i) => ({
      ...c,
      vector: Array.from({ length: mockDim }, (_, idx) => Math.sin(i + 1 + idx / 10))
    }));

    const result = addChunks('test-collection', {
      chunks: chunksWithVectors,
      provider,
      model,
      dimension: mockDim,
      name: filename
    });

    console.log('--- INGESTION RESULTS (Simulated Embeddings) ---');
    console.log(`Collection ID:  ${result.id}`);
    console.log(`Provider:       ${result.provider}`);
    console.log(`Model:          ${result.model}`);
    console.log(`Chunk Count:    ${result.totalChunks}`);
    console.log(`Vector Length:  ${result.dimension}`);
    return;
  }

  // Live ingestion
  const result = await ingestDocuments({
    files: [{ buffer, filename }],
    collectionId: 'rag-handbook-col',
    collectionName: 'RAG Handbook'
  });

  console.log('--- INGESTION RESULTS (Live Provider API) ---');
  console.log(`Collection ID:  ${result.collectionId}`);
  console.log(`Provider:       ${result.provider}`);
  console.log(`Model:          ${result.model}`);
  console.log(`Chunk Count:    ${result.totalChunks}`);
  console.log(`Vector Length:  ${result.dimension}`);
  console.log(`Files Ingested: ${JSON.stringify(result.files, null, 2)}`);

  // Verify stored collection in Vector Store
  const stored = getCollection(result.collectionId);
  console.log('\n--- VERIFICATION IN VECTOR STORE ---');
  console.log(`Stored Provider:      ${stored.provider}`);
  console.log(`Stored Model:         ${stored.model}`);
  console.log(`Stored Vector Length: ${stored.dimension}`);
  console.log(`Stored Total Chunks:  ${stored.totalChunks}`);
}

runIngestionTest().catch((err) => {
  console.error('Ingestion test failed:', err);
  process.exit(1);
});
