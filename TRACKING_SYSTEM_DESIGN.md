# Affiliate Tracking & Attribution System Design

## High-Level Architecture

### Core Principles

1. **Session-Based Attribution**: Clicks create referral sessions, not direct commission records
2. **Server-Side Authority**: Payment webhooks are the source of truth for conversions
3. **Idempotent Conversions**: Same conversion event can be processed multiple times safely
4. **Attribution Windows**: Sessions expire after a configurable period (30-90 days)
5. **Last-Click Attribution**: Most recent valid session wins
6. **Separation of Concerns**: Tracking → Attribution → Commission Calculation

### System Components

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Click     │────▶│   Referral   │────▶│ Conversion  │
│  Tracking   │     │   Session    │     │   Event     │
└─────────────┘     └──────────────┘     └─────────────┘
                                              │
                                              ▼
                                    ┌─────────────┐
                                    │ Attribution │
                                    └─────────────┘
                                              │
                                              ▼
                                    ┌─────────────┐
                                    │ Commission  │
                                    └─────────────┘
```

---

## Database Schema

### 1. `referral_sessions`

**Purpose**: Tracks click events and maintains attribution windows.

```sql
CREATE TABLE referral_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Attribution identifiers
  affiliate_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  
  -- Session metadata
  session_token TEXT NOT NULL UNIQUE, -- Client-side identifier
  ip_address INET,
  user_agent TEXT,
  referrer_url TEXT,
  landing_url TEXT NOT NULL,
  
  -- Attribution window
  expires_at TIMESTAMPTZ NOT NULL, -- Based on vendor's cookie_duration
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true, -- Can be invalidated
  
  -- Indexes
  CONSTRAINT referral_sessions_expires_at_idx 
    ON referral_sessions(expires_at) WHERE is_active = true,
  CONSTRAINT referral_sessions_affiliate_vendor_idx 
    ON referral_sessions(affiliate_id, vendor_id, created_at DESC),
  CONSTRAINT referral_sessions_token_idx 
    ON referral_sessions(session_token)
);
```

**Key Design Decisions**:
- `session_token`: Unique identifier stored client-side (not affiliate_id directly)
- `expires_at`: Enforces attribution window at database level
- `is_active`: Allows manual invalidation without deletion
- Separate from conversions/commissions: pure tracking data

---

### 2. `conversions`

**Purpose**: Server-side authoritative conversion events (from payment webhooks).

```sql
CREATE TABLE conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- External system identifiers (for idempotency)
  external_id TEXT NOT NULL UNIQUE, -- Stripe payment_intent_id, PayPal transaction_id, etc.
  external_source TEXT NOT NULL, -- 'stripe', 'paypal', 'manual', etc.
  
  -- Vendor context
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  
  -- Conversion details
  amount NUMERIC NOT NULL, -- Gross sale amount
  currency TEXT NOT NULL DEFAULT 'USD',
  customer_email TEXT,
  customer_id TEXT, -- External customer identifier
  
  -- Metadata
  metadata JSONB, -- Flexible storage for product_id, plan_type, etc.
  occurred_at TIMESTAMPTZ NOT NULL, -- When conversion actually happened (from payment system)
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(), -- When we recorded it
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'attributed', 'failed', 'refunded')),
  
  -- Attribution (set after attribution logic runs)
  attributed_session_id UUID REFERENCES referral_sessions(id),
  attributed_at TIMESTAMPTZ,
  
  -- Indexes
  CONSTRAINT conversions_external_id_idx ON conversions(external_id),
  CONSTRAINT conversions_vendor_status_idx ON conversions(vendor_id, status, occurred_at DESC),
  CONSTRAINT conversions_attributed_session_idx ON conversions(attributed_session_id) 
    WHERE attributed_session_id IS NOT NULL
);
```

**Key Design Decisions**:
- `external_id` + `external_source`: Enforces idempotency (same payment = same conversion)
- `occurred_at` vs `recorded_at`: Distinguishes when event happened vs when we learned about it
- `status`: Tracks attribution lifecycle
- Server-side only: No client-side inserts

---

### 3. `attributions`

**Purpose**: Explicit record of which session was attributed to which conversion.

```sql
CREATE TABLE attributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  conversion_id UUID NOT NULL REFERENCES conversions(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES referral_sessions(id) ON DELETE RESTRICT,
  
  -- Attribution metadata
  attribution_method TEXT NOT NULL DEFAULT 'last_click' 
    CHECK (attribution_method IN ('last_click', 'first_click', 'manual')),
  attribution_window_days INTEGER NOT NULL, -- How many days the session had left
  
  -- Audit trail
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by TEXT, -- 'system' or user_id for manual attributions
  
  -- Uniqueness: one conversion = one attribution
  CONSTRAINT attributions_conversion_unique UNIQUE (conversion_id),
  
  -- Indexes
  CONSTRAINT attributions_session_idx ON attributions(session_id),
  CONSTRAINT attributions_conversion_idx ON attributions(conversion_id)
);
```

**Key Design Decisions**:
- Explicit table: Makes attribution decisions auditable
- One-to-one with conversions: Prevents double-attribution
- `attribution_window_days`: Records how much time was left (for analytics)

---

### 4. `commissions`

**Purpose**: Calculated commission amounts, downstream of attribution.

```sql
CREATE TABLE commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Links
  attribution_id UUID NOT NULL REFERENCES attributions(id) ON DELETE CASCADE,
  conversion_id UUID NOT NULL REFERENCES conversions(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES referral_sessions(id) ON DELETE RESTRICT,
  affiliate_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  
  -- Commission calculation
  commission_type TEXT NOT NULL CHECK (commission_type IN ('percentage', 'fixed')),
  commission_rate NUMERIC NOT NULL, -- Percentage (e.g., 20.5) or fixed amount
  sale_amount NUMERIC NOT NULL, -- From conversion.amount
  commission_amount NUMERIC NOT NULL, -- Calculated: sale_amount * rate or fixed
  
  -- Status lifecycle
  status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'approved', 'paid', 'cancelled', 'reversed')),
  
  -- Timestamps
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  
  -- Indexes
  CONSTRAINT commissions_affiliate_status_idx 
    ON commissions(affiliate_id, status, calculated_at DESC),
  CONSTRAINT commissions_vendor_status_idx 
    ON commissions(vendor_id, status, calculated_at DESC),
  CONSTRAINT commissions_attribution_idx ON commissions(attribution_id)
);
```

**Key Design Decisions**:
- Calculated downstream: Commission is derived from conversion + vendor rules
- Status tracking: Clear lifecycle (pending → approved → paid)
- Immutable calculation: `commission_amount` is calculated once and stored
- Links to attribution: Always traceable back to session

---

### 5. `commission_adjustments`

**Purpose**: Tracks refunds, reversals, and manual adjustments.

```sql
CREATE TABLE commission_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  commission_id UUID NOT NULL REFERENCES commissions(id) ON DELETE CASCADE,
  
  -- Adjustment details
  adjustment_type TEXT NOT NULL 
    CHECK (adjustment_type IN ('refund', 'partial_refund', 'reversal', 'manual')),
  adjustment_amount NUMERIC NOT NULL, -- Negative for refunds
  reason TEXT,
  
  -- External reference
  external_refund_id TEXT, -- Stripe refund_id, etc.
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id), -- NULL for system-generated
  
  -- Indexes
  CONSTRAINT adjustments_commission_idx ON commission_adjustments(commission_id)
);
```

**Key Design Decisions**:
- Separate table: Preserves audit trail without modifying commission history
- Supports partial refunds: `adjustment_amount` can be less than commission
- Links to external refunds: Idempotent refund processing

---

## Step-by-Step Flows

### Flow 1: Click Tracking

**Trigger**: User clicks affiliate tracking link `/go/{affiliateId}/{vendorId}`

**Steps**:

1. **Validate Request**
   - Verify affiliate exists and is active
   - Verify vendor exists and `is_active = true`
   - Check if affiliate is enrolled in vendor's program

2. **Create Referral Session**
   ```sql
   INSERT INTO referral_sessions (
     affiliate_id,
     vendor_id,
     session_token, -- UUID v4 generated server-side
     ip_address,
     user_agent,
     referrer_url,
     landing_url,
     expires_at -- now() + vendor.cookie_duration days
   ) VALUES (...)
   ```

3. **Return Session Token to Client**
   - Set cookie: `vouchfor_session={session_token}` (HttpOnly, Secure, SameSite=Lax)
   - Redirect to `vendor.destination_url?session={session_token}`
   - **Do NOT pass affiliate_id in URL** (privacy + security)

4. **Client-Side Storage** (tracker.js)
   - Read `session` parameter from URL
   - Store in localStorage: `vouchfor_session = {token, expires_at}`
   - Store in cookie (fallback if localStorage fails)

**Why This Design**:
- Session token is opaque (doesn't reveal affiliate_id)
- Expiry is enforced at database level
- Cookie + localStorage provides redundancy
- No commission created yet (just tracking)

---

### Flow 2: Conversion Event (Server-Side)

**Trigger**: Payment webhook from Stripe/PayPal, or manual entry

**Steps**:

1. **Idempotency Check**
   ```sql
   SELECT id FROM conversions 
   WHERE external_id = $1 AND external_source = $2
   ```
   - If exists: Return existing conversion (idempotent)
   - If not: Continue

2. **Create Conversion Record**
   ```sql
   INSERT INTO conversions (
     external_id,
     external_source,
     vendor_id,
     amount,
     currency,
     customer_email,
     occurred_at,
     status
   ) VALUES (...)
   RETURNING id
   ```

3. **Trigger Attribution Logic** (async)
   - Queue job or call attribution function
   - Do NOT block webhook response

**Why This Design**:
- Webhook must respond quickly (200 OK)
- Attribution can be async (eventual consistency)
- Idempotency prevents duplicate commissions

---

### Flow 3: Attribution Resolution

**Trigger**: After conversion is created (async job or function)

**Steps**:

1. **Find Valid Sessions**
   ```sql
   SELECT * FROM referral_sessions
   WHERE vendor_id = $vendor_id
     AND is_active = true
     AND expires_at > $conversion_occurred_at
     AND customer_email = $conversion_customer_email -- Optional: email matching
   ORDER BY created_at DESC -- Last-click attribution
   LIMIT 1
   ```

   **Attribution Rules**:
   - Session must be active
   - Session must not be expired at time of conversion
   - Last-click wins (most recent session)
   - Optional: Email matching for higher confidence

2. **If Session Found: Create Attribution**
   ```sql
   BEGIN;
   
   -- Check if conversion already attributed (race condition protection)
   SELECT id FROM attributions WHERE conversion_id = $conversion_id
   FOR UPDATE;
   
   -- If not attributed, create attribution
   INSERT INTO attributions (
     conversion_id,
     session_id,
     attribution_method,
     attribution_window_days
   ) VALUES (...);
   
   -- Update conversion status
   UPDATE conversions 
   SET status = 'attributed',
       attributed_session_id = $session_id,
       attributed_at = now()
   WHERE id = $conversion_id;
   
   COMMIT;
   ```

3. **If No Session Found**
   ```sql
   UPDATE conversions 
   SET status = 'failed'
   WHERE id = $conversion_id;
   ```
   - Conversion recorded but not attributed
   - Can be manually attributed later

4. **Trigger Commission Calculation** (async)
   - Queue job to calculate commission for this attribution

**Why This Design**:
- Explicit attribution table: Auditable decisions
- Race condition protection: `FOR UPDATE` prevents double-attribution
- Failed attributions: Can be manually reviewed
- Attribution window enforced: Expired sessions don't count

---

### Flow 4: Commission Calculation

**Trigger**: After attribution is created

**Steps**:

1. **Fetch Attribution + Conversion + Vendor**
   ```sql
   SELECT 
     a.*,
     c.amount as sale_amount,
     v.commission_type,
     v.commission_value
   FROM attributions a
   JOIN conversions c ON a.conversion_id = c.id
   JOIN vendors v ON c.vendor_id = v.id
   WHERE a.id = $attribution_id
   ```

2. **Calculate Commission**
   ```javascript
   if (vendor.commission_type === 'percentage') {
     commission_amount = sale_amount * (vendor.commission_value / 100);
   } else {
     commission_amount = vendor.commission_value; // fixed
   }
   ```

3. **Create Commission Record**
   ```sql
   INSERT INTO commissions (
     attribution_id,
     conversion_id,
     session_id,
     affiliate_id,
     vendor_id,
     commission_type,
     commission_rate,
     sale_amount,
     commission_amount,
     status
   ) VALUES (...)
   ```

4. **Update Attribution Status** (optional)
   - Mark attribution as "commissioned"

**Why This Design**:
- Commission is calculated once and stored (immutable)
- Links back to attribution and session (full audit trail)
- Status allows workflow (pending → approved → paid)

---

## Tracker.js Redesign

### What It Stores

```javascript
// localStorage structure
{
  vouchfor_session: {
    token: "550e8400-e29b-41d4-a716-446655440000",
    expires_at: "2025-02-15T10:30:00Z",
    vendor_id: "vendor-uuid" // Optional: for multi-vendor sites
  }
}
```

### What It Does

1. **On Page Load**:
   - Check URL for `?session={token}` parameter
   - If found: Store in localStorage + cookie
   - If not found: Check localStorage for existing valid session
   - If expired: Clear storage

2. **On Conversion** (vendor calls):
   ```javascript
   window.vouchfor.track('conversion', {
     session_token: stored_session.token, // From localStorage
     conversion_id: 'stripe_pi_123', // Optional: for client-side tracking
     amount: 99.00
   });
   ```

3. **What Tracker.js Sends to API**:
   ```json
   {
     "event": "conversion_hint",
     "session_token": "...",
     "conversion_id": "stripe_pi_123", // Advisory only
     "amount": 99.00
   }
   ```

**Key Points**:
- Tracker.js sends **advisory** events only
- Server-side webhook is authoritative
- Session token is used, not affiliate_id
- Conversion hints help with debugging but don't create commissions

---

## API Endpoint: `/api/track`

### Responsibilities

1. **Click Tracking** (GET/POST `/api/track/click`)
   - Creates referral session
   - Returns session token
   - Sets cookie

2. **Conversion Hint** (POST `/api/track/conversion`)
   - Accepts advisory conversion events from tracker.js
   - Validates session token
   - Logs for debugging
   - **Does NOT create conversion** (webhook does)
   - Returns: `{ received: true, session_valid: true }`

3. **Session Validation** (GET `/api/track/session/{token}`)
   - Validates session token
   - Returns session metadata (for debugging)
   - Used by vendor sites to check if user has valid session

### Request/Response Examples

**Click Tracking**:
```http
POST /api/track/click
Content-Type: application/json

