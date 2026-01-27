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
  -- Count from auth.users (built-in Supabase auth table)
  -- This counts all users who have signed up
  -- If you want to count only verified users, uncomment the WHERE clause below
  RETURN (SELECT COUNT(*) FROM auth.users);
  -- To count only verified/confirmed users, use this instead:
  -- RETURN (SELECT COUNT(*) FROM auth.users WHERE email_confirmed_at IS NOT NULL);
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
