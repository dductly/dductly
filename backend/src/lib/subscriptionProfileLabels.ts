import type { SupabaseClient } from "@supabase/supabase-js";

/** Stored in `profiles.subscription` — must match frontend constants. */
export const PROFILE_SUBSCRIPTION_FREE_TRIAL = "free_trial" as const;
export const PROFILE_SUBSCRIPTION_STANDARD_MONTHLY = "standard_monthly" as const;
export const PROFILE_SUBSCRIPTION_STANDARD_YEARLY = "standard_yearly" as const;

type PlanCadence = "monthly" | "yearly";

const resolvePlanCadence = (
  plan: string | null | undefined,
  subscription: { items?: { data?: Array<{ price?: { id?: string } }> } }
): PlanCadence => {
  if (plan === "yearly") return "yearly";
  if (plan === "monthly") return "monthly";
  const priceId = subscription.items?.data?.[0]?.price?.id;
  const yearly = process.env.STRIPE_PRICE_ID_YEARLY;
  const monthly = process.env.STRIPE_PRICE_ID_MONTHLY;
  if (priceId && yearly && priceId === yearly) return "yearly";
  if (priceId && monthly && priceId === monthly) return "monthly";
  return "monthly";
};

/**
 * Maps Stripe subscription state to `profiles.subscription`.
 * - trialing → free_trial
 * - active (paid period, including after trial) → standard_monthly | standard_yearly
 * Other statuses return null (caller should not overwrite the profile column).
 */
export const profileSubscriptionLabelFromStripe = (
  subscription: { status?: string; items?: { data?: Array<{ price?: { id?: string } }> } },
  plan: string | null | undefined
): string | null => {
  const status = subscription.status;
  if (status === "trialing") return PROFILE_SUBSCRIPTION_FREE_TRIAL;
  if (status === "active") {
    const cadence = resolvePlanCadence(plan, subscription);
    return cadence === "yearly"
      ? PROFILE_SUBSCRIPTION_STANDARD_YEARLY
      : PROFILE_SUBSCRIPTION_STANDARD_MONTHLY;
  }
  return null;
};

export const syncProfileSubscriptionLabel = async (
  supabase: SupabaseClient,
  userId: string,
  subscription: { status?: string; items?: { data?: Array<{ price?: { id?: string } }> } },
  plan: string | null | undefined
): Promise<void> => {
  const label = profileSubscriptionLabelFromStripe(subscription, plan);
  if (!label) return;

  const { data: existing } = await supabase.from("profiles").select("subscription").eq("id", userId).maybeSingle();
  if (existing?.subscription?.trim().toLowerCase() === "free_for_life") return;

  const { error } = await supabase.from("profiles").update({ subscription: label }).eq("id", userId);
  if (error) {
    console.warn("Failed to sync profiles.subscription:", error.message);
  }
};
