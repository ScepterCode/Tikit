import { useAuth } from '../../contexts/SupabaseAuthContext';
import { useNavigate } from 'react-router';
import UnifiedWalletDashboard from '../../components/wallet/UnifiedWalletDashboard';

export function Wallet() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <h1 style={styles.logo}>Grooovy</h1>
        <div style={styles.userMenu}>
          <span style={styles.userName}>
            {user?.firstName} {user?.lastName}
          </span>
          <button onClick={() => signOut()} style={styles.logoutButton}>
            Logout
          </button>
        </div>
      </header>

      <div style={styles.layout}>
        {/* Sidebar */}
        <aside style={styles.sidebar}>
          <nav style={styles.nav}>
            <NavItem icon="🏠" label="Dashboard" onClick={() => navigate('/attendee/dashboard')} />
            <NavItem icon="🎫" label="My Tickets" onClick={() => navigate('/attendee/tickets')} />
            <NavItem icon="💰" label="Wallet" active />
            <NavItem icon="🎉" label="Browse Events" onClick={() => navigate('/events')} />
            <NavItem icon="🎁" label="Referrals" onClick={() => navigate('/attendee/referrals')} />
            <NavItem icon="👤" label="Profile" onClick={() => navigate('/attendee/profile')} />
          </nav>
        </aside>

        {/* Main Content */}
        <main style={styles.main}>
          <div style={styles.pageHeader}>
            <div>
              <h2 style={styles.pageTitle}>My Wallet</h2>
              <p style={styles.pageSubtitle}>Unified wallet dashboard with all your financial tools</p>
            </div>
          </div>

          {/* Unified Wallet Dashboard */}
          <UnifiedWalletDashboard />
        </main>
      </div>
    </div>
  );
}

// Navigation Item Component
function NavItem({ 
  icon, 
  label, 
  active = false, 
  onClick 
}: { 
  icon: string; 
  label: string; 
  active?: boolean; 
  onClick?: () => void; 
}) {
  return (
    <button
      style={{
        ...styles.navItem,
        ...(active ? styles.navItemActive : {})
      }}
      onClick={onClick}
    >
      <span style={styles.navIcon}>{icon}</span>
      {label}
    </button>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#ffffff',
    padding: '16px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  logo: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#667eea',
    margin: 0,
  },
  userMenu: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  userName: {
    fontSize: '14px',
    color: '#374151',
    fontWeight: '500',
  },
  logoutButton: {
    padding: '8px 16px',
    fontSize: '14px',
    backgroundColor: '#f3f4f6',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    color: '#374151',
    transition: 'all 0.2s',
  },
  layout: {
    display: 'flex',
  },
  sidebar: {
    width: '240px',
    backgroundColor: '#ffffff',
    borderRight: '1px solid #e5e7eb',
    minHeight: 'calc(100vh - 65px)',
    padding: '24px 0',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
    padding: '0 12px',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    fontSize: '14px',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    color: '#6b7280',
    textAlign: 'left' as const,
    transition: 'all 0.2s',
  },
  navItemActive: {
    backgroundColor: '#f5f7ff',
    color: '#667eea',
    fontWeight: '500',
  },
  navIcon: {
    fontSize: '18px',
  },
  main: {
    flex: 1,
    padding: '32px',
    maxWidth: '1200px',
  },
  pageHeader: {
    marginBottom: '32px',
  },
  pageTitle: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#1f2937',
    margin: '0 0 4px 0',
  },
  pageSubtitle: {
    fontSize: '16px',
    color: '#6b7280',
    margin: 0,
  },
};
