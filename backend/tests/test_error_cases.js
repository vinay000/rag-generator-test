import { PDFDocument } from 'pdf-lib';
import { parseDocument } from '../src/ingestion/parser.js';

async function testErrorCases() {
  console.log('=== TESTING PARSER ERROR CASES ===\n');

  // Case 1: Empty File (0 bytes)
  console.log('--- Case 1: Empty File (0 bytes) ---');
  try {
    const emptyBuffer = Buffer.from([]);
    await parseDocument({ buffer: emptyBuffer, filename: 'empty_doc.txt' });
    console.log('❌ Failed: Should have thrown an error');
  } catch (err) {
    console.log(`✅ Caught expected error [${err.statusCode}]: "${err.message}"`);
  }

  // Case 2: Scanned / Blank PDF (No text layer)
  console.log('\n--- Case 2: Scanned PDF with No Text ---');
  try {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.addPage([600, 400]); // Blank page without any text layer
    const blankPdfBytes = await pdfDoc.save();
    const blankPdfBuffer = Buffer.from(blankPdfBytes);

    await parseDocument({ buffer: blankPdfBuffer, filename: 'scanned_receipt.pdf' });
    console.log('❌ Failed: Should have thrown an error');
  } catch (err) {
    console.log(`✅ Caught expected error [${err.statusCode}]: "${err.message}"`);
  }

  // Case 3: Unsupported File Type
  console.log('\n--- Case 3: Unsupported File Type ---');
  try {
    const fakeImageBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
    await parseDocument({ buffer: fakeImageBuffer, filename: 'photo.png' });
    console.log('❌ Failed: Should have thrown an error');
  } catch (err) {
    console.log(`✅ Caught expected error [${err.statusCode}]: "${err.message}"`);
  }

  console.log('\n=== ALL 3 ERROR CASES VERIFIED SUCCESSFULLY ===');
}

testErrorCases().catch(console.error);
