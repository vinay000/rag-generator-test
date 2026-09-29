import express from 'express';
import multer from 'multer';
import path from 'node:path';
import { ingestDocuments } from '../ingestion/ingest.js';
import { generateAnswerForQuery } from '../retrieval/answer.js';
import {
  listCollections,
  getCollection,
  deleteCollection
} from '../services/vectorStore.js';
import { AppError } from '../utils/errors.js';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit
const ALLOWED_EXTS = new Set(['.pdf', '.txt', '.md']);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTS.has(ext)) {
      return cb(new AppError(`Unsupported file type "${ext}". Use PDF, TXT or MD.`, 400));
    }
    cb(null, true);
  }
}).array('files');

function handleUpload(req, res, next) {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return next(new AppError('File too large. Maximum size is 10MB.', 400));
    }
    if (err) return next(err);
    next();
  });
}

export const collectionsRouter = express.Router();

/**
 * POST /api/collections
 * Upload documents (PDF, TXT, MD) to create a new collection
 */
collectionsRouter.post('/', handleUpload, async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      throw new AppError('No files uploaded. Please attach at least one document.', 400);
    }

    const files = req.files.map((file) => ({
      buffer: file.buffer,
      filename: file.originalname
    }));

    const result = await ingestDocuments({
      files,
      collectionId: req.body.id,
      collectionName: req.body.name
    });

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/collections
 * Lists all active collections in memory
 */
collectionsRouter.get('/', (req, res, next) => {
  try {
    const collections = listCollections();
    res.status(200).json({ collections });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/collections/:id
 * Retrieves metadata for a single collection
 */
collectionsRouter.get('/:id', (req, res, next) => {
  try {
    const collection = getCollection(req.params.id);
    if (!collection) {
      throw new AppError(`Collection "${req.params.id}" not found`, 404);
    }
    res.status(200).json(collection);
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/collections/:id
 * Removes a collection from memory
 */
collectionsRouter.delete('/:id', (req, res, next) => {
  try {
    deleteCollection(req.params.id);
    res.status(200).json({
      message: `Collection "${req.params.id}" deleted successfully`,
      id: req.params.id
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/collections/:id/query
 * Queries a collection to generate a grounded answer with citations
 */
collectionsRouter.post('/:id/query', async (req, res, next) => {
  try {
    const question = req.body.question || req.body.query;
    if (!question?.trim()) {
      throw new AppError('Question field is required', 400);
    }

    const result = await generateAnswerForQuery(req.params.id, question);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});
