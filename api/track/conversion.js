/**
 * API Endpoint: /api/track/conversion
 * Vercel serverless function wrapper for conversion hint handler
 */
import { handleConversionHint } from '../../server/api-track.js';

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  return handleConversionHint(req, res);
}

