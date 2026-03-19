import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/FastAPIAuthContext';
import { useNavigate } from 'react-router-dom';
import { DashboardNavbar } from '../../components/layout/DashboardNavbar';
import { DashboardSidebar, SIDEBAR_WIDTH, SIDEBAR_BREAK } from '../../components/layout/DashboardSidebar';

interface ReferralHistory {
  id: string;
  referredUser: string;
  dateReferred: string;
  status: 'pending' | 'active' | 'completed';
  earnings: number;
}

const MOCK_HISTORY: ReferralHistory[] = [
  { id: '1', referredUser: 'John D.',  dateReferred: '2025-12-28', status: 'completed', earnings: 2000 },
  { id: '2', referredUser: 'Sarah M.', dateReferred: '2025-12-25', status: 'active',    earnings: 2000 },
  { id: '3', referredUser: 'Mike J.',  dateReferred: '2025-12-22', status: 'pending',   earnings: 0 },
  { id: '4', referredUser: 'Emma W.',  dateReferred: '2025-12-20', status: 'completed', earnings: 2000 },
];

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  completed: { bg: '#ecfdf5', color: '#059669' },
  active:    { bg: '#eef2ff', color: '#4f46e5' },
  pending:   { bg: '#fffbeb', color: '#d97706' },
};

