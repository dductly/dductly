-- Profile subscription label (e.g. free_for_life for founding users).
-- Safe to run on existing databases that already have public.profiles.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription TEXT;
