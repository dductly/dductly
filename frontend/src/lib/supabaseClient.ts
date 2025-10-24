import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_PUBLIC_KEY as string;

// Check if environment variables are available
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables not found. Please create a .env.local file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_PUBLIC_KEY for local development.');
  console.warn('For production, these should be set in your Vercel environment variables.');
}

// Create Supabase client with environment-specific options
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      // Auto-refresh tokens
      autoRefreshToken: true,
      // Persist session in localStorage
      persistSession: true,
      // Detect session from URL (for email confirmations)
      detectSessionInUrl: true,
      // Flow type for authentication
      flowType: 'pkce'
    }
  }
);