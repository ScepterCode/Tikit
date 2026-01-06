import { ReactNode } from 'react';
import { SupabaseAuthProvider } from './SupabaseAuthContext';

// PRODUCTION MODE: Always use Supabase, never localhost
// const IS_PRODUCTION = import.meta.env.PROD || window.location.hostname !== 'localhost';

// Production Auth Provider - Supabase Only
export function ProductionAuthProvider({ children }: { children: ReactNode }) {
  console.log('🚀 Production Mode: Using Supabase Authentication');
  
  // Always use Supabase in production - no localhost dependencies
  return <SupabaseAuthProvider>{children}</SupabaseAuthProvider>;
}

// Export Supabase auth as the primary auth method
export { useSupabaseAuth as useAuth } from './SupabaseAuthContext';

// Universal auth hook for production
export function useProductionAuth() {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const supabaseAuth = require('./SupabaseAuthContext').useSupabaseAuth();
  return {
    ...supabaseAuth,
    // Add compatibility methods for existing code
    adminLogin: supabaseAuth.login, // Supabase handles roles via RLS
    refreshAuth: async () => true, // Supabase handles token refresh automatically
  };
}