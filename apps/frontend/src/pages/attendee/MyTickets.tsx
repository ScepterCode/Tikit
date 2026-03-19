import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/FastAPIAuthContext';
import { useNavigate } from 'react-router-dom';
import { DashboardNavbar } from '../../components/layout/DashboardNavbar';
import { DashboardSidebar, SIDEBAR_WIDTH, SIDEBAR_BREAK } from '../../components/layout/DashboardSidebar';

export function MyTickets() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < SIDEBAR_BREAK);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < SIDEBAR_BREAK);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleLogout = async () => { await signOut(); navigate('/'); };

  const mainPadding = isMobile
    ? '96px 16px 60px'
    : `96px 40px 60px ${SIDEBAR_WIDTH + 40}px`;

  return (
    <div style={s.root}>
      <DashboardNavbar user={user!} onLogout={handleLogout} />
      <DashboardSidebar />

      <main style={{ ...s.main, padding: mainPadding }}>

        {/* Page header */}
        <div style={s.pageHeader}>
          <div>
            <h1 style={s.pageTitle}>My Tickets</h1>
            <p style={s.pageSub}>All your purchased event tickets</p>
          </div>
          <button style={s.primaryBtn} onClick={() => navigate('/events')}>
            + Browse Events
          </button>
        </div>

        {/* Filter row */}
        <div style={s.filterRow}>
          {['All', 'Upcoming', 'Past', 'Cancelled'].map((f) => (
            <button key={f} style={{ ...s.filterChip, ...(f === 'All' ? s.filterChipActive : {}) }}>
              {f}
            </button>
          ))}
        </div>

        {/* Empty state */}
        <div style={s.emptyCard}>
          <div style={s.emptyIconWrap}>
            <span style={s.emptyIconInner}>🎫</span>
          </div>
          <h3 style={s.emptyTitle}>No tickets yet</h3>
          <p style={s.emptyText}>
            You haven't purchased any tickets yet.<br />Find something exciting to attend!
          </p>
          <button style={s.primaryBtn} onClick={() => navigate('/events')}>
            Browse Events
          </button>
        </div>

      </main>
    </div>
  );
}

const s = {
  root: { minHeight: '100vh', backgroundColor: '#f5f6fa', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' },
  main: { maxWidth: '1100px' },

  pageHeader: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' as const },
  pageTitle: { fontSize: '24px', fontWeight: '800', color: '#111827', margin: '0 0 4px' },
  pageSub: { fontSize: '13px', color: '#9ca3af', margin: 0 },

  filterRow: { display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' as const },
  filterChip: { padding: '7px 16px', fontSize: '13px', fontWeight: '500', backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '20px', cursor: 'pointer', color: '#6b7280', transition: 'all 0.15s ease' },
  filterChipActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5', color: '#fff', fontWeight: '600' },

  primaryBtn: { padding: '10px 20px', fontSize: '13.5px', fontWeight: '600', background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', whiteSpace: 'nowrap' as const, flexShrink: 0 },

  emptyCard: { backgroundColor: '#fff', borderRadius: '20px', border: '1px solid #f1f3f5', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', padding: '64px 32px', textAlign: 'center' as const, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '12px' },
  emptyIconWrap: { width: '88px', height: '88px', borderRadius: '24px', backgroundColor: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' },
  emptyIconInner: { fontSize: '40px', lineHeight: 1 },
  emptyTitle: { fontSize: '20px', fontWeight: '700', color: '#111827', margin: 0 },
  emptyText: { fontSize: '14px', color: '#9ca3af', lineHeight: 1.6, margin: 0 },
};
