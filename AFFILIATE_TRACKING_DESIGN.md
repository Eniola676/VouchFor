# Affiliate Tracking & Attribution System Design

## High-Level Architecture

### Core Principles

1. **Session-Based Attribution**: Clicks create referral sessions. Attribution is resolved at conversion time by finding the active session.
2. **Idempotent Conversions**: Conversion events use external transaction IDs to prevent duplicates.
3. **Server-Truth Model**: Client-side events are advisory; server validates and authorizes all state changes.
4. **Separation of Concerns**: 
   - Sessions track clicks and attribution windows
   - Conversions track sales events
   - Commissions are calculated downstream from conversions

### System Components

```
┌─────────────────┐
│  Tracking Link  │ → Creates referral_session
│  (/go/:id/:pid) │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│  Vendor Site    │ → Stores session_id in localStorage
│  (tracker.js)   │ → Sends conversion events
└─────────────────┘
         │
         ▼
┌─────────────────┐
│  /api/track     │ → Validates & creates conversion
│  (Server)       │ → Resolves attribution
└─────────────────┘
         │
         ▼
┌─────────────────┐
│  Commission     │ → Calculated from conversion
│  Calculation    │
└─────────────────┘
```

---

## Database Schema

### 1. `referral_sessions`

**Purpose**: Tracks click events and maintains attribution windows.

```sql
CREATE TABLE referral_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Attribution
  affiliate_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  
  -- Session metadata
  session_token TEXT NOT NULL UNIQUE, -- Client-facing identifier
  ip_address INET,
  user_agent TEXT,
  referer_url TEXT,
  
  -- Attribution window
  expires_at TIMESTAMPTZ NOT NULL, -- Based on vendor's cookie_duration
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true, -- Can be invalidated
  
  -- Indexes
  CONSTRAINT referral_sessions_affiliate_vendor_idx 
    UNIQUE NULLS NOT DISTINCT (affiliate_id, vendor_id, created_at DESC)
);

CREATE INDEX idx_referral_sessions_token ON referral_sessions(session_token);
CREATE INDEX idx_referral_sessions_affiliate ON referral_sessions(affiliate_id);
CREATE INDEX idx_referral_sessions_vendor ON referral_sessions(vendor_id);
CREATE INDEX idx_referral_sessions_active_expires ON referral_sessions(is_active, expires_at) 
  WHERE is_active = true;
```

**Key Design Decisions**:
- `session_token`: Client-facing ID stored in localStorage (not affiliate_id)
- `expires_at`: Attribution window based on vendor's cookie_duration
- Unique constraint on (affiliate_id, vendor_id, created_at) for last-click attribution
- `is_active`: Allows manual invalidation for fraud/disputes

---

### 2. `conversions`

**Purpose**: Tracks conversion events (sales) with idempotency.

```sql
CREATE TABLE conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Attribution (resolved at conversion time)
  referral_session_id UUID NOT NULL REFERENCES referral_sessions(id) ON DELETE RESTRICT,
  affiliate_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  
  -- Idempotency
  external_transaction_id TEXT NOT NULL, -- From payment processor (Stripe, PayPal)
  idempotency_key TEXT NOT NULL UNIQUE, -- SHA256(external_transaction_id + vendor_id)
  
  -- Conversion data
  amount NUMERIC NOT NULL, -- Sale amount (for commission calculation)
  currency TEXT NOT NULL DEFAULT 'USD',
  metadata JSONB, -- Additional data (customer email, product info, etc.)
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'confirmed', 'refunded', 'disputed')),
  
  -- Timestamps
  converted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Indexes
  CONSTRAINT conversions_vendor_transaction_unique 
    UNIQUE (vendor_id, external_transaction_id)
);

CREATE INDEX idx_conversions_referral_session ON conversions(referral_session_id);
CREATE INDEX idx_conversions_affiliate ON conversions(affiliate_id);
CREATE INDEX idx_conversions_vendor ON conversions(vendor_id);
CREATE INDEX idx_conversions_status ON conversions(status);
CREATE INDEX idx_conversions_idempotency ON conversions(idempotency_key);
```

