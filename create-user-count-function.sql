-- ============================================
-- Database Function for User Count
-- ============================================
-- This is the recommended Supabase approach using SECURITY DEFINER
-- The function can be called with the anon key and returns only the count
-- No service role key required!
-- 
-- This function counts from auth.users (which always exists)
-- If you have a profiles table, you can change it to count from there instead

-- Create a function that returns the user count
CREATE OR REPLACE FUNCTION public.get_user_count()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Count from auth.users (always exists in Supabase)
  -- If you prefer to count from profiles table, change this to:
  -- RETURN (SELECT COUNT(*) FROM public.profiles);
  RETURN (SELECT COUNT(*) FROM auth.users);
END;
$$;

-- Grant execute permission to everyone (including anonymous users)
GRANT EXECUTE ON FUNCTION public.get_user_count() TO anon, authenticated;

-- ============================================
-- Usage:
-- ============================================
-- The backend already uses this function via:
-- const { data, error } = await supabase.rpc('get_user_count');
-- 
-- Run this SQL in your Supabase SQL Editor to create the function.
