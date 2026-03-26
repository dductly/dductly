import express, { Response } from "express";
import Stripe from "stripe";
import { authenticateUser, authenticateUserOrPendingSignup, AuthRequest } from "../middleware/auth";
import supabase from "../lib/supabaseClient";
import { getStripe } from "../services/stripeService";

const router = express.Router();
const TRIAL_DAYS = Number(process.env.STRIPE_TRIAL_DAYS || 14);

type BillingPlan = "monthly" | "yearly";

const PRICE_IDS: Record<BillingPlan, string | undefined> = {
  monthly: process.env.STRIPE_PRICE_ID_MONTHLY,
  yearly: process.env.STRIPE_PRICE_ID_YEARLY,
};

router.post("/create-checkout-session", authenticateUserOrPendingSignup, async (req: AuthRequest, res: Response) => {
  try {
    const stripe = getStripe();
    if (!stripe) {
      return res.status(500).json({ error: "Billing Not Configured", message: "Missing STRIPE_SECRET_KEY" });
    }

    const { email, plan, embedded } = req.body as {
      email?: string;
      plan?: string;
      embedded?: boolean;
    };
    const userId = req.user?.id;
    const userEmail = req.user?.email;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized", message: "User ID missing from auth context" });
    }

    if (!email?.trim() && !userEmail) {
      return res.status(400).json({ error: "Bad Request", message: "Email is required" });
    }

    const selectedPlan: BillingPlan = plan === "yearly" ? "yearly" : "monthly";
    const priceId = PRICE_IDS[selectedPlan];
    if (!priceId) {
      return res.status(500).json({
        error: "Billing Not Configured",
        message: `Missing STRIPE_PRICE_ID_${selectedPlan === "yearly" ? "YEARLY" : "MONTHLY"}`,
      });
    }

    // Base URL for Stripe redirects (embedded return_url + success/cancel).
    // In development, always prefer FRONTEND_URL so local testing doesn't bounce to production.
    const clientBase = (
      process.env.NODE_ENV !== "production" ? process.env.FRONTEND_URL : process.env.CLIENT_URL
    )?.replace(/\/$/, "");

    const clientBaseFallback = (process.env.CLIENT_URL || process.env.FRONTEND_URL || "").replace(/\/$/, "");
    const resolvedClientBase = clientBase || clientBaseFallback;
    if (!resolvedClientBase) {
      return res.status(500).json({
        error: "Configuration Error",
        message: "CLIENT_URL or FRONTEND_URL is required for checkout",
      });
    }

    const customer = await stripe.customers.create({
      email: email || userEmail,
      metadata: {
        supabase_user_id: userId,
        billing_plan: selectedPlan,
      },
    });

    // Ensure we store the user's selected plan immediately, even if webhooks
    // haven't been delivered yet (common in local dev).
    const estimatedTrialEnd = TRIAL_DAYS
      ? new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString()
      : null;
    const { error: upsertError } = await supabase.from("billing_subscriptions").upsert(
      {
        user_id: userId,
        stripe_customer_id: customer.id,
        status: "pending",
        plan: selectedPlan,
        price_id: priceId,
        trial_end: estimatedTrialEnd,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
    if (upsertError) {
      console.warn("Failed to upsert pending subscription:", upsertError.message);
    }

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      customer: customer.id,
      client_reference_id: userId,
      payment_method_collection: "always",
      metadata: {
        supabase_user_id: userId,
        billing_plan: selectedPlan,
      },
      subscription_data: {
        trial_period_days: TRIAL_DAYS,
        metadata: {
          supabase_user_id: userId,
          billing_plan: selectedPlan,
        },
      },
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
    };

    if (embedded) {
      sessionParams.ui_mode = "embedded";
      // Land directly on email verification after embedded checkout finishes.
      sessionParams.return_url = `${resolvedClientBase}/confirm-email`;
    } else {
      sessionParams.success_url = `${resolvedClientBase}/confirm-email`;
      sessionParams.cancel_url = `${resolvedClientBase}/confirm-email`;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    if (embedded) {
      if (!session.client_secret) {
        return res.status(500).json({
          error: "Checkout Error",
          message: "Embedded checkout could not be started",
        });
      }
      return res.json({ clientSecret: session.client_secret });
    }

    if (!session.url) {
      return res.status(500).json({
        error: "Checkout Error",
        message: "Checkout URL missing",
      });
    }

    return res.json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).send("Stripe error");
  }
});

