-- Add manual_arrangement_details column to vendors table
ALTER TABLE vendors 
ADD COLUMN IF NOT EXISTS manual_arrangement_details TEXT;

-- Add comment for clarity
COMMENT ON COLUMN vendors.manual_arrangement_details IS 'Details about manual payout arrangement when payout_method is "other"';