**Key Design Decisions**:
- `external_transaction_id`: From payment processor (prevents duplicates)
- `idempotency_key`: SHA256 hash for fast duplicate detection
- `referral_session_id`: Links conversion to the session that attributed it
- `status`: Supports refund reversal workflow
- Unique constraint on (vendor_id, external_transaction_id) prevents duplicate sales

---

### 3. `commissions`

**Purpose**: Calculated commissions from conversions.

```sql
CREATE TABLE commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Source
  conversion_id UUID NOT NULL REFERENCES conversions(id) ON DELETE RESTRICT,
  affiliate_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  
  -- Commission calculation
  sale_amount NUMERIC NOT NULL, -- Snapshot of conversion.amount
  commission_type TEXT NOT NULL CHECK (commission_type IN ('percentage', 'fixed')),
  commission_rate NUMERIC NOT NULL, -- Percentage (0-100) or fixed amount
  commission_amount NUMERIC NOT NULL, -- Calculated: sale_amount * rate or fixed
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'approved', 'paid', 'reversed')),
  
  -- Payout tracking
  payout_schedule TEXT, -- From vendor settings
  paid_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_commissions_conversion ON commissions(conversion_id);
CREATE INDEX idx_commissions_affiliate ON commissions(affiliate_id);
CREATE INDEX idx_commissions_vendor ON commissions(vendor_id);
CREATE INDEX idx_commissions_status ON commissions(status);
```

**Key Design Decisions**:
- `commission_rate`: Snapshot of vendor settings at conversion time
- `sale_amount`: Snapshot to prevent recalculation issues
- `status`: Separate from conversion status (conversion can be refunded, commission reversed)
- Created downstream from conversion (not from click)

---

### 4. `conversion_events` (Audit Log)

**Purpose**: Immutable log of all conversion attempts (for debugging).

```sql
CREATE TABLE conversion_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Event data
  session_token TEXT, -- From client
  external_transaction_id TEXT,
  vendor_id UUID REFERENCES vendors(id),
  
  -- Request metadata
  ip_address INET,
  user_agent TEXT,
  request_payload JSONB,
  
  -- Outcome
  status TEXT NOT NULL CHECK (status IN ('success', 'duplicate', 'invalid_session', 'expired', 'error')),
  error_message TEXT,
  conversion_id UUID REFERENCES conversions(id), -- If successful
  
  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_conversion_events_transaction ON conversion_events(external_transaction_id);
CREATE INDEX idx_conversion_events_session_token ON conversion_events(session_token);
CREATE INDEX idx_conversion_events_created ON conversion_events(created_at DESC);
```

**Key Design Decisions**:
- Immutable audit log for debugging
- Tracks all attempts, not just successes
- Helps identify fraud patterns

---

## Step-by-Step Flows

### Flow 1: Click → Referral Session Creation

