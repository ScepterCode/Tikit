import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';

export function DebugPage() {
  const authState = useSupabaseAuth();

  return (
    <div style={{
      padding: '20px',
      fontFamily: 'monospace',
      backgroundColor: '#f5f5f5',
      minHeight: '100vh'
    }}>
      <h1>Debug Page</h1>
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', marginTop: '20px' }}>
        <h2>Authentication State</h2>
        <pre style={{ backgroundColor: '#f0f0f0', padding: '10px', borderRadius: '4px' }}>
          {JSON.stringify({
            isLoading: authState.isLoading,
            isAuthenticated: authState.isAuthenticated,
            user: authState.user ? {
              id: authState.user.id,
              firstName: authState.user.firstName,
              lastName: authState.user.lastName,
              role: authState.user.role,
              phoneNumber: authState.user.phoneNumber
            } : null,
            hasAccessToken: false, // Not applicable for Supabase auth
            hasRefreshToken: false // Not applicable for Supabase auth
          }, null, 2)}
        </pre>
      </div>
      
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', marginTop: '20px' }}>
        <h2>LocalStorage Contents</h2>
        <pre style={{ backgroundColor: '#f0f0f0', padding: '10px', borderRadius: '4px' }}>
          {JSON.stringify({
            accessToken: localStorage.getItem('tikit_access_token'),
            refreshToken: localStorage.getItem('tikit_refresh_token'),
            user: localStorage.getItem('tikit_user')
          }, null, 2)}
        </pre>
      </div>

      <div style={{ marginTop: '20px' }}>
        <a href="/auth/login" style={{ 
          padding: '10px 20px', 
          backgroundColor: '#007bff', 
          color: 'white', 
          textDecoration: 'none', 
          borderRadius: '4px',
          marginRight: '10px'
        }}>
          Go to Login
        </a>
        <a href="/auth/register" style={{ 
          padding: '10px 20px', 
          backgroundColor: '#28a745', 
          color: 'white', 
          textDecoration: 'none', 
          borderRadius: '4px',
          marginRight: '10px'
        }}>
          Go to Register
        </a>
        <a href="/" style={{ 
          padding: '10px 20px', 
          backgroundColor: '#6c757d', 
          color: 'white', 
          textDecoration: 'none', 
          borderRadius: '4px'
        }}>
          Go to Home
        </a>
      </div>
    </div>
  );
}