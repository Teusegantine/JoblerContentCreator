import { createClient } from '@supabase/supabase-js';

// Retrieve credentials from environment variables compiled by Vite
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || '';
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Create the Supabase client or default to null if offline
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

if (!isSupabaseConfigured) {
  console.warn(
    "Supabase URL or Anon Key is missing. The extension is running in Offline/Mock Mode, saving logs to chrome.storage.local."
  );
}
