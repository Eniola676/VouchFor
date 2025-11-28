------------------------------------------------------------
-- Function to Record Click (Bypasses RLS for public tracking links)
------------------------------------------------------------
-- This function allows recording referral clicks from public tracking links
-- without requiring authentication, similar to join_program function

CREATE OR REPLACE FUNCTION public.record_referral_click(
  p_affiliate_id UUID,
  p_vendor_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_referral_id UUID;
BEGIN
  -- Validate that vendor exists and is active
  IF NOT EXISTS (
    SELECT 1 FROM vendors 
    WHERE id = p_vendor_id 
    AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Vendor program not found or inactive';
  END IF;

  -- Validate that affiliate exists
  IF NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = p_affiliate_id
  ) THEN
    RAISE EXCEPTION 'Affiliate not found';
  END IF;

  -- Insert referral click record
  -- commission_amount is set to 0 for clicks (will be calculated later for conversions)
  INSERT INTO referrals (affiliate_id, vendor_id, status, commission_amount)
  VALUES (p_affiliate_id, p_vendor_id, 'click', 0)
  RETURNING id INTO v_referral_id;

  RETURN v_referral_id;
END;
$$;

