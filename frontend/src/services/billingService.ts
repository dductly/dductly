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

export type CheckoutSessionResponse =
  | { embedded: false; url: string }
  | { embedded: true; clientSecret: string };

export type CreateCheckoutSessionArgs = {
  email: string;
  plan: CheckoutPlan;
  embedded?: boolean;
} & (
  | { accessToken: string }
  | { supabaseUserId: string; accessToken?: never }
);

/**
 * Checkout session. Use `accessToken` when the user has a Supabase session, or `supabaseUserId`
 * when the account exists but email isn’t confirmed yet (no JWT).
 */
export const createCheckoutSession = async (
  args: CreateCheckoutSessionArgs
): Promise<CheckoutSessionResponse> => {
  if (!API_BASE_URL?.trim()) {
    throw new Error("Missing VITE_API_BASE_URL");
  }

  const { email, plan, embedded: embeddedOpt } = args;
  const embedded = Boolean(embeddedOpt);
  const base = API_BASE_URL.replace(/\/$/, "");

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const requestBody: Record<string, unknown> = { email, plan, embedded };

  if ("accessToken" in args && args.accessToken) {
    headers.Authorization = `Bearer ${args.accessToken}`;
  } else if ("supabaseUserId" in args && args.supabaseUserId) {
    requestBody.supabaseUserId = args.supabaseUserId;
  } else {
    throw new Error("Missing accessToken or supabaseUserId");
  }

  const response = await fetch(`${base}/api/stripe/create-checkout-session`, {
    method: "POST",
    headers,
    body: JSON.stringify(requestBody),
  });

  const responseBody = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error((responseBody as { message?: string }).message || "Failed to start checkout");
  }

  if (embedded) {
    const clientSecret = (responseBody as { clientSecret?: string }).clientSecret;
    if (!clientSecret) {
      throw new Error("Embedded checkout could not be started");
    }
    return { embedded: true, clientSecret };
  }

  const url = (responseBody as { url?: string }).url;
  if (!url) {
    throw new Error("Checkout URL missing in response");
  }
  return { embedded: false, url };
};

export const cancelSubscription = async (accessToken: string): Promise<void> => {
  if (!API_BASE_URL?.trim()) {
    throw new Error("Missing VITE_API_BASE_URL");
  }
  if (!accessToken) {
    throw new Error("Missing access token");
  }
  const base = API_BASE_URL.replace(/\/$/, "");
  const response = await fetch(`${base}/api/stripe/cancel-subscription`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({}),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error((body as { message?: string }).message || "Failed to cancel subscription");
  }
};

export const cleanupBilling = async (accessToken: string): Promise<void> => {
  if (!API_BASE_URL?.trim()) {
    throw new Error("Missing VITE_API_BASE_URL");
  }
  if (!accessToken) {
    throw new Error("Missing access token");
  }
  const base = API_BASE_URL.replace(/\/$/, "");
  const response = await fetch(`${base}/api/stripe/cleanup-billing`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({}),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error((body as { message?: string }).message || "Failed to clean up billing");
  }
};

// (Removed) requestAccountDeletion: immediate export + delete flow now.
