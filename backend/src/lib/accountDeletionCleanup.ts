import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
import { getStripe } from "../services/stripeService";

/** Unlink all Financial Connections accounts for a Stripe Customer (best-effort). */
export async function disconnectFinancialConnectionsForStripeCustomer(
  stripe: Stripe,
  customerId: string
): Promise<void> {
  try {
    const list = await stripe.financialConnections.accounts.list({
      account_holder: { customer: customerId },
      limit: 100,
    });
    for (const acc of list.data) {
      if (acc.status === "disconnected") continue;
      try {
        await stripe.financialConnections.accounts.disconnect(acc.id);
      } catch (e) {
        console.warn(`[accountDeletion] FC disconnect failed ${acc.id}:`, e);
      }
    }
  } catch (e) {
    console.warn("[accountDeletion] list FC accounts failed:", e);
  }
}

/**
 * Disconnects linked banks at Stripe, deletes FC sync tables, expenses, income, and billing_subscriptions.
 * Does not delete profiles or auth — caller does that after.
 */
export async function purgeUserBillingAndBankData(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  const { data: row } = await supabase
    .from("billing_subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .maybeSingle();

  const customerId = (row?.stripe_customer_id as string | undefined) ?? undefined;

  const stripe = getStripe();
  if (stripe && customerId) {
    await disconnectFinancialConnectionsForStripeCustomer(stripe, customerId);
  }

  const { error: fcTxErr } = await supabase
    .from("financial_connection_transactions")
    .delete()
    .eq("user_id", userId);
  if (fcTxErr) console.warn("[accountDeletion] financial_connection_transactions:", fcTxErr.message);

  const { error: fcSyncErr } = await supabase
    .from("financial_connections_account_sync")
    .delete()
    .eq("user_id", userId);
  if (fcSyncErr) console.warn("[accountDeletion] financial_connections_account_sync:", fcSyncErr.message);

  await supabase.from("expenses").delete().eq("user_id", userId);
  await supabase.from("income").delete().eq("user_id", userId);

  const { error: billErr } = await supabase.from("billing_subscriptions").delete().eq("user_id", userId);
  if (billErr) console.warn("[accountDeletion] billing_subscriptions:", billErr.message);
}
