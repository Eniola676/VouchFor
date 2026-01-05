/**
 * API Endpoint: /api/track/session/:token
 * Vercel serverless function wrapper for session validation
 */
import { handleSessionValidation } from '../../../server/api-track.js';

export default async function handler(req, res) {
  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // Extract token from query parameter (Vercel dynamic route)
  const { token } = req.query;
  req.params = { token };
  
  return handleSessionValidation(req, res);
}

