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
// CORS: Allow requests from frontend and external vendor sites
app.use(cors({
  origin: true, // Allow all origins (configure specific origins in production)
  credentials: false
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'vouchfor-api' });
});

// Tracking endpoint (Destination Tracking)
app.post('/api/track', handleTrackEvent);

// Legacy endpoint for backward compatibility
app.post('/api/track/event', handleTrackEvent);

// Start server
app.listen(PORT, () => {
  console.log(`VouchFor API server running on port ${PORT}`);
  console.log(`Hybrid Tracking endpoint: http://localhost:${PORT}/api/track`);
  console.log(`  - Accepts: { event: 'click' | 'sale', ref_id: '...', program_id: '...' }`);
  console.log(`Legacy endpoint: http://localhost:${PORT}/api/track/event`);
});

