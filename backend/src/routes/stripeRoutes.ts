import express, { Response } from "express";
import Stripe from "stripe";
import { authenticateUser, authenticateUserOrPendingSignup, AuthRequest } from "../middleware/auth";
import supabase from "../lib/supabaseClient";
import { getBillingUserThreshold, getProfileUserCount } from "../lib/billingConfig";
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

    const userThreshold = getBillingUserThreshold();
    const userCount = await getProfileUserCount(supabase);
    if (userCount < userThreshold) {
      return res.status(403).json({
        error: "Billing Not Enabled",
        message: `Paid checkout unlocks after ${userThreshold} members`,
        userCount,
        userThreshold,
      });
    }

    const clientBase = (process.env.CLIENT_URL || "").replace(/\/$/, "");
    if (!clientBase) {
      return res.status(500).json({
        error: "Configuration Error",
        message: "CLIENT_URL is required for checkout",
      });
    }

    const customer = await stripe.customers.create({
      email: email || userEmail,
      metadata: {
        supabase_user_id: userId,
        billing_plan: selectedPlan,
      },
    });

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
      sessionParams.return_url = `${clientBase}/signup?stripe_session_id={CHECKOUT_SESSION_ID}`;
    } else {
      sessionParams.success_url = `${clientBase}/success`;
      sessionParams.cancel_url = `${clientBase}/cancel`;
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

export default router;
