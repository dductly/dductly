import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "npm:stripe@20.4.1";

const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
const stripeWebhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, { apiVersion: "2026-02-25.clover" })
  : null;

const supabaseAdmin = supabaseUrl && supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey)
  : null;

const toIsoFromUnix = (value?: number | null): string | null => {
  if (!value) return null;
  return new Date(value * 1000).toISOString();
};

const PROFILE_FREE_TRIAL = "free_trial";
const PROFILE_STANDARD_MONTHLY = "standard_monthly";
const PROFILE_STANDARD_YEARLY = "standard_yearly";

const resolvePlanCadence = (
  plan: string | null | undefined,
  subscription: Stripe.Subscription
): "monthly" | "yearly" => {
  if (plan === "yearly") return "yearly";
  if (plan === "monthly") return "monthly";
  const priceId = subscription.items.data[0]?.price?.id;
  const yearly = Deno.env.get("STRIPE_PRICE_ID_YEARLY");
  const monthly = Deno.env.get("STRIPE_PRICE_ID_MONTHLY");
  if (priceId && yearly && priceId === yearly) return "yearly";
  if (priceId && monthly && priceId === monthly) return "monthly";
  return "monthly";
};

const profileLabelFromStripe = (subscription: Stripe.Subscription, plan: string | null | undefined): string | null => {
  if (subscription.status === "trialing") return PROFILE_FREE_TRIAL;
  if (subscription.status === "active") {
    return resolvePlanCadence(plan, subscription) === "yearly"
      ? PROFILE_STANDARD_YEARLY
      : PROFILE_STANDARD_MONTHLY;
  }
  return null;
};

const syncProfileSubscription = async (
  userId: string,
  subscription: Stripe.Subscription,
  plan: string | null | undefined
) => {
  if (!supabaseAdmin) return;
  const label = profileLabelFromStripe(subscription, plan);
  if (!label) return;

  const { data: existing } = await supabaseAdmin.from("profiles").select("subscription").eq("id", userId).maybeSingle();
  if (existing?.subscription?.trim().toLowerCase() === "free_for_life") return;

  const { error } = await supabaseAdmin.from("profiles").update({ subscription: label }).eq("id", userId);
  if (error) console.warn("Failed to sync profiles.subscription:", error.message);
};

const upsertSubscriptionRecord = async (params: {
  userId: string;
  plan: string | null;
  subscription: Stripe.Subscription;
  customerId?: string | null;
}) => {
  if (!supabaseAdmin) {
    throw new Error("Supabase admin client is not configured");
  }

  const { userId, plan, subscription, customerId } = params;
  const subscriptionCustomerId =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id;

  const { error } = await supabaseAdmin.from("billing_subscriptions").upsert(
    {
      user_id: userId,
      stripe_customer_id: customerId || subscriptionCustomerId || null,
      stripe_subscription_id: subscription.id,
      status: subscription.status,
      plan,
      price_id: subscription.items.data[0]?.price?.id || null,
      current_period_start: null,
      current_period_end: null,
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: toIsoFromUnix(subscription.canceled_at),
      trial_end: toIsoFromUnix(subscription.trial_end),
      raw: subscription as unknown as Record<string, unknown>,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    throw new Error(`Failed to upsert billing subscription: ${error.message}`);
  }

  await syncProfileSubscription(userId, subscription, plan);
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200 });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  if (!stripe || !stripeWebhookSecret || !supabaseAdmin) {
    return new Response("Webhook service not configured", { status: 500 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  try {
    const payload = await req.text();
    const event = await stripe.webhooks.constructEventAsync(
      payload,
      signature,
      stripeWebhookSecret
    );

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription" || !session.subscription) break;

        const subscriptionId =
          typeof session.subscription === "string" ? session.subscription : session.subscription.id;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const userId = session.metadata?.supabase_user_id || subscription.metadata?.supabase_user_id;
        const plan = session.metadata?.billing_plan || subscription.metadata?.billing_plan || null;

        if (!userId) break;

        await upsertSubscriptionRecord({
          userId,
          plan,
          subscription,
          customerId: typeof session.customer === "string" ? session.customer : session.customer?.id,
        });
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.supabase_user_id;
        const plan = subscription.metadata?.billing_plan || null;

        if (userId) {
          await upsertSubscriptionRecord({
            userId,
            plan,
            subscription,
          });
          break;
        }

        // Fallback for legacy subscriptions without metadata
        const { data: existingRecord } = await supabaseAdmin
          .from("billing_subscriptions")
          .select("user_id")
          .eq("stripe_subscription_id", subscription.id)
          .maybeSingle();

        if (!existingRecord?.user_id) break;

        await upsertSubscriptionRecord({
          userId: existingRecord.user_id,
          plan,
          subscription,
        });
        break;
      }

      default:
        break;
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Stripe webhook processing error:", error);
    return new Response("Webhook Error", { status: 400 });
  }
});
