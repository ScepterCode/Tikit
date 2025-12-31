import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if Supabase is properly configured
const isConfigured = supabaseUrl && 
                    supabaseAnonKey && 
                    supabaseUrl !== 'https://your-project-id.supabase.co' &&
                    supabaseAnonKey !== 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-actual-anon-key-here';

if (!isConfigured) {
  console.error('🔥 SUPABASE SETUP REQUIRED');
  console.error('Please configure Supabase environment variables:');
  console.error('1. Create a Supabase project at https://supabase.com');
  console.error('2. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to Vercel');
  console.error('3. Run the database schema from SUPABASE_QUICK_SETUP.md');
}

// Create Supabase client for frontend (using anon key)
export const supabase = isConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null;

export default supabase;
