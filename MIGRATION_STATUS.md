# Tracking System Migration Status

## Current State

### ❌ Old System (Still Active)
The **old tracking system is still running** and being used by your codebase:

**What's Currently Active:**
1. **Database**: Uses `referrals` table (from `supabase-affiliate-schema.sql`)
   - Stores: `affiliate_id`, `vendor_id`, `status`, `commission_amount`
   - Statuses: `'click'`, `'signup'`, `'pending_commission'`, `'paid_commission'`

2. **Click Tracking** (`src/pages/go/TrackingLink.tsx`):
   - Inserts directly into `referrals` table with `status: 'click'`
   - Redirects with `?ref={affiliateId}` in URL

3. **Tracker.js** (`public/tracker.js`):
   - Stores `vouchfor_ref_id` (the affiliate_id) in localStorage
   - Sends `ref_id` to API endpoint
   - Tracks sales via `window.vouchfor('track', 'sale', ...)`

4. **API Endpoint** (`server/api-track.js`):
   - Accepts `ref_id` (affiliate_id) and `program_id`
   - Inserts into `referrals` table

### ✅ New System (Designed, Not Implemented)
The new system exists only as:
- **Design Document**: `TRACKING_SYSTEM_DESIGN.md` (architecture explanation)
- **Schema File**: `supabase-tracking-redesign-schema.sql` (SQL schema, not applied)

**New System Tables:**
- `referral_sessions` (replaces direct `referrals` inserts for clicks)
- `conversions` (idempotent conversion events)
- `commissions` (calculated downstream)
- `conversion_events` (audit log)

---

## How It Works NOW (Old System)

### Current Flow:

```
1. User clicks: /go/{affiliateId}/{vendorId}
   ↓
2. TrackingLink.tsx inserts into referrals table:
   - affiliate_id: {affiliateId}
   - vendor_id: {vendorId}
   - status: 'click'
   - commission_amount: 0
   ↓
3. Redirects to vendor site: destination_url?ref={affiliateId}
   ↓
4. Tracker.js on vendor site:
   - Detects ?ref={affiliateId} in URL
   - Stores in localStorage: vouchfor_ref_id = {affiliateId}
   ↓
5. When sale happens:
   - Vendor calls: window.vouchfor('track', 'sale', { program_id: '...' })
   - Tracker sends: { event: 'sale', ref_id: {affiliateId}, program_id: '...' }
   ↓
6. API endpoint inserts into referrals:
   - affiliate_id: {affiliateId}
   - vendor_id: {program_id}
   - status: 'pending_commission'
   - commission_amount: 0
```

**Problems with Current System:**
- ❌ No attribution windows (sessions expire)
- ❌ No idempotency (duplicate sales possible)
- ❌ Attribution happens at click time (not conversion time)
- ❌ No separation between tracking and commissions
- ❌ Client-side can send fake affiliate_ids

---

## How It Will Work (New System)

### New Flow:

```
1. User clicks: /go/{affiliateId}/{vendorId}
   ↓
2. Server creates referral_session:
   - Generates unique session_token (UUID)
   - Stores: affiliate_id, vendor_id, session_token
   - Sets expires_at = now() + vendor.cookie_duration days
   ↓
3. Redirects to vendor site: destination_url?session={session_token}
   (NO affiliate_id in URL - privacy + security)
   ↓
4. Tracker.js on vendor site:
   - Detects ?session={token} in URL
   - Stores in localStorage: vouchfor_session = {token, expires_at}
   ↓
5. When sale happens (Payment Webhook):
   - Stripe/PayPal sends webhook to your server
   - Server creates conversion record:
     * external_transaction_id: 'stripe_pi_123'
     * idempotency_key: SHA256(transaction_id + vendor_id)
     * status: 'pending'
   ↓
6. Attribution Job (async):
   - Finds valid referral_session by session_token
   - Checks: is_active = true AND expires_at > conversion_time
   - Creates attribution link
   ↓
7. Commission Calculation (async):
   - Calculates commission from conversion.amount
   - Creates commission record
   - Links back to session and conversion
```

