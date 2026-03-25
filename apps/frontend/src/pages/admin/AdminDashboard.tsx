import { useAuth } from '../../contexts/SupabaseAuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { apiService } from '../../services/api';
import { NotificationCenter } from '../../components/notifications/NotificationCenter';

interface DashboardStats {
  total_users: number;
  active_events: number;
  tickets_sold: number;
  platform_revenue: number;
}

interface PendingActions {
  organizer_verifications: number;
  flagged_events: number;
  support_tickets: number;
}

interface Activity {
  type: string;
  title: string;
  description: string;
  timestamp: string;
  icon: string;
}

export function AdminDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    total_users: 0,
    active_events: 0,
    tickets_sold: 0,
    platform_revenue: 0
  });
  const [pending, setPending] = useState<PendingActions>({
    organizer_verifications: 0,
    flagged_events: 0,
    support_tickets: 0
  });
  const [activity, setActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    // Refresh data every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load stats
      const statsResponse = await apiService.request('/admin/dashboard/stats');
      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data);
      }
      
      // Load pending actions
      const pendingResponse = await apiService.request('/admin/dashboard/pending-actions');
      if (pendingResponse.success && pendingResponse.data) {
        setPending(pendingResponse.data);
      }
      
      // Load recent activity
      const activityResponse = await apiService.request('/admin/dashboard/activity?limit=10');
      if (activityResponse.success && activityResponse.data) {
        setActivity(activityResponse.data);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Top Bar */}
      <header style={styles.header}>
        <h1 style={styles.logo}>Grooovy Admin</h1>
        <div style={styles.userMenu}>
          <NotificationCenter />
          <span style={styles.userName}>Admin: {user?.firstName}</span>
          <button onClick={() => signOut()} style={styles.logoutButton}>
            Logout
          </button>
        </div>
      </header>

      <div style={styles.layout}>
        {/* Sidebar */}
        <aside style={styles.sidebar}>
          <nav style={styles.nav}>
            <NavItem icon="📊" label="Dashboard" active />
            <NavItem icon="👥" label="Users" onClick={() => navigate('/admin/users')} />
            <NavItem icon="🎉" label="Events" onClick={() => navigate('/admin/events')} />
            <NavItem icon="💰" label="Financials" onClick={() => navigate('/admin/financials')} />
            <NavItem icon="📈" label="Analytics" onClick={() => navigate('/admin/analytics')} />
            <NavItem icon="🔒" label="Security" onClick={() => navigate('/admin/security')} />
            <NavItem icon="📢" label="Announcements" onClick={() => navigate('/admin/announcements')} />
            <NavItem icon="⚙️" label="Settings" onClick={() => navigate('/admin/settings')} />
          </nav>
        </aside>

        {/* Main Content */}
        <main style={styles.main}>
          <h2 style={styles.pageTitle}>Platform Overview</h2>

          {/* Stats Cards */}
          <div style={styles.statsGrid}>
            <StatsCard
              icon="👥"
              title="Total Users"
              value={stats.total_users.toString()}
              subtitle="All time"
              trend={`+${stats.total_users}%`}
              color="#667eea"
            />
            <StatsCard
              icon="🎉"
              title="Active Events"
              value={stats.active_events.toString()}
              subtitle="This month"
              trend={`+${stats.active_events}%`}
              color="#10b981"
            />
            <StatsCard
              icon="🎫"
              title="Tickets Sold"
              value={stats.tickets_sold.toString()}
              subtitle="This month"
              trend={`+${stats.tickets_sold}%`}
              color="#f59e0b"
            />
            <StatsCard
              icon="💰"
              title="Platform Revenue"
              value={`₦${stats.platform_revenue.toLocaleString()}`}
              subtitle="This month"
              trend={`+${stats.platform_revenue > 0 ? '1' : '0'}%`}
              color="#8b5cf6"
            />
          </div>

          {/* Quick Actions */}
          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>Quick Actions</h3>
            <div style={styles.actionsGrid}>
              <ActionCard
                icon="✅"
                title="Verify Organizers"
                description="Review pending verifications"
                onClick={() => navigate('/admin/verifications')}
              />
              <ActionCard
                icon="🎉"
                title="Moderate Events"
                description="Review flagged events"
                onClick={() => navigate('/admin/events')}
              />
              <ActionCard
                icon="📊"
                title="View Reports"
                description="Platform analytics"
                onClick={() => navigate('/admin/analytics')}
              />
              <ActionCard
                icon="📢"
                title="Send Announcement"
                description="Broadcast to all users"
                onClick={() => navigate('/admin/announcements')}
              />
            </div>
          </section>

          {/* Recent Activity */}
          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>Recent Activity</h3>
            {loading ? (
              <div style={styles.emptyState}>
                <p style={styles.emptyText}>Loading...</p>
              </div>
            ) : activity.length === 0 ? (
              <div style={styles.emptyState}>
                <p style={styles.emptyText}>No recent activity to display</p>
              </div>
            ) : (
              <div style={styles.activityList}>
                {activity.map((item, index) => (
                  <div key={index} style={styles.activityItem}>
                    <span style={styles.activityIcon}>{item.icon}</span>
                    <div style={styles.activityContent}>
                      <p style={styles.activityTitle}>{item.title}</p>
                      <p style={styles.activityDescription}>{item.description}</p>
                    </div>
                    <span style={styles.activityTime}>
                      {new Date(item.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Pending Actions */}
          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>Pending Actions</h3>
            <div style={styles.pendingGrid}>
              <PendingCard
                title="Organizer Verifications"
                count={pending.organizer_verifications}
                onClick={() => navigate('/admin/verifications')}
              />
              <PendingCard
                title="Flagged Events"
                count={pending.flagged_events}
                onClick={() => navigate('/admin/events?filter=flagged')}
              />
              <PendingCard
                title="Support Tickets"
                count={pending.support_tickets}
                onClick={() => navigate('/admin/support')}
              />
            </div>
          </section>
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
  trend,
  color,
}: {
  icon: string;
  title: string;
  value: string;
  subtitle: string;
  trend: string;
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
        <div style={styles.statsFooter}>
          <span style={styles.statsSubtitle}>{subtitle}</span>
          <span style={styles.statsTrend}>{trend}</span>
        </div>
      </div>
    </div>
  );
}

function ActionCard({
  icon,
  title,
  description,
  onClick,
}: {
  icon: string;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button style={styles.actionCard} onClick={onClick}>
      <div style={styles.actionIcon}>{icon}</div>
      <h4 style={styles.actionTitle}>{title}</h4>
      <p style={styles.actionDescription}>{description}</p>
    </button>
  );
}

function PendingCard({
  title,
  count,
  onClick,
}: {
  title: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button style={styles.pendingCard} onClick={onClick}>
      <div style={styles.pendingCount}>{count}</div>
      <p style={styles.pendingTitle}>{title}</p>
    </button>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#1f2937',
    padding: '16px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#ffffff',
    margin: 0,
  },
  userMenu: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  userName: {
    fontSize: '14px',
    color: '#ffffff',
    fontWeight: '500',
  },
  logoutButton: {
    padding: '8px 16px',
    fontSize: '14px',
    backgroundColor: '#374151',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    color: '#ffffff',
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
  pageTitle: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '24px',
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
  statsFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsSubtitle: {
    fontSize: '12px',
    color: '#9ca3af',
  },
  statsTrend: {
    fontSize: '12px',
    color: '#10b981',
    fontWeight: '500',
  },
  section: {
    marginBottom: '32px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '16px',
  },
  actionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
  },
  actionCard: {
    backgroundColor: '#ffffff',
    padding: '24px',
    borderRadius: '12px',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left' as const,
    transition: 'all 0.2s',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  actionIcon: {
    fontSize: '32px',
    marginBottom: '12px',
  },
  actionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '4px',
  },
  actionDescription: {
    fontSize: '14px',
    color: '#6b7280',
  },
  emptyState: {
    backgroundColor: '#ffffff',
    padding: '48px',
    borderRadius: '12px',
    textAlign: 'center' as const,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  emptyText: {
    fontSize: '14px',
    color: '#6b7280',
  },
  activityList: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
  },
  activityItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px',
    borderBottom: '1px solid #e5e7eb',
    transition: 'background-color 0.2s',
  },
  activityIcon: {
    fontSize: '24px',
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '4px',
  },
  activityDescription: {
    fontSize: '12px',
    color: '#6b7280',
  },
  activityTime: {
    fontSize: '12px',
    color: '#9ca3af',
  },
  pendingGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
  },
  pendingCard: {
    backgroundColor: '#ffffff',
    padding: '24px',
    borderRadius: '12px',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'center' as const,
    transition: 'all 0.2s',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  pendingCount: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#667eea',
    marginBottom: '8px',
  },
  pendingTitle: {
    fontSize: '14px',
    color: '#6b7280',
  },
};
