import express, { Response } from "express";
import { authenticateUser, AuthRequest } from "../middleware/auth";
import supabase from "../lib/supabaseClient";
import { getStripe } from "../services/stripeService";

const router = express.Router();
const TRIAL_DAYS = Number(process.env.STRIPE_TRIAL_DAYS || 14);

router.post("/create-checkout-session", authenticateUser, async (req: AuthRequest, res: Response) => {
  try {
    const stripe = getStripe();
    if (!stripe) {
      return res.status(500).json({ error: "Billing Not Configured", message: "Missing STRIPE_SECRET_KEY" });
    }

    const { email } = req.body;
    const userId = req.user?.id;
    const userEmail = req.user?.email;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized", message: "User ID missing from auth context" });
    }

    if (!email && !userEmail) {
      return res.status(400).json({ error: "Bad Request", message: "Email is required" });
    }

    const customer = await stripe.customers.create({
      email: email || userEmail,
      metadata: {
        supabase_user_id: userId,
      },
    });

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customer.id,
      client_reference_id: userId,
      metadata: {
        supabase_user_id: userId,
      },
      subscription_data: {
        trial_period_days: TRIAL_DAYS,
        metadata: {
          supabase_user_id: userId,
        },
      },

      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID_MONTHLY || "price_abc123",
          quantity: 1,
        },
      ],
      success_url: `${process.env.CLIENT_URL}/success`,
      cancel_url: `${process.env.CLIENT_URL}/cancel`,
    });

    res.json({ url: session.url });

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