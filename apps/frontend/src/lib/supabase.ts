import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Supabase Debug Info:');
console.log('URL:', supabaseUrl);
console.log('Key length:', supabaseAnonKey?.length || 0);
console.log('Key starts with eyJ:', supabaseAnonKey?.startsWith('eyJ') || false);
console.log('URL includes .supabase.co:', supabaseUrl?.includes('.supabase.co') || false);

// Check if Supabase is properly configured
const isConfigured = supabaseUrl && 
                    supabaseAnonKey && 
                    supabaseUrl.trim() !== '' &&
                    supabaseAnonKey.trim() !== '' &&
                    supabaseUrl.includes('.supabase.co') &&
                    supabaseAnonKey.startsWith('eyJ') &&
                    !supabaseUrl.includes('YOUR-ACTUAL-PROJECT-ID') &&
                    !supabaseAnonKey.includes('YOUR-ACTUAL-ANON-KEY');

console.log('🔍 Validation Results:');
console.log('isConfigured:', isConfigured);

if (!isConfigured) {
  console.error('🔥 SUPABASE SETUP REQUIRED');
  console.error('Please configure Supabase environment variables');
  console.error('Current URL:', supabaseUrl);
  console.error('Current Key length:', supabaseAnonKey?.length || 0);
}

// Create Supabase client for frontend (using anon key)
// Use a singleton pattern to prevent multiple client instances
let supabaseInstance: any = null;

function createSupabaseClient() {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  if (!isConfigured) {
    return null;
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce'
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
    global: {
      headers: {
        'X-Client-Info': 'grooovy-frontend@1.0.0',
      },
    },
  });

  console.log('✅ Supabase client created');
  return supabaseInstance;
}

export const supabase = createSupabaseClient();

export default supabase;