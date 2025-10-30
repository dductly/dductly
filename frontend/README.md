# dductly Frontend

React + TypeScript frontend application for dductly, a donation tracking and tax deduction management platform.

## Features

- ✅ User authentication with Supabase Auth
- ✅ Real-time authentication state management
- ✅ Responsive design
- ✅ CSV data import functionality
- ✅ Protected routes for authenticated users
- ✅ Modern UI with React

## Prerequisites

- Node.js 18+
- npm or yarn
- A Supabase project ([free tier available](https://supabase.com))

## Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Configure Supabase:**

Create a `.env.local` file in the frontend directory:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_PUBLIC_KEY=your-anon-key-here
```

**Getting Supabase Credentials:**
1. Go to [app.supabase.com](https://app.supabase.com)
2. Create a new project (or select existing)
3. Go to Settings → API
4. Copy:
   - `Project URL` → `VITE_SUPABASE_URL`
   - `anon public` key → `VITE_SUPABASE_ANON_PUBLIC_KEY`

3. **Configure Supabase Email Settings (Optional):**

By default, Supabase requires email confirmation for new signups. You can:

**Option A: Disable email confirmation (for development)**
1. Go to Authentication → Settings
2. Uncheck "Enable email confirmations"

**Option B: Configure email templates**
1. Go to Authentication → Email Templates
2. Set redirect URLs to: `http://localhost:5173`
3. Customize email templates as needed

4. **Run the development server:**
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Authentication Flow

The app uses Supabase Auth for authentication:

1. **Sign Up**: Users create an account with email/password
2. **Email Verification**: Optional email confirmation link
3. **Sign In**: Users authenticate with credentials
4. **Session Management**: Automatic session handling via Supabase
5. **Protected Routes**: Authenticated users can access Import page

## Project Structure

```
frontend/
├── src/
│   ├── components/        # Reusable React components
│   │   ├── CSVUpload.tsx
│   │   └── DataTable.tsx
│   ├── contexts/          # React Context providers
│   │   ├── AuthContext.tsx      # Real Supabase auth
│   │   └── MockAuthContext.tsx  # Mock auth for testing
│   ├── hooks/             # Custom React hooks
│   │   └── useAuth.ts
│   ├── lib/               # Third-party configurations
│   │   └── supabaseClient.ts
│   ├── pages/             # Page components
│   │   ├── Landing.tsx
│   │   ├── Home.tsx
│   │   ├── SignUp.tsx
│   │   ├── SignIn.tsx
│   │   ├── EmailConfirmation.tsx
│   │   ├── Import.tsx
│   │   ├── Services.tsx
│   │   └── Contact.tsx
│   ├── services/          # API services
│   │   └── contactService.ts
│   ├── img/               # Images and assets
│   ├── App.tsx            # Main app component
│   ├── main.tsx           # App entry point
│   └── style.css          # Global styles
├── public/                # Static assets
├── .env.local             # Environment variables (create this)
├── .env.example           # Environment template
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Key Components

### AuthContext
Manages authentication state and provides auth methods:
- `signUp(email, password, firstName, lastName)`
- `signIn(email, password)`
- `signOut()`
- `user` - Current user object
- `session` - Current session
- `loading` - Loading state

### useAuth Hook
Custom hook to access auth context:
```tsx
import { useAuth } from './hooks/useAuth';

function MyComponent() {
  const { user, signIn, signOut } = useAuth();
  // ...
}
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_PUBLIC_KEY` | Your Supabase anon/public key | Yes |

## Supabase Configuration

### Email Authentication Setup

1. **Enable Email Provider:**
   - Go to Authentication → Providers
   - Email should be enabled by default

2. **Configure Site URL:**
   - Go to Authentication → URL Configuration
   - Site URL: `http://localhost:5173` (development) or your production URL
   - Redirect URLs: Add `http://localhost:5173/**` and your production URLs

3. **Email Templates:**
   - Customize in Authentication → Email Templates
   - Update redirect URLs in templates

### User Metadata

The app stores user metadata in Supabase:
```typescript
{
  first_name: string,
  last_name: string
}
```

Access via: `user.user_metadata.first_name`

## Development Notes

### Switching Between Mock and Real Auth

The app is currently configured to use real Supabase Auth. If you need to use mock authentication for testing:

1. In `src/App.tsx`:
```tsx
// Change from:
import { AuthProvider } from "./contexts/AuthContext";

// To:
import { AuthProvider } from "./contexts/MockAuthContext";
```

2. In `src/hooks/useAuth.ts`:
```tsx
// Change from:
import { AuthContext } from '../contexts/AuthContext';

// To:
import { useAuthFromContext } from '../contexts/MockAuthContext';
export const useAuth = useAuthFromContext;
```

### Protected Routes

To protect a route, use the `useAuth` hook:

```tsx
const MyProtectedPage = () => {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Please sign in</div>;
  
  return <div>Protected content</div>;
};
```

## Deployment

### Build for Production

```bash
npm run build
```

The build output will be in the `dist/` directory.

### Environment Variables (Production)

Set these in your hosting provider (Vercel, Netlify, etc.):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_PUBLIC_KEY`

### Supabase Production Settings

1. Update Site URL and Redirect URLs in Supabase to your production domain
2. Configure email templates with production URLs
3. Consider enabling email confirmations in production

## Troubleshooting

### "Unable to connect to authentication service"
- Check that environment variables are set correctly
- Verify Supabase project is active
- Check browser console for detailed errors

### Email confirmation not working
- Verify email provider is enabled in Supabase
- Check spam folder
- Verify redirect URLs are correct
- For development, consider disabling email confirmation

### CORS errors
- Update Site URL in Supabase dashboard
- Add your domain to allowed redirect URLs

### Session not persisting
- Check browser localStorage (should have `supabase.auth.token`)
- Verify anon key is correct
- Check if cookies/localStorage are blocked

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Supabase** - Backend and authentication
- **React Context** - State management
- **CSS3** - Styling

## License

MIT
