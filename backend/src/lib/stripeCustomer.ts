import Stripe from "stripe";
import supabase from "./supabaseClient";

export type StripeCustomerProfile = {
  email?: string;
  name?: string;
  businessName?: string;
};

/** Build name / business fields from Supabase Auth user_metadata (Settings / signup). */
export const stripeCustomerProfileFromAuthUser = (user: {
  email?: string;
  user_metadata?: Record<string, unknown>;
} | undefined): StripeCustomerProfile => {
  const meta = user?.user_metadata ?? {};
  const first = typeof meta.first_name === "string" ? meta.first_name.trim() : "";
  const last = typeof meta.last_name === "string" ? meta.last_name.trim() : "";
  const name = [first, last].filter(Boolean).join(" ") || undefined;
  const businessRaw = meta.business_name;
  const businessName =
    typeof businessRaw === "string" && businessRaw.trim() ? businessRaw.trim() : undefined;
  return {
    email: user?.email,
    name,
    businessName,
  };
};

function isStripeResourceMissing(err: unknown): boolean {
  const anyErr = err as { code?: string; statusCode?: number; raw?: { code?: string; statusCode?: number } };
  return (
    anyErr?.code === "resource_missing" ||
    anyErr?.raw?.code === "resource_missing" ||
    anyErr?.statusCode === 404 ||
    anyErr?.raw?.statusCode === 404
  );
}

async function clearStaleStripeCustomerId(userId: string, staleId: string): Promise<void> {
  const { error: clearErr } = await supabase
    .from("billing_subscriptions")
    .update({
      stripe_customer_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);
  if (clearErr) {
    console.warn("[stripe] Could not clear stale stripe_customer_id:", clearErr.message);
  } else {
    console.warn("[stripe] Stored stripe_customer_id missing in Stripe; cleared for user", userId, staleId);
  }
}

/**
 * Returns `billing_subscriptions.stripe_customer_id` only if that customer still exists in Stripe.
 * If the ID is stale, it is cleared in Supabase and this returns undefined (does not create a customer).
 */
export const getValidStoredStripeCustomerId = async (
  stripe: Stripe,
  userId: string
): Promise<string | undefined> => {
  const { data: row, error: lookupError } = await supabase
    .from("billing_subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (lookupError) {
    throw new Error(lookupError.message);
  }

  const existing = row?.stripe_customer_id as string | undefined;
  if (!existing) {
    return undefined;
  }

  try {
    await stripe.customers.retrieve(existing);
    return existing;
  } catch (e: unknown) {
    if (!isStripeResourceMissing(e)) {
      throw e instanceof Error ? e : new Error(String(e));
    }
    await clearStaleStripeCustomerId(userId, existing);
    return undefined;
  }
};

/**
 * Returns an existing Stripe customer for this user, or creates one and stores it on `billing_subscriptions`.
 * Reused by checkout and Financial Connections so we do not create duplicate customers.
 *
 * If the DB references a customer that no longer exists in Stripe (deleted, wrong mode), the ID is cleared
 * and a new customer is created — needed for free-tier users who never completed checkout.
 */
export const getOrCreateStripeCustomerId = async (
  stripe: Stripe,
  userId: string,
  profile: StripeCustomerProfile,
  extraMetadata?: Record<string, string>
): Promise<string> => {
  const validExisting = await getValidStoredStripeCustomerId(stripe, userId);
  if (validExisting) {
    return validExisting;
  }

  const metadata: Record<string, string> = {
    supabase_user_id: userId,
    ...extraMetadata,
  };
  if (profile.businessName) {
    metadata.business_name = profile.businessName;
  }

  const customer = await stripe.customers.create({
    email: profile.email?.trim() || undefined,
    name: profile.name?.trim() || undefined,
    metadata,
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
