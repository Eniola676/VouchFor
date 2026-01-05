/**
 * Commission Calculation Service
 * 
 * Calculates and creates commission records from attributed conversions.
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
 * Calculate and create commission from conversion
 */
export async function calculateCommission(conversionId) {
  try {
    // Fetch conversion with vendor details
    const { data: conversion, error: conversionError } = await supabase
      .from('conversions')
      .select(`
        id,
        referral_session_id,
        affiliate_id,
        vendor_id,
        amount,
        status,
        vendors:vendor_id (
          commission_type,
          commission_value
        )
      `)
      .eq('id', conversionId)
      .single();

    if (conversionError || !conversion) {
      throw new Error('Conversion not found: ' + conversionId);
    }

    // Check if conversion is confirmed
    if (conversion.status !== 'confirmed') {
      console.log('Conversion not confirmed, skipping commission:', conversionId);
      return;
    }

    // Check if commission already exists
    const { data: existingCommission } = await supabase
      .from('commissions')
      .select('id')
      .eq('conversion_id', conversionId)
      .single();

    if (existingCommission) {
      console.log('Commission already exists:', existingCommission.id);
      return;
    }

    if (!conversion.referral_session_id || !conversion.affiliate_id) {
      throw new Error('Conversion not attributed');
    }

    const vendor = conversion.vendors;
    if (!vendor) {
      throw new Error('Vendor not found');
    }

    // Calculate commission
    let commissionAmount = 0;
    const saleAmount = parseFloat(conversion.amount);

    if (vendor.commission_type === 'percentage') {
      const rate = parseFloat(vendor.commission_value);
      commissionAmount = saleAmount * (rate / 100);
    } else if (vendor.commission_type === 'fixed') {
      commissionAmount = parseFloat(vendor.commission_value);
    }

    // Create commission record
    const { data: commission, error: commissionError } = await supabase
      .from('commissions')
      .insert({
        conversion_id: conversionId,
        affiliate_id: conversion.affiliate_id,
        vendor_id: conversion.vendor_id,
        sale_amount: saleAmount,
        commission_type: vendor.commission_type,
        commission_rate: vendor.commission_value,
        commission_amount: commissionAmount,
        status: 'pending',
      })
      .select()
      .single();

    if (commissionError) {
      throw commissionError;
    }

    console.log('Commission created:', {
      commission_id: commission.id,
      conversion_id: conversionId,
      affiliate_id: conversion.affiliate_id,
      amount: commissionAmount,
    });

    return commission;

  } catch (error) {
    console.error('Error calculating commission:', error);
    throw error;
  }
}





