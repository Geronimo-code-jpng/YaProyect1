import { createClient } from "@supabase/supabase-js";

import { ENV } from "../config/env"

export const supabaseUrl = ENV.SUPABASE_URL;
export const supabaseAnonKey = ENV.SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error("❌ SUPABASE_URL is not defined in environment variables");
}

if (!supabaseAnonKey) {
  throw new Error("❌ SUPABASE_ANON_KEY is not defined in environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
