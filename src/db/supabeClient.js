import { createClient } from "@supabase/supabase-js";
import { supabaseUrl, supabaseAnonKey } from "../lib/supabase";

const supabaseClient = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      storage: window.localStorage,
      storageKey: 'supabase.auth.token',
      autoRefreshToken: true,
      detectSessionInUrl: true,
      debug: false,
      flowType: 'pkce',
      sessionTimeout: 86400, // 24 hours in seconds
    }
  }
);

export { supabaseClient };