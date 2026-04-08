import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPBASE_ANON_KEY;

if (!supabaseUrl) {
  console.error('SUPABASE_URL is not defined in environment variables');
}

if (!supabaseAnonKey) {
  console.error('SUPABASE_ANON_KEY is not defined in environment variables');
}

// Singleton pattern to prevent multiple instances
let supabaseInstance = null;

export const supabase = supabaseInstance || createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Export the URL and key for reference if needed
export { supabaseUrl, supabaseAnonKey };
