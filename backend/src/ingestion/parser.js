import path from 'node:path';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { AppError } from '../utils/errors.js';

async function parsePdf(buffer) {
  let doc;
  const loadingTask = getDocument({
    data: new Uint8Array(buffer),
    useSystemFonts: true,
    isEvalSupported: false,
  });

  try {
    doc = await loadingTask.promise;
  } catch (err) {
    throw new AppError(`Could not read PDF: ${err.message}`, 400);
  }

  const pages = [];
  for (let n = 1; n <= doc.numPages; n++) {
    const page = await doc.getPage(n);
    const { items } = await page.getTextContent();
    const text = items.map((i) => i.str + (i.hasEOL ? '\n' : ' ')).join('').trim();
    pages.push({ pageNumber: n, text });
  }
  await loadingTask.destroy();
  return pages;
}

export async function parseDocument({ buffer, filename }) {
  if (!buffer?.length) throw new AppError(`${filename} is empty`, 400);

  const ext = path.extname(filename).toLowerCase();
  let pages;

  if (ext === '.pdf') pages = await parsePdf(buffer);
  else if (ext === '.txt' || ext === '.md')
    pages = [{ pageNumber: 1, text: buffer.toString('utf-8').trim() }];
  else throw new AppError(`Unsupported file type "${ext}". Use PDF, TXT or MD.`, 400);

  if (!pages.some((p) => p.text?.trim()))
    throw new AppError(`${filename} has no readable text (scanned PDF?)`, 400);

  return { filename, pages };

}