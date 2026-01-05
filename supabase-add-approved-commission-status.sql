-- Add 'approved_commission' status to referrals table
-- This migration updates the CHECK constraint to include the new status

-- First, drop the existing constraint
ALTER TABLE referrals DROP CONSTRAINT IF EXISTS referrals_status_check;

-- Add the new constraint with all statuses including 'approved_commission'
ALTER TABLE referrals 
ADD CONSTRAINT referrals_status_check 
CHECK (status IN ('click', 'signup', 'pending_commission', 'approved_commission', 'paid_commission'));

-- Optional: Add a comment to document the status flow
COMMENT ON COLUMN referrals.status IS 'Status flow: click -> signup -> pending_commission -> approved_commission -> paid_commission';





