import { createClient } from "@supabase/supabase-js";

export const supabaseUrl = process.env.SUPABASE_URL;
export const supabaseAnonKey = process.env.SUPBASE_ANON_KEY;

if (!supabaseUrl) {
  console.error('❌ SUPABASE_URL is not defined in environment variables');
}

if (!supabaseAnonKey) {
  console.error('❌ SUPBASE_ANON_KEY is not defined in environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
