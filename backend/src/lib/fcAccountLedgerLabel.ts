/**
 * Human-readable bank account line for ledger UI (matches frontend `formatLinkedFinancialAccountLabel`).
 * Stored on each `financial_connection_transactions` row at sync time so labels work without Stripe list calls.
 */
export function buildFcAccountLedgerLabel(acc: {
  institution_name?: string | null;
  display_name?: string | null;
  last4?: string | null;
}): string {
  const institution = acc.institution_name?.trim() || "Bank";
  const segments = [
    institution,
    acc.display_name?.trim() || null,
    acc.last4 ? `····${acc.last4}` : null,
  ].filter((s): s is string => Boolean(s));
  return segments.join(" · ");
}
