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
    
    // SOLUTION 3: Prevent auth state change from overwriting role immediately after login
    let isInitialLoad = true;
    
    // Listen for Supabase auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        setSession(session);
        
        if (session?.user) {
          // SOLUTION 3: Don't fetch from API immediately after sign-in
          // The signIn/signUp methods already set the user with correct role
          if (event === 'SIGNED_IN' && !isInitialLoad) {
            console.log('⚠️ SIGNED_IN event detected, skipping API fetch to preserve role from login response');
            // Don't call fetchUserFromAPI here - it would overwrite the role
            // The user is already set by signIn() with the correct role
          } else if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED' || isInitialLoad) {
            console.log('🔄 Fetching user data from API due to:', event);
            await fetchUserFromAPI();
          }
        } else {
          setUser(null);
          localStorage.removeItem('userRole'); // Clear stored role on logout
        }
        
        isInitialLoad = false;
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
        
        // SOLUTION 2: Persist role in localStorage
        if (mappedUser.role) {
          localStorage.setItem('userRole', mappedUser.role);
          console.log('✅ Role persisted to localStorage:', mappedUser.role);
        }
        
        setUser(mappedUser);
      } else {
        console.error('Failed to fetch user from API:', response.error);
        // If API fails, try to get basic info from Supabase
        if (supabase) {
          const { data: { user: supabaseUser } } = await supabase.auth.getUser();
          if (supabaseUser) {
            // SOLUTION 2: Try localStorage first, then Supabase metadata, then default
            const storedRole = localStorage.getItem('userRole');
            const role = storedRole || supabaseUser.user_metadata?.role || 'attendee';
            
            console.log('⚠️ Using fallback user data');
            console.log('- Stored role from localStorage:', storedRole);
            console.log('- Supabase metadata role:', supabaseUser.user_metadata?.role);
            console.log('- Final role used:', role);
            
            // Create minimal user object from Supabase data
            setUser({
              id: supabaseUser.id,
              phoneNumber: supabaseUser.phone || '',
              firstName: supabaseUser.user_metadata?.firstName || '',
              lastName: supabaseUser.user_metadata?.lastName || '',
              email: supabaseUser.email || '',
              state: supabaseUser.user_metadata?.state || '',
              role: role,
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
        
        // SOLUTION 2: Persist role in localStorage
        localStorage.setItem('userRole', mappedUser.role);
        console.log('✅ Role persisted to localStorage:', mappedUser.role);
        
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

      console.log('🔐 Starting login process for:', phoneNumber);

      // First, authenticate with FastAPI backend
      const apiResponse = await apiService.login({ phoneNumber, password });
      
      console.log('📥 API login response:', apiResponse);
      
      if (!apiResponse.success) {
        return {
          success: false,
          error: apiResponse.error?.message || 'Login failed'
        };
      }

      // SOLUTION 3: Set user immediately from API response with correct role
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
        
        console.log('✅ Setting user from login response:', mappedUser);
        console.log('- User role:', mappedUser.role);
        
        // SOLUTION 2: Persist role in localStorage
        localStorage.setItem('userRole', mappedUser.role);
        console.log('✅ Role persisted to localStorage:', mappedUser.role);
        
        // Set user BEFORE Supabase auth to prevent overwrite
        setUser(mappedUser);
      }

      // Then sign in to Supabase (optional - don't fail if it errors)
      if (supabase) {
        try {
          const email = apiResponse.data?.user?.email || `${phoneNumber}@grooovy.temp`;
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
          });

          if (error) {
            console.warn('⚠️ Supabase signin failed (continuing with FastAPI only):', error.message);
            // API login succeeded, continue without Supabase
          } else {
            console.log('✅ Supabase sign-in successful');
            setSession(data.session);
          }
        } catch (error: any) {
          console.warn('⚠️ Supabase signin error (continuing with FastAPI only):', error.message);
          // Continue anyway - FastAPI login succeeded
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
      
      // SOLUTION 2: Clear localStorage on logout
      localStorage.removeItem('userRole');
      console.log('✅ User logged out, role cleared from localStorage');

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
