-- VouchFor Vendors Table Schema
-- Run this SQL in your Supabase SQL Editor to create the vendors table

-- Create the vendors table
CREATE TABLE IF NOT EXISTS vendors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Vendor identification
  vendor_slug TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Link to authenticated user (nullable for now)
  
  -- Form fields from OfferSetupForm
  destination_url TEXT NOT NULL,
  program_name TEXT NOT NULL,
  commission_type TEXT NOT NULL CHECK (commission_type IN ('percentage', 'fixed')),
  commission_value TEXT NOT NULL,
  cookie_duration INTEGER NOT NULL DEFAULT 60,
  cooling_off_period INTEGER NOT NULL DEFAULT 30,
  payout_schedule TEXT NOT NULL CHECK (payout_schedule IN ('monthly_1st', 'net_15', 'net_30', 'upon_request')),
  payout_method TEXT NOT NULL CHECK (payout_method IN ('bank_transfer', 'other')),
  manual_arrangement_details TEXT, -- Details about manual payout arrangement when payout_method is "other"
  minimum_payout_threshold TEXT NOT NULL DEFAULT '10000',
  transaction_fees TEXT NOT NULL CHECK (transaction_fees IN ('vendor', 'affiliate')),
  
  -- Additional fields from calculator
  service_price TEXT,
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  published_at TIMESTAMP WITH TIME ZONE
);

-- Create an index on vendor_slug for fast lookups
CREATE INDEX IF NOT EXISTS idx_vendors_slug ON vendors(vendor_slug);

-- Create an index on user_id for user-specific queries
CREATE INDEX IF NOT EXISTS idx_vendors_user_id ON vendors(user_id);

-- Create an index on is_active for filtering active vendors
CREATE INDEX IF NOT EXISTS idx_vendors_is_active ON vendors(is_active);

-- Create a function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update updated_at
CREATE TRIGGER update_vendors_updated_at
  BEFORE UPDATE ON vendors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read all active vendors (for public recruitment pages)
CREATE POLICY "Public vendors are viewable by everyone"
  ON vendors FOR SELECT
  USING (is_active = true);

-- Policy: Allow inserts without authentication (for MVP - can restrict later)
CREATE POLICY "Anyone can insert vendors"
  ON vendors FOR INSERT
  WITH CHECK (true);

-- Policy: Users can update their own vendors
CREATE POLICY "Users can update their own vendors"
  ON vendors FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own vendors
CREATE POLICY "Users can delete their own vendors"
  ON vendors FOR DELETE
  USING (auth.uid() = user_id);