export function Referrals() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < SIDEBAR_BREAK);
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < SIDEBAR_BREAK);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleLogout = async () => { await signOut(); navigate('/'); };

  const code = user?.referralCode || 'GROOOVY123';
  const link = `https://grooovy.com/register?ref=${code}`;

  const copy = (text: string, type: 'code' | 'link') => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const share = (platform: string) => {
    const msg = `Join Grooovy for amazing event tickets! Use my code: ${code}`;
    if (platform === 'whatsapp') window.open(`https://wa.me/?text=${encodeURIComponent(msg + ' ' + link)}`);
    if (platform === 'twitter')  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(msg)}&url=${encodeURIComponent(link)}`);
    if (platform === 'facebook') window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`);
  };

  const mainPadding = isMobile
    ? '96px 16px 60px'
    : `96px 40px 60px ${SIDEBAR_WIDTH + 40}px`;

  const stats = [
    { icon: '👥', label: 'Total Referrals',  value: '12',         color: '#4f46e5', bg: '#eef2ff' },
    { icon: '✅', label: 'Active',           value: '8',          color: '#059669', bg: '#ecfdf5' },
    { icon: '💰', label: 'Total Earned',     value: '₦24,000',    color: '#d97706', bg: '#fffbeb' },
    { icon: '⏳', label: 'Pending',          value: '₦6,000',     color: '#7c3aed', bg: '#f5f3ff' },
  ];

  return (
    <div style={s.root}>
      <DashboardNavbar user={user!} onLogout={handleLogout} />
      <DashboardSidebar />

      <main style={{ ...s.main, padding: mainPadding }}>

        <div style={s.pageHeader}>
          <h1 style={s.pageTitle}>Referral Program</h1>
          <p style={s.pageSub}>Invite friends and earn ₦2,000 for every successful referral</p>
        </div>

        {/* Stats */}
        <div style={s.statsGrid}>
          {stats.map((stat) => (
            <div key={stat.label} style={s.statCard}>
              <div style={{ ...s.statIcon, backgroundColor: stat.bg, color: stat.color }}>{stat.icon}</div>
              <div>
                <p style={s.statValue}>{stat.value}</p>
                <p style={s.statLabel}>{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Code card */}
        <div style={s.codeCard}>
          <div style={s.codeCardHead}>
            <div style={s.codeCardIcon}>🎁</div>
            <div>
              <p style={s.codeCardTitle}>Your Referral Code</p>
              <p style={s.codeCardSub}>Share this code and earn rewards</p>
            </div>
          </div>

          <div style={s.codeDisplay}>
            <span style={s.codeText}>{code}</span>
            <button style={s.copyBtn} onClick={() => copy(code, 'code')}>
              {copied === 'code' ? '✓ Copied' : '📋 Copy Code'}
            </button>
          </div>

          <div style={s.linkRow}>
            <span style={s.linkText}>{link}</span>
            <button style={{ ...s.copyBtn, ...s.copyBtnSmall }} onClick={() => copy(link, 'link')}>
              {copied === 'link' ? '✓' : '📋'}
            </button>
          </div>

          <div style={s.shareRow}>
            <p style={s.shareLabel}>Share via</p>
            <div style={s.shareButtons}>
              <button style={{ ...s.shareBtn, ...s.shareBtnWA }} onClick={() => share('whatsapp')}>📱 WhatsApp</button>
              <button style={{ ...s.shareBtn, ...s.shareBtnTW }} onClick={() => share('twitter')}>🐦 Twitter</button>
              <button style={{ ...s.shareBtn, ...s.shareBtnFB }} onClick={() => share('facebook')}>📘 Facebook</button>
            </div>
          </div>
        </div>

        {/* How it works */}
        <section style={s.section}>
          <h2 style={s.sectionTitle}>How It Works</h2>
          <div style={s.stepsGrid}>
            {[
              { n: '1', title: 'Share Your Code', desc: 'Share your unique referral code or link with friends and family.' },
              { n: '2', title: 'Friend Registers', desc: 'Your friend signs up using your code and makes their first purchase.' },
              { n: '3', title: 'Earn Rewards',     desc: 'You both get ₦2,000 credited to your wallets instantly.' },
            ].map((step) => (
              <div key={step.n} style={s.stepCard}>
                <div style={s.stepNum}>{step.n}</div>
                <h3 style={s.stepTitle}>{step.title}</h3>
                <p style={s.stepDesc}>{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* History */}
        <section style={s.section}>
          <h2 style={s.sectionTitle}>Referral History</h2>
          <div style={s.table}>
            <div style={s.tableHead}>
              <span>User</span>
              <span>Date</span>
              <span>Status</span>
              <span style={{ textAlign: 'right' as const }}>Earnings</span>
            </div>
            {MOCK_HISTORY.map((r) => {
              const st = STATUS_STYLES[r.status];
              return (
                <div key={r.id} style={s.tableRow}>
                  <span style={s.rowUser}>{r.referredUser}</span>
                  <span style={s.rowDate}>{new Date(r.dateReferred).toLocaleDateString()}</span>
                  <span style={{ ...s.rowStatus, backgroundColor: st.bg, color: st.color }}>
                    {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                  </span>
                  <span style={{ ...s.rowEarnings, textAlign: 'right' as const }}>
                    {r.earnings > 0 ? `₦${r.earnings.toLocaleString()}` : '—'}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

      </main>
    </div>
  );
}

const s = {
  root: { minHeight: '100vh', backgroundColor: '#f5f6fa', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' },
  main: { maxWidth: '1100px' },

  pageHeader: { marginBottom: '24px' },
  pageTitle: { fontSize: '24px', fontWeight: '800', color: '#111827', margin: '0 0 4px' },
  pageSub: { fontSize: '13px', color: '#9ca3af', margin: 0 },

  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: '12px', marginBottom: '24px' },
  statCard: { backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #f1f3f5', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px' },
  statIcon: { width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 },
  statValue: { fontSize: '20px', fontWeight: '800', color: '#111827', margin: '0 0 2px' },
  statLabel: { fontSize: '12px', color: '#9ca3af', margin: 0, fontWeight: '500' },

  codeCard: { backgroundColor: '#fff', borderRadius: '20px', border: '1px solid #f1f3f5', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', padding: '28px', marginBottom: '24px' },
  codeCardHead: { display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' },
  codeCardIcon: { width: '44px', height: '44px', borderRadius: '12px', backgroundColor: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' },
  codeCardTitle: { fontSize: '16px', fontWeight: '700', color: '#111827', margin: '0 0 2px' },
  codeCardSub: { fontSize: '13px', color: '#9ca3af', margin: 0 },
  codeDisplay: { display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '14px', border: '1.5px dashed #e5e7eb', marginBottom: '12px', flexWrap: 'wrap' as const },
  codeText: { flex: 1, fontSize: '22px', fontWeight: '800', color: '#4f46e5', letterSpacing: '3px', minWidth: '120px' },
  copyBtn: { padding: '9px 18px', fontSize: '13px', fontWeight: '600', background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', whiteSpace: 'nowrap' as const },
  copyBtnSmall: { padding: '8px 12px', fontSize: '14px', flexShrink: 0 },
  linkRow: { display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', backgroundColor: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb', marginBottom: '20px' },
  linkText: { flex: 1, fontSize: '12px', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const },
  shareRow: { borderTop: '1px solid #f1f3f5', paddingTop: '20px' },
  shareLabel: { fontSize: '12px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase' as const, letterSpacing: '0.5px', margin: '0 0 12px' },
  shareButtons: { display: 'flex', gap: '10px', flexWrap: 'wrap' as const },
  shareBtn: { padding: '10px 18px', fontSize: '13.5px', fontWeight: '600', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer' },
  shareBtnWA: { backgroundColor: '#25d366' },
  shareBtnTW: { backgroundColor: '#1da1f2' },
  shareBtnFB: { backgroundColor: '#4267b2' },

  section: { marginBottom: '24px' },
  sectionTitle: { fontSize: '16px', fontWeight: '700', color: '#111827', margin: '0 0 14px' },

  stepsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '12px' },
  stepCard: { backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #f1f3f5', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', padding: '22px', textAlign: 'center' as const },
  stepNum: { width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '800', margin: '0 auto 14px' },
  stepTitle: { fontSize: '15px', fontWeight: '700', color: '#111827', margin: '0 0 8px' },
  stepDesc: { fontSize: '13px', color: '#6b7280', lineHeight: '1.6', margin: 0 },

  table: { backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #f1f3f5', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden' },
  tableHead: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px', padding: '12px 20px', backgroundColor: '#fafafa', borderBottom: '1px solid #f1f3f5', fontSize: '11px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase' as const, letterSpacing: '0.5px' },
  tableRow: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px', padding: '14px 20px', borderBottom: '1px solid #f9fafb', alignItems: 'center', fontSize: '13.5px' },
  rowUser: { fontWeight: '600', color: '#111827' },
  rowDate: { color: '#6b7280' },
  rowStatus: { padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', display: 'inline-block', width: 'fit-content' },
  rowEarnings: { fontWeight: '700', color: '#059669' },
};
