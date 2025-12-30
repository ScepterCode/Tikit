import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export function OrganizerFinancials() {
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
            <NavItem icon="💰" label="Financials" active />
            <NavItem icon="📢" label="Broadcast" onClick={() => navigate('/organizer/broadcast')} />
            <NavItem icon="📱" label="Scanner" onClick={() => navigate('/organizer/scanner')} />
            <NavItem icon="⚙️" label="Settings" onClick={() => navigate('/organizer/settings')} />
          </nav>
        </aside>

        {/* Main Content */}
        <main style={styles.main}>
          <div style={styles.titleRow}>
            <div>
              <h2 style={styles.pageTitle}>Financials</h2>
              <p style={styles.pageSubtitle}>
                Track your revenue, payouts, and financial performance
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div style={styles.statsGrid}>
            <StatsCard
              icon="💰"
              title="Total Revenue"
              value="₦0"
              subtitle="All time"
              color="#10b981"
            />
            <StatsCard
              icon="📈"
              title="This Month"
              value="₦0"
              subtitle="Current month"
              color="#667eea"
            />
            <StatsCard
              icon="💳"
              title="Pending Payouts"
              value="₦0"
              subtitle="Processing"
              color="#f59e0b"
            />
            <StatsCard
              icon="🏦"
              title="Available Balance"
              value="₦0"
              subtitle="Ready to withdraw"
              color="#8b5cf6"
            />
          </div>

          <div style={styles.content}>
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>💰</div>
              <h3 style={styles.emptyTitle}>No financial data yet</h3>
              <p style={styles.emptyText}>
                Start selling tickets to see your revenue and financial analytics here.
              </p>
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

function StatsCard({
  icon,
  title,
  value,
  subtitle,
  color,
}: {
  icon: string;
  title: string;
  value: string;
  subtitle: string;
  color: string;
}) {
  return (
    <div style={styles.statsCard}>
      <div style={{ ...styles.statsIcon, backgroundColor: color + '20', color }}>
        {icon}
      </div>
      <div style={styles.statsContent}>
        <p style={styles.statsTitle}>{title}</p>
        <p style={styles.statsValue}>{value}</p>
        <p style={styles.statsSubtitle}>{subtitle}</p>
      </div>
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
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '20px',
    marginBottom: '32px',
  },
  statsCard: {
    backgroundColor: '#ffffff',
    padding: '20px',
    borderRadius: '12px',
    display: 'flex',
    gap: '16px',
    alignItems: 'flex-start',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  statsIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
  },
  statsContent: {
    flex: 1,
  },
  statsTitle: {
    fontSize: '12px',
    color: '#6b7280',
    marginBottom: '4px',
  },
  statsValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '4px',
  },
  statsSubtitle: {
    fontSize: '12px',
    color: '#9ca3af',
  },
  content: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '48px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    textAlign: 'center' as const,
  },
  emptyState: {
    maxWidth: '400px',
    margin: '0 auto',
  },
  emptyIcon: {
    fontSize: '64px',
    marginBottom: '16px',
  },
  emptyTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '8px',
  },
  emptyText: {
    fontSize: '14px',
    color: '#6b7280',
  },
};