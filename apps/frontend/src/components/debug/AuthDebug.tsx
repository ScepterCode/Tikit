import { useAuth } from '../../contexts/FastAPIAuthContext';

export function AuthDebug() {
  const { user, loading, session } = useAuth();

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: '#000',
      color: '#fff',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '300px'
    }}>
      <h4>Auth Debug</h4>
      <p>Loading: {loading ? 'Yes' : 'No'}</p>
      <p>Authenticated: {user ? 'Yes' : 'No'}</p>
      <p>User: {user ? `${user.firstName} (${user.role})` : 'None'}</p>
      <p>Token: {session?.access_token ? 'Present' : 'None'}</p>
    </div>
  );
}