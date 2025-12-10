-- Add public_key column to vendors table for destination tracking
ALTER TABLE vendors 
ADD COLUMN IF NOT EXISTS public_key TEXT;

-- Generate public keys for existing vendors (optional - can be done via application)
-- UPDATE vendors SET public_key = encode(gen_random_bytes(16), 'hex') WHERE public_key IS NULL;

-- Create index on public_key for fast lookups
CREATE INDEX IF NOT EXISTS idx_vendors_public_key ON vendors(public_key);

-- Add comment for clarity
COMMENT ON COLUMN vendors.public_key IS 'Public key for destination tracking API authentication';


