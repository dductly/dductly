export const getStripePriceAvailability = (): { monthly: boolean; yearly: boolean } => ({
  monthly: Boolean(process.env.STRIPE_PRICE_ID_MONTHLY),
  yearly: Boolean(process.env.STRIPE_PRICE_ID_YEARLY),
});
