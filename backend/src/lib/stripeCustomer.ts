import Stripe from "stripe";
import supabase from "./supabaseClient";

/**
 * Returns an existing Stripe customer for this user, or creates one and stores it on `billing_subscriptions`.
 * Reused by checkout and Financial Connections so we do not create duplicate customers.
 */
export const getOrCreateStripeCustomerId = async (
  stripe: Stripe,
  userId: string,
  email: string | undefined,
  extraMetadata?: Record<string, string>
): Promise<string> => {
  const { data: row, error: lookupError } = await supabase
    .from("billing_subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (lookupError) {
    throw new Error(lookupError.message);
  }

  const existing = row?.stripe_customer_id as string | undefined;
  if (existing) {
    return existing;
  }

  const customer = await stripe.customers.create({
    email: email || undefined,
    metadata: {
      supabase_user_id: userId,
      ...extraMetadata,
    },
  });

  const { error: upsertError } = await supabase.from("billing_subscriptions").upsert(
    {
      user_id: userId,
      stripe_customer_id: customer.id,
      status: "pending",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (upsertError) {
    console.warn("Failed to upsert billing_subscriptions for new Stripe customer:", upsertError.message);
  }

  return customer.id;
};
