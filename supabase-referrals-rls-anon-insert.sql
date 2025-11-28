------------------------------------------------------------
-- RLS Policy: Allow Anonymous Inserts to Referrals Table
------------------------------------------------------------
-- This policy allows public/anonymous users to insert referral clicks
-- while still validating that affiliate_id and vendor_id are valid UUIDs
-- and exist in the database

-- Drop existing policy if it exists (we'll replace it)
DROP POLICY IF EXISTS "Allow anonymous referral click inserts" ON referrals;

-- Create new policy that allows anonymous inserts
-- This policy checks that:
-- 1. The affiliate_id exists in auth.users
-- 2. The vendor_id exists in vendors table and is active
-- 3. The status is 'click' (for anonymous inserts, we only allow clicks)
CREATE POLICY "Allow anonymous referral click inserts"
  ON referrals
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    -- Validate affiliate exists
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = referrals.affiliate_id
    )
    AND
    -- Validate vendor exists and is active
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = referrals.vendor_id
      AND vendors.is_active = true
    )
    AND
    -- Only allow 'click' status for anonymous inserts (conversions require auth)
    referrals.status = 'click'
    AND
    -- Ensure commission_amount is 0 for clicks
    (COALESCE(referrals.commission_amount::numeric, 0) = 0)
  );

-- Note: The existing policy "Affiliates can insert own referrals" will still work
-- for authenticated users inserting their own referrals. This new policy
-- specifically allows anonymous users to insert clicks.

