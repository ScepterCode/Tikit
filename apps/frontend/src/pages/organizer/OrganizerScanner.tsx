import { useAuth } from '../../contexts/FastAPIAuthContext';
import { useNavigate } from 'react-router-dom';

export function OrganizerScanner() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      {/* Top Bar */}
      <header style={styles.header}>
        <h1 style={styles.logo}>Tikit</h1>
        <div style={styles.userMenu}>
          <span style={styles.userName}>{user?.organizationName || user?.firstName}</span>
          <button onClick={() => signOut()} style={styles.logoutButton}>
            Logout
          </button>
        </div>
      </header>

      <div style={styles.layout}>
        {/* Sidebar */}
        <aside style={styles.sidebar}>
          <nav style={styles.nav}>
            <NavItem icon="📊" label="Dashboard" onClick={() => navigate('/organizer/dashboard')} />
            <NavItem icon="🎉" label="My Events" onClick={() => navigate('/organizer/events')} />
            <NavItem icon="➕" label="Create Event" onClick={() => navigate('/organizer/create-event')} />
            <NavItem icon="👥" label="Attendees" onClick={() => navigate('/organizer/attendees')} />
            <NavItem icon="💰" label="Financials" onClick={() => navigate('/organizer/financials')} />
            <NavItem icon="📢" label="Broadcast" onClick={() => navigate('/organizer/broadcast')} />
            <NavItem icon="📱" label="Scanner" active />
            <NavItem icon="⚙️" label="Settings" onClick={() => navigate('/organizer/settings')} />
          </nav>
        </aside>

        {/* Main Content */}
        <main style={styles.main}>
          <div style={styles.titleRow}>
            <div>
              <h2 style={styles.pageTitle}>Ticket Scanner</h2>
              <p style={styles.pageSubtitle}>
                Scan and verify attendee tickets at your events
              </p>
            </div>
          </div>

          <div style={styles.content}>
            <div style={styles.scannerCard}>
              <div style={styles.scannerIcon}>📱</div>
              <h3 style={styles.scannerTitle}>QR Code Scanner</h3>
              <p style={styles.scannerText}>
                Use your device camera to scan attendee tickets and verify their authenticity.
              </p>
              <button style={styles.scanButton} onClick={() => alert('Scanner will be implemented soon!')}>
                Start Scanning
              </button>
            </div>

            <div style={styles.statsGrid}>
              <div style={styles.statCard}>
                <div style={styles.statIcon}>✅</div>
                <div style={styles.statContent}>
                  <h4 style={styles.statTitle}>Verified Today</h4>
                  <p style={styles.statValue}>0</p>
                </div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statIcon}>❌</div>
                <div style={styles.statContent}>
                  <h4 style={styles.statTitle}>Invalid Scans</h4>
                  <p style={styles.statValue}>0</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function NavItem({
  icon,
  label,
  active,
  onClick,
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
        ...(active ? styles.navItemActive : {}),
      }}
      onClick={onClick}
    >
      <span style={styles.navIcon}>{icon}</span>
      <span>{label}</span>
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
  titleRow: {
    marginBottom: '24px',
  },
  pageTitle: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '4px',
  },
  pageSubtitle: {
    fontSize: '14px',
    color: '#6b7280',
  },
  content: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px',
  },
  scannerCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '48px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    textAlign: 'center' as const,
  },
  scannerIcon: {
    fontSize: '64px',
    marginBottom: '16px',
  },
  scannerTitle: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '8px',
  },
  scannerText: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '24px',
    maxWidth: '400px',
    margin: '0 auto 24px',
  },
  scanButton: {
    padding: '12px 32px',
    fontSize: '16px',
    fontWeight: '600',
    backgroundColor: '#667eea',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
  },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  statIcon: {
    fontSize: '32px',
  },
  statContent: {
    flex: 1,
  },
  statTitle: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '4px',
  },
  statValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1f2937',
  },
};