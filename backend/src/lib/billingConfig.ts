import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * User count required before paid checkout is allowed.
 * - Set BILLING_USER_THRESHOLD explicitly to override.
 * - If unset: production defaults to 50; non-production defaults to 1 (easier local/staging tests).
 */
export const getBillingUserThreshold = (): number => {
  const raw = process.env.BILLING_USER_THRESHOLD;
  if (raw !== undefined && raw.trim() !== '') {
    const n = Number(raw);
    if (!Number.isNaN(n) && n >= 0) {
      return n;
    }
  }
  return process.env.NODE_ENV === 'production' ? 50 : 1;
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
