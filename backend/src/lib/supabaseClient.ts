import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = (process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_PUBLIC_KEY) as string;
const supabaseServiceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY) as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Warning: Missing Supabase environment variables.');
  console.warn('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (or VITE_SUPABASE_ANON_PUBLIC_KEY) in your .env file.');
}

if (!supabaseServiceRoleKey) {
  console.warn('Warning: Missing service role key. Set SUPABASE_SERVICE_ROLE_KEY (or VITE_SUPABASE_SERVICE_ROLE_KEY).');
}

// Backend prefers service role key when available, with anon fallback for local/dev.
export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey || supabaseAnonKey);

export default supabase;
  