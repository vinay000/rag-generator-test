import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'node:fs/promises';
import path from 'node:path';

async function createSamplePdf() {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Page 1: Introduction
  const page1 = pdfDoc.addPage([600, 400]);
  page1.drawText('Page 1: Introduction to RAG Systems', {
    x: 50,
    y: 350,
    size: 18,
    font: boldFont,
    color: rgb(0.1, 0.2, 0.6),
  });
  page1.drawText('Retrieval-Augmented Generation combines external document retrieval with LLMs.', {
    x: 50,
    y: 300,
    size: 12,
    font: font,
    color: rgb(0.2, 0.2, 0.2),
  });
  page1.drawText('This allows AI models to answer questions using private knowledge bases accurately.', {
    x: 50,
    y: 270,
    size: 12,
    font: font,
    color: rgb(0.2, 0.2, 0.2),
  });

  // Page 2: Ingestion Pipeline
  const page2 = pdfDoc.addPage([600, 400]);
  page2.drawText('Page 2: Ingestion Pipeline Architecture', {
    x: 50,
    y: 350,
    size: 18,
    font: boldFont,
    color: rgb(0.1, 0.2, 0.6),
  });
  page2.drawText('Documents are parsed into clean text and sliced into overlapping chunks.', {
    x: 50,
    y: 300,
    size: 12,
    font: font,
    color: rgb(0.2, 0.2, 0.2),
  });
  page2.drawText('Each chunk is transformed into vector embeddings and saved into the vector store.', {
    x: 50,
    y: 270,
    size: 12,
    font: font,
    color: rgb(0.2, 0.2, 0.2),
  });

  // Page 3: Query & Retrieval
  const page3 = pdfDoc.addPage([600, 400]);
  page3.drawText('Page 3: Query and Retrieval Workflow', {
    x: 50,
    y: 350,
    size: 18,
    font: boldFont,
    color: rgb(0.1, 0.2, 0.6),
  });
  page3.drawText('User queries are converted into vectors and matched using cosine similarity.', {
    x: 50,
    y: 300,
    size: 12,
    font: font,
    color: rgb(0.2, 0.2, 0.2),
  });
  page3.drawText('Top ranked chunks are injected into the prompt as grounded reference context.', {
    x: 50,
    y: 270,
    size: 12,
    font: font,
    color: rgb(0.2, 0.2, 0.2),
  });

  const pdfBytes = await pdfDoc.save();
  const outputPath = path.resolve('../sample-docs/tech/rag_handbook.pdf');
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, pdfBytes);
  console.log(`Successfully generated sample PDF at: ${outputPath}`);
}

createSamplePdf().catch(console.error);
