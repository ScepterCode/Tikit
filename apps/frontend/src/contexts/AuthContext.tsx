import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (phoneNumber: string, password: string) => Promise<void>;
  adminLogin: (phoneNumber: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshAuth: () => Promise<boolean>;
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

// API Configuration
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// Storage keys
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'tikit_access_token',
  REFRESH_TOKEN: 'tikit_refresh_token',
  USER: 'tikit_user'
} as const;

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider Component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: true
  });

  // API helper with automatic token refresh
  const apiCall = async (url: string, options: RequestInit = {}) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {})
    };

    if (state.accessToken) {
      headers['Authorization'] = `Bearer ${state.accessToken}`;
    }

    let response = await fetch(`${API_URL}${url}`, {
      ...options,
      headers
    });

    // If token expired, try to refresh
    if (response.status === 401 && state.refreshToken) {
      const refreshed = await refreshAuth();
      if (refreshed) {
        // Retry with new token
        headers['Authorization'] = `Bearer ${state.accessToken}`;
        response = await fetch(`${API_URL}${url}`, {
          ...options,
          headers
        });
      }
    }

    return response;
  };

  // Load auth state from storage
  useEffect(() => {
    const loadAuthState = () => {
      try {
        const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
        const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
        const userStr = localStorage.getItem(STORAGE_KEYS.USER);

        if (accessToken && refreshToken && userStr) {
          const user = JSON.parse(userStr);
          setState({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false
          });
          console.log('🔄 Auth state loaded from storage:', user.firstName);
        } else {
          console.log('🔄 No auth data in storage, setting unauthenticated state');
          setState(prev => ({ 
            ...prev, 
            isLoading: false,
            isAuthenticated: false,
            user: null,
            accessToken: null,
            refreshToken: null
          }));
        }
      } catch (error) {
        console.error('❌ Error loading auth state:', error);
        clearAuthState();
      }
    };

    loadAuthState();
  }, []);

  // Save auth state to storage
  const saveAuthState = (user: User, accessToken: string, refreshToken: string) => {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));

    setState({
      user,
      accessToken,
      refreshToken,
      isAuthenticated: true,
      isLoading: false
    });

    console.log('✅ Auth state saved:', user.firstName);
  };

  // Clear auth state
  const clearAuthState = () => {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);

    setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false
    });

    console.log('🧹 Auth state cleared');
  };

  // Register function
  const register = async (data: RegisterData): Promise<void> => {
    try {
      console.log('📝 Registering user...');
      
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (!response.ok) {
        // Extract the specific error message from the backend
        const errorMessage = result.error?.message || result.message || 'Registration failed';
        throw new Error(errorMessage);
      }

      if (result.success && result.data) {
        const { user, accessToken, refreshToken } = result.data;
        saveAuthState(user, accessToken, refreshToken);
        console.log('✅ Registration successful');
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('❌ Registration error:', error);
      throw error;
    }
  };

  // Admin login function - only allows admin users
  const adminLogin = async (phoneNumber: string, password: string): Promise<void> => {
    try {
      console.log('🔐 Admin login attempt...');
      
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, password })
      });

      const result = await response.json();

      if (!response.ok) {
        // Extract the specific error message from the backend
        const errorMessage = result.error?.message || result.message || 'Login failed';
        throw new Error(errorMessage);
      }

      if (result.success && result.data) {
        const { user, accessToken, refreshToken } = result.data;
        
        // Check if user is admin
        if (user.role !== 'admin') {
          throw new Error('Access denied. Admin credentials required.');
        }
        
        saveAuthState(user, accessToken, refreshToken);
        console.log('✅ Admin login successful');
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('❌ Admin login error:', error);
      throw error;
    }
  };
  const login = async (phoneNumber: string, password: string): Promise<void> => {
    try {
      console.log('🔐 Logging in user...');
      
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, password })
      });

      const result = await response.json();

      if (!response.ok) {
        // Extract the specific error message from the backend
        const errorMessage = result.error?.message || result.message || 'Login failed';
        throw new Error(errorMessage);
      }

      if (result.success && result.data) {
        const { user, accessToken, refreshToken } = result.data;
        
        // Prevent admin users from logging in through regular login
        if (user.role === 'admin') {
          throw new Error('Admin users must use the admin login portal at /admin/login');
        }
        
        saveAuthState(user, accessToken, refreshToken);
        console.log('✅ Login successful');
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      throw error;
    }
  };

  // Refresh auth function
  const refreshAuth = async (): Promise<boolean> => {
    try {
      if (!state.refreshToken) {
        return false;
      }

      console.log('🔄 Refreshing auth tokens...');

      const response = await fetch(`${API_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: state.refreshToken })
      });

      const result = await response.json();

      if (response.ok && result.success && result.accessToken) {
        // Update access token while keeping user data and refresh token
        if (state.user) {
          localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, result.accessToken);
          setState(prev => ({
            ...prev,
            accessToken: result.accessToken
          }));
          console.log('✅ Access token refreshed');
          return true;
        }
      }

      // If refresh fails, clear auth state
      clearAuthState();
      return false;
    } catch (error) {
      console.error('❌ Token refresh error:', error);
      clearAuthState();
      return false;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      if (state.accessToken) {
        await fetch(`${API_URL}/api/auth/logout`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${state.accessToken}`
          }
        });
      }
    } catch (error) {
      console.error('❌ Logout error:', error);
    } finally {
      clearAuthState();
      console.log('👋 User logged out');
    }
  };

  const contextValue: AuthContextType = {
    ...state,
    login,
    adminLogin,
    register,
    logout,
    refreshAuth
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