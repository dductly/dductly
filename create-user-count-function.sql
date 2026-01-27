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
  -- Count from profiles table (more reliable - only counts users with profiles)
  -- This ensures we're counting actual signed-up users, not just auth records
  RETURN (SELECT COUNT(*) FROM public.profiles);
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
-- IMPORTANT: Run this SQL in your Supabase SQL Editor to create the function.
-- The function uses SECURITY DEFINER which allows it to bypass RLS policies
-- and count profiles even for anonymous users.
