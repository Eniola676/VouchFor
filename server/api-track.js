/**
 * API Endpoint: /api/track/event
 * 
 * This endpoint handles tracking events from the VouchFor tracker.js SDK
 * It records signups and other events in the referrals table
 * 
 * To use with Express:
 * import { handleTrackEvent } from './server/api-track.js';
 * app.post('/api/track/event', handleTrackEvent);
 * 
 * Or use with Vite proxy or Supabase Edge Functions
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
// In production, use environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role key for server-side

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
 * Extract affiliate_id and vendor_id from referral_id
 * Format: referral_id is the affiliate_id, we need to find the vendor_id from the click
 */
async function findVendorFromReferral(referralId) {
  try {
    // First, find the most recent click for this affiliate
    // The referral_id in the tracker is actually the affiliate_id
    const { data: recentClick, error } = await supabase
      .from('referrals')
      .select('vendor_id')
      .eq('affiliate_id', referralId)
      .eq('status', 'click')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !recentClick) {
      console.error('Error finding vendor from referral:', error);
      return null;
    }

    return recentClick.vendor_id;
  } catch (err) {
    console.error('Exception finding vendor:', err);
    return null;
  }
}

/**
 * Handle tracking event
 */
export async function handleTrackEvent(req, res) {
  try {
    const { referral_id, event_name, metadata } = req.body;

    if (!referral_id) {
      return res.status(400).json({ error: 'referral_id is required' });
    }

    if (!event_name) {
      return res.status(400).json({ error: 'event_name is required' });
    }

    // For signup events, we need to update the referrals table
    if (event_name === 'signup') {
      // Find the vendor_id from the most recent click
      const vendorId = await findVendorFromReferral(referral_id);

      if (!vendorId) {
        console.warn('No vendor found for referral_id:', referral_id);
        return res.status(200).json({ 
          success: true, 
          message: 'Event received but no active referral found',
          warning: 'No recent click found for this affiliate'
        });
      }

      // Check if a signup already exists for this affiliate+vendor combination
      const { data: existingSignup } = await supabase
        .from('referrals')
        .select('id')
        .eq('affiliate_id', referral_id)
        .eq('vendor_id', vendorId)
        .eq('status', 'signup')
        .limit(1)
        .single();

      if (existingSignup) {
        return res.status(200).json({ 
          success: true, 
          message: 'Signup already recorded',
          referral_id: existingSignup.id
        });
      }

      // Get vendor commission details to calculate commission amount
      const { data: vendor } = await supabase
        .from('vendors')
        .select('commission_type, commission_value')
        .eq('id', vendorId)
        .single();

      let commissionAmount = 0;
      if (vendor) {
        // For signups, commission is typically 0 until conversion
        // But you can set it based on your business logic
        // For now, we'll set it to 0 and update it when conversion happens
        commissionAmount = 0;
      }

      // Insert signup record
      const { data: signupRecord, error: insertError } = await supabase
        .from('referrals')
        .insert({
          affiliate_id: referral_id,
          vendor_id: vendorId,
          status: 'signup',
          commission_amount: commissionAmount,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error inserting signup:', insertError);
        return res.status(500).json({ 
          error: 'Failed to record signup',
          details: insertError.message 
        });
      }

      return res.status(200).json({ 
        success: true, 
        message: 'Signup recorded successfully',
        referral_id: signupRecord.id
      });
    }

    // For other events, just log them (you can extend this)
    console.log('VouchFor Event:', event_name, metadata);
    return res.status(200).json({ 
      success: true, 
      message: 'Event received',
      event: event_name
    });

  } catch (error) {
    console.error('Error handling track event:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

// Express route handler
export default function trackEventRoute(req, res) {
  return handleTrackEvent(req, res);
}

