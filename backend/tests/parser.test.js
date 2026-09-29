import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument } from 'pdf-lib';
import { parseDocument } from '../src/ingestion/parser.js';

describe('Parser Error Handling', () => {
  it('should throw 400 when file buffer is empty', async () => {
    await assert.rejects(
      async () => {
        await parseDocument({ buffer: Buffer.from([]), filename: 'empty.txt' });
      },
      (err) => {
        assert.equal(err.statusCode, 400);
        assert.equal(err.message, 'empty.txt is empty');
        return true;
      }
    );
  });

  it('should throw 400 when PDF has no readable text (scanned PDF)', async () => {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.addPage([600, 400]);
    const blankPdfBuffer = Buffer.from(await pdfDoc.save());

    await assert.rejects(
      async () => {
        await parseDocument({ buffer: blankPdfBuffer, filename: 'scanned.pdf' });
      },
      (err) => {
        assert.equal(err.statusCode, 400);
        assert.equal(err.message, 'scanned.pdf has no readable text (scanned PDF?)');
        return true;
      }
    );
  });

  it('should throw 400 for unsupported file types', async () => {
    const buffer = Buffer.from([1, 2, 3, 4]);
    await assert.rejects(
      async () => {
        await parseDocument({ buffer, filename: 'photo.jpg' });
      },
      (err) => {
        assert.equal(err.statusCode, 400);
        assert.equal(err.message, 'Unsupported file type ".jpg". Use PDF, TXT or MD.');
        return true;
      }
    );
  });
});
