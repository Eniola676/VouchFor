/**
 * Stripe Webhook Handler
 * Vercel serverless function wrapper
 */
import { handleStripeWebhook } from '../../server/webhooks/stripe.js';

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  return handleStripeWebhook(req, res);
}

