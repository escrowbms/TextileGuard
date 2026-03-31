import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

// Robust singleton to prevent multiple GoTrueClient instances in Dev Mode
declare global {
  interface Window {
    _supabaseInstance?: SupabaseClient;
  }
}

let supabase: SupabaseClient;

if (typeof window !== 'undefined') {
  if (!window._supabaseInstance) {
    window._supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  supabase = window._supabaseInstance;
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export { supabase };
