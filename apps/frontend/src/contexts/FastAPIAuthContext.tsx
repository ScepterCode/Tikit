/*
FastAPI Authentication Context
Hybrid authentication using both FastAPI backend and Supabase
*/

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { apiService } from '../services/api';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';

interface AuthUser {
  id: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  email?: string;
  state: string;
  role: string;
  walletBalance: number;
  referralCode: string;
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
    phoneNumber: string;
    password: string;
    firstName: string;
    lastName: string;
    email?: string;
    state: string;
    role?: string;
    organizationName?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  signIn: (phoneNumber: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function FastAPIAuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize authentication state
  useEffect(() => {
    initializeAuth();
    
    if (!supabase) {
      setLoading(false);
      return;
    }
    
    // Listen for Supabase auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        setSession(session);
        
        if (session?.user) {
          await fetchUserFromAPI();
        } else {
          setUser(null);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const initializeAuth = async () => {
    try {
      if (!supabase) {
        setLoading(false);
        return;
      }

      // Get current Supabase session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
        setLoading(false);
        return;
      }

      setSession(session);

      if (session?.user) {
        await fetchUserFromAPI();
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserFromAPI = async () => {
    try {
      const response = await apiService.getCurrentUser();
      
      if (response.success && response.data) {
        const backendUser = response.data;
        setUser({
          id: backendUser.id,
          phoneNumber: backendUser.phone_number,
          firstName: backendUser.first_name,
          lastName: backendUser.last_name,
          email: backendUser.email,
          state: backendUser.state,
          role: backendUser.role,
          walletBalance: backendUser.wallet_balance || 0,
          referralCode: backendUser.referral_code || '',
          organizationName: backendUser.organization_name,
          organizationType: backendUser.organization_type,
          isVerified: backendUser.is_verified || false,
          createdAt: backendUser.created_at
        });
      } else {
        console.error('Failed to fetch user from API:', response.error);
        // If API fails, try to get basic info from Supabase
        if (supabase) {
          const { data: { user: supabaseUser } } = await supabase.auth.getUser();
          if (supabaseUser) {
            // Create minimal user object from Supabase data
            setUser({
              id: supabaseUser.id,
              phoneNumber: supabaseUser.phone || '',
              firstName: supabaseUser.user_metadata?.firstName || '',
              lastName: supabaseUser.user_metadata?.lastName || '',
              email: supabaseUser.email || '',
              state: supabaseUser.user_metadata?.state || '',
              role: supabaseUser.user_metadata?.role || 'attendee',
              walletBalance: 0,
              referralCode: '',
              isVerified: supabaseUser.email_confirmed_at !== null,
              createdAt: supabaseUser.created_at
            });
          }
        }
      }
    } catch (error) {
      console.error('Error fetching user from API:', error);
    }
  };

  const signUp = async (userData: {
    phoneNumber: string;
    password: string;
    firstName: string;
    lastName: string;
    email?: string;
    state: string;
    role?: string;
    organizationName?: string;
  }) => {
    try {
      setLoading(true);

      console.log('🔍 Registration Debug:');
      console.log('- Input userData:', userData);
      console.log('- Selected role:', userData.role);

      // First, register with FastAPI backend
      const apiResponse = await apiService.register(userData);
      
      console.log('- API Response:', apiResponse);

      if (!apiResponse.success) {
        return {
          success: false,
          error: apiResponse.error?.message || 'Registration failed'
        };
      }

      // Then create Supabase auth user
      if (supabase) {
        console.log('🔍 Creating Supabase user with metadata...');
        const { error } = await supabase.auth.signUp({
        email: userData.email || `${userData.phoneNumber}@grooovy.temp`,
        password: userData.password,
        phone: userData.phoneNumber,
        options: {
          data: {
            firstName: userData.firstName,
            lastName: userData.lastName,
            state: userData.state,
            role: userData.role || 'attendee', // Ensure role is always set
            organizationName: userData.organizationName
          }
        }
      });

        if (error) {
          console.error('Supabase signup error:', error);
          // API registration succeeded but Supabase failed
          // This is okay for hybrid mode
        } else {
          console.log('✅ Supabase user created successfully');
        }
      }

      // Set user data from API response
      if (apiResponse.data?.user) {
        const backendUser = apiResponse.data.user;
        const mappedUser = {
          id: backendUser.id,
          phoneNumber: backendUser.phone_number,
          firstName: backendUser.first_name,
          lastName: backendUser.last_name,
          email: backendUser.email,
          state: backendUser.state,
          role: backendUser.role,
          walletBalance: backendUser.wallet_balance || 0,
          referralCode: backendUser.referral_code || '',
          organizationName: backendUser.organization_name,
          organizationType: backendUser.organization_type,
          isVerified: backendUser.is_verified || false,
          createdAt: backendUser.created_at
        };
        console.log('✅ Setting user after registration:', mappedUser);
        console.log('- Final user role:', mappedUser.role);
        setUser(mappedUser);
      }

      return { success: true };

    } catch (error: any) {
      console.error('❌ Signup error:', error);
      return {
        success: false,
        error: error.message || 'Registration failed'
      };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (phoneNumber: string, password: string) => {
    try {
      setLoading(true);

      // First, authenticate with FastAPI backend
      const apiResponse = await apiService.login({ phoneNumber, password });
      
      if (!apiResponse.success) {
        return {
          success: false,
          error: apiResponse.error?.message || 'Login failed'
        };
      }

      // Then sign in to Supabase
      if (supabase) {
        const email = apiResponse.data?.user?.email || `${phoneNumber}@grooovy.temp`;
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) {
          console.error('Supabase signin error:', error);
          // API login succeeded but Supabase failed
          // This is okay for hybrid mode, set user from API
          if (apiResponse.data?.user) {
            setUser(apiResponse.data.user);
          }
        } else {
          // Both succeeded, user will be set via auth state change
          setSession(data.session);
        }
      } else {
        // No Supabase, just use API data
        if (apiResponse.data?.user) {
          const backendUser = apiResponse.data.user;
          const mappedUser = {
            id: backendUser.id,
            phoneNumber: backendUser.phone_number,
            firstName: backendUser.first_name,
            lastName: backendUser.last_name,
            email: backendUser.email,
            state: backendUser.state,
            role: backendUser.role,
            walletBalance: backendUser.wallet_balance || 0,
            referralCode: backendUser.referral_code || '',
            organizationName: backendUser.organization_name,
            organizationType: backendUser.organization_type,
            isVerified: backendUser.is_verified || false,
            createdAt: backendUser.created_at
          };
          setUser(mappedUser);
        }
      }

      return { success: true };

    } catch (error: any) {
      console.error('Signin error:', error);
      return {
        success: false,
        error: error.message || 'Login failed'
      };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);

      // Sign out from both FastAPI and Supabase
      const promises: Promise<any>[] = [apiService.logout()];
      if (supabase) {
        promises.push(supabase.auth.signOut());
      }
      await Promise.all(promises);

      setUser(null);
      setSession(null);

    } catch (error) {
      console.error('Signout error:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    if (session?.user) {
      await fetchUserFromAPI();
    }
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useFastAPIAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useFastAPIAuth must be used within a FastAPIAuthProvider');
  }
  return context;
}

// Compatibility hook for existing components
export function useAuth() {
  return useFastAPIAuth();
}