import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";

export type FcTransactionRefreshPollOutcome = "succeeded" | "failed" | "pending";

/**
 * Poll Stripe until each account’s transaction_refresh leaves `pending` or missing refresh,
 * or until `deadlineMs` elapses. Used before listing FC transactions (which requires a
 * successful refresh). See Account.transaction_refresh in Stripe API docs.
 */
export async function pollFcAccountsTransactionRefresh(
  stripe: Stripe,
  fcAccountIds: string[],
  options: { deadlineMs: number; pollIntervalMs: number }
): Promise<Map<string, { outcome: FcTransactionRefreshPollOutcome; refreshId: string | null }>> {
  const results = new Map<string, { outcome: FcTransactionRefreshPollOutcome; refreshId: string | null }>();
  for (const id of fcAccountIds) {
    results.set(id, { outcome: "pending", refreshId: null });
  }

  const { deadlineMs, pollIntervalMs } = options;
  const deadline = Date.now() + deadlineMs;

  const updateFromRetrieve = async (id: string) => {
    const acc = await stripe.financialConnections.accounts.retrieve(id);
    if (acc.status === "disconnected") {
      results.set(id, { outcome: "failed", refreshId: null });
      return;
    }
    const tr = acc.transaction_refresh;
    if (!tr || typeof tr !== "object") {
      results.set(id, { outcome: "pending", refreshId: null });
      return;
    }
    const trObj = tr as { id?: string; status?: string };
    const status = trObj.status;
    const refreshId = trObj.id ?? null;
    if (status === "succeeded") {
      results.set(id, { outcome: "succeeded", refreshId });
    } else if (status === "failed") {
      results.set(id, { outcome: "failed", refreshId });
    } else {
      results.set(id, { outcome: "pending", refreshId });
    }
  };

  for (;;) {
    const pendingIds = [...results.entries()]
      .filter(([, v]) => v.outcome === "pending")
      .map(([k]) => k);
    if (pendingIds.length === 0) break;

    await Promise.all(pendingIds.map((id) => updateFromRetrieve(id)));

    const anyStillPending = [...results.values()].some((v) => v.outcome === "pending");
    if (!anyStillPending) break;
    if (Date.now() >= deadline) break;
    const sleepMs = Math.min(pollIntervalMs, Math.max(0, deadline - Date.now()));
    if (sleepMs <= 0) break;
    await new Promise((r) => setTimeout(r, sleepMs));
  }

  return results;
}

const unixToIso = (unix?: number | null): string | null => {
  if (unix == null || unix === 0) return null;
  return new Date(unix * 1000).toISOString();
};

export async function resolveUserIdForStripeCustomer(
  supabase: SupabaseClient,
  customerId: string,
  stripe?: Stripe
): Promise<string | null> {
  const { data, error } = await supabase
    .from("billing_subscriptions")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  if (error) {
    console.warn("resolveUserIdForStripeCustomer:", error.message);
    return null;
  }
  const fromDb = (data?.user_id as string | undefined) ?? null;
  if (fromDb) return fromDb;

  if (stripe) {
    try {
      const c = await stripe.customers.retrieve(customerId);
      if (!c.deleted && "metadata" in c && c.metadata?.supabase_user_id) {
        return c.metadata.supabase_user_id;
      }
    } catch (e) {
      console.warn("resolveUserIdForStripeCustomer Stripe retrieve:", e);
    }
  }
  return null;
}

/**
 * Pulls Financial Connections transactions after a refresh completes and upserts into Supabase.
 * See https://docs.stripe.com/financial-connections/transactions
 *
 * If the FC account is disconnected (user unlinked the bank), returns without writing — existing
 * `financial_connection_transactions` rows are never deleted by this function.
 */
export async function syncFinancialConnectionTransactions(params: {
  stripe: Stripe;
  supabase: SupabaseClient;
  fcAccountId: string;
  userId: string;
  /** transaction_refresh.id from the webhook account payload (new refresh). */
  currentTransactionRefreshId: string | null | undefined;
}): Promise<{ insertedOrUpdated: number }> {
  const { stripe, supabase, fcAccountId, userId, currentTransactionRefreshId } = params;

  try {
    const fcAccount = await stripe.financialConnections.accounts.retrieve(fcAccountId);
    if (fcAccount.status === "disconnected") {
      return { insertedOrUpdated: 0 };
    }
  } catch (e) {
    console.warn(
      "syncFinancialConnectionTransactions: skip sync (account missing or inaccessible after unlink?)",
      fcAccountId,
      e instanceof Error ? e.message : e
    );
    return { insertedOrUpdated: 0 };
  }

  const { data: syncRow } = await supabase
    .from("financial_connections_account_sync")
    .select("last_transaction_refresh_id")
    .eq("user_id", userId)
    .eq("stripe_fc_account_id", fcAccountId)
    .maybeSingle();

  const lastRefreshId = (syncRow?.last_transaction_refresh_id as string | undefined) ?? null;

  const listParams: Stripe.FinancialConnections.TransactionListParams = {
    account: fcAccountId,
    limit: 100,
  };

  if (lastRefreshId) {
    listParams.transaction_refresh = { after: lastRefreshId };
  }

  let total = 0;
  let startingAfter: string | undefined;

  for (;;) {
    const page = await stripe.financialConnections.transactions.list({
      ...listParams,
      starting_after: startingAfter,
    });

    for (const tx of page.data) {
      const postedAt =
        unixToIso(tx.status_transitions?.posted_at) ??
        unixToIso(tx.transacted_at) ??
        null;
      const transactedAt = unixToIso(tx.transacted_at);

      const { error } = await supabase.from("financial_connection_transactions").upsert(
        {
          stripe_transaction_id: tx.id,
          user_id: userId,
          stripe_fc_account_id: fcAccountId,
          amount: tx.amount,
          currency: tx.currency,
          description: tx.description ?? null,
          status: tx.status ?? null,
          transacted_at: transactedAt,
          posted_at: postedAt,
          stripe_transaction_refresh_id:
            typeof tx.transaction_refresh === "string"
              ? tx.transaction_refresh
              : (tx.transaction_refresh as { id?: string } | null)?.id ?? null,
          raw: tx as unknown as Record<string, unknown>,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "stripe_transaction_id" }
      );

      if (error) {
        throw new Error(`Upsert financial_connection_transactions failed: ${error.message}`);
      }
      total += 1;
    }

    if (!page.has_more || page.data.length === 0) break;
    startingAfter = page.data[page.data.length - 1]?.id;
    if (!startingAfter) break;
  }

  if (currentTransactionRefreshId) {
    const { error: syncErr } = await supabase.from("financial_connections_account_sync").upsert(
      {
        user_id: userId,
        stripe_fc_account_id: fcAccountId,
        last_transaction_refresh_id: currentTransactionRefreshId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,stripe_fc_account_id" }
    );
    if (syncErr) {
      throw new Error(`Upsert financial_connections_account_sync failed: ${syncErr.message}`);
    }
  }

  return { insertedOrUpdated: total };
}
