import { useAuth } from '../../contexts/SupabaseAuthContext';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';

export function OrganizerAnalytics() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <div style={styles.container}>
          <div style={styles.titleRow}>
            <div>
              <h2 style={styles.pageTitle}>Analytics</h2>
              <p style={styles.pageSubtitle}>
                Track your event performance and attendee insights
              </p>
            </div>
          </div>

          <div style={styles.content}>
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>📊</div>
              <h3 style={styles.emptyTitle}>No analytics data yet</h3>
              <p style={styles.emptyText}>
                Create events and start selling tickets to see detailed analytics and insights here.
              </p>
              <button
                style={styles.primaryButton}
                onClick={() => navigate('/organizer/create-event')}
              >
                Create Your First Event
              </button>
            </div>
          </div>
      </div>
    </DashboardLayout>
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
    marginBottom: '24px',
  },
  primaryButton: {
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '600',
    backgroundColor: '#667eea',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
};