router.get("/subscription-status", authenticateUser, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized", message: "User ID missing from auth context" });
    }

    const { data, error } = await supabase
      .from("billing_subscriptions")
      .select(
        "status, plan, price_id, current_period_start, current_period_end, cancel_at_period_end, canceled_at, trial_end, updated_at"
      )
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      return res.status(500).json({ error: "Subscription Lookup Failed", message: error.message });
    }

    if (!data) {
      return res.json({
        hasSubscription: false,
        status: "none",
      });
    }

    return res.json({
      hasSubscription: true,
      ...data,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).send("Subscription status error");
  }
});

router.post("/cancel-subscription", authenticateUser, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized", message: "User ID missing from auth context" });
    }

    const stripe = getStripe();
    if (!stripe) {
      return res.status(500).json({ error: "Billing Not Configured", message: "Missing STRIPE_SECRET_KEY" });
    }

    const { data: record, error: lookupError } = await supabase
      .from("billing_subscriptions")
      .select("stripe_subscription_id, status, trial_end, current_period_end")
      .eq("user_id", userId)
      .maybeSingle();

    if (lookupError) {
      return res.status(500).json({ error: "Subscription Lookup Failed", message: lookupError.message });
    }

    const stripeSubscriptionId = record?.stripe_subscription_id;
    if (!stripeSubscriptionId) {
      return res.status(400).json({
        error: "No Subscription",
        message: "No Stripe subscription found for this user yet.",
      });
    }

    // Cancel at period end so the user keeps access through trial/paid period.
    const updated = await stripe.subscriptions.update(stripeSubscriptionId, {
      cancel_at_period_end: true,
    });
    const updatedSub = updated as unknown as Stripe.Subscription & { current_period_end?: number | null };

    const { error: updateError } = await supabase.from("billing_subscriptions").upsert(
      {
        user_id: userId,
        stripe_subscription_id: stripeSubscriptionId,
        status: updatedSub.status,
        cancel_at_period_end: Boolean(updatedSub.cancel_at_period_end),
        current_period_end: updatedSub.current_period_end
          ? new Date(updatedSub.current_period_end * 1000).toISOString()
          : null,
        trial_end: updatedSub.trial_end ? new Date(updatedSub.trial_end * 1000).toISOString() : null,
        updated_at: new Date().toISOString(),
        raw: updatedSub,
      },
      { onConflict: "user_id" }
    );

    if (updateError) {
      return res.status(500).json({ error: "Subscription Update Failed", message: updateError.message });
    }

    return res.json({
      ok: true,
      status: updatedSub.status,
      cancelAtPeriodEnd: Boolean(updatedSub.cancel_at_period_end),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Cancel Subscription Failed" });
  }
});

// Used for "cancel during trial then delete account" cleanup:
// cancel subscription immediately (best effort) and delete Stripe customer.
router.post("/cleanup-billing", authenticateUser, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized", message: "User ID missing from auth context" });
    }

    const stripe = getStripe();
    if (!stripe) {
      return res.status(500).json({ error: "Billing Not Configured", message: "Missing STRIPE_SECRET_KEY" });
    }

    const { data: record, error: lookupError } = await supabase
      .from("billing_subscriptions")
      .select("stripe_customer_id, stripe_subscription_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (lookupError) {
      return res.status(500).json({ error: "Subscription Lookup Failed", message: lookupError.message });
    }

    const subId = record?.stripe_subscription_id ?? null;
    const customerId = record?.stripe_customer_id ?? null;

    if (subId) {
      try {
        await stripe.subscriptions.cancel(subId, { invoice_now: false, prorate: false });
      } catch (e) {
        // If the subscription doesn't exist (stale ID / different Stripe mode),
        // treat cleanup as already done.
        const anyErr = e as any;
        const isMissing =
          anyErr?.code === "resource_missing" ||
          anyErr?.raw?.code === "resource_missing" ||
          anyErr?.statusCode === 404 ||
          anyErr?.raw?.statusCode === 404;
        if (!isMissing) {
          console.warn("Stripe subscription cancel failed:", e);
        }
      }
    }

    if (customerId) {
      try {
        await stripe.customers.del(customerId);
      } catch (e) {
        // Common when the stored customerId is stale or from the other Stripe mode (test vs live).
        const anyErr = e as any;
        const isMissing =
          anyErr?.code === "resource_missing" ||
          anyErr?.raw?.code === "resource_missing" ||
          anyErr?.statusCode === 404 ||
          anyErr?.raw?.statusCode === 404;
        if (!isMissing) {
          console.warn("Stripe customer delete failed:", e);
        }
      }
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Billing Cleanup Failed" });
  }
});

export default router;
