-- ============================================
-- DDUCTLY DATABASE SETUP
-- ============================================
-- This script creates the profiles table and sets up automatic
-- profile creation when a new user signs up via Supabase Auth

-- ============================================
-- 1. CREATE PROFILES TABLE
-- ============================================
-- This table stores additional user information beyond what's in auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. CREATE RLS POLICIES
-- ============================================
-- Users can view their own profile
CREATE POLICY "Users can view own profile" 
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile (for manual inserts)
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================
-- 4. CREATE FUNCTION TO HANDLE NEW USER
-- ============================================
-- This function will be triggered when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. CREATE TRIGGER
-- ============================================
-- Drop the trigger if it exists (for re-running this script)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger that fires when a new user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 6. CREATE FUNCTION TO UPDATE TIMESTAMP
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. CREATE TRIGGER FOR UPDATED_AT
-- ============================================
DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles;

CREATE TRIGGER on_profile_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 8. CREATE DONATIONS TABLE (OPTIONAL)
-- ============================================
-- Uncomment if you want to store donation data
/*
CREATE TABLE IF NOT EXISTS public.donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  date DATE NOT NULL,
  category TEXT,
  notes TEXT,
  receipt_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on donations
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- Users can view their own donations
CREATE POLICY "Users can view own donations"
  ON public.donations
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own donations
CREATE POLICY "Users can insert own donations"
  ON public.donations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own donations
CREATE POLICY "Users can update own donations"
  ON public.donations
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own donations
CREATE POLICY "Users can delete own donations"
  ON public.donations
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add updated_at trigger to donations
CREATE TRIGGER on_donation_updated
  BEFORE UPDATE ON public.donations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
*/

-- ============================================
-- 9. GRANT PERMISSIONS (if needed)
-- ============================================
-- Grant access to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
-- GRANT ALL ON public.donations TO authenticated; -- Uncomment if using donations table

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these queries after executing the script to verify setup:

-- Check if profiles table exists
-- SELECT * FROM information_schema.tables WHERE table_name = 'profiles';

-- Check if trigger exists
-- SELECT * FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created';

-- View all profiles (after creating some users)
-- SELECT * FROM public.profiles;

-- Check RLS policies
-- SELECT * FROM pg_policies WHERE tablename = 'profiles';

