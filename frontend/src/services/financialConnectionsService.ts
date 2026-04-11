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

/** Human-readable label for tables (matches Settings-style naming: institution · account · last4). */
export function formatLinkedFinancialAccountLabel(a: LinkedFinancialAccount): string {
  const institution = a.institutionName?.trim() || "Bank";
  const segments = [
    institution,
    a.displayName?.trim() || null,
    a.last4 ? `····${a.last4}` : null,
  ].filter((s): s is string => Boolean(s));
  return segments.join(" · ");
}

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

/**
 * Subscribe linked accounts to Stripe’s transaction subscription (daily refresh + initial pull).
 * Safe to call after each successful link; ignores benign errors.
 * @see https://docs.stripe.com/financial-connections/transactions#subscribe-to-transaction-data
 */
export async function subscribeFinancialConnectionsTransactions(accessToken: string): Promise<void> {
  if (!hasBillingApiBaseUrl() || !API_BASE) {
    return;
  }
  const response = await fetch(`${API_BASE}/api/stripe/financial-connections-subscribe-transactions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    console.warn(
      "Financial Connections transaction subscribe:",
      (body as { message?: string }).message || response.statusText
    );
  }
}

/**
 * Pulls FC transactions from Stripe into Supabase (same data webhooks would write).
 * Call after subscribe; helps when webhooks are not reachable (e.g. localhost).
 */
export async function syncFinancialConnectionsFromStripe(accessToken: string): Promise<void> {
  if (!hasBillingApiBaseUrl() || !API_BASE) {
    return;
  }
  const response = await fetch(`${API_BASE}/api/stripe/financial-connections-sync-from-stripe`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    console.warn(
      "Financial Connections sync from Stripe:",
      (body as { message?: string }).message || response.statusText
    );
  }
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
