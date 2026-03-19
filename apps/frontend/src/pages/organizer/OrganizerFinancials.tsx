import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/FastAPIAuthContext';
import { useNavigate } from 'react-router-dom';
import { DashboardNavbar } from '../../components/layout/DashboardNavbar';
import { OrganizerSidebar, ORG_SIDEBAR_WIDTH, ORG_SIDEBAR_BREAK } from '../../components/layout/OrganizerSidebar';

const STAT_CARDS = [
  { icon: '💰', label: 'Total Revenue',      value: '₦0', sub: 'All time',           color: '#10b981', bg: '#ecfdf5' },
  { icon: '📈', label: 'This Month',          value: '₦0', sub: 'Current month',      color: '#667eea', bg: '#eef2ff' },
  { icon: '💳', label: 'Pending Payouts',     value: '₦0', sub: 'Processing',         color: '#f59e0b', bg: '#fffbeb' },
  { icon: '🏦', label: 'Available Balance',   value: '₦0', sub: 'Ready to withdraw',  color: '#8b5cf6', bg: '#f5f3ff' },
];

export function OrganizerFinancials() {
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
            <h2 style={s.pageTitle}>Financials</h2>
            <p style={s.pageSubtitle}>Track your revenue, payouts, and financial performance</p>
          </div>
        </div>

        {/* Stat cards */}
        <div style={s.statsGrid}>
          {STAT_CARDS.map((c) => (
            <div key={c.label} style={s.statCard}>
              <div style={{ ...s.statIconBox, backgroundColor: c.bg, color: c.color }}>{c.icon}</div>
              <div>
                <p style={s.statLabel}>{c.label}</p>
                <p style={{ ...s.statValue, color: c.color }}>{c.value}</p>
                <p style={s.statSub}>{c.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Empty state */}
        <div style={s.card}>
          <div style={s.emptyState}>
            <div style={s.emptyIcon}>💰</div>
            <h3 style={s.emptyTitle}>No financial data yet</h3>
            <p style={s.emptyText}>
              Start selling tickets to see your revenue and financial analytics here.
            </p>
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
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '16px', marginBottom: '24px' },
  statCard: { backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #f1f3f5', padding: '20px', display: 'flex', gap: '16px', alignItems: 'flex-start' },
  statIconBox: { width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 },
  statLabel: { fontSize: '12px', color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase' as const, letterSpacing: '0.4px', margin: '0 0 4px' },
  statValue: { fontSize: '24px', fontWeight: '800', margin: '0 0 2px' },
  statSub: { fontSize: '11px', color: '#9ca3af', margin: 0 },
  card: { backgroundColor: '#fff', borderRadius: '20px', border: '1px solid #f1f3f5', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', padding: '64px 32px' },
  emptyState: { textAlign: 'center' as const, maxWidth: '400px', margin: '0 auto' },
  emptyIcon: { fontSize: '56px', marginBottom: '16px' },
  emptyTitle: { fontSize: '20px', fontWeight: '700', color: '#111827', margin: '0 0 8px' },
  emptyText: { fontSize: '14px', color: '#9ca3af', margin: 0, lineHeight: 1.6 },
};
