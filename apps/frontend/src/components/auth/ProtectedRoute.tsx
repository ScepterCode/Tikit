import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/FastAPIAuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('attendee' | 'organizer' | 'admin')[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const isAuthenticated = !!user;

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner}></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  // Check role-based access
  if (allowedRoles && user && !allowedRoles.includes(user.role as "attendee" | "organizer" | "admin")) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
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
    borderTop: '4px solid #3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
};
