import { useState, ReactNode, useEffect } from 'react';
import { DashboardNavbar } from './DashboardNavbar';
import { DashboardSidebar } from './DashboardSidebar';
import { useSupabaseAuth } from '../../contexts/SupabaseAuthContext';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useSupabaseAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 767);

  // Handle window resize for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 767);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!user) {
    return (
      <div style={styles.loading}>
        <div style={styles.loadingSpinner}>Loading...</div>
      </div>
    );
  }

  // SECURITY FIX: Standardize user data structure and validate role
  const userRole = user.role || 'attendee';
  const firstName = user.firstName || 'User';
  const lastName = user.lastName || '';
  const phoneNumber = user.phoneNumber || '';
  const email = user.email || '';
  const state = user.state || '';
  const walletBalance = user.walletBalance || 0;
  const isVerified = user.isVerified || false;

  // SECURITY: Validate role is one of the allowed values
  const validRoles = ['attendee', 'organizer', 'admin'];
  const validatedRole = validRoles.includes(userRole) ? userRole : 'attendee';

  if (validatedRole !== userRole) {
    console.warn(`🚨 SECURITY: Invalid role "${userRole}" detected, defaulting to "attendee"`);
  }

  // Transform user data for components with validated data
  const navUser = {
    firstName,
    lastName,
    phoneNumber,
    email,
    state,
    role: validatedRole,
    walletBalance,
    referralCode: user.referralCode || '',
    isVerified,
  };

  const sidebarUser = {
    role: validatedRole as 'attendee' | 'organizer' | 'admin',
    firstName,
    lastName,
  };

  // SECURITY: Log user access for audit trail
  console.log(`🔐 Dashboard access: ${email} (${validatedRole}) at ${new Date().toISOString()}`);

  // Calculate responsive styles
  const mainContentStyle = {
    ...styles.mainContent,
    marginLeft: isMobile ? 0 : (sidebarCollapsed ? '80px' : '280px'),
  };

  const pageContentStyle = {
    ...styles.pageContent,
    padding: isMobile ? '16px' : '24px',
    marginTop: isMobile ? '80px' : '64px',
  };

  return (
    <div style={styles.layout}>
      {/* Sidebar */}
      <DashboardSidebar 
        user={sidebarUser}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      
      {/* Main Content Area */}
      <div style={mainContentStyle}>
        {/* Top Navbar */}
        <DashboardNavbar 
          user={navUser}
          onLogout={logout}
        />
        
        {/* Page Content */}
        <main style={pageContentStyle}>
          {children}
        </main>
      </div>
    </div>
  );
}

const styles = {
  layout: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
  },
  
  mainContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    transition: 'margin-left 0.3s ease',
  },
  
  pageContent: {
    flex: 1,
    minHeight: 'calc(100vh - 64px)',
  },
  
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    backgroundColor: '#f8fafc',
  },
  
  loadingSpinner: {
    fontSize: '18px',
    color: '#6b7280',
    fontWeight: '500',
  },
};