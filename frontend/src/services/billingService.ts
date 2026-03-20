const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string | undefined;

export interface PublicBillingConfig {
  billingEnabled: boolean;
  userCount: number;
  userThreshold: number;
  hasStripeConfig: boolean;
  availablePlans: {
    monthly: boolean;
    yearly: boolean;
  };
}

export const hasBillingApiBaseUrl = (): boolean => Boolean(API_BASE_URL?.trim());

/**
 * Public billing rollout info (no auth). Used after signup, etc.
 */
export const getPublicBillingConfig = async (): Promise<PublicBillingConfig> => {
  if (!API_BASE_URL?.trim()) {
    throw new Error("Missing VITE_API_BASE_URL");
  }

  const response = await fetch(`${API_BASE_URL.replace(/\/$/, "")}/api/billing/config`);
  if (!response.ok) {
    throw new Error("Failed to load billing configuration");
  }

  return response.json();
};

export type CheckoutPlan = "monthly" | "yearly";

/**
 * Authenticated checkout (same as Settings). Requires Supabase access_token.
 */
export const createCheckoutSession = async (
  accessToken: string,
  email: string,
  plan: CheckoutPlan
): Promise<string> => {
  if (!API_BASE_URL?.trim()) {
    throw new Error("Missing VITE_API_BASE_URL");
  }

  const base = API_BASE_URL.replace(/\/$/, "");
  const response = await fetch(`${base}/api/stripe/create-checkout-session`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, plan }),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error((body as { message?: string }).message || "Failed to start checkout");
  }

  const url = (body as { url?: string }).url;
  if (!url) {
    throw new Error("Checkout URL missing in response");
  }
  return url;
};
