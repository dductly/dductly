-- ============================================
-- STRIPE FINANCIAL CONNECTIONS — TRANSACTION SYNC
-- ============================================
-- Stores synced bank transactions from Stripe Financial Connections API
-- (see https://docs.stripe.com/financial-connections/transactions).
-- Populated when Stripe sends financial_connections.account.refreshed_transactions
-- (your Node webhook and/or Supabase `stripe-webhook` Edge Function — same DB writes).

-- Where the row was ingested from (extend enum later if you add more sources).
DO $$ BEGIN
  CREATE TYPE public.fc_transaction_ledger_source AS ENUM ('stripe_financial_connections');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Per-account cursor for incremental transaction_refresh[after] pulls
CREATE TABLE IF NOT EXISTS public.financial_connections_account_sync (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_fc_account_id TEXT NOT NULL,
  last_transaction_refresh_id TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, stripe_fc_account_id)
);

ALTER TABLE public.financial_connections_account_sync ENABLE ROW LEVEL SECURITY;

-- Users can read their own sync rows (optional; mostly for debugging)
CREATE POLICY "Users can view own fc sync"
  ON public.financial_connections_account_sync
  FOR SELECT
  USING (auth.uid() = user_id);

-- Synced transactions (Stripe transaction id = fctxn_...).
-- Unlinking a bank in the app calls Stripe disconnect only — we do NOT delete historical rows here;
-- ingestion stops because sync skips disconnected accounts.
CREATE TABLE IF NOT EXISTS public.financial_connection_transactions (
  stripe_transaction_id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_fc_account_id TEXT NOT NULL,
  amount BIGINT NOT NULL,
  currency TEXT NOT NULL,
  description TEXT,
  status TEXT,
  transacted_at TIMESTAMP WITH TIME ZONE,
  posted_at TIMESTAMP WITH TIME ZONE,
  stripe_transaction_refresh_id TEXT,
  ledger_source public.fc_transaction_ledger_source NOT NULL DEFAULT 'stripe_financial_connections',
  linked_account_label TEXT,
  raw JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fc_tx_user_transacted
  ON public.financial_connection_transactions (user_id, transacted_at DESC NULLS LAST);

ALTER TABLE public.financial_connection_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own fc transactions"
  ON public.financial_connection_transactions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Inserts/updates come from service role (webhook / backend) only — no user INSERT policy

GRANT SELECT ON public.financial_connections_account_sync TO authenticated;
GRANT SELECT ON public.financial_connection_transactions TO authenticated;
