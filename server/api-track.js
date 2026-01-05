/**
 * API Endpoint: /api/track
 * 
 * Session-Based Tracking API for VouchFor
 * Handles conversion hints (advisory) and session validation.
 * Webhooks are authoritative for actual conversions.
 * 
 * Endpoints:
 * - POST /api/track/conversion - Accepts conversion hints (advisory)
 * - GET /api/track/session/:token - Validates session token
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Initialize Supabase client with service role key
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
}

const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

/**
 * Generate idempotency key for conversions
 */
function generateIdempotencyKey(transactionId, vendorId) {
  return crypto
    .createHash('sha256')
    .update(transactionId + '::' + vendorId)
    .digest('hex');
}

/**
 * Handle conversion hint (advisory)
 * Webhooks are authoritative for actual conversions
 */
export async function handleConversionHint(req, res) {
  try {
    const { session_token, conversion_id, amount } = req.body;

    if (!session_token) {
      return res.status(400).json({ 
        error: 'session_token is required' 
      });
    }

    // Validate session token
    const { data: session, error: sessionError } = await supabase
      .from('referral_sessions')
      .select('id, affiliate_id, vendor_id, expires_at, is_active')
      .eq('session_token', session_token)
      .single();

    if (sessionError || !session) {
      // Log invalid session attempt
      await logConversionEvent({
        session_token,
        external_transaction_id: conversion_id,
        status: 'invalid_session',
        error_message: 'Session not found or invalid',
        request_payload: req.body,
      });

      return res.status(200).json({ 
        received: true,
        session_valid: false,
        message: 'Session invalid or expired. Webhook will handle conversion if payment succeeds.'
      });
    }

    // Check if session is active and not expired
    const now = new Date();
    const expiresAt = new Date(session.expires_at);
    
    if (!session.is_active || expiresAt <= now) {
      await logConversionEvent({
        session_token,
        vendor_id: session.vendor_id,
        external_transaction_id: conversion_id,
        status: 'expired',
        error_message: 'Session expired',
        request_payload: req.body,
      });

      return res.status(200).json({ 
        received: true,
        session_valid: false,
        message: 'Session expired. Webhook will handle conversion if payment succeeds.'
      });
    }

    // Log successful conversion hint
    await logConversionEvent({
      session_token,
      vendor_id: session.vendor_id,
      external_transaction_id: conversion_id,
      status: 'success',
      request_payload: req.body,
    });

    return res.status(200).json({ 
      received: true,
      session_valid: true,
      message: 'Conversion hint recorded. Webhook is authoritative for actual conversion.'
    });

  } catch (error) {
    console.error('Error handling conversion hint:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

/**
 * Validate session token
 */
export async function handleSessionValidation(req, res) {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ error: 'Session token is required' });
    }

    const { data: session, error: sessionError } = await supabase
      .from('referral_sessions')
      .select('id, affiliate_id, vendor_id, expires_at, is_active, created_at')
      .eq('session_token', token)
      .single();

    if (sessionError || !session) {
      return res.status(404).json({ 
        valid: false,
        message: 'Session not found' 
      });
    }

    const now = new Date();
    const expiresAt = new Date(session.expires_at);
    const isValid = session.is_active && expiresAt > now;

    return res.status(200).json({ 
      valid: isValid,
      expires_at: session.expires_at,
      is_active: session.is_active,
      expires_in_days: isValid 
        ? Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24))
        : 0
    });

  } catch (error) {
    console.error('Error validating session:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

/**
 * Log conversion event for debugging and audit
 */
async function logConversionEvent(eventData) {
  try {
    const { data, error } = await supabase
      .from('conversion_events')
      .insert({
        session_token: eventData.session_token,
        external_transaction_id: eventData.external_transaction_id,
        vendor_id: eventData.vendor_id,
        status: eventData.status,
        error_message: eventData.error_message,
        request_payload: eventData.request_payload || {},
        ip_address: eventData.ip_address,
        user_agent: eventData.user_agent,
      });

    if (error) {
      console.error('Error logging conversion event:', error);
    }
  } catch (err) {
    console.error('Exception logging conversion event:', err);
  }
}

// Express route handlers
export default {
  handleConversionHint,
  handleSessionValidation,
};
