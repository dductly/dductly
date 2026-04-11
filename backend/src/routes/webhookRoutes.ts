import express, { Request, Response } from "express";
import type Stripe from "stripe";
import supabase from "../lib/supabaseClient";
import {
  resolveUserIdForStripeCustomer,
  syncFinancialConnectionTransactions,
} from "../lib/financialConnectionsSync";
import { syncProfileSubscriptionLabel } from "../lib/subscriptionProfileLabels";
import { getStripe } from "../services/stripeService";

const toIsoFromUnix = (value?: number | null): string | null => {
  if (!value) return null;
  return new Date(value * 1000).toISOString();
};

const upsertSubscriptionRecord = async (params: {
  userId: string;
  plan: string | null;
  subscription: any;
  customerId?: string | null;
}) => {
  const { userId, plan, subscription, customerId } = params;
  const subscriptionCustomerId =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id;

  const { error } = await supabase.from("billing_subscriptions").upsert(
    {
      user_id: userId,
      stripe_customer_id: customerId || subscriptionCustomerId || null,
      stripe_subscription_id: subscription.id,
      status: subscription.status,
      plan,
      price_id: subscription.items?.data?.[0]?.price?.id || null,
      current_period_start: null,
      current_period_end: null,
      cancel_at_period_end: Boolean(subscription.cancel_at_period_end),
      canceled_at: toIsoFromUnix(subscription.canceled_at),
      trial_end: toIsoFromUnix(subscription.trial_end),
      raw: subscription,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    throw new Error(`Failed to upsert billing subscription: ${error.message}`);
  }

  await syncProfileSubscriptionLabel(supabase, userId, subscription, plan);
};

/** Trim, strip accidental quotes, remove CR — common .env footguns. */
export function normalizeStripeWebhookSecret(raw: string | undefined): string {
  if (!raw) return "";
  let s = raw.trim().replace(/\r/g, "");
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).trim();
  }
  return s;
}

/**
 * Raw bytes only — register this route on `app` before any `express.json()` / global parsers.
 */
export const stripeWebhookRawMiddleware = express.raw({ type: "*/*", limit: "1mb" });

export async function handleStripeWebhook(req: Request, res: Response): Promise<void> {
  const stripe = getStripe();
  if (!stripe) {
    res.status(500).json({ error: "Billing Not Configured", message: "Missing STRIPE_SECRET_KEY" });
    return;
  }

  const sig = req.headers["stripe-signature"] as string | undefined;

  const webhookSecret = normalizeStripeWebhookSecret(process.env.STRIPE_WEBHOOK_SECRET);
  if (!webhookSecret) {
    console.error("Webhook: STRIPE_WEBHOOK_SECRET is not set");
    res.status(500).json({ error: "Server misconfiguration", message: "STRIPE_WEBHOOK_SECRET is missing" });
    return;
  }

  const rawBody = req.body;
  if (!Buffer.isBuffer(rawBody) || rawBody.length === 0) {
    console.error("Webhook: expected raw JSON body (Buffer). Got:", typeof rawBody, "content-type:", req.headers["content-type"]);
    res.status(400).json({
      error: "Invalid body",
      message: "Webhook payload was not parsed as raw bytes — check middleware order (express.json must not run before this route).",
    });
    return;
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig ?? "", webhookSecret);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Webhook signature error:", msg);
    if (process.env.NODE_ENV !== "production") {
      console.error(
        "[webhook] dev hint: bodyBytes=%s stripe-signature=%s secretPrefix=%s (use whsec_ from the *same* `stripe listen` session; restart listen = new secret)",
        rawBody.length,
        sig ? "present" : "MISSING",
        webhookSecret.slice(0, 8)
      );
    }
    res.status(400).json({
      error: "Invalid signature",
      message:
        "STRIPE_WEBHOOK_SECRET must match the signing secret for this delivery. With Stripe CLI, copy the whsec_ shown when you run `stripe listen` (Dashboard secrets do not work for CLI forwards). Restart `stripe listen` → new secret → update .env and restart the server.",
    });
    return;
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as any;
      if (session.mode === "subscription" && session.subscription) {
        const subscriptionId =
          typeof session.subscription === "string" ? session.subscription : session.subscription.id;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const userId = session.metadata?.supabase_user_id || subscription.metadata?.supabase_user_id;
        const plan = session.metadata?.billing_plan || subscription.metadata?.billing_plan || null;

        if (userId) {
          await upsertSubscriptionRecord({
            userId,
            plan,
            subscription,
            customerId: typeof session.customer === "string" ? session.customer : session.customer?.id,
          });
        }
      }
    }

    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      const subscription = event.data.object as any;
      const userId = subscription.metadata?.supabase_user_id;
      const plan = subscription.metadata?.billing_plan || null;

      if (userId) {
        await upsertSubscriptionRecord({
          userId,
          plan,
          subscription,
        });
      } else {
        const { data: existingRecord } = await supabase
          .from("billing_subscriptions")
          .select("user_id")
          .eq("stripe_subscription_id", subscription.id)
          .maybeSingle();

        if (existingRecord?.user_id) {
          await upsertSubscriptionRecord({
            userId: existingRecord.user_id,
            plan,
            subscription,
          });
        }
      }
    }

    if (event.type === "financial_connections.account.refreshed_transactions") {
      const account = event.data.object as Stripe.FinancialConnections.Account;
      const holder = account.account_holder;
      const customerRaw =
        holder && typeof holder === "object" && "customer" in holder
          ? (holder as { customer?: string | { id?: string } }).customer
          : undefined;
      const customerId =
        typeof customerRaw === "string" ? customerRaw : customerRaw?.id ?? null;
      if (customerId && account.id) {
        const userId = await resolveUserIdForStripeCustomer(supabase, customerId, stripe);
        if (!userId) {
          console.warn(
            "[webhook] financial_connections.account.refreshed_transactions: no user for Stripe customer",
            customerId,
            "(check billing_subscriptions.stripe_customer_id or Customer metadata.supabase_user_id)"
          );
        } else {
          const refreshId =
            account.transaction_refresh &&
            typeof account.transaction_refresh === "object" &&
            "id" in account.transaction_refresh
              ? (account.transaction_refresh as { id: string }).id
              : null;
          await syncFinancialConnectionTransactions({
            stripe,
            supabase,
            fcAccountId: account.id,
            userId,
            currentTransactionRefreshId: refreshId,
          });
        }
      }
    }
  } catch (err: any) {
    console.error("Webhook processing error:", err?.message || err);
    res.sendStatus(500);
    return;
  }

  res.sendStatus(200);
}
