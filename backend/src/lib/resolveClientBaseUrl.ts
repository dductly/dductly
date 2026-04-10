/** Public web origin for Stripe return URLs (Financial Connections, etc.). */
export const resolveClientBaseUrl = (): string | null => {
  const clientBase = (
    process.env.NODE_ENV !== "production" ? process.env.FRONTEND_URL : process.env.CLIENT_URL
  )?.replace(/\/$/, "");
  const clientBaseFallback = (process.env.CLIENT_URL || process.env.FRONTEND_URL || "").replace(/\/$/, "");
  return clientBase || clientBaseFallback || null;
};
