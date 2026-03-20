# dductly Backend API

Backend API server for the dductly application, built with Express and Supabase Auth.

## Features

- ✅ User authentication (signup, signin, signout)
- ✅ JWT token verification middleware
- ✅ User profile management
- ✅ Password reset functionality
- ✅ Secure API endpoints with Supabase Auth
- ✅ TypeScript support
- ✅ CORS and security headers

## Prerequisites

- Node.js 18+ 
- npm or yarn
- A Supabase project (free tier available at [supabase.com](https://supabase.com))

## Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Configure environment variables:**

Create a `.env` file in the backend directory:

```bash
cp .env.example .env
```

Then update the values in `.env`:

```env
# Server Configuration
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Optional: For admin operations
# SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**Getting Supabase Credentials:**
1. Go to [app.supabase.com](https://app.supabase.com)
2. Select your project
3. Go to Settings → API
4. Copy the `Project URL` and `anon public` key

3. **Run the development server:**
```bash
npm run dev
```

The server will start on `http://localhost:3001`

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server

<a id="stripe-curl-testing"></a>
## Testing Stripe checkout & webhooks (curl)

Use this flow when the billing UI is not wired yet. It creates a real Checkout Session and triggers your **Supabase** `stripe-webhook` function (or you can watch Stripe → Webhooks → event deliveries).

### Prerequisites

- **Stripe test mode:** `STRIPE_SECRET_KEY=sk_test_...`, test `price_...` IDs, and a **test-mode** webhook endpoint + `STRIPE_WEBHOOK_SECRET` (live vs test secrets differ).
- Backend running: `npm run dev` (default `http://localhost:3001`). If port is busy, use `PORT=3002 npm run dev` and change URLs below.
- `.env` in `backend/` includes `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (or `VITE_SUPABASE_ANON_PUBLIC_KEY`), and `STRIPE_SECRET_KEY`.
- Table `billing_subscriptions` exists (see `database-billing-setup.sql` in repo root).

### 1) Load env vars into your shell (optional but handy)

From `backend/`:

```bash
cd backend
set -a && source .env && set +a
```

Verify anon key is loaded (should print a short prefix, not empty):

```bash
echo "${VITE_SUPABASE_ANON_KEY:0:20}"
```

### 2) Get a Supabase access token (password grant)

Replace `YOUR_PROJECT_REF`, email, and password. Use your real **anon** key in `apikey` (not placeholders like `YOUR_SUPABASE_ANON_KEY`).

```bash
curl -s -X POST "https://YOUR_PROJECT_REF.supabase.co/auth/v1/token?grant_type=password" \
  -H "apikey: $VITE_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"your-password"}'
```

Copy only the **`access_token`** string from the JSON (the long JWT), not the whole JSON.

**With `jq`** (extract token in one step):

```bash
ACCESS_TOKEN=$(curl -s -X POST "https://YOUR_PROJECT_REF.supabase.co/auth/v1/token?grant_type=password" \
  -H "apikey: $VITE_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"your-password"}' | jq -r '.access_token')
echo "$ACCESS_TOKEN"
```

Tokens expire (often ~1 hour). If checkout returns `401`, run step 2 again.

### 3) Create a Stripe Checkout Session

Use the JWT from step 2 — header value is `Bearer <jwt>` only, no JSON wrapper.

```bash
curl -s -X POST "http://localhost:3001/api/stripe/create-checkout-session" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com"}'
```

Response includes a `url`. Open it in a browser and pay with a **test** card, e.g. `4242 4242 4242 4242`.

### 4) Confirm the webhook ran

- **Stripe:** Developers → Webhooks → your endpoint → recent events → should show **2xx**.
- **Supabase:** SQL editor — query `billing_subscriptions` for your user after checkout completes.

### 5) Optional: subscription status (authenticated)

```bash
curl -s "http://localhost:3001/api/stripe/subscription-status" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### Troubleshooting

| Symptom | Likely fix |
|--------|------------|
| `curl: (7) Failed to connect to localhost:3001` | Start `npm run dev` or free port / use correct `PORT`. |
| `Invalid API key` / `No API key found` | Use real anon key; run `source .env` from `backend/`. |
| `Billing Not Configured` / missing Stripe key | `STRIPE_SECRET_KEY` in `backend/.env`; **restart** server after editing `.env`. |
| Test card rejected in Checkout | You are on **live** keys; switch to test keys + test prices + test webhook secret. |
| `URL rejected: Bad hostname` | Replace `YOUR_PROJECT_REF` with real ref (no `<` `>` in URL). |

### Signup success screen (frontend)

After sign-up, the app calls **`GET /api/billing/config`** if `VITE_API_BASE_URL` is set in `frontend/.env` or `.env.local`, e.g.:

```env
VITE_API_BASE_URL=http://localhost:3001
```

### Billing rollout threshold

- Env: **`BILLING_USER_THRESHOLD`** (optional).
- If **unset**: **development** defaults to **1** (easy testing); **production** defaults to **50**.
- Set explicitly in any environment to override, e.g. `BILLING_USER_THRESHOLD=3`.

`POST /api/stripe/create-checkout-session` uses the same threshold as `/api/billing/config`.

**Checkout body:** `{ "email": "user@example.com", "plan": "monthly" | "yearly" }` (`plan` defaults to `monthly` if omitted).

## API Endpoints

### Billing

#### GET `/api/billing/config`
Public. Returns rollout status and profile count used for signup messaging and gating.

**Response (example):**
```json
{
  "billingEnabled": true,
  "userCount": 12,
  "userThreshold": 1,
  "hasStripeConfig": true,
  "availablePlans": { "monthly": true, "yearly": true }
}
```

### Authentication

#### POST `/api/auth/signup`
Create a new user account.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "firstName": "John",
  "lastName": "Doe"
}
```

#### POST `/api/auth/signin`
Sign in with email and password.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

#### POST `/api/auth/signout`
Sign out the current user (requires authentication).

**Headers:**
```
Authorization: Bearer <access_token>
```

#### POST `/api/auth/refresh`
Refresh the session token.

**Body:**
```json
{
  "refresh_token": "your-refresh-token"
}
```

#### POST `/api/auth/reset-password`
Request a password reset email.

**Body:**
```json
{
  "email": "user@example.com"
}
```

#### GET `/api/auth/verify`
Verify the current token and return user info.

**Headers:**
```
Authorization: Bearer <access_token>
```

### User Profile

#### GET `/api/user/profile`
Get the current user's profile (requires authentication).

**Headers:**
```
Authorization: Bearer <access_token>
```

#### PUT `/api/user/profile`
Update the current user's profile (requires authentication).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith"
}
```

#### POST `/api/user/change-password`
Change the current user's password (requires authentication).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Body:**
```json
{
  "newPassword": "newsecurepassword"
}
```

#### DELETE `/api/user/account`
Delete the current user's account (requires authentication and admin key).

**Headers:**
```
Authorization: Bearer <access_token>
```

### Health Check

#### GET `/health`
Check if the API is running.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Authentication Flow

1. **Signup/Signin**: User signs up or signs in through the frontend
2. **Token Storage**: Frontend stores the JWT access token
3. **API Requests**: Frontend sends the token in the Authorization header
4. **Token Verification**: Backend middleware verifies the token with Supabase
5. **Protected Routes**: User data is attached to the request object

## Security Features

- Helmet.js for security headers
- CORS configuration
- JWT token verification
- Password hashing handled by Supabase
- Rate limiting (recommended to add)

## Supabase Configuration

### Email Templates (Optional)

You can customize email templates in Supabase:

1. Go to Authentication → Email Templates
2. Customize confirmation, password reset, and other emails
3. Set the redirect URLs to match your frontend

### Row Level Security (RLS)

If you create custom tables, enable RLS policies:

```sql
-- Example: Enable RLS on a custom table
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;

-- Example: Policy to allow users to read their own data
CREATE POLICY "Users can read own data" ON your_table
  FOR SELECT USING (auth.uid() = user_id);
```

## Project Structure

```
backend/
├── src/
│   ├── lib/
│   │   └── supabaseClient.ts    # Supabase client configuration
│   ├── middleware/
│   │   └── auth.ts               # Authentication middleware
│   ├── routes/
│   │   ├── auth.ts               # Authentication routes
│   │   └── user.ts               # User profile routes
│   └── index.ts                  # Main server file
├── .env.example                  # Environment variables template
├── package.json
├── tsconfig.json
└── README.md
```

## Deployment

### Vercel / Netlify Functions

The backend can be deployed as serverless functions or as a containerized API.

### Environment Variables (Production)

Make sure to set these in your hosting provider:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `FRONTEND_URL` (your production frontend URL)
- `NODE_ENV=production`

## Troubleshooting

### "Missing SUPABASE env vars" error
Make sure your `.env` file exists and contains valid Supabase credentials.

### CORS errors
Update the `FRONTEND_URL` in your `.env` file to match your frontend URL.

### Authentication fails
- Check that your Supabase project is active
- Verify the API keys are correct
- Ensure email confirmation is disabled (or confirm emails) in Supabase

## License

MIT
