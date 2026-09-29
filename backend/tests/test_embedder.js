import * as openaiProvider from '../src/services/providers/openai.js';
import * as geminiProvider from '../src/services/providers/gemini.js';
import { config } from '../src/config.js';

const sampleChunks = [
  'Page 1: Introduction to RAG Systems. Retrieval-Augmented Generation combines external document retrieval with LLMs.',
  'Page 2: Ingestion Pipeline Architecture. Documents are parsed into clean text and sliced into overlapping chunks.',
  'Page 3: Query and Retrieval Workflow. User queries are converted into vectors and matched using cosine similarity.'
];

async function runEmbeddingTest() {
  console.log('=== TESTING EMBEDDER PROVIDERS ON 3 SAMPLE CHUNKS ===\n');
  console.log(`Sample Chunks Count: ${sampleChunks.length}\n`);

  // --- 1. Test OpenAI Provider ---
  console.log('--- 1. Testing OpenAI Provider ---');
  if (!config.openaiApiKey || config.openaiApiKey.includes('your_openai_api_key')) {
    console.log('⚠️  OPENAI_API_KEY is not set. Skipping live API call for OpenAI.');
  } else {
    try {
      console.log(`Calling OpenAI (Model: ${config.openaiEmbeddingModel})...`);
      const openaiResult = await openaiProvider.embed(sampleChunks);
      console.log(`✅ OpenAI Embeddings Generated: ${openaiResult.embeddings.length} vectors`);
      console.log(`   Vector Length (Dimension):   ${openaiResult.dimension}`);
      console.log(`   Vector 1 Sample:            [${openaiResult.embeddings[0].slice(0, 5).map(n => n.toFixed(4)).join(', ')}, ...]`);
    } catch (err) {
      console.error(`❌ OpenAI Embedding failed: ${err.message}`);
    }
  }

  // --- 2. Test Gemini Provider ---
  console.log('\n--- 2. Testing Gemini Provider ---');
  if (!config.geminiApiKey || config.geminiApiKey.includes('your_gemini_api_key')) {
    console.log('⚠️  GEMINI_API_KEY is not set. Skipping live API call for Gemini.');
  } else {
    try {
      console.log(`Calling Gemini (Model: ${config.geminiEmbeddingModel})...`);
      const geminiResult = await geminiProvider.embed(sampleChunks);
      console.log(`✅ Gemini Embeddings Generated: ${geminiResult.embeddings.length} vectors`);
      console.log(`   Vector Length (Dimension):   ${geminiResult.dimension}`);
      console.log(`   Vector 1 Sample:            [${geminiResult.embeddings[0].slice(0, 5).map(n => n.toFixed(4)).join(', ')}, ...]`);
    } catch (err) {
      console.error(`❌ Gemini Embedding failed: ${err.message}`);
    }
  }
}

runEmbeddingTest().catch(console.error);