**Trigger**: User clicks tracking link `/go/{affiliateId}/{vendorId}`

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
     session_token, -- Generate UUID v4
     ip_address,
     user_agent,
     referer_url,
     expires_at -- now() + vendor.cookie_duration days
   ) VALUES (...)
   RETURNING session_token;
   ```

3. **Handle Last-Click Attribution**
   - If session exists for (affiliate_id, vendor_id) within attribution window:
     - Mark old session as `is_active = false` (optional, or let expire naturally)
   - New session becomes the active one

4. **Redirect to Vendor Site**
   ```
   destination_url + ?ref_session={session_token}
   ```

**Code Location**: `src/pages/go/TrackingLink.tsx`

**Key Points**:
- Session token is client-facing (not affiliate_id)
- Attribution window set at session creation
- Last-click wins (new session invalidates old ones)

---

### Flow 2: Tracker.js → Session Persistence

**Trigger**: Vendor site loads with `?ref_session={token}`

**tracker.js Responsibilities**:

1. **Extract Session Token**
   ```javascript
   const sessionToken = getUrlParameter('ref_session');
   ```

2. **Store in localStorage**
   ```javascript
   localStorage.setItem('vouchfor_session_token', sessionToken);
   localStorage.setItem('vouchfor_session_expires', expiresTimestamp);
   ```

3. **Validate Expiry on Page Load**
   ```javascript
   if (isExpired(expiresTimestamp)) {
     localStorage.removeItem('vouchfor_session_token');
     return null;
   }
   ```

4. **Expose API**
   ```javascript
   window.vouchfor('track', 'conversion', {
     transaction_id: 'stripe_123',
     amount: 99.00,
     currency: 'USD',
     metadata: { ... }
   });
   ```

**Key Points**:
- Stores session_token (not affiliate_id)
- Validates expiry client-side (server re-validates)
- Idempotent: multiple calls with same transaction_id are safe

---

### Flow 3: Conversion Event → Attribution Resolution

**Trigger**: Vendor calls `window.vouchfor('track', 'conversion', {...})`

**API Endpoint**: `POST /api/track`

**Steps**:

1. **Extract Session Token**
   ```javascript
   const sessionToken = request.body.session_token || 
                       request.headers['x-vouchfor-session'];
   ```

2. **Resolve Attribution (Server-Side)**
   ```sql
   SELECT * FROM referral_sessions
   WHERE session_token = $1
     AND is_active = true
     AND expires_at > now()
   FOR UPDATE; -- Lock row to prevent race conditions
   ```
   
   If not found:
   - Return 404: "Invalid or expired session"
   - Log to `conversion_events` with status 'invalid_session'

3. **Check Idempotency**
   ```sql
   SELECT id FROM conversions
   WHERE idempotency_key = $1; -- SHA256(transaction_id + vendor_id)
   ```
   
   If exists:
   - Return 200 with existing conversion_id
   - Log to `conversion_events` with status 'duplicate'

4. **Create Conversion**
   ```sql
   INSERT INTO conversions (
     referral_session_id,
     affiliate_id, -- From session
     vendor_id, -- From session
     external_transaction_id,
     idempotency_key,
     amount,
     currency,
     metadata,
     status
   ) VALUES (...)
   RETURNING id;
   ```

5. **Trigger Commission Calculation** (Async)
   - Fetch vendor commission settings
   - Calculate commission amount
   - Insert into `commissions` table

6. **Log Event**
   ```sql
   INSERT INTO conversion_events (
     session_token,
     external_transaction_id,
     vendor_id,
     status,
     conversion_id
   ) VALUES (...);
   ```

**Response**:
```json
{
  "success": true,
  "conversion_id": "uuid",
  "status": "pending"
}
```

**Key Points**:
- Attribution resolved server-side from session_token
- Idempotency prevents duplicate conversions
- Commission calculation is async (downstream)

---

### Flow 4: Commission Calculation

**Trigger**: After conversion is created (async job or trigger)

**Steps**:

1. **Fetch Vendor Settings**
   ```sql
   SELECT commission_type, commission_value, cookie_duration
   FROM vendors
   WHERE id = $1;
   ```

2. **Calculate Commission**
   ```javascript
   if (commission_type === 'percentage') {
     commission_amount = sale_amount * (commission_value / 100);
   } else {
     commission_amount = commission_value; // Fixed
   }
   ```

3. **Create Commission Record**
   ```sql
   INSERT INTO commissions (
     conversion_id,
     affiliate_id,
     vendor_id,
     sale_amount,
     commission_type,
     commission_rate,
     commission_amount,
     status
   ) VALUES (...);
   ```

4. **Update Conversion Status** (Optional)
   ```sql
   UPDATE conversions
   SET status = 'confirmed'
   WHERE id = $1;
   ```

**Key Points**:
- Commission is calculated from conversion (not click)
- Snapshot vendor settings at calculation time
- Status workflow: pending → approved → paid

---

## Failure Cases & Handling

### Case 1: Duplicate Conversion Attempt

**Scenario**: Vendor calls tracker.js twice with same transaction_id.

**Handling**:
- Idempotency key check finds existing conversion
- Return existing conversion_id (200 OK)
- Log as 'duplicate' in conversion_events
- **Result**: No duplicate commission created

---

### Case 2: Expired Session

**Scenario**: User clicks link, waits 91 days (attribution window = 90 days), then purchases.

**Handling**:
- Session lookup finds `expires_at < now()`
- Return 404: "Attribution window expired"
- Log as 'expired' in conversion_events
- **Result**: No attribution, no commission

---

### Case 3: Invalid Session Token

**Scenario**: Client sends malformed or non-existent session_token.

**Handling**:
- Session lookup returns no rows
- Return 404: "Invalid session"
- Log as 'invalid_session' in conversion_events
- **Result**: No attribution, no commission

---

### Case 4: Refund Reversal

**Scenario**: Customer requests refund after commission paid.

**Handling**:
```sql
-- 1. Mark conversion as refunded
UPDATE conversions
SET status = 'refunded', updated_at = now()
WHERE external_transaction_id = $1;

