import { useAuth } from '../../contexts/ProductionAuthContext';
import { useNavigate } from 'react-router-dom';

export function OrganizerSettings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      {/* Top Bar */}
      <header style={styles.header}>
        <h1 style={styles.logo}>Tikit</h1>
        <div style={styles.userMenu}>
          <span style={styles.userName}>{user?.organizationName || user?.firstName}</span>
          <button onClick={logout} style={styles.logoutButton}>
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
            <NavItem icon="📱" label="Scanner" onClick={() => navigate('/organizer/scanner')} />
            <NavItem icon="⚙️" label="Settings" active />
          </nav>
        </aside>

        {/* Main Content */}
        <main style={styles.main}>
          <div style={styles.titleRow}>
            <div>
              <h2 style={styles.pageTitle}>Settings</h2>
              <p style={styles.pageSubtitle}>
                Manage your account and organization settings
              </p>
            </div>
          </div>

          <div style={styles.content}>
            <div style={styles.settingsSection}>
              <h3 style={styles.sectionTitle}>Account Information</h3>
              <div style={styles.infoGrid}>
                <InfoItem label="Organization Name" value={user?.organizationName || 'Not set'} />
                <InfoItem label="Organization Type" value={user?.organizationType || 'Not set'} />
                <InfoItem label="Contact Name" value={`${user?.firstName} ${user?.lastName}`} />
                <InfoItem label="Phone Number" value={user?.phoneNumber || 'Not set'} />
                <InfoItem label="Email" value={user?.email || 'Not set'} />
                <InfoItem label="State" value={user?.state || 'Not set'} />
                <InfoItem label="Account Status" value={user?.isVerified ? 'Verified' : 'Pending Verification'} />
                <InfoItem label="Member Since" value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'} />
              </div>
            </div>

            <div style={styles.settingsSection}>
              <h3 style={styles.sectionTitle}>Quick Actions</h3>
              <div style={styles.actionsGrid}>
                <button style={styles.actionButton} onClick={() => alert('Profile editing will be implemented soon!')}>
                  Edit Profile
                </button>
                <button style={styles.actionButton} onClick={() => alert('Verification process will be implemented soon!')}>
                  Complete Verification
                </button>
                <button style={styles.actionButton} onClick={() => alert('Password change will be implemented soon!')}>
                  Change Password
                </button>
                <button style={styles.actionButton} onClick={() => alert('Notification settings will be implemented soon!')}>
                  Notification Settings
                </button>
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

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.infoItem}>
      <span style={styles.infoLabel}>{label}</span>
      <span style={styles.infoValue}>{value}</span>
    </div>
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
    gap: '32px',
  },
  settingsSection: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '32px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '20px',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '16px',
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  infoLabel: {
    fontSize: '12px',
    color: '#6b7280',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: '14px',
    color: '#1f2937',
    fontWeight: '600',
  },
  actionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
  },
  actionButton: {
    padding: '12px 16px',
    fontSize: '14px',
    fontWeight: '600',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
};