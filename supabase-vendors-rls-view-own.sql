-- RLS Policy: Allow vendors to view their own vendors
-- This policy allows authenticated users to SELECT their own vendors
-- regardless of the is_active status

-- Drop the policy if it exists (to allow re-running this script)
DROP POLICY IF EXISTS "Vendors can view their own vendors" ON vendors;

-- Create the policy
CREATE POLICY "Vendors can view their own vendors"
  ON vendors FOR SELECT
  USING (auth.uid() = user_id);

-- Note: This policy works alongside the existing "Public vendors are viewable by everyone" policy
-- Users can now:
-- 1. View all active vendors (public policy)
-- 2. View their own vendors regardless of active status (this policy)