{
  "affiliate_id": "affiliate-uuid",
  "vendor_id": "vendor-uuid",
  "ip_address": "192.168.1.1",
  "user_agent": "Mozilla/5.0...",
  "referrer_url": "https://affiliate-site.com",
  "landing_url": "https://vendor-site.com/landing"
}

Response:
{
  "session_token": "550e8400-...",
  "expires_at": "2025-02-15T10:30:00Z",
  "redirect_url": "https://vendor-site.com?session=550e8400-..."
}
```

**Conversion Hint**:
```http
POST /api/track/conversion
Content-Type: application/json

{
  "session_token": "550e8400-...",
  "conversion_id": "stripe_pi_123",
  "amount": 99.00
}

Response:
{
  "received": true,
  "session_valid": true,
  "message": "Conversion hint recorded (webhook is authoritative)"
}
```

---

## Fraud Prevention & Duplicate Handling

### 1. Duplicate Sale Prevention

**Problem**: Same payment processed twice (webhook retry, duplicate webhook)

**Solution**: Idempotency via `external_id` + `external_source`
```sql
-- Conversion creation is idempotent
INSERT INTO conversions (external_id, external_source, ...)
ON CONFLICT (external_id, external_source) 
DO NOTHING
RETURNING id;
```

**Result**: Same payment = same conversion record (no duplicate commissions)

---

### 2. Attribution Window Enforcement

**Problem**: Old sessions attributing to new conversions

**Solution**: Database constraint + query filter
```sql
-- Sessions expire at database level
WHERE expires_at > $conversion_occurred_at

