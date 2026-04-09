/**
 * Canonical legal copy for the website, in-app modals, and App Store / privacy disclosures.
 * Update this file when practices change; public URLs are /privacy, /terms, and /support.
 */

export const LEGAL_LAST_UPDATED = "April 9, 2026";

export type LegalSection = {
  title: string;
  paragraphs: string[];
  listItems?: string[];
};

export const TERMS_OF_SERVICE_SECTIONS: LegalSection[] = [
  {
    title: "1. Acceptance of Terms",
    paragraphs: [
      "By accessing and using dductly, you accept and agree to be bound by the terms and provisions of this agreement.",
    ],
  },
  {
    title: "2. Use of Service",
    paragraphs: [
      "dductly provides expense tracking and financial management tools for small business owners. You agree to use the service only for lawful purposes and in accordance with these Terms.",
    ],
  },
  {
    title: "3. User Accounts",
    paragraphs: [
      "You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.",
    ],
  },
  {
    title: "4. Data and Privacy",
    paragraphs: [
      "Your use of dductly is also governed by our Privacy Policy. We collect and use your data to provide and improve our services.",
    ],
  },
  {
    title: "5. Intellectual Property",
    paragraphs: [
      "The service and its original content, features, and functionality are owned by dductly and are protected by international copyright, trademark, and other intellectual property laws.",
      'Free icons from Streamline (https://www.streamlinehq.com/).',
    ],
  },
  {
    title: "6. Limitation of Liability",
    paragraphs: [
      "dductly shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service.",
    ],
  },
  {
    title: "7. Changes to Terms",
    paragraphs: [
      "We reserve the right to modify these terms at any time. We will notify users of any changes by posting the new Terms of Service on this page.",
    ],
  },
  {
    title: "8. Contact Information",
    paragraphs: [
      "If you have any questions about these Terms, please contact us through our Support page or the contact form on our website.",
    ],
  },
];

export const PRIVACY_POLICY_SECTIONS: LegalSection[] = [
  {
    title: "1. Information We Collect",
    paragraphs: [
      "We collect information you provide directly to us, including your name, email address, phone number, and business financial data you choose to track (for example expenses, income, mileage, categories, and notes).",
      "If you upload receipts, attachments, or other files, we store that content so you can access it in your account.",
      "We use Supabase for authentication, application data (hosted PostgreSQL), and file storage. Supabase processes personal data as a service provider under their terms and privacy policy.",
      "If you use our website, we and our analytics provider may collect usage data (like page views and product interactions) as described in the Analytics and cookies section below.",
      "If you use our mobile app (including the iOS app), we may send push notifications when you opt in, for example for account, security, or product messages. You can turn off notifications in your device settings.",
      "If you use our mobile app to attach receipts or documents, we may access photos only when you choose them through the system photo picker or camera. We do not access your full photo library beyond the images you explicitly select.",
      "dductly is designed to give you a single view of your business finances, and connecting your banks and other financial institutions is a central part of that experience. When you link an account, we work with Stripe (and, where applicable, Stripe's partners that facilitate financial institution connections) to verify the connection and retrieve transaction-related information. That typically includes transaction descriptions, amounts, dates, merchant or counterparty names, account or routing identifiers, institution name, and similar details we need to display, categorize, and reconcile your activity in one dashboard. You authorize each connection through Stripe's secure linking flow; we only receive data for accounts you explicitly connect.",
      "We store linked transaction and institution data in your account alongside information you enter manually. You can disconnect a linked institution at any time; we then stop receiving new data from it. We may retain historical linked data until you request deletion or as required by law and legitimate business needs.",
    ],
  },
  {
    title: "2. How We Use Your Information",
    paragraphs: ["We use the information we collect to:"],
    listItems: [
      "Provide, maintain, and improve our services",
      "Process and complete transactions and subscriptions (including through Stripe)",
      "Pull in, display, and organize linked bank and financial institution transactions in your dashboard together with records you add manually",
      "Authenticate your account and keep it secure",
      "Send you technical notices, support messages, and (where you allow) notifications",
      "Respond to your comments and questions",
      "Understand usage and improve user experience (including through analytics on the web and in the app, as applicable)",
    ],
  },
  {
    title: "3. Service Providers and Subprocessors",
    paragraphs: [
      "We use trusted third parties to operate the service. Depending on how you use dductly, this may include:",
    ],
    listItems: [
      "Supabase — authentication, database, and file storage",
      "Stripe — subscription billing and payment processing; and financial institution connections (including verifying linked accounts, retrieving transaction data, and maintaining those connections) through Stripe and its partners as applicable",
      "PostHog — product analytics and event data (we configure our integration to reduce sensitive data)",
      "Email and notification delivery providers when we send transactional or support email",
    ],
  },
  {
    title: "4. Information Sharing",
    paragraphs: [
      "We do not sell your personal information. We may share your information only in the following circumstances:",
    ],
    listItems: [
      "With service providers who process data on our behalf (listed above), subject to appropriate safeguards",
      "With your consent",
      "To comply with legal obligations",
      "To protect our rights and prevent fraud",
    ],
  },
  {
    title: "5. Data Security",
    paragraphs: [
      "We implement appropriate technical and organizational measures to protect your personal data against unauthorized or unlawful processing and accidental loss, destruction, or damage. No method of transmission over the Internet is completely secure.",
    ],
  },
  {
    title: "6. Your Rights",
    paragraphs: [
      "You may access, update, or delete much of your personal information through your account settings. You may also contact us to exercise applicable privacy rights, subject to verification and applicable law.",
    ],
  },
  {
    title: "7. Cookies and Similar Technologies (Web)",
    paragraphs: [
      "On our website, we use cookies and similar technologies as needed for the service to function and to understand usage. Analytics tools may set cookies or use local storage in accordance with their policies.",
    ],
  },
  {
    title: "8. Children's Privacy",
    paragraphs: [
      "Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13.",
    ],
  },
  {
    title: "9. Changes to This Policy",
    paragraphs: [
      "We may update our Privacy Policy from time to time. We will post the updated policy on this page and update the \"Last Updated\" date.",
    ],
  },
  {
    title: "10. Contact Us",
    paragraphs: [
      "If you have any questions about this Privacy Policy, please use our Support page or the contact form on our website.",
    ],
  },
];

/** Short reference for App Store Connect “App Privacy” / privacy nutrition labels — align questionnaire answers with this list. */
export const APP_PRIVACY_DATA_TYPES_SUMMARY = [
  "Contact info: name, email address, phone number (account and support)",
  "User content: business financial entries, notes, mileage logs, uploaded files and receipts (including photos you choose in the mobile app)",
  "Financial info: linked bank and institution transaction data via Stripe (e.g. amounts, dates, descriptions, institution identifiers) for the unified dashboard",
  "Identifiers: user/account IDs used with Supabase authentication",
  "Usage data and diagnostics: product analytics (PostHog), and similar events on web/app as configured",
  "Payments: subscription status processed by Stripe (we do not store full card numbers on our servers)",
] as const;