-- 2. Reverse commission
UPDATE commissions
SET status = 'reversed', updated_at = now()
WHERE conversion_id IN (
  SELECT id FROM conversions 
  WHERE external_transaction_id = $1
);
```

**Result**: Commission reversed, can be deducted from future payouts

---

### Case 5: Race Condition (Multiple Conversions)

**Scenario**: Two conversion events arrive simultaneously for same transaction.

**Handling**:
- Use `FOR UPDATE` lock on idempotency_key check
- First request creates conversion
- Second request sees existing idempotency_key, returns existing conversion_id
- **Result**: Only one conversion created

---

### Case 6: Session Token Manipulation

**Scenario**: Attacker tries to use someone else's session_token.

**Handling**:
- Server validates session_token exists and is active
- Server validates session belongs to correct vendor
- If mismatch, return 403: "Invalid session for vendor"
- **Result**: Fraud attempt logged, no attribution

---

## Fraud Prevention Mechanisms

### 1. Server-Side Attribution Resolution
- Client sends session_token, server resolves affiliate_id
- Prevents client-side manipulation

### 2. Idempotency Keys
- SHA256(external_transaction_id + vendor_id)
- Prevents duplicate conversions from same sale

### 3. Attribution Window Enforcement
- Sessions expire based on vendor's cookie_duration
- Server checks `expires_at > now()` on every conversion

### 4. Audit Logging
- All conversion attempts logged to `conversion_events`
- Helps identify fraud patterns

### 5. Transaction ID Validation
- External transaction IDs must be unique per vendor
- Prevents fake conversions

---

## Implementation Notes

### Tracker.js Changes

```javascript
// OLD (current)
localStorage.setItem('vouchfor_ref_id', affiliateId);

// NEW (proposed)
localStorage.setItem('vouchfor_session_token', sessionToken);
localStorage.setItem('vouchfor_session_expires', expiresAt);
```

### API Endpoint Changes

```javascript
// OLD (current)
POST /api/track
{
  "event": "sale",
  "ref_id": "affiliate-uuid",
  "program_id": "vendor-uuid"
}

// NEW (proposed)
POST /api/track
{
  "event": "conversion",
  "session_token": "session-uuid",
  "transaction_id": "stripe_123",
  "amount": 99.00,
  "currency": "USD",
  "metadata": { ... }
}
```

### Tracking Link Changes

```javascript
// OLD (current)
Redirect: destination_url + ?ref=affiliateId

// NEW (proposed)
Redirect: destination_url + ?ref_session=sessionToken
```

---

## Summary

This design provides:

✅ **Session-based attribution** (not affiliate ID based)  
✅ **Idempotent conversions** (transaction ID based)  
✅ **Server-truth model** (client is advisory)  
✅ **Attribution window enforcement** (expires_at)  
✅ **Duplicate prevention** (idempotency keys)  
✅ **Refund support** (status workflow)  
✅ **Fraud resistance** (server-side validation)  
✅ **Debuggability** (audit logs)

The system is designed for correctness first, with clear separation between sessions, conversions, and commissions.
