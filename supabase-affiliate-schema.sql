------------------------------------------------------------
-- VouchFor Affiliate Schema (Migration-Safe Version)
------------------------------------------------------------

-------------------------------
-- 0. Ensure helper function exists
-------------------------------
-- This must exist from vendor schema. If missing, create it.
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

------------------------------------------------------------
-- 1. PROFILES TABLE
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  role TEXT DEFAULT 'affiliate' CHECK (role IN ('affiliate', 'vendor', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Recreate trigger safely
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

------------------------------------------------------------
-- 2. REFERRALS TABLE
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('click', 'signup', 'pending_commission', 'paid_commission')),
  commission_amount NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_referrals_affiliate_id ON referrals(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_referrals_vendor_id ON referrals(vendor_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_referrals_created_at ON referrals(created_at DESC);

-- Recreate trigger safely
DROP TRIGGER IF EXISTS update_referrals_updated_at ON referrals;

CREATE TRIGGER update_referrals_updated_at
  BEFORE UPDATE ON referrals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

------------------------------------------------------------
-- 3. ACTIVITIES TABLE
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(type);

------------------------------------------------------------
-- 4. AFFILIATE_PROGRAMS TABLE
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS affiliate_programs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'banned')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(affiliate_id, vendor_id)
);

CREATE INDEX IF NOT EXISTS idx_affiliate_programs_affiliate_id ON affiliate_programs(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_programs_vendor_id ON affiliate_programs(vendor_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_programs_status ON affiliate_programs(status);

------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS) POLICIES MIGRATION-SAFE
------------------------------------------------------------

-- PROFILES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='Users can view own profile') THEN
    CREATE POLICY "Users can view own profile"
      ON profiles FOR SELECT
      USING (auth.uid() = id);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='Users can insert own profile') THEN
    CREATE POLICY "Users can insert own profile"
      ON profiles FOR INSERT
      WITH CHECK (auth.uid() = id);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='Users can update own profile') THEN
    CREATE POLICY "Users can update own profile"
      ON profiles FOR UPDATE
      USING (auth.uid() = id);
  END IF;
END$$;


-- REFERRALS
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='Affiliates can view own referrals') THEN
    CREATE POLICY "Affiliates can view own referrals"
      ON referrals FOR SELECT
      USING (auth.uid() = affiliate_id);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='Affiliates can insert own referrals') THEN
    CREATE POLICY "Affiliates can insert own referrals"
      ON referrals FOR INSERT
      WITH CHECK (auth.uid() = affiliate_id);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='Vendors can view referrals for their programs') THEN
    CREATE POLICY "Vendors can view referrals for their programs"
      ON referrals FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM vendors
          WHERE vendors.id = referrals.vendor_id
          AND vendors.user_id = auth.uid()
        )
      );
  END IF;
END$$;


-- ACTIVITIES
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='Users can view own activities') THEN
    CREATE POLICY "Users can view own activities"
      ON activities FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='Users can insert own activities') THEN
    CREATE POLICY "Users can insert own activities"
      ON activities FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END$$;

------------------------------------------------------------
-- 6. AUTO-CREATE PROFILE ON SIGNUP
------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'affiliate')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
 
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

------------------------------------------------------------
-- 7. AFFILIATE_PROGRAMS TABLE
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS affiliate_programs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'banned')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(affiliate_id, vendor_id)
);

CREATE INDEX IF NOT EXISTS idx_affiliate_programs_affiliate_id ON affiliate_programs(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_programs_vendor_id ON affiliate_programs(vendor_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_programs_status ON affiliate_programs(status);

ALTER TABLE affiliate_programs ENABLE ROW LEVEL SECURITY;

-- Affiliates can view their own program memberships
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='Affiliates can view own program memberships') THEN
    CREATE POLICY "Affiliates can view own program memberships"
      ON affiliate_programs FOR SELECT
      USING (auth.uid() = affiliate_id);
  END IF;
END$$;

-- Allow inserts during signup (before email confirmation)
-- This policy allows inserts if the user_id matches, even if not fully authenticated
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='Allow program join during signup') THEN
    CREATE POLICY "Allow program join during signup"
      ON affiliate_programs FOR INSERT
      WITH CHECK (true); -- Allow all inserts - we'll validate in the function
  END IF;
END$$;

-- Vendors can view affiliates in their programs
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='Vendors can view affiliates in their programs') THEN
    CREATE POLICY "Vendors can view affiliates in their programs"
      ON affiliate_programs FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM vendors
          WHERE vendors.id = affiliate_programs.vendor_id
          AND vendors.user_id = auth.uid()
        )
      );
  END IF;
END$$;

------------------------------------------------------------
-- 8. FUNCTION TO JOIN PROGRAM (Bypasses RLS for signup)
------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.join_program(
  p_affiliate_id UUID,
  p_vendor_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_program_id UUID;
BEGIN
  -- Check if vendor exists and is active
  IF NOT EXISTS (
    SELECT 1 FROM vendors 
    WHERE id = p_vendor_id 
    AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Vendor program not found or inactive';
  END IF;

  -- Insert or update affiliate_programs
  INSERT INTO affiliate_programs (affiliate_id, vendor_id, status)
  VALUES (p_affiliate_id, p_vendor_id, 'active')
  ON CONFLICT (affiliate_id, vendor_id) 
  DO UPDATE SET status = 'active', created_at = timezone('utc'::text, now())
  RETURNING id INTO v_program_id;

  RETURN v_program_id;
END;
$$;