-- Attribution window is vendor-specific
expires_at = created_at + vendor.cookie_duration days
```

**Result**: Expired sessions cannot be attributed

---

### 3. Double-Attribution Prevention

**Problem**: Race condition: two conversions attributed to same session

**Solution**: Transaction + `FOR UPDATE` lock
```sql
BEGIN;
SELECT id FROM attributions WHERE conversion_id = $id FOR UPDATE;
-- If exists, skip; if not, create
COMMIT;
```

**Result**: One conversion = one attribution (enforced at database level)

---

### 4. Session Token Validation

**Problem**: Client sends fake session token

**Solution**: Server validates token exists and is active
```sql
SELECT * FROM referral_sessions 
WHERE session_token = $token 
  AND is_active = true 
  AND expires_at > now()
```

**Result**: Only valid, non-expired sessions can be used

---

### 5. Refund Handling

**Problem**: Commission paid, then refund occurs

**Solution**: Commission adjustment records
```sql
-- When refund webhook arrives
INSERT INTO commission_adjustments (
  commission_id,
  adjustment_type,
  adjustment_amount, -- Negative
  external_refund_id
) VALUES (...);

-- Update commission status
UPDATE commissions 
SET status = 'reversed'
WHERE id = $commission_id;
```

**Result**: Full audit trail of refunds, commissions can be reversed

---

## Common Failure Cases

### 1. Conversion Without Session

**Scenario**: User converts but no valid session found

**Handling**:
- Conversion is recorded with `status = 'failed'`
- Can be manually attributed later
- Vendor can review and approve manual attribution

---

### 2. Expired Session

**Scenario**: User clicks link, waits 91 days (beyond 90-day window), then converts

**Handling**:
- Attribution query filters: `expires_at > conversion_occurred_at`
- Expired sessions are excluded
- Conversion marked as `failed` (no attribution)

---

### 3. Multiple Sessions (Same Affiliate)

**Scenario**: User clicks multiple affiliate links before converting

**Handling**:
- Last-click attribution: `ORDER BY created_at DESC LIMIT 1`
- Most recent valid session wins
- Other sessions are ignored (but preserved for audit)

---

### 4. Webhook Retry

**Scenario**: Stripe sends same webhook multiple times

**Handling**:
- Idempotency check: `external_id` + `external_source` unique constraint
- Second webhook returns existing conversion (no duplicate)

---

### 5. Session Token Lost (Client-Side)

**Scenario**: User clears localStorage/cookies

**Handling**:
- Conversion still recorded (webhook is authoritative)
- Attribution fails (no session to attribute to)
- Can be manually attributed if vendor provides customer email

---

### 6. Race Condition: Attribution

**Scenario**: Two conversions processed simultaneously, both try to attribute

**Handling**:
- `FOR UPDATE` lock on attribution check
- First transaction wins, second sees existing attribution and skips

---

## Summary

### Key Design Principles Applied

1. ✅ **Sessions are first-class**: `referral_sessions` table, not just affiliate_id
2. ✅ **Server-side authority**: Conversions from webhooks, not client-side
3. ✅ **Idempotent conversions**: `external_id` + `external_source` unique constraint
4. ✅ **Attribution windows**: Enforced at database level via `expires_at`
5. ✅ **Last-click attribution**: `ORDER BY created_at DESC LIMIT 1`
6. ✅ **Duplicate prevention**: Idempotency + transaction locks
7. ✅ **Refund support**: `commission_adjustments` table
8. ✅ **Audit trail**: Every step is recorded and traceable

### What This Design Achieves

- **Reliability**: Idempotent operations, transaction safety
- **Debuggability**: Full audit trail from click → session → conversion → attribution → commission
- **Dispute-resistant**: Immutable records, explicit attribution decisions
- **Scalable**: Async attribution/commission jobs don't block webhooks
- **Flexible**: Supports manual attribution, adjustments, different attribution methods

---

## Next Steps (Not in Scope)

- Analytics queries (can be built on top of this schema)
- Dashboard views (read-only queries)
- Real-time notifications
- Commission payout automation
- Multi-touch attribution (first-click, linear, etc.)





