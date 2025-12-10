-- Function to get user names from auth.users metadata
-- This function allows vendors to get partner names including Google Auth users
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION public.get_user_names(user_ids UUID[])
RETURNS TABLE (
  user_id UUID,
  full_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id as user_id,
    COALESCE(
      p.full_name,
      u.raw_user_meta_data->>'full_name',
      u.raw_user_meta_data->>'name',
      CASE 
        WHEN u.raw_user_meta_data->>'first_name' IS NOT NULL 
        THEN (u.raw_user_meta_data->>'first_name' || ' ' || COALESCE(u.raw_user_meta_data->>'last_name', ''))
        ELSE NULL
      END,
      split_part(u.email, '@', 1) -- Use email prefix as fallback
    ) as full_name
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  WHERE u.id = ANY(user_ids);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_names(UUID[]) TO authenticated;

