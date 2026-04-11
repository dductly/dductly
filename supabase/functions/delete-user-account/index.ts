import { serve } from "std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "npm:stripe@20.4.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, { apiVersion: "2026-02-25.clover" })
  : null;

/**
 * Mirror backend/src/lib/accountDeletionCleanup.ts: Stripe disconnect + DB cleanup for FC/billing.
 */
async function disconnectFinancialConnectionsForCustomer(customerId: string): Promise<void> {
  if (!stripe) return;
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
        console.warn(`[delete-user-account] FC disconnect failed ${acc.id}:`, e);
      }
    }
  } catch (e) {
    console.warn("[delete-user-account] list FC accounts failed:", e);
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    const { userId, reason, email } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Missing userId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

    if (reason) {
      const { error: reasonError } = await supabaseAdmin.from("deletion_reasons").insert({
        user_email: email || null,
        reason: reason,
      });
      if (reasonError) {
        console.error("Failed to save deletion reason:", reasonError);
      }
    }

    const { data: subRow } = await supabaseAdmin
      .from("billing_subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .maybeSingle();

    const customerId = subRow?.stripe_customer_id as string | undefined;
    if (customerId) {
      await disconnectFinancialConnectionsForCustomer(customerId);
    }

    const { error: fcTxErr } = await supabaseAdmin
      .from("financial_connection_transactions")
      .delete()
      .eq("user_id", userId);
    if (fcTxErr) console.warn("[delete-user-account] financial_connection_transactions:", fcTxErr.message);

    const { error: fcSyncErr } = await supabaseAdmin
      .from("financial_connections_account_sync")
      .delete()
      .eq("user_id", userId);
    if (fcSyncErr) console.warn("[delete-user-account] financial_connections_account_sync:", fcSyncErr.message);

    await supabaseAdmin.from("expenses").delete().eq("user_id", userId);
    await supabaseAdmin.from("income").delete().eq("user_id", userId);

    const { error: billErr } = await supabaseAdmin.from("billing_subscriptions").delete().eq("user_id", userId);
    if (billErr) console.warn("[delete-user-account] billing_subscriptions:", billErr.message);

    await supabaseAdmin.from("profiles").delete().eq("id", userId);

    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authError) {
      return new Response(
        JSON.stringify({ error: authError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ message: "Account deleted successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: `${err}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
