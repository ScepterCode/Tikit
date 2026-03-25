/*
Supabase-Only Authentication Context
Pure Supabase authentication without FastAPI hybrid mode
*/

import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';
import { clearAllStorage } from '../utils/clearStorage';

interface AuthUser {
  id: string;
  email: string;
  phoneNumber?: string;
  firstName: string;
  lastName: string;
  state: string;
  role: string;
  walletBalance: number;
  organizationName?: string;
  organizationType?: string;
  isVerified: boolean;
  createdAt: string;
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  signUp: (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    state: string;
    role?: string;
    organizationName?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function SupabaseAuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const initializationRef = useRef(false);
  const subscriptionRef = useRef<any>(null);

  // Helper function to map session user to AuthUser
  const mapSessionToUser = (sessionUser: any): AuthUser => {
    const metadata = sessionUser.user_metadata || {};
    return {
      id: sessionUser.id,
      email: sessionUser.email || '',
      phoneNumber: sessionUser.phone || metadata.phone_number,
      firstName: metadata.first_name || '',
      lastName: metadata.last_name || '',
      state: metadata.state || '',
      role: metadata.role || 'attendee',
      walletBalance: metadata.wallet_balance || 10000,
      organizationName: metadata.organization_name,
      organizationType: metadata.organization_type,
      isVerified: sessionUser.email_confirmed_at !== null,
      createdAt: sessionUser.created_at
    };
  };

  // Initialize authentication state - COMPLETELY disable auto-login
  useEffect(() => {
    if (!supabase || initializationRef.current) {
      return;
    }

    initializationRef.current = true;
    let isMounted = true;

    const initAuth = async () => {
      try {
        console.log('🔐 Initializing auth...');
        
        // SECURITY FIX: Clear any existing sessions and storage immediately
        clearAllStorage();
        await supabase!.auth.signOut({ scope: 'local' });
        
        console.log('🔐 No automatic session loading - user must login explicitly');
        
        if (isMounted) {
          setSession(null);
          setUser(null);
          setLoading(false);
          console.log('✅ Auth initialization complete - no auto-login');
        }
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    // Listen for Supabase auth changes - but ONLY for explicit user actions
    const { data: { subscription } } = supabase!.auth.onAuthStateChange(
      async (event: string, session: Session | null) => {
        console.log('🔐 Auth state changed:', event);
        
        // SECURITY: Only process explicit sign-in from login form
        if (event === 'SIGNED_IN' && session?.user) {
          // Check if this is from an explicit login (not auto-restore)
          const isExplicitLogin = (window as any).__explicitLogin;
          if (isExplicitLogin) {
            console.log('🔐 Explicit sign-in detected');
            const mappedUser = mapSessionToUser(session.user);
            
            console.log(`🔐 SECURITY: User signed in - ${mappedUser.email} (${mappedUser.role}) at ${new Date().toISOString()}`);
            
            if (isMounted) {
              setSession(session);
              setUser(mappedUser);
              setLoading(false);
            }
            
            // Clear the flag
            (window as any).__explicitLogin = false;
          } else {
            console.log('🔐 Ignoring automatic SIGNED_IN event');
            // Force sign out if this wasn't explicit
            await supabase!.auth.signOut({ scope: 'local' });
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('🔐 User signed out');
          if (isMounted) {
            setSession(null);
            setUser(null);
            setLoading(false);
          }
        }
        
        // Ignore all other events to prevent auto-login
        if (event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
          console.log(`🔐 Ignoring ${event} to prevent auto-login`);
          // Force clear session if it tries to auto-restore
          if (session) {
            await supabase!.auth.signOut({ scope: 'local' });
          }
        }
      }
    );

    subscriptionRef.current = subscription;

    return () => {
      isMounted = false;
      subscriptionRef.current?.unsubscribe();
    };
  }, []);

  const signUp = async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    state: string;
    role?: string;
    organizationName?: string;
  }) => {
    try {
      setLoading(true);

      if (!supabase) {
        return { success: false, error: 'Supabase not configured' };
      }

      console.log('📝 Signing up user:', userData.email);

      const { data, error } = await supabase!.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            first_name: userData.firstName,
            last_name: userData.lastName,
            phone_number: userData.phoneNumber,
            state: userData.state,
            role: userData.role || 'attendee',
            organization_name: userData.organizationName,
            wallet_balance: 10000
          }
        }
      });

      if (error) {
        console.error('❌ Signup error:', error);
        return { success: false, error: error.message };
      }

      if (data.user) {
        console.log('✅ User signed up successfully');
        const mappedUser = mapSessionToUser(data.user);
        setUser(mappedUser);
        return { success: true };
      }

      return { success: false, error: 'Signup failed' };
    } catch (error: any) {
      console.error('❌ Signup exception:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);

      if (!supabase) {
        return { success: false, error: 'Supabase not configured' };
      }

      console.log('🔐 Signing in user:', email);

      // Set flag to indicate this is an explicit login
      (window as any).__explicitLogin = true;

      const { data, error } = await supabase!.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('❌ Signin error:', error);
        (window as any).__explicitLogin = false; // Clear flag on error
        
        if (error.message.includes('Email not confirmed')) {
          return { 
            success: false, 
            error: 'Please confirm your email first. Check your inbox for a confirmation link.' 
          };
        }
        
        return { success: false, error: error.message };
      }

      if (data.session) {
        console.log('✅ User signed in successfully');
        // The auth state change handler will process this with the explicit flag
        return { success: true };
      }

      (window as any).__explicitLogin = false; // Clear flag if no session
      return { success: false, error: 'Signin failed' };
    } catch (error: any) {
      console.error('❌ Signin exception:', error);
      (window as any).__explicitLogin = false; // Clear flag on exception
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);

      if (!supabase) return;

      const { error } = await supabase!.auth.signOut();

      if (error) {
        console.error('❌ Signout error:', error);
      } else {
        console.log('✅ User signed out');
        setUser(null);
        setSession(null);
      }
    } catch (error) {
      console.error('❌ Signout exception:', error);
    } finally {
      setLoading(false);
    }
  };

  // Alias for logout (used by components)
  const logout = async () => {
    await signOut();
  };

  const refreshUser = async () => {
    if (session?.user) {
      const mappedUser = mapSessionToUser(session.user);
      setUser(mappedUser);
    }
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    logout,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within SupabaseAuthProvider');
  }
  return context;
}

// Alias for useSupabaseAuth (used by components)
export const useSupabaseAuth = useAuth;
