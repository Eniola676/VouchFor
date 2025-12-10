/**
 * API Endpoint: /api/track
 * 
 * Hybrid Click and Sale Tracking API for VouchFor
 * Handles both click and sale events from tracker.js
 * 
 * Request Body:
 * {
 *   "event": "click" | "sale",
 *   "ref_id": "affiliate-uuid",
 *   "program_id": "vendor-uuid" (optional for clicks, required for sales)
 * }
 */

import { createClient } from '@supabase/supabase-js';

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
 * Handle tracking event (click or sale)
 */
export async function handleTrackEvent(req, res) {
  try {
    // Support both 'event' and 'event_type' for backward compatibility
    const event = req.body.event || req.body.event_type;
    const { ref_id, program_id } = req.body;

    // Validate required fields
    if (!ref_id) {
      return res.status(400).json({ error: 'ref_id is required' });
    }

    if (!event) {
      return res.status(400).json({ error: 'event is required (must be "click" or "sale")' });
    }

    if (event !== 'click' && event !== 'sale') {
      return res.status(400).json({ error: 'event must be "click" or "sale"' });
    }

    // For sale events, program_id is required
    if (event === 'sale' && !program_id) {
      return res.status(400).json({ error: 'program_id is required for sale events' });
    }

    // For click events, program_id is optional but recommended
    // If not provided, we'll try to find it from the affiliate's active programs
    let vendorId = program_id;

    // Validate vendor/program if program_id is provided
    if (vendorId) {
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .select('id, commission_type, commission_value, is_active')
        .eq('id', vendorId)
        .single();

      if (vendorError || !vendorData) {
        return res.status(404).json({ 
          error: 'Program not found',
          details: vendorError?.message 
        });
      }

      if (!vendorData.is_active) {
        return res.status(400).json({ 
          error: 'Program is not active' 
        });
      }
    }

    // Determine status based on event type
    let status;
    let commissionAmount = 0;

    if (event === 'click') {
      status = 'click';
      commissionAmount = 0;
    } else if (event === 'sale') {
      status = 'pending_commission';
      commissionAmount = 0; // Will be calculated later when sale is confirmed
    }

    // For clicks without program_id, we need to find the vendor_id
    // This could happen if the tracking link doesn't include program_id
    // For now, we'll require program_id for both events
    if (!vendorId) {
      return res.status(400).json({ 
        error: 'program_id is required' 
      });
    }

    // Insert referral record into referrals table
    const referralData = {
      affiliate_id: ref_id,
      vendor_id: vendorId,
      status: status,
      commission_amount: commissionAmount,
    };

    const { data: referralRecord, error: insertError } = await supabase
      .from('referrals')
      .insert([referralData])
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting referral:', insertError);
      return res.status(500).json({ 
        error: 'Failed to record event',
        details: insertError.message 
      });
    }

    console.log(`${event} event recorded:`, {
      referral_id: referralRecord.id,
      affiliate_id: ref_id,
      vendor_id: vendorId,
      status: status
    });

    return res.status(200).json({ 
      success: true, 
      message: `${event} recorded successfully`,
      referral_id: referralRecord.id,
      status: referralRecord.status
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
