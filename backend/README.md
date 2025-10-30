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

## API Endpoints

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