**Benefits of New System:**
- ✅ Attribution windows enforced at database level
- ✅ Idempotent conversions (same payment = same conversion)
- ✅ Attribution resolved at conversion time (not click time)
- ✅ Session tokens (not affiliate_ids) - more secure
- ✅ Server-side authority (webhooks, not client-side)
- ✅ Full audit trail

---

## Migration Path

### Step 1: Apply New Schema
```bash
# Run in Supabase SQL Editor
supabase-tracking-redesign-schema.sql
```

This creates new tables but **doesn't delete old ones** (safe migration).

### Step 2: Update Click Tracking
**File**: `src/pages/go/TrackingLink.tsx`

**Change**:
```typescript
// OLD:
await supabase.from('referrals').insert({
  affiliate_id: affiliateId,
  vendor_id: programId,
  status: 'click',
  commission_amount: 0,
});

// NEW:
const sessionToken = crypto.randomUUID();
const { data: vendor } = await supabase
  .from('vendors')
  .select('cookie_duration')
  .eq('id', programId)
  .single();

await supabase.from('referral_sessions').insert({
  affiliate_id: affiliateId,
  vendor_id: programId,
  session_token: sessionToken,
  expires_at: new Date(Date.now() + vendor.cookie_duration * 24 * 60 * 60 * 1000),
  ip_address: req.ip,
  user_agent: req.headers['user-agent'],
});

// Redirect with session token (not affiliate_id)
window.location.href = `${destinationUrl}?session=${sessionToken}`;
```

### Step 3: Update Tracker.js
**File**: `public/tracker.js`

**Change**:
```javascript
// OLD:
const STORAGE_KEY = 'vouchfor_ref_id';
// Stores: affiliate_id

// NEW:
const STORAGE_KEY = 'vouchfor_session';
// Stores: { token: 'uuid', expires_at: '2025-02-15T...' }

// On page load:
const sessionParam = getUrlParameter('session');
if (sessionParam) {
  const expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // 60 days
  saveSession({ token: sessionParam, expires_at: expiresAt });
}

// On conversion (advisory only):
window.vouchfor('track', 'conversion', {
  session_token: getStoredSession().token,
  conversion_id: 'stripe_pi_123', // Optional
  amount: 99.00
});
```

### Step 4: Create Webhook Endpoint
**New File**: `server/webhooks/stripe.js` (or similar)

```javascript
// Handle Stripe webhook
app.post('/api/webhooks/stripe', async (req, res) => {
  const event = req.body;
  
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    
    // Create conversion (idempotent)
    const idempotencyKey = generateIdempotencyKey(
      paymentIntent.id,
      vendorId
    );
    
    await supabase.from('conversions').insert({
      external_transaction_id: paymentIntent.id,
      idempotency_key: idempotencyKey,
      vendor_id: vendorId,
      amount: paymentIntent.amount / 100,
      status: 'pending',
    });
    
    // Queue attribution job
    await queueAttributionJob(conversionId);
  }
  
  res.json({ received: true });
});
```

### Step 5: Update API Endpoint
**File**: `server/api-track.js`

**Change**:
```javascript
// OLD: Accepts ref_id (affiliate_id)
// NEW: Accepts session_token

app.post('/api/track/conversion', async (req, res) => {
  const { session_token, conversion_id, amount } = req.body;
  
  // Validate session
  const { data: session } = await supabase
    .from('referral_sessions')
    .select('*')
    .eq('session_token', session_token)
    .eq('is_active', true)
    .gt('expires_at', new Date())
    .single();
  
  if (!session) {
    return res.json({ 
      received: true, 
      session_valid: false,
      message: 'Session invalid or expired. Webhook will handle conversion.'
    });
  }
  
  // Log as advisory event (webhook is authoritative)
  await supabase.from('conversion_events').insert({
    session_token,
    external_transaction_id: conversion_id,
    vendor_id: session.vendor_id,
    status: 'success',
    request_payload: req.body,
  });
  
  res.json({ 
    received: true, 
    session_valid: true,
    message: 'Conversion hint recorded. Webhook is authoritative.'
  });
});
```

