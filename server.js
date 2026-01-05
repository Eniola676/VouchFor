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
import { handleConversionHint, handleSessionValidation } from './server/api-track.js';
import { handleStripeWebhook } from './server/webhooks/stripe.js';
import { attributeConversion } from './server/services/attribution.js';
import { calculateCommission } from './server/services/commission.js';

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

// Session-based tracking endpoints
app.post('/api/track/conversion', handleConversionHint);
app.get('/api/track/session/:token', handleSessionValidation);

// Webhook endpoints (authoritative for conversions)
app.post('/api/webhooks/stripe', handleStripeWebhook);
// Add PayPal webhook handler here when needed

// Start server
app.listen(PORT, () => {
  console.log(`VouchFor API server running on port ${PORT}`);
  console.log(`Conversion hint endpoint: POST http://localhost:${PORT}/api/track/conversion`);
  console.log(`Session validation: GET http://localhost:${PORT}/api/track/session/:token`);
  console.log(`Stripe webhook: POST http://localhost:${PORT}/api/webhooks/stripe`);
});

