import { createClient } from "@supabase/supabase-js";

const supabaseClient = createClient(
  "https://vcbqhwxlwmhwdbcplgbj.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjYnFod3hsd21od2RiY3BsZ2JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NDI4MzAsImV4cCI6MjA5MDAxODgzMH0.8gB7gNCVHOhQTuk2qWFgGvdpxZXHAc9LsIRST3fcMiA",
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