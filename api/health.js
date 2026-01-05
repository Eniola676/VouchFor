/**
 * Health check endpoint for Vercel
 * Accessible at /health (not /api/health)
 */
export default function handler(req, res) {
  return res.status(200).json({ 
    status: 'ok', 
    service: 'vouchfor-api' 
  });
}