### Step 6: Create Attribution Service
**New File**: `server/services/attribution.js`

```javascript
async function attributeConversion(conversionId) {
  const { data: conversion } = await supabase
    .from('conversions')
    .select('*')
    .eq('id', conversionId)
    .single();
  
  // Find session from customer email or other identifier
  // (This is simplified - real implementation needs customer matching)
  
  const { data: session } = await supabase
    .from('referral_sessions')
    .select('*')
    .eq('vendor_id', conversion.vendor_id)
    .eq('is_active', true)
    .gt('expires_at', conversion.converted_at)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  if (session) {
    // Create attribution
    await supabase.from('attributions').insert({
      conversion_id: conversionId,
      session_id: session.id,
      attribution_method: 'last_click',
    });
    
    // Update conversion
    await supabase
      .from('conversions')
      .update({
        referral_session_id: session.id,
        affiliate_id: session.affiliate_id,
        status: 'confirmed',
      })
      .eq('id', conversionId);
    
    // Queue commission calculation
    await queueCommissionCalculation(conversionId);
  }
}
```

### Step 7: Update Frontend Queries
**Files**: 
- `src/components/affiliate/CommissionsTableWithFilters.tsx`
- `src/pages/dashboard/affiliate/commissions.tsx`
- `src/hooks/useAffiliateStats.ts`

**Change**: Query `commissions` table instead of `referrals` table

```typescript
// OLD:
const { data } = await supabase
  .from('referrals')
  .select('*')
  .eq('affiliate_id', userId)
  .in('status', ['pending_commission', 'paid_commission']);

// NEW:
const { data } = await supabase
  .from('commissions')
  .select(`
    *,
    conversion:conversion_id (
      amount,
      converted_at
    ),
    session:session_id (
      created_at
    )
  `)
  .eq('affiliate_id', userId)
  .in('status', ['pending', 'approved', 'paid']);
```

---

## Migration Checklist

- [ ] **Step 1**: Apply new schema (`supabase-tracking-redesign-schema.sql`)
- [ ] **Step 2**: Update `TrackingLink.tsx` to create sessions
- [ ] **Step 3**: Update `tracker.js` to use session tokens
- [ ] **Step 4**: Create webhook endpoints (Stripe/PayPal)
- [ ] **Step 5**: Update `/api/track` endpoint
- [ ] **Step 6**: Create attribution service
- [ ] **Step 7**: Create commission calculation service
- [ ] **Step 8**: Update frontend queries
- [ ] **Step 9**: Test end-to-end flow
- [ ] **Step 10**: Migrate existing data (optional)
- [ ] **Step 11**: Deprecate old `referrals` table (after validation period)

---

## What You Need to Do

### Immediate Actions:

1. **Decide**: Do you want to migrate now or keep old system?
   - Old system works but has limitations
   - New system is production-ready but requires implementation

2. **If Migrating**:
   - Start with Step 1 (apply schema) - this is safe (doesn't break old system)
   - Implement steps 2-7 incrementally
   - Test thoroughly before deprecating old system

3. **If Keeping Old System**:
   - Current code will continue working
   - You'll miss out on:
     - Attribution windows
     - Idempotent conversions
     - Better fraud prevention
     - Server-side authority

---

## Questions?

- **Can both systems run in parallel?** Yes, temporarily during migration
- **Will old data be lost?** No, old `referrals` table remains
- **How long does migration take?** 2-4 hours of development + testing
- **Can I rollback?** Yes, new tables are separate from old ones





