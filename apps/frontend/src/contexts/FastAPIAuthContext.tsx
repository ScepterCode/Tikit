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

// Maps FastAPI snake_case response → AuthUser camelCase
function mapUser(b: any): AuthUser {
  return {
    id: b.id,
    phoneNumber: b.phone_number,
    firstName: b.first_name,
    lastName: b.last_name,
    email: b.email,
    state: b.state,
    role: b.role,
    walletBalance: b.wallet_balance || 0,
    referralCode: b.referral_code || '',
    organizationName: b.organization_name,
    organizationType: b.organization_type,
    isVerified: b.is_verified || false,
    createdAt: b.created_at,
  };
}

// Builds AuthUser from Supabase user object (metadata stored at signup).
// Supabase is used as the reliable source for display data since the
// backend may be a mock that returns placeholder user data.
function buildUserFromSupabase(sbUser: any, phoneOverride?: string): AuthUser {
  const meta = sbUser.user_metadata || {};
  // Phone is stored in sbUser.phone or encoded in email as phone@grooovy.temp
  const phone =
    phoneOverride ||
    sbUser.phone ||
    (sbUser.email?.endsWith('@grooovy.temp')
      ? sbUser.email.replace('@grooovy.temp', '')
      : '');
  return {
    id: sbUser.id,
    phoneNumber: phone,
    firstName: meta.firstName || '',
    lastName: meta.lastName || '',
    email: sbUser.email?.endsWith('@grooovy.temp') ? undefined : sbUser.email,
    state: meta.state || '',
    role: meta.role || 'attendee',
    walletBalance: 0,
    referralCode: '',
    organizationName: meta.organizationName,
    organizationType: meta.organizationType,
    isVerified: !!sbUser.email_confirmed_at,
    createdAt: sbUser.created_at,
  };
}

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
    // NOTE: We do NOT fetch user data here. FastAPI is the source of truth for user data.
    // This listener only tracks the Supabase session token for API calls that need it.
    // Fetching user here causes stale/wrong user data when Supabase and FastAPI are out of sync.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        setSession(session);
        // NEVER call fetchUserFromAPI() here - it races with the login flow
        // and returns the wrong user when no FastAPI token is set yet
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const initializeAuth = async () => {
    try {
      // Restore FastAPI token so API calls are authenticated
      const storedToken = localStorage.getItem('fastapi_token');
      if (storedToken) {
        apiService.setFastAPIToken(storedToken);
      }

      // Primary: restore user from Supabase session (real user metadata)
      // The backend may be a mock that returns placeholder data, so Supabase
      // is the reliable source of truth for who the user actually is.
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setSession(session);
          setUser(buildUserFromSupabase(session.user));
          return;
        }
      }

      // Fallback: if no Supabase session but we have a FastAPI token, try the API
      if (storedToken) {
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
        setUser(mapUser(response.data));
      } else {
        console.error('Failed to fetch user from API:', response.error);
        // Clear stored token if /auth/me rejects it - token is invalid
        localStorage.removeItem('fastapi_token');
        setUser(null);
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
        const sbEmail = userData.email || `${userData.phoneNumber}@grooovy.temp`;
        // Store the email so we can look it up on future logins
        localStorage.setItem(`sb_email_${userData.phoneNumber}`, sbEmail);

        const { data: sbData, error: sbError } = await supabase.auth.signUp({
          email: sbEmail,
          password: userData.password,
          phone: userData.phoneNumber,
          options: {
            data: {
              firstName: userData.firstName,
              lastName: userData.lastName,
              state: userData.state,
              role: userData.role || 'attendee',
              organizationName: userData.organizationName
            }
          }
        });

        if (sbError) {
          console.error('Supabase signup error:', sbError);
        } else if (sbData.user) {
          console.log('✅ Supabase user created successfully');
          // Use Supabase metadata as the user — it has the real submitted data
          const regToken = apiResponse.data?.access_token || apiResponse.data?.token;
          if (regToken) {
            localStorage.setItem('fastapi_token', regToken);
            apiService.setFastAPIToken(regToken);
          }
          setUser(buildUserFromSupabase(sbData.user, userData.phoneNumber));
          setSession(sbData.session);
          return { success: true };
        }
      }

      // Fallback: Supabase not available — use backend response data
      if (apiResponse.data?.user) {
        const regToken = apiResponse.data?.access_token || apiResponse.data?.token;
        if (regToken) {
          localStorage.setItem('fastapi_token', regToken);
          apiService.setFastAPIToken(regToken);
        }
        setUser(mapUser(apiResponse.data.user));
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

      // Store the FastAPI token for API calls
      const fastapiToken = apiResponse.data?.access_token || apiResponse.data?.token;
      if (fastapiToken) {
        localStorage.setItem('fastapi_token', fastapiToken);
        apiService.setFastAPIToken(fastapiToken);
      }

      // Sign into Supabase and use its metadata as the real user data.
      // The backend may return placeholder data (e.g. a mock), so Supabase
      // user_metadata (stored at signup) is the reliable source of truth.
      if (supabase) {
        // Look up the email used at registration (stored in localStorage at signup)
        const email = localStorage.getItem(`sb_email_${phoneNumber}`) || `${phoneNumber}@grooovy.temp`;
        const { data: sbData, error: sbError } = await supabase.auth.signInWithPassword({ email, password });
        if (!sbError && sbData.user) {
          setSession(sbData.session);
          setUser(buildUserFromSupabase(sbData.user, phoneNumber));
          return { success: true };
        }
      }

      // Fallback: use whatever the backend returned (may be mock/placeholder)
      if (apiResponse.data?.user) {
        setUser(mapUser(apiResponse.data.user));
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
      if (supabase) promises.push(supabase.auth.signOut());
      await Promise.all(promises);

      localStorage.removeItem('fastapi_token');
      if (apiService.clearAuth) apiService.clearAuth();
      setUser(null);
      setSession(null);

    } catch (error) {
      console.error('Signout error:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    if (!supabase) return;
    const { data: { user: sbUser } } = await supabase.auth.getUser();
    if (sbUser) {
      setUser(buildUserFromSupabase(sbUser, user?.phoneNumber));
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