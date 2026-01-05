import { Navigate } from 'react-router-dom';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';

export function DashboardRouter() {
  const { user, isLoading } = useSupabaseAuth();

  if (isLoading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner}></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  // Redirect based on user role
  switch (user.role) {
    case 'attendee':
      return <Navigate to="/attendee/dashboard" replace />;
    case 'organizer':
      return <Navigate to="/organizer/dashboard" replace />;
    case 'admin':
      return <Navigate to="/admin/dashboard" replace />;
    default:
      return <Navigate to="/" replace />;
  }
}

const styles = {
  loading: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    gap: '16px',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
};
