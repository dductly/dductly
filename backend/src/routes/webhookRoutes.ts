import express, { Request, Response } from "express";
import supabase from "../lib/supabaseClient";
import { syncProfileSubscriptionLabel } from "../lib/subscriptionProfileLabels";
import { getStripe } from "../services/stripeService";

const router = express.Router();

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

router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req: Request, res: Response) => {
    const stripe = getStripe();
    if (!stripe) {
      return res.status(500).json({ error: "Billing Not Configured", message: "Missing STRIPE_SECRET_KEY" });
    }

    const sig = req.headers["stripe-signature"] as string;

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET as string
      );
    } catch (err: any) {
      console.error("Webhook error:", err.message);
      return res.sendStatus(400);
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
    } catch (err: any) {
      console.error("Webhook processing error:", err?.message || err);
      return res.sendStatus(500);
    }

    res.sendStatus(200);
  }
);

export default router;