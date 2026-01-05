-- ============================================================================
-- Affiliate Tracking & Attribution System - Database Schema
-- ============================================================================
-- This schema implements a session-based attribution system with idempotent
-- conversions and downstream commission calculation.
--
-- Key Principles:
-- 1. Clicks create referral_sessions (not referrals/commissions)
-- 2. Attribution resolved at conversion time from sessions
-- 3. Conversions are idempotent (transaction ID based)
-- 4. Commissions calculated downstream from conversions
-- ============================================================================

-- ============================================================================
-- 1. REFERRAL_SESSIONS
-- ============================================================================
-- Tracks click events and maintains attribution windows.
-- Each click creates a session with an expiry based on vendor's cookie_duration.

CREATE TABLE IF NOT EXISTS referral_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Attribution
  affiliate_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  
  -- Session metadata
  session_token TEXT NOT NULL UNIQUE, -- Client-facing identifier (UUID v4)
  ip_address INET,
  user_agent TEXT,
  referer_url TEXT,
  
  -- Attribution window
  expires_at TIMESTAMPTZ NOT NULL, -- Based on vendor's cookie_duration
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true, -- Can be invalidated for fraud/disputes
  
  -- Constraints
  CONSTRAINT referral_sessions_token_not_empty CHECK (session_token != '')
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_referral_sessions_token 
  ON referral_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_referral_sessions_affiliate 
  ON referral_sessions(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_referral_sessions_vendor 
  ON referral_sessions(vendor_id);
CREATE INDEX IF NOT EXISTS idx_referral_sessions_active_expires 
  ON referral_sessions(is_active, expires_at) 
  WHERE is_active = true;

-- Index for last-click attribution queries
CREATE INDEX IF NOT EXISTS idx_referral_sessions_affiliate_vendor_created 
  ON referral_sessions(affiliate_id, vendor_id, created_at DESC);

-- ============================================================================
-- 2. CONVERSIONS
-- ============================================================================
-- Tracks conversion events (sales) with idempotency.
-- Attribution is resolved from referral_session at conversion time.

CREATE TABLE IF NOT EXISTS conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Attribution (resolved at conversion time - nullable until attribution)
  referral_session_id UUID REFERENCES referral_sessions(id) ON DELETE RESTRICT,
  affiliate_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  
  -- Idempotency
  external_transaction_id TEXT NOT NULL, -- From payment processor (Stripe, PayPal)
  idempotency_key TEXT NOT NULL UNIQUE, -- SHA256(external_transaction_id || vendor_id)
  
  -- Conversion data
  amount NUMERIC NOT NULL CHECK (amount >= 0), -- Sale amount (for commission calculation)
  currency TEXT NOT NULL DEFAULT 'USD',
  metadata JSONB DEFAULT '{}', -- Additional data (customer email, product info, etc.)
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'confirmed', 'failed', 'refunded', 'disputed')),
  
  -- Timestamps
  converted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT conversions_transaction_id_not_empty CHECK (external_transaction_id != ''),
  CONSTRAINT conversions_idempotency_key_not_empty CHECK (idempotency_key != ''),
  CONSTRAINT conversions_vendor_transaction_unique 
    UNIQUE (vendor_id, external_transaction_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_conversions_referral_session 
  ON conversions(referral_session_id);
CREATE INDEX IF NOT EXISTS idx_conversions_affiliate 
  ON conversions(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_conversions_vendor 
  ON conversions(vendor_id);
CREATE INDEX IF NOT EXISTS idx_conversions_status 
  ON conversions(status);
CREATE INDEX IF NOT EXISTS idx_conversions_idempotency 
  ON conversions(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_conversions_external_transaction 
  ON conversions(external_transaction_id);

-- ============================================================================
-- 3. COMMISSIONS
-- ============================================================================
-- Calculated commissions from conversions.
-- Created downstream from conversions, not from clicks.

CREATE TABLE IF NOT EXISTS commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Source
  conversion_id UUID NOT NULL REFERENCES conversions(id) ON DELETE RESTRICT,
  affiliate_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  
  -- Commission calculation (snapshots at conversion time)
  sale_amount NUMERIC NOT NULL CHECK (sale_amount >= 0), -- Snapshot of conversion.amount
  commission_type TEXT NOT NULL CHECK (commission_type IN ('percentage', 'fixed')),
  commission_rate NUMERIC NOT NULL CHECK (commission_rate >= 0), -- Percentage (0-100) or fixed amount
  commission_amount NUMERIC NOT NULL CHECK (commission_amount >= 0), -- Calculated amount
  
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_commissions_conversion 
  ON commissions(conversion_id);
CREATE INDEX IF NOT EXISTS idx_commissions_affiliate 
  ON commissions(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_commissions_vendor 
  ON commissions(vendor_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status 
  ON commissions(status);

-- ============================================================================
-- 4. CONVERSION_EVENTS (Audit Log)
-- ============================================================================
-- Immutable log of all conversion attempts for debugging and fraud detection.

CREATE TABLE IF NOT EXISTS conversion_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Event data
  session_token TEXT, -- From client
  external_transaction_id TEXT,
  vendor_id UUID REFERENCES vendors(id),
  
  -- Request metadata
  ip_address INET,
  user_agent TEXT,
  request_payload JSONB DEFAULT '{}',
  
  -- Outcome
  status TEXT NOT NULL 
    CHECK (status IN ('success', 'duplicate', 'invalid_session', 'expired', 'error')),
  error_message TEXT,
  conversion_id UUID REFERENCES conversions(id), -- If successful
  
  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_conversion_events_transaction 
  ON conversion_events(external_transaction_id);
CREATE INDEX IF NOT EXISTS idx_conversion_events_session_token 
  ON conversion_events(session_token);
CREATE INDEX IF NOT EXISTS idx_conversion_events_vendor 
  ON conversion_events(vendor_id);
CREATE INDEX IF NOT EXISTS idx_conversion_events_status 
  ON conversion_events(status);
CREATE INDEX IF NOT EXISTS idx_conversion_events_created 
  ON conversion_events(created_at DESC);

-- ============================================================================
-- 5. TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to conversions
DROP TRIGGER IF EXISTS update_conversions_updated_at ON conversions;
CREATE TRIGGER update_conversions_updated_at
  BEFORE UPDATE ON conversions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply to commissions
DROP TRIGGER IF EXISTS update_commissions_updated_at ON commissions;
CREATE TRIGGER update_commissions_updated_at
  BEFORE UPDATE ON commissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 6. HELPER FUNCTIONS
-- ============================================================================

-- Function to generate idempotency key
CREATE OR REPLACE FUNCTION generate_idempotency_key(
  transaction_id TEXT,
  vendor_id UUID
)
RETURNS TEXT AS $$
BEGIN
  RETURN encode(
    digest(transaction_id || '::' || vendor_id::TEXT, 'sha256'),
    'hex'
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to find active referral session for attribution
CREATE OR REPLACE FUNCTION find_active_referral_session(
  p_session_token TEXT
)
RETURNS TABLE (
  id UUID,
  affiliate_id UUID,
  vendor_id UUID,
  expires_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rs.id,
    rs.affiliate_id,
    rs.vendor_id,
    rs.expires_at
  FROM referral_sessions rs
  WHERE rs.session_token = p_session_token
    AND rs.is_active = true
    AND rs.expires_at > now()
  FOR UPDATE; -- Lock row to prevent race conditions
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Referral Sessions
ALTER TABLE referral_sessions ENABLE ROW LEVEL SECURITY;

-- Affiliates can view their own sessions
CREATE POLICY "Affiliates can view own referral sessions"
  ON referral_sessions FOR SELECT
  USING (auth.uid() = affiliate_id);

-- Vendors can view sessions for their programs
CREATE POLICY "Vendors can view referral sessions for their programs"
  ON referral_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = referral_sessions.vendor_id
        AND vendors.user_id = auth.uid()
    )
  );

-- Conversions
ALTER TABLE conversions ENABLE ROW LEVEL SECURITY;

-- Affiliates can view their own conversions
CREATE POLICY "Affiliates can view own conversions"
  ON conversions FOR SELECT
  USING (auth.uid() = affiliate_id);

-- Vendors can view conversions for their programs
CREATE POLICY "Vendors can view conversions for their programs"
  ON conversions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = conversions.vendor_id
        AND vendors.user_id = auth.uid()
    )
  );

-- Commissions
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;

-- Affiliates can view their own commissions
CREATE POLICY "Affiliates can view own commissions"
  ON commissions FOR SELECT
  USING (auth.uid() = affiliate_id);

-- Vendors can view commissions for their programs
CREATE POLICY "Vendors can view commissions for their programs"
  ON commissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = commissions.vendor_id
        AND vendors.user_id = auth.uid()
    )
  );

-- Conversion Events (read-only for debugging)
ALTER TABLE conversion_events ENABLE ROW LEVEL SECURITY;

-- Vendors can view events for their programs
CREATE POLICY "Vendors can view conversion events for their programs"
  ON conversion_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = conversion_events.vendor_id
        AND vendors.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 8. COMMENTS (Documentation)
-- ============================================================================

COMMENT ON TABLE referral_sessions IS 
  'Tracks click events and maintains attribution windows. Each click creates a session with expiry based on vendor cookie_duration.';

COMMENT ON TABLE conversions IS 
  'Tracks conversion events (sales) with idempotency. Attribution resolved from referral_session at conversion time.';

COMMENT ON TABLE commissions IS 
  'Calculated commissions from conversions. Created downstream from conversions, not from clicks.';

COMMENT ON TABLE conversion_events IS 
  'Immutable audit log of all conversion attempts for debugging and fraud detection.';

COMMENT ON COLUMN referral_sessions.session_token IS 
  'Client-facing identifier stored in localStorage. Not the affiliate_id.';

COMMENT ON COLUMN referral_sessions.expires_at IS 
  'Attribution window expiry. Based on vendor.cookie_duration.';

COMMENT ON COLUMN conversions.idempotency_key IS 
  'SHA256 hash of (external_transaction_id || vendor_id) for duplicate prevention.';

COMMENT ON COLUMN conversions.external_transaction_id IS 
  'Transaction ID from payment processor (Stripe, PayPal). Must be unique per vendor.';

COMMENT ON COLUMN commissions.sale_amount IS 
  'Snapshot of conversion.amount at commission calculation time.';

COMMENT ON COLUMN commissions.commission_rate IS 
  'Snapshot of vendor commission settings at conversion time.';
