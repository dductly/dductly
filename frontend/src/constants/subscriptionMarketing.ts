/** Home hero: subscription plans section (title + intro above the plan cards). */
export const SUBSCRIPTION_PLANS_SECTION = {
  title: "Our Subscription Plans",
  subtitle:
    "Unlimited access to expense tracking, income management, financial reporting, and advanced analytics — everything you need to stay organized all year.",
} as const;

/** Stored in `profiles.subscription` for users with lifetime free access. */
export const PROFILE_SUBSCRIPTION_TIER_FREE_FOR_LIFE = "free_for_life" as const;

/** During Stripe trial (`trialing`); switches to standard_* after first paid period. */
export const PROFILE_SUBSCRIPTION_FREE_TRIAL = "free_trial" as const;

/** After trial ends and subscription is `active` (paid). */
export const PROFILE_SUBSCRIPTION_STANDARD_MONTHLY = "standard_monthly" as const;
export const PROFILE_SUBSCRIPTION_STANDARD_YEARLY = "standard_yearly" as const;

/** Display label for that tier (matches home hero plan card). */
export const FREE_FOR_LIFE_DISPLAY_NAME = "Free for Life";

export const STANDARD_SUBSCRIPTION_CARD = {
  title: "Standard Subscription",
  monthly: {
    cardTitle: "Billed monthly",
    price: "$8.50",
    period: "/ month",
  },
  yearly: {
    cardTitle: "Billed yearly",
    price: "$78",
    period: "/ year",
  },
} as const;
