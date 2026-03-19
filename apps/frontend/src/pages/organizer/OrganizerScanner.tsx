import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/FastAPIAuthContext';
import { useNavigate } from 'react-router-dom';
import { DashboardNavbar } from '../../components/layout/DashboardNavbar';
import { OrganizerSidebar, ORG_SIDEBAR_WIDTH, ORG_SIDEBAR_BREAK } from '../../components/layout/OrganizerSidebar';

export function OrganizerScanner() {
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
            <h2 style={s.pageTitle}>Ticket Scanner</h2>
            <p style={s.pageSubtitle}>Scan and verify attendee tickets at your events</p>
          </div>
        </div>

        {/* Scanner card */}
        <div style={{ ...s.card, marginBottom: '20px', textAlign: 'center' as const }}>
          <div style={s.scannerIcon}>📱</div>
          <h3 style={s.scannerTitle}>QR Code Scanner</h3>
          <p style={s.scannerText}>
            Use your device camera to scan attendee tickets and verify their authenticity.
          </p>
          <button style={s.scanBtn} onClick={() => alert('Scanner will be implemented soon!')}>
            Start Scanning
          </button>
        </div>

        {/* Stats row */}
        <div style={s.statsRow}>
          {[
            { icon: '✅', label: 'Verified Today', value: '0', color: '#10b981', bg: '#ecfdf5' },
            { icon: '❌', label: 'Invalid Scans',  value: '0', color: '#ef4444', bg: '#fef2f2' },
          ].map((c) => (
            <div key={c.label} style={s.statCard}>
              <div style={{ ...s.statIconBox, backgroundColor: c.bg, color: c.color }}>{c.icon}</div>
              <div>
                <p style={s.statLabel}>{c.label}</p>
                <p style={{ ...s.statValue, color: c.color }}>{c.value}</p>
              </div>
            </div>
          ))}
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
  card: { backgroundColor: '#fff', borderRadius: '20px', border: '1px solid #f1f3f5', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', padding: '48px 32px' },
  scannerIcon: { fontSize: '56px', marginBottom: '16px' },
  scannerTitle: { fontSize: '22px', fontWeight: '700', color: '#111827', margin: '0 0 10px' },
  scannerText: { fontSize: '14px', color: '#9ca3af', margin: '0 auto 24px', maxWidth: '400px', lineHeight: 1.6 },
  scanBtn: { padding: '13px 32px', fontSize: '15px', fontWeight: '700', background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer' },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '16px' },
  statCard: { backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #f1f3f5', padding: '20px', display: 'flex', gap: '16px', alignItems: 'center' },
  statIconBox: { width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 },
  statLabel: { fontSize: '12px', color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase' as const, letterSpacing: '0.4px', margin: '0 0 4px' },
  statValue: { fontSize: '28px', fontWeight: '800', margin: 0 },
};
