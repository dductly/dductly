/** Home hero: subscription plans section (title + intro above the plan cards). */
export const SUBSCRIPTION_PLANS_SECTION = {
  title: "Our Subscription Plans",
  subtitle:
    "Unlimited access to expense tracking, income management, financial reporting, and advanced analytics — everything you need to stay organized all year.",
} as const;

export const STANDARD_SUBSCRIPTION_CARD = {
  title: "Standard Subscription",
  monthly: {
    cardTitle: "Billed monthly",
    price: "$7",
    period: "/ month",
    billingLabel: "($84 per year)",
  },
  yearly: {
    cardTitle: "Billed yearly",
    price: "$60",
    period: "/ year",
    billingLabel: "($5 per month)",
  },
} as const;
