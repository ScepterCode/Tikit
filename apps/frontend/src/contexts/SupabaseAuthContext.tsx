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

  // Initialize authentication state - Allow proper session persistence
  useEffect(() => {
    if (!supabase || initializationRef.current) {
      return;
    }

    initializationRef.current = true;
    let isMounted = true;

    const initAuth = async () => {
      try {
        console.log('🔐 Initializing auth...');
        
        // Get current session without clearing it
        const { data: { session }, error } = await supabase!.auth.getSession();
        
        if (error) {
          console.error('❌ Session error:', error);
        }
        
        if (session?.user && isMounted) {
          console.log('🔐 Found existing session for:', session.user.email);
          const mappedUser = mapSessionToUser(session.user);
          setSession(session);
          setUser(mappedUser);
          // Set global user role for navigation
          (window as any).__userRole = mappedUser.role;
        }
        
        if (isMounted) {
          setLoading(false);
          console.log('✅ Auth initialization complete');
        }
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    // Listen for Supabase auth changes
    const { data: { subscription } } = supabase!.auth.onAuthStateChange(
      async (event: string, session: Session | null) => {
        console.log('🔐 Auth state changed:', event);
        
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('🔐 User signed in:', session.user.email);
          const mappedUser = mapSessionToUser(session.user);
          
          if (isMounted) {
            setSession(session);
            setUser(mappedUser);
            setLoading(false);
            // Set global user role for navigation
            (window as any).__userRole = mappedUser.role;
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('🔐 User signed out');
          if (isMounted) {
            setSession(null);
            setUser(null);
            setLoading(false);
          }
        } else if (event === 'TOKEN_REFRESHED' && session) {
          console.log('🔐 Token refreshed');
          const mappedUser = mapSessionToUser(session.user);
          if (isMounted) {
            setSession(session);
            setUser(mappedUser);
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

      const { data, error } = await supabase!.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('❌ Signin error:', error);
        
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
        return { success: true };
      }

      return { success: false, error: 'Signin failed' };
    } catch (error: any) {
      console.error('❌ Signin exception:', error);
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
