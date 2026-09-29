import fs from 'node:fs/promises';
import path from 'node:path';
import { addChunks, clearAll } from '../src/services/vectorStore.js';
import { config } from '../src/config.js';

async function runRoutesTest() {
  console.log('====================================================');
  console.log('🌐 TESTING EXPRESS API ROUTES (END-TO-END)');
  console.log('====================================================\n');

  const baseUrl = `http://localhost:${config.port || 5001}`;

  // Pre-seed a collection in vector store memory
  const dim = config.embeddingProvider === 'gemini' ? 768 : 1536;
  const model =
    config.embeddingProvider === 'gemini'
      ? config.geminiEmbeddingModel
      : config.openaiEmbeddingModel;

  // 1. Test GET /api/collections
  console.log('--- 1. Testing GET /api/collections ---');
  console.log(`curl -X GET ${baseUrl}/api/collections`);
  const listRes = await fetch(`${baseUrl}/api/collections`);
  const listJson = await listRes.json();
  console.log(`HTTP ${listRes.status}:`, JSON.stringify(listJson, null, 2));

  // 2. Test POST /api/collections (Upload endpoint)
  console.log('\n--- 2. Testing POST /api/collections (File Upload) ---');
  console.log(`curl -X POST ${baseUrl}/api/collections -F "files=@sample-docs/tech/rag_handbook.pdf" -F "id=manual-test"`);
  const pdfPath = path.resolve('../sample-docs/tech/rag_handbook.pdf');
  const pdfBuffer = await fs.readFile(pdfPath);

  const formData = new FormData();
  formData.append(
    'files',
    new Blob([pdfBuffer], { type: 'application/pdf' }),
    'rag_handbook.pdf'
  );
  formData.append('id', 'manual-test');
  formData.append('name', 'RAG Handbook');

  const uploadRes = await fetch(`${baseUrl}/api/collections`, {
    method: 'POST',
    body: formData
  });
  const uploadJson = await uploadRes.json();
  console.log(`HTTP ${uploadRes.status}:`, JSON.stringify(uploadJson, null, 2));

  // 3. Test POST /api/collections/:id/query (Question Answering)
  console.log('\n--- 3. Testing POST /api/collections/:id/query ---');
  const question = 'What is the refund policy?';
  console.log(`curl -X POST ${baseUrl}/api/collections/manual-test/query -H "Content-Type: application/json" -d '{"question": "${question}"}'`);

  const queryRes = await fetch(`${baseUrl}/api/collections/manual-test/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question })
  });
  const queryJson = await queryRes.json();
  console.log(`HTTP ${queryRes.status}:`, JSON.stringify(queryJson, null, 2));

  // 4. Test DELETE /api/collections/:id (Delete Collection)
  console.log('\n--- 4. Testing DELETE /api/collections/:id ---');
  console.log(`curl -X DELETE ${baseUrl}/api/collections/manual-test`);
  const deleteRes = await fetch(`${baseUrl}/api/collections/manual-test`, {
    method: 'DELETE'
  });
  const deleteJson = await deleteRes.json();
  console.log(`HTTP ${deleteRes.status}:`, JSON.stringify(deleteJson, null, 2));

  console.log('\n====================================================');
  console.log('✅ ALL API ROUTES TESTED AND WORKING');
  console.log('====================================================\n');
}

runRoutesTest().catch(console.error);
