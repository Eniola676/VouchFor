-- Create affiliate_payout_details table for storing banking information
CREATE TABLE IF NOT EXISTS affiliate_payout_details (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  bank_name TEXT NOT NULL,
  account_holder_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  swift_bic_code TEXT NOT NULL,
  bank_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index on affiliate_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_affiliate_payout_details_affiliate_id ON affiliate_payout_details(affiliate_id);

-- Create trigger to automatically update updated_at timestamp
CREATE TRIGGER update_affiliate_payout_details_updated_at
  BEFORE UPDATE ON affiliate_payout_details
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE affiliate_payout_details ENABLE ROW LEVEL SECURITY;

-- Policy: Affiliates can view their own payout details
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='Affiliates can view own payout details') THEN
    CREATE POLICY "Affiliates can view own payout details"
      ON affiliate_payout_details FOR SELECT
      USING (auth.uid() = affiliate_id);
  END IF;
END$$;

-- Policy: Affiliates can insert their own payout details
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='Affiliates can insert own payout details') THEN
    CREATE POLICY "Affiliates can insert own payout details"
      ON affiliate_payout_details FOR INSERT
      WITH CHECK (auth.uid() = affiliate_id);
  END IF;
END$$;

-- Policy: Affiliates can update their own payout details
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='Affiliates can update own payout details') THEN
    CREATE POLICY "Affiliates can update own payout details"
      ON affiliate_payout_details FOR UPDATE
      USING (auth.uid() = affiliate_id)
      WITH CHECK (auth.uid() = affiliate_id);
  END IF;
END$$;

-- Policy: Vendors can view payout details of affiliates in their programs
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='Vendors can view affiliate payout details') THEN
    CREATE POLICY "Vendors can view affiliate payout details"
      ON affiliate_payout_details FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM affiliate_programs ap
          INNER JOIN vendors v ON ap.vendor_id = v.id
          WHERE ap.affiliate_id = affiliate_payout_details.affiliate_id
          AND v.user_id = auth.uid()
        )
      );
  END IF;
END$$;

