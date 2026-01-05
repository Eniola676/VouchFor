/**
 * Stripe Webhook Handler
 * 
 * Authoritative source for conversion events.
 * Creates conversion records and triggers attribution.
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { attributeConversion } from '../services/attribution.js';

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
 * Generate idempotency key for conversions
 */
function generateIdempotencyKey(transactionId, vendorId) {
  return crypto
    .createHash('sha256')
    .update(transactionId + '::' + vendorId)
    .digest('hex');
}

/**
 * Handle Stripe webhook events
 */
export async function handleStripeWebhook(req, res) {
  try {
    const event = req.body;

    // Respond quickly to Stripe (webhook must respond within 20 seconds)
    res.status(200).json({ received: true });

    // Process event asynchronously
    processStripeEvent(event).catch(err => {
      console.error('Error processing Stripe event:', err);
    });

  } catch (error) {
    console.error('Error handling Stripe webhook:', error);
    // Still return 200 to prevent Stripe from retrying
    return res.status(200).json({ received: true, error: error.message });
  }
}

/**
 * Process Stripe event
 */
async function processStripeEvent(event) {
  // Handle payment_intent.succeeded (conversion)
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    
    // Extract vendor_id from metadata (vendor should set this)
    const vendorId = paymentIntent.metadata?.vendor_id;
    
    if (!vendorId) {
      console.warn('Stripe webhook: No vendor_id in payment_intent metadata');
      return;
    }

    // Verify vendor exists
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id, is_active')
      .eq('id', vendorId)
      .single();

    if (vendorError || !vendor || !vendor.is_active) {
      console.warn('Stripe webhook: Vendor not found or inactive:', vendorId);
      return;
    }

    // Create conversion (idempotent)
    const externalTransactionId = paymentIntent.id;
    const idempotencyKey = generateIdempotencyKey(externalTransactionId, vendorId);
    const amount = paymentIntent.amount / 100; // Convert from cents
    const currency = paymentIntent.currency.toUpperCase();

    // Check if conversion already exists (idempotency)
    const { data: existingConversion } = await supabase
      .from('conversions')
      .select('id')
      .eq('idempotency_key', idempotencyKey)
      .single();

    if (existingConversion) {
      console.log('Stripe webhook: Conversion already exists (idempotent):', existingConversion.id);
      return;
    }

    // Create conversion record (attribution will be resolved later)
    const { data: conversion, error: conversionError } = await supabase
      .from('conversions')
      .insert({
        external_transaction_id: externalTransactionId,
        idempotency_key: idempotencyKey,
        vendor_id: vendorId,
        amount: amount,
        currency: currency,
        metadata: {
          customer_email: paymentIntent.receipt_email,
          customer_id: paymentIntent.customer,
          payment_method: paymentIntent.payment_method,
          ...paymentIntent.metadata,
        },
        status: 'pending',
        converted_at: new Date(paymentIntent.created * 1000).toISOString(),
      })
      .select()
      .single();

    if (conversionError) {
      // Check if it's a duplicate key error (idempotency)
      if (conversionError.code === '23505') {
        console.log('Stripe webhook: Conversion already exists (unique constraint)');
        return;
      }
      throw conversionError;
    }

    console.log('Stripe webhook: Conversion created:', conversion.id);

    // Trigger attribution (async)
    await attributeConversion(conversion.id).catch(err => {
      console.error('Error attributing conversion:', err);
    });

  } else if (event.type === 'charge.refunded') {
    // Handle refunds
    const charge = event.data.object;
    const paymentIntentId = charge.payment_intent;
    
    // Find conversion by external_transaction_id
    const { data: conversion } = await supabase
      .from('conversions')
      .select('id, status')
      .eq('external_transaction_id', paymentIntentId)
      .single();

    if (conversion) {
      // Update conversion status
      await supabase
        .from('conversions')
        .update({ status: 'refunded' })
        .eq('id', conversion.id);

      // Find and reverse commissions
      const { data: commissions } = await supabase
        .from('commissions')
        .select('id')
        .eq('conversion_id', conversion.id)
        .in('status', ['pending', 'approved']);

      for (const commission of commissions || []) {
        await supabase
          .from('commissions')
          .update({ status: 'reversed' })
          .eq('id', commission.id);
      }

      console.log('Stripe webhook: Conversion refunded:', conversion.id);
    }
  }
}





