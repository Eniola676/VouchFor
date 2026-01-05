/**
 * Attribution Service
 * 
 * Links conversions to referral sessions based on last-click attribution.
 * Runs asynchronously after conversion is created.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

/**
 * Attribute conversion to referral session
 * Uses last-click attribution within attribution window
 */
export async function attributeConversion(conversionId) {
  try {
    // Fetch conversion
    const { data: conversion, error: conversionError } = await supabase
      .from('conversions')
      .select('id, vendor_id, converted_at, metadata')
      .eq('id', conversionId)
      .single();

    if (conversionError || !conversion) {
      throw new Error('Conversion not found: ' + conversionId);
    }

    // Check if already attributed
    if (conversion.referral_session_id) {
      console.log('Conversion already attributed:', conversionId);
      return;
    }

    // Find valid referral sessions for this vendor
    // Last-click attribution: most recent session wins
    const { data: sessions, error: sessionsError } = await supabase
      .from('referral_sessions')
      .select('id, affiliate_id, vendor_id, created_at, expires_at')
      .eq('vendor_id', conversion.vendor_id)
      .eq('is_active', true)
      .gt('expires_at', conversion.converted_at) // Session must not be expired at conversion time
      .order('created_at', { ascending: false }) // Last-click: most recent first
      .limit(1);

    if (sessionsError) {
      throw sessionsError;
    }

    if (!sessions || sessions.length === 0) {
      // No valid session found - mark conversion as failed
      await supabase
        .from('conversions')
        .update({ status: 'failed' })
        .eq('id', conversionId);

      console.log('No valid session found for conversion:', conversionId);
      return;
    }

    const session = sessions[0];

    // Update conversion with attribution (transaction-safe)
    const { error: updateError } = await supabase
      .from('conversions')
      .update({
        referral_session_id: session.id,
        affiliate_id: session.affiliate_id,
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
      })
      .eq('id', conversionId);

    if (updateError) {
      // Check if it was already attributed (race condition)
      if (updateError.code === '23505' || updateError.message.includes('already')) {
        console.log('Conversion already attributed (race condition):', conversionId);
        return;
      }
      throw updateError;
    }

    console.log('Conversion attributed:', {
      conversion_id: conversionId,
      session_id: session.id,
      affiliate_id: session.affiliate_id,
    });

    // Trigger commission calculation (async)
    await calculateCommission(conversionId).catch(err => {
      console.error('Error calculating commission:', err);
    });

  } catch (error) {
    console.error('Error attributing conversion:', error);
    throw error;
  }
}





