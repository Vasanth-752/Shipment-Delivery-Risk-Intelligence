import express from 'express';
import cors from 'cors';
import { shipmentsRouter } from './routes/shipments.js';

export const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api', shipmentsRouter);

// Standalone execution support
if (process.env.STANDALONE_BACKEND === 'true' || process.argv[1]?.endsWith('server.js')) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend API server running on port ${PORT}`);
  });
}
