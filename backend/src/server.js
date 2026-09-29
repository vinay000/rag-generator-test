import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { collectionsRouter } from './routes/collections.js';
import { notFound, errorHandler } from './utils/errors.js';

const app = express();

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Server is healthy',
    timestamp: new Date().toISOString()
  });
});

// Collection routes
app.use('/api/collections', collectionsRouter);

// 404 & Global Error handlers
app.use(errorHandler);

const PORT = config.port || 5001;

// Only listen if executed directly and not inside serverless runtime
if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server is running at port - ${PORT}`);
  });
}

export default app;