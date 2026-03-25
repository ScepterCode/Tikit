import { Navigate } from 'react-router';
import { useAuth } from '../../contexts/SupabaseAuthContext';

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
    console.log('🔒 SECURITY: Unauthenticated access attempt, redirecting to login');
    return <Navigate to="/auth/login" replace />;
  }

  // SECURITY: Validate user role and check access
  if (allowedRoles && user) {
    const userRole = user.role || 'attendee';
    const validRoles = ['attendee', 'organizer', 'admin'];
    
    // Validate role is legitimate
    if (!validRoles.includes(userRole)) {
      console.error(`🚨 SECURITY: Invalid role "${userRole}" detected for user ${user.email}`);
      return <Navigate to="/unauthorized" replace />;
    }
    
    // Check if user has required role
    if (!allowedRoles.includes(userRole as "attendee" | "organizer" | "admin")) {
      console.warn(`🔒 SECURITY: Access denied - user ${user.email} (${userRole}) attempted to access ${allowedRoles.join(', ')} only route`);
      return <Navigate to="/unauthorized" replace />;
    }
    
    // Log successful access for audit trail
    console.log(`✅ SECURITY: Access granted - user ${user.email} (${userRole}) accessing ${allowedRoles.join(', ')} route`);
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
