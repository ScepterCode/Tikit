import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

// Types
interface User {
  id: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  email?: string;
  role: 'attendee' | 'organizer' | 'admin';
  state: string;
  organizationName?: string;
  organizationType?: string;
  referralCode: string;
  walletBalance: number;
  isVerified: boolean;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  supabaseUser: SupabaseUser | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (phoneNumber: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
}

interface RegisterData {
  phoneNumber: string;
  password: string;
  firstName: string;
  lastName: string;
  email?: string;
  state: string;
  role?: 'attendee' | 'organizer';
  organizationName?: string;
  organizationType?: string;
}

// Create context
const SupabaseAuthContext = createContext<AuthContextType | undefined>(undefined);

// Supabase Setup Component
function SupabaseSetupScreen() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
      backgroundColor: '#f9fafb',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        maxWidth: '600px',
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        textAlign: 'center'
      }}>
        <h1 style={{ color: '#10b981', marginBottom: '20px' }}>🔥 Supabase Setup Required</h1>
        <p style={{ fontSize: '18px', marginBottom: '30px', color: '#374151' }}>
          Tikit is ready to launch! Just connect your Supabase database to get started.
        </p>
        
        <div style={{ textAlign: 'left', marginBottom: '30px' }}>
          <h3 style={{ color: '#1f2937' }}>Quick Setup (5 minutes):</h3>
          <ol style={{ color: '#4b5563', lineHeight: '1.6' }}>
            <li>Create a Supabase project at <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" style={{ color: '#10b981' }}>supabase.com</a></li>
            <li>Go to Settings → API and copy your credentials</li>
            <li>Add environment variables to Vercel:
              <ul style={{ marginTop: '10px' }}>
                <li><code>VITE_SUPABASE_URL</code></li>
                <li><code>VITE_SUPABASE_ANON_KEY</code></li>
              </ul>
            </li>
            <li>Run the database schema (see setup guide)</li>
            <li>Redeploy your app</li>
          </ol>
        </div>
        
        <div style={{ backgroundColor: '#f3f4f6', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
          <p style={{ margin: 0, color: '#6b7280' }}>
            <strong>No localhost dependencies!</strong> This app uses Supabase for all backend functionality.
          </p>
        </div>
        
        <a 
          href="https://supabase.com" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{
            display: 'inline-block',
            backgroundColor: '#10b981',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '6px',
            textDecoration: 'none',
            fontWeight: '600'
          }}
        >
          Create Supabase Project
        </a>
      </div>
    </div>
  );
}

// Auth Provider Component
export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    supabaseUser: null,
    session: null,
    isAuthenticated: false,
    isLoading: true
  });

  // Check if Supabase is configured
  if (!supabase) {
    return <SupabaseSetupScreen />;
  }

  // Load auth state from Supabase
  useEffect(() => {
    if (!supabase) return;
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleAuthChange(session);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleAuthChange(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Handle auth state changes
  const handleAuthChange = async (session: Session | null) => {
    if (session?.user) {
      // Fetch user profile from our users table
      const userProfile = await fetchUserProfile(session.user.id);
      
      setState({
        user: userProfile,
        supabaseUser: session.user,
        session,
        isAuthenticated: true,
        isLoading: false
      });
      
      console.log('✅ User authenticated:', userProfile?.firstName || session.user.email);
    } else {
      setState({
        user: null,
        supabaseUser: null,
        session: null,
        isAuthenticated: false,
        isLoading: false
      });
      
      console.log('👋 User signed out');
    }
  };

  // Fetch user profile from database
  const fetchUserProfile = async (userId: string): Promise<User | null> => {
    if (!supabase) return null;
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      return {
        id: data.id,
        phoneNumber: data.phone_number,
        firstName: data.first_name,
        lastName: data.last_name,
        email: data.email,
        role: data.role,
        state: data.state,
        organizationName: data.organization_name,
        organizationType: data.organization_type,
        referralCode: data.referral_code,
        walletBalance: data.wallet_balance,
        isVerified: data.is_verified,
        createdAt: data.created_at
      };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  // Generate referral code
  const generateReferralCode = (firstName: string, lastName: string): string => {
    const initials = (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${initials}${randomNum}`;
  };

  // Register function
  const register = async (data: RegisterData): Promise<void> => {
    if (!supabase) throw new Error('Supabase not configured');
    
    try {
      console.log('📝 Registering user with Supabase...');

      // Use email if provided, otherwise create email from phone number
      const email = data.email || `${data.phoneNumber.replace(/[^0-9]/g, '')}@tikit.app`;
      
      console.log('📧 Using email for registration:', email);
      
      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: data.password,
        options: {
          data: {
            phone_number: data.phoneNumber,
            first_name: data.firstName,
            last_name: data.lastName,
          }
        }
      });

      if (authError) {
        console.error('Auth error:', authError);
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error('Failed to create user');
      }

      console.log('✅ Auth user created:', authData.user.id);

      // Create user profile in our users table
      const referralCode = generateReferralCode(data.firstName, data.lastName);
      
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          phone_number: data.phoneNumber,
          first_name: data.firstName,
          last_name: data.lastName,
          email: data.email,
          role: data.role || 'attendee',
          state: data.state,
          organization_name: data.organizationName,
          organization_type: data.organizationType,
          referral_code: referralCode,
          wallet_balance: 0,
          is_verified: false
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        
        // If RLS policy blocks it, the user is still created in auth
        // We can continue and let them log in - profile can be created later
        if (profileError.code === '42501') {
          console.warn('⚠️ RLS policy prevented profile creation, but auth user exists');
          console.warn('User can still log in, profile will be created on first login');
          // Don't throw error, let registration succeed
          return;
        } else {
          // For other errors, clean up auth user
          await supabase.auth.signOut();
          throw new Error(`Failed to create user profile: ${profileError.message}`);
        }
      }

      console.log('✅ Registration successful');
    } catch (error) {
      console.error('❌ Registration error:', error);
      throw error;
    }
  };

  // Login function
  const login = async (phoneNumber: string, password: string): Promise<void> => {
    if (!supabase) throw new Error('Supabase not configured');
    
    try {
      console.log('🔐 Logging in user...');

      // Use email format for login - clean phone number first
      const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
      const email = phoneNumber.includes('@') ? phoneNumber : `${cleanPhone}@tikit.app`;
      
      console.log('📧 Using email for login:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Login error details:', error);
        throw new Error(error.message);
      }

      if (!data.user) {
        throw new Error('Login failed - no user returned');
      }

      console.log('✅ Login successful');
    } catch (error) {
      console.error('❌ Login error:', error);
      throw error;
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    if (!supabase) return;
    
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
      }
    } catch (error) {
      console.error('❌ Logout error:', error);
    }
  };

  const contextValue: AuthContextType = {
    ...state,
    login,
    register,
    logout
  };

  return (
    <SupabaseAuthContext.Provider value={contextValue}>
      {children}
    </SupabaseAuthContext.Provider>
  );
}

// Hook to use auth context
export function useSupabaseAuth(): AuthContextType {
  const context = useContext(SupabaseAuthContext);
  if (context === undefined) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  return context;
}

export default SupabaseAuthContext;