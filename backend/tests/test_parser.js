import fs from 'node:fs/promises';
import path from 'node:path';
import { parseDocument } from '../src/ingestion/parser.js';

async function testParser() {
  const filePath = path.resolve('../sample-docs/tech/rag_handbook.pdf');
  const filename = path.basename(filePath);
  const buffer = await fs.readFile(filePath);

  console.log(`Testing parseDocument with file: ${filename} (${buffer.length} bytes)\n`);

  const result = await parseDocument({ buffer, filename });

  console.log('--- RESULT ---');
  console.log(`Filename:    ${result.filename}`);
  console.log(`Total Pages: ${result.pages.length}`);

  console.log('\n--- EXTRACTED PAGES ---');
  result.pages.forEach((page) => {
    console.log(`\n[Page ${page.pageNumber}]:`);
    console.log(page.text);
  });
}

testParser().catch((err) => {
  console.error('Parser test failed:', err);
  process.exit(1);
});
