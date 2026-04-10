import { hasBillingApiBaseUrl } from "./billingService";
import { getStripeBrowser } from "../lib/stripeBrowser";

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ?? "";

export type FinancialConnectionsSessionResponse = {
  clientSecret: string;
};

/** Sanitized row from GET /api/stripe/financial-connections-accounts */
export type LinkedFinancialAccount = {
  id: string;
  displayName: string | null;
  institutionName: string | null;
  last4: string | null;
  subcategory: string | null;
  category: string | null;
  status: string | null;
};

export async function createFinancialConnectionsSession(
  accessToken: string
): Promise<FinancialConnectionsSessionResponse> {
  if (!hasBillingApiBaseUrl() || !API_BASE) {
    throw new Error("Billing API is not configured (VITE_API_BASE_URL).");
  }
  const response = await fetch(`${API_BASE}/api/stripe/financial-connections-session`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({}),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error((body as { message?: string }).message || "Could not start bank connection");
  }
  const clientSecret = (body as { clientSecret?: string }).clientSecret;
  if (!clientSecret) {
    throw new Error("Missing client secret from server");
  }
  return { clientSecret };
}

export async function fetchLinkedFinancialAccounts(
  accessToken: string
): Promise<LinkedFinancialAccount[]> {
  if (!hasBillingApiBaseUrl() || !API_BASE) {
    return [];
  }
  const response = await fetch(`${API_BASE}/api/stripe/financial-connections-accounts`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error((body as { message?: string }).message || "Could not load linked accounts");
  }
  const accounts = (body as { accounts?: LinkedFinancialAccount[] }).accounts;
  return Array.isArray(accounts) ? accounts : [];
}

export async function disconnectFinancialAccount(
  accessToken: string,
  accountId: string
): Promise<void> {
  if (!hasBillingApiBaseUrl() || !API_BASE) {
    throw new Error("Billing API is not configured (VITE_API_BASE_URL).");
  }
  const id = encodeURIComponent(accountId);
  const response = await fetch(`${API_BASE}/api/stripe/financial-connections-accounts/${id}/disconnect`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error((body as { message?: string }).message || "Could not remove linked account");
  }
}

/**
 * Opens Stripe Financial Connections. Resolves when the user finishes or cancels (see Stripe.js docs).
 */
export async function collectFinancialConnectionsAccounts(accessToken: string): Promise<{
  error: { message: string } | null;
}> {
  const stripe = await getStripeBrowser();
  if (!stripe) {
    return { error: { message: "Stripe is not configured (missing VITE_STRIPE_PUBLISHABLE_KEY)." } };
  }
  const { clientSecret } = await createFinancialConnectionsSession(accessToken);

  // Stripe.js — Financial Connections collector (see Stripe docs)
  const collector = (
    stripe as unknown as {
      collectFinancialConnectionsAccounts?: (opts: { clientSecret: string }) => Promise<{
        error?: { message?: string };
      }>;
    }
  ).collectFinancialConnectionsAccounts;

  if (typeof collector !== "function") {
    return {
      error: {
        message:
          "This Stripe.js version does not support Financial Connections. Update @stripe/stripe-js.",
      },
    };
  }

  const result = await collector.call(stripe, { clientSecret });
  if (result?.error?.message) {
    return { error: { message: result.error.message } };
  }
  return { error: null };
}
