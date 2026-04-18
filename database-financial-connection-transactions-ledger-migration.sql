-- ============================================
-- MIGRATION: FC transaction ledger source + stored bank label
-- ============================================
-- Run once on databases that already have `financial_connection_transactions`
-- without `ledger_source` / `linked_account_label`. New installs can use the
-- updated `database-financial-connection-transactions.sql` instead.

DO $$ BEGIN
  CREATE TYPE public.fc_transaction_ledger_source AS ENUM ('stripe_financial_connections');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.financial_connection_transactions
  ADD COLUMN IF NOT EXISTS ledger_source public.fc_transaction_ledger_source
  NOT NULL DEFAULT 'stripe_financial_connections';

ALTER TABLE public.financial_connection_transactions
  ADD COLUMN IF NOT EXISTS linked_account_label TEXT;

COMMENT ON COLUMN public.financial_connection_transactions.ledger_source IS
  'Ingestion source; stripe_financial_connections = Stripe Financial Connections API.';
COMMENT ON COLUMN public.financial_connection_transactions.linked_account_label IS
  'Denormalized institution · account · last4 at sync time; UI can show without Stripe account list.';
