-- ============================================
-- INCOME TABLE SETUP
-- ============================================
-- This script creates the income table similar to expenses table

-- ============================================
-- 1. CREATE INCOME TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.income (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  income_date DATE NOT NULL,
  category TEXT NOT NULL,
  source TEXT NOT NULL,
  description TEXT,
  payment_method TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.income ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. CREATE RLS POLICIES
-- ============================================
-- Users can view their own income
CREATE POLICY "Users can view own income"
  ON public.income
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own income
CREATE POLICY "Users can insert own income"
  ON public.income
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own income
CREATE POLICY "Users can update own income"
  ON public.income
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own income
CREATE POLICY "Users can delete own income"
  ON public.income
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 4. ADD UPDATED_AT TRIGGER
-- ============================================
CREATE TRIGGER on_income_updated
  BEFORE UPDATE ON public.income
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 5. GRANT PERMISSIONS
-- ============================================
GRANT ALL ON public.income TO authenticated;
