import { useAuth } from '../../contexts/SupabaseAuthContext';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';

export function OrganizerFinancials() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <div style={styles.container}>
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
      </div>
    </DashboardLayout>
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
    width: '100%',
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
