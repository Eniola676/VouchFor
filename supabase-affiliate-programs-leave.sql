-- Policy: Affiliates can delete their own program memberships (opt out)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='Affiliates can delete own program memberships') THEN
    CREATE POLICY "Affiliates can delete own program memberships"
      ON affiliate_programs FOR DELETE
      USING (auth.uid() = affiliate_id);
  END IF;
END$$;









