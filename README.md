# dductly

dductly is a simple, secure tool that takes the stress out of tax season by helping people track their donations and write-offs year-round. Instead of scrambling through receipts and emails at the last minute, users log their charitable gifts and deductible expenses as they happen. When tax time comes, dductly generates a clean, exportable report that works with any accountant or tax service, no lock-in to a single platform. With a major gap in the market that leaves millions of individuals and small businesses without a trusted solution, dductly is stepping up by turning everyday giving into real savings, making tax filing easier, smarter, and far less stressful.

### Email confirmation (Supabase)

For "Confirm email" links in signup emails to work, add your redirect URL in **Supabase Dashboard**:

1. Go to **Authentication → URL Configuration → Redirect URLs**.
2. Add:
   - Production: `https://yourdomain.com/confirm-email`
   - Development: `http://localhost:5173/confirm-email`

If this URL is not in the list, users may see a "path is invalid" (or similar) error when they click the confirm link in their email.

### frontend
### backend

**Stripe / billing curl testing:** see [backend/README.md → Stripe curl testing](backend/README.md#stripe-curl-testing).

**Signup + billing message:** set `VITE_API_BASE_URL` in the frontend env to your API (e.g. `http://localhost:3001`) so the post-signup screen can load `/api/billing/config`. Threshold defaults: dev **1**, prod **50** (override with `BILLING_USER_THRESHOLD` on the backend).

### Stripe webhook via Supabase Edge Function

If your backend is primarily Supabase-hosted, use an Edge Function as the Stripe webhook destination.

1. Deploy the function:
   - `supabase functions deploy stripe-webhook`
2. Set required secrets:
   - `supabase secrets set STRIPE_SECRET_KEY=sk_...`
   - `supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...`
   - `supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...`
3. In Stripe Dashboard, create webhook destination:
   - `https://<your-project-ref>.supabase.co/functions/v1/stripe-webhook`
4. Subscribe to these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

This function upserts subscription state into `billing_subscriptions` using `supabase_user_id` metadata.
