/**
 * Express Server for VouchFor API
 * 
 * Run this server separately or integrate with your main server
 * 
 * Usage:
 *   npm install express cors dotenv
 *   npm run server
 * 
 * Or add to your existing Express app:
 *   import { handleTrackEvent } from './server/api-track.js';
 *   app.post('/api/track/event', handleTrackEvent);
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { handleTrackEvent } from './server/api-track.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'vouchfor-api' });
});

// Tracking endpoint
app.post('/api/track/event', handleTrackEvent);

// Start server
app.listen(PORT, () => {
  console.log(`VouchFor API server running on port ${PORT}`);
  console.log(`Tracking endpoint: http://localhost:${PORT}/api/track/event`);
});

