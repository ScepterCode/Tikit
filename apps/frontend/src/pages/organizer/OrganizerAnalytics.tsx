import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/FastAPIAuthContext';
import { useNavigate } from 'react-router-dom';
import { DashboardNavbar } from '../../components/layout/DashboardNavbar';
import { OrganizerSidebar, ORG_SIDEBAR_WIDTH, ORG_SIDEBAR_BREAK } from '../../components/layout/OrganizerSidebar';

export function OrganizerAnalytics() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < ORG_SIDEBAR_BREAK);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < ORG_SIDEBAR_BREAK);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleLogout = async () => { await signOut(); navigate('/'); };
  const mainPadding = isMobile ? '96px 16px 60px' : `96px 40px 60px ${ORG_SIDEBAR_WIDTH + 40}px`;

  return (
    <div style={s.root}>
      <DashboardNavbar user={user!} onLogout={handleLogout} />
      <OrganizerSidebar />
      <main style={{ ...s.main, padding: mainPadding }}>

        <div style={s.titleRow}>
          <div>
            <h2 style={s.pageTitle}>Analytics</h2>
            <p style={s.pageSubtitle}>Track your event performance and attendee insights</p>
          </div>
        </div>

        <div style={s.card}>
          <div style={s.emptyState}>
            <div style={s.emptyIcon}>📊</div>
            <h3 style={s.emptyTitle}>No analytics data yet</h3>
            <p style={s.emptyText}>
              Create events and start selling tickets to see detailed analytics and insights here.
            </p>
            <button style={s.primaryBtn} onClick={() => navigate('/organizer/create-event')}>
              Create Your First Event
            </button>
          </div>
        </div>

      </main>
    </div>
  );
}

const s = {
  root: { minHeight: '100vh', backgroundColor: '#f5f6fa', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' },
  main: { maxWidth: '1200px' },
  titleRow: { marginBottom: '28px' },
  pageTitle: { fontSize: '26px', fontWeight: '800', color: '#111827', margin: '0 0 4px' },
  pageSubtitle: { fontSize: '14px', color: '#9ca3af', margin: 0 },
  card: { backgroundColor: '#fff', borderRadius: '20px', border: '1px solid #f1f3f5', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', padding: '64px 32px' },
  emptyState: { textAlign: 'center' as const, maxWidth: '400px', margin: '0 auto' },
  emptyIcon: { fontSize: '56px', marginBottom: '16px' },
  emptyTitle: { fontSize: '20px', fontWeight: '700', color: '#111827', margin: '0 0 8px' },
  emptyText: { fontSize: '14px', color: '#9ca3af', margin: '0 0 24px', lineHeight: 1.6 },
  primaryBtn: { padding: '12px 24px', fontSize: '14px', fontWeight: '700', background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer' },
};
