import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Legacy billing rollout threshold.
 * Checkout is no longer gated on profile count, but this helper remains for backward compatibility.
 */
export const getBillingUserThreshold = (): number => {
  const raw = process.env.BILLING_USER_THRESHOLD;
  if (raw !== undefined && raw.trim() !== '') {
    const n = Number(raw);
    if (!Number.isNaN(n) && n >= 0) {
      return n;
    }
  }
  return 0;
};

export const getStripePriceAvailability = (): { monthly: boolean; yearly: boolean } => ({
  monthly: Boolean(process.env.STRIPE_PRICE_ID_MONTHLY),
  yearly: Boolean(process.env.STRIPE_PRICE_ID_YEARLY),
});

export const getProfileUserCount = async (supabase: SupabaseClient): Promise<number> => {
  const { count, error } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true });

  if (error) {
    throw new Error(`Failed to fetch user count: ${error.message}`);
  }

  return count ?? 0;
};
