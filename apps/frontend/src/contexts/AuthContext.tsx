import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from './supabaseClient'; // We'll create this next

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
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (phoneNumber: string, password: string) => Promise<void>;
  adminLogin: (phoneNumber: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
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
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider Component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true
  });

  // Load auth state and listen for changes
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUserProfile(session.user.id);
      } else {
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false
        });
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          await loadUserProfile(session.user.id);
        } else {
          setState({
            user: null,
            isAuthenticated: false,
            isLoading: false
          });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Load user profile from database
  const loadUserProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (profile) {
        setState({
          user: profile as User,
          isAuthenticated: true,
          isLoading: false
        });
        console.log('✅ User profile loaded:', profile.firstName);
      }
    } catch (error) {
      console.error('❌ Error loading user profile:', error);
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false
      });
    }
  };

  // Register function
  const register = async (data: RegisterData): Promise<void> => {
    try {
      console.log('📝 Registering user...');

      // Generate a referral code
      const referralCode = `TKT${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // Sign up with Supabase Auth using phone number as email
      // We'll use phone@tikit.app format since Supabase requires email
      const email = data.email || `${data.phoneNumber}@tikit.app`;
      
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password: data.password,
        options: {
          data: {
            phone_number: data.phoneNumber,
            first_name: data.firstName,
            last_name: data.lastName
          }
        }
      });

      if (signUpError) throw signUpError;
      if (!authData.user) throw new Error('Registration failed');

      // Create user profile in database
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

      if (profileError) throw profileError;

      // Load the user profile
      await loadUserProfile(authData.user.id);
      console.log('✅ Registration successful');
    } catch (error: any) {
      console.error('❌ Registration error:', error);
      throw new Error(error.message || 'Registration failed');
    }
  };

  // Login function
  const login = async (phoneNumber: string, password: string): Promise<void> => {
    try {
      console.log('🔐 Logging in user...');

      // First, get the email associated with this phone number
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('email, phone_number, role')
        .eq('phone_number', phoneNumber)
        .single();

      if (fetchError || !userData) {
        throw new Error('Invalid phone number or password');
      }

      // Prevent admin users from logging in through regular login
      if (userData.role === 'admin') {
        throw new Error('Admin users must use the admin login portal at /admin/login');
      }

      // Sign in with email
      const email = userData.email || `${phoneNumber}@tikit.app`;
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) throw signInError;
      if (!authData.user) throw new Error('Login failed');

      // Profile will be loaded automatically by onAuthStateChange
      console.log('✅ Login successful');
    } catch (error: any) {
      console.error('❌ Login error:', error);
      throw new Error(error.message || 'Login failed');
    }
  };

  // Admin login function
  const adminLogin = async (phoneNumber: string, password: string): Promise<void> => {
    try {
      console.log('🔐 Admin login attempt...');

      // First, get the email associated with this phone number
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('email, phone_number, role')
        .eq('phone_number', phoneNumber)
        .single();

      if (fetchError || !userData) {
        throw new Error('Invalid phone number or password');
      }

      // Check if user is admin
      if (userData.role !== 'admin') {
        throw new Error('Access denied. Admin credentials required.');
      }

      // Sign in with email
      const email = userData.email || `${phoneNumber}@tikit.app`;
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) throw signInError;
      if (!authData.user) throw new Error('Login failed');

      // Profile will be loaded automatically by onAuthStateChange
      console.log('✅ Admin login successful');
    } catch (error: any) {
      console.error('❌ Admin login error:', error);
      throw new Error(error.message || 'Admin login failed');
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await supabase.auth.signOut();
      console.log('👋 User logged out');
    } catch (error) {
      console.error('❌ Logout error:', error);
    }
  };

  const contextValue: AuthContextType = {
    ...state,
    login,
    adminLogin,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
