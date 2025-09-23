import 'dotenv/config'
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing SUPABASE env vars. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.")
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default supabase
  