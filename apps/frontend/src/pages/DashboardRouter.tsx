import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/FastAPIAuthContext';

export function DashboardRouter() {
  const { user, loading } = useAuth();

  // Debug logging to understand the issue
  console.log('🔍 DashboardRouter Debug:');
  console.log('- User:', user);
  console.log('- User role:', user?.role);
  console.log('- Loading:', loading);
  console.log('- Current URL:', window.location.href);

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner}></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    console.log('❌ No user found, redirecting to login');
    return <Navigate to="/auth/login" replace />;
  }

  // Debug role routing
  console.log(`🎯 Routing user with role: "${user.role}"`);

  // Redirect based on user role
  switch (user.role) {
    case 'attendee':
      console.log('✅ Redirecting to attendee dashboard');
      return <Navigate to="/attendee/dashboard" replace />;
    case 'organizer':
      console.log('✅ Redirecting to organizer dashboard');
      return <Navigate to="/organizer/dashboard" replace />;
    case 'admin':
      console.log('✅ Redirecting to admin dashboard');
      return <Navigate to="/admin/dashboard" replace />;
    default:
      console.log(`❌ Unknown role "${user.role}", redirecting to home`);
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
