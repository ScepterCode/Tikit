import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/FastAPIAuthContext';
import { useNavigate } from 'react-router-dom';
import { DashboardNavbar } from '../../components/layout/DashboardNavbar';
import { DashboardSidebar, SIDEBAR_WIDTH, SIDEBAR_BREAK } from '../../components/layout/DashboardSidebar';
import { GroupBuyCreator } from '../../components/tickets/GroupBuyCreator';
import { SprayMoneyLeaderboard } from '../../components/events/SprayMoneyLeaderboard';

const MOCK_EVENT = {
  id: 'demo',
  title: 'Demo Event',
  tiers: [
    { id: 't1', name: 'Regular',  price: 5000,  capacity: 200, sold: 80 },
    { id: 't2', name: 'VIP',      price: 15000, capacity: 50,  sold: 20 },
    { id: 't3', name: 'Table',    price: 50000, capacity: 10,  sold: 3  },
  ],
};

export function AttendeeDashboard() {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < SIDEBAR_BREAK);
  const [activeFeature, setActiveFeature] = useState<'group-buy' | 'spray-money' | null>(null);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < SIDEBAR_BREAK);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleLogout = async () => { await signOut(); navigate('/'); };

  if (loading) return <LoadingScreen />;
  if (!user) return <ErrorScreen onLogin={() => navigate('/auth/login')} />;

  const initials = `${user.firstName?.charAt(0) ?? ''}${user.lastName?.charAt(0) ?? ''}`.toUpperCase() || '??';
  const fullName = `${user.firstName} ${user.lastName}`.trim();

  const stats = [
    { label: 'Active Tickets', value: '0', sub: 'Ready to use',        icon: '🎫', color: '#4f46e5', bg: '#eef2ff' },
    { label: 'Wallet Balance', value: `₦${(user.walletBalance || 0).toLocaleString()}`, sub: 'Available', icon: '💰', color: '#059669', bg: '#ecfdf5' },
    { label: 'Referral Code',  value: user.referralCode || 'N/A',       sub: 'Share & earn',   icon: '🎁', color: '#d97706', bg: '#fffbeb' },
    { label: 'Upcoming',       value: '0',                              sub: 'This month',     icon: '📅', color: '#7c3aed', bg: '#f5f3ff' },
  ];

  const actions = [
    { icon: '🔍', label: 'Browse Events',  sub: 'Discover events',      path: '/events' },
    { icon: '🎫', label: 'My Tickets',     sub: 'View all tickets',     path: '/attendee/tickets' },
    { icon: '💳', label: 'Add Funds',      sub: 'Top up wallet',        path: '/attendee/wallet' },
    { icon: '🎁', label: 'Referrals',      sub: 'Earn rewards',         path: '/attendee/referrals' },
    { icon: '👤', label: 'Profile',        sub: 'Manage account',       path: '/attendee/profile' },
    { icon: '🔔', label: 'Notifications',  sub: "What's new",           path: '/attendee/notifications' },
  ];

  const mainPadding = isMobile
    ? '96px 16px 60px'
    : `96px 40px 60px ${SIDEBAR_WIDTH + 40}px`;

  return (
    <div style={s.root}>
      <DashboardNavbar user={user} onLogout={handleLogout} />
      <DashboardSidebar onFeature={(f) => setActiveFeature(f as 'group-buy' | 'spray-money')} />

      <main style={{ ...s.main, padding: mainPadding }}>

        {/* ── Hero ─────────────────────────────────────────────────── */}
        <div style={s.hero}>
          <div style={s.heroOrb1} />
          <div style={s.heroOrb2} />
          <div style={s.heroContent}>
            <div style={s.heroLeft}>
              <p style={s.heroGreet}>Welcome back 👋</p>
              <h1 style={s.heroName}>{fullName}</h1>
              <p style={s.heroSub}>
                {user.state ? `Discovering events across ${user.state}` : 'Ready to discover amazing events'}
              </p>
              <div style={s.heroBadges}>
                <span style={s.badge}>● {user.role === 'attendee' ? 'Attendee' : user.role}</span>
                {user.isVerified && <span style={{ ...s.badge, ...s.badgeGreen }}>✓ Verified</span>}
              </div>
            </div>
            <div style={s.heroAvatarWrap}>
              <div style={s.avatarRing}>
                <div style={s.avatarInner}>{initials}</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Stats ────────────────────────────────────────────────── */}
        <div style={s.statsGrid}>
          {stats.map((stat) => (
            <div key={stat.label} style={s.statCard}>
              <div style={{ ...s.statIconBox, backgroundColor: stat.bg, color: stat.color }}>
                {stat.icon}
              </div>
              <div style={s.statBody}>
                <p style={s.statLabel}>{stat.label}</p>
                <p style={s.statValue}>{stat.value}</p>
                <p style={s.statSub}>{stat.sub}</p>
              </div>
              <div style={{ ...s.statBar, backgroundColor: stat.color }} />
            </div>
          ))}
        </div>

        {/* ── Quick Actions ─────────────────────────────────────────── */}
        <section style={s.section}>
          <h2 style={s.sectionTitle}>Quick Actions</h2>
          <div style={s.actionsGrid}>
            {actions.map((a) => (
              <button key={a.label} style={s.actionCard} onClick={() => navigate(a.path)}>
                <span style={s.actionIcon}>{a.icon}</span>
                <div style={s.actionBody}>
                  <p style={s.actionLabel}>{a.label}</p>
                  <p style={s.actionSub}>{a.sub}</p>
                </div>
                <span style={s.actionChevron}>›</span>
              </button>
            ))}
          </div>
        </section>

        {/* ── Account Details ───────────────────────────────────────── */}
        <section style={s.section}>
          <h2 style={s.sectionTitle}>Account Details</h2>
          <div style={s.infoCard}>
            {[
              { label: 'Full Name',    value: fullName || '—' },
              { label: 'Phone',        value: user.phoneNumber || '—' },
              { label: 'Email',        value: user.email || 'Not provided' },
              { label: 'State',        value: user.state || '—' },
              { label: 'Role',         value: user.role || '—' },
              { label: 'Verified',     value: user.isVerified ? 'Yes ✓' : 'Pending' },
            ].map(({ label, value }, i, arr) => (
              <div key={label} style={{ ...s.infoRow, ...(i === arr.length - 1 ? s.infoRowLast : {}) }}>
                <span style={s.infoLabel}>{label}</span>
                <span style={s.infoValue}>{value}</span>
              </div>
            ))}
          </div>
        </section>

      </main>

      {/* Feature modals */}
      {activeFeature && (
        <div style={s.modalOverlay} onClick={() => setActiveFeature(null)}>
          <div style={s.modalSheet} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalSheetHead}>
              <p style={s.modalSheetTitle}>
                {activeFeature === 'group-buy' ? '👥 Group Buys' : '💸 Spray Money'}
              </p>
              <button style={s.modalSheetClose} onClick={() => setActiveFeature(null)}>✕</button>
            </div>
            <div style={s.modalSheetBody}>
              {activeFeature === 'group-buy' && (
                <GroupBuyCreator
                  event={MOCK_EVENT}
                  onGroupBuyCreated={() => setActiveFeature(null)}
                />
              )}
              {activeFeature === 'spray-money' && (
                <SprayMoneyLeaderboard
                  eventId="demo"
                  onSprayMoney={async (amount, message) => {
                    alert(`Sprayed ₦${amount.toLocaleString()}${message ? `: "${message}"` : ''}`);
                  }}
                  isOnline={false}
                />
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ─── Loading & Error ─────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div style={s.fullCenter}>
      <div style={s.spinner} />
      <p style={s.loadingText}>Loading your dashboard…</p>
    </div>
  );
}
function ErrorScreen({ onLogin }: { onLogin: () => void }) {
  return (
    <div style={s.fullCenter}>
      <div style={s.errorBox}>
        <p style={s.errorTitle}>Session expired</p>
        <p style={s.errorSub}>Please sign in again.</p>
        <button onClick={onLogin} style={s.errorBtn}>Go to Login</button>
      </div>
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const s = {
  root: { minHeight: '100vh', backgroundColor: '#f5f6fa', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' },
  main: { maxWidth: '1100px' },

  fullCenter: { minHeight: '100vh', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', gap: '14px', backgroundColor: '#f5f6fa' },
  spinner: { width: '36px', height: '36px', border: '3px solid #e5e7eb', borderTop: '3px solid #667eea', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  loadingText: { fontSize: '14px', color: '#9ca3af', margin: 0 },
  errorBox: { padding: '32px', backgroundColor: '#fff', borderRadius: '20px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', textAlign: 'center' as const, maxWidth: '340px' },
  errorTitle: { fontSize: '18px', fontWeight: '700', color: '#111827', margin: '0 0 6px' },
  errorSub: { fontSize: '14px', color: '#6b7280', margin: '0 0 20px' },
  errorBtn: { padding: '10px 24px', fontSize: '14px', fontWeight: '600', backgroundColor: '#667eea', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer' },

  // Hero
  hero: {
    position: 'relative' as const,
    background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 55%, #4c1d95 100%)',
    borderRadius: '20px',
    marginBottom: '24px',
    overflow: 'hidden',
  },
  heroOrb1: { position: 'absolute' as const, width: '260px', height: '260px', borderRadius: '50%', background: 'rgba(167,139,250,0.15)', top: '-80px', right: '-40px', pointerEvents: 'none' as const },
  heroOrb2: { position: 'absolute' as const, width: '180px', height: '180px', borderRadius: '50%', background: 'rgba(99,102,241,0.2)', bottom: '-60px', left: '20%', pointerEvents: 'none' as const },
  heroContent: { position: 'relative' as const, zIndex: 1, padding: '36px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px' },
  heroLeft: { flex: 1, minWidth: 0 },
  heroGreet: { fontSize: '13px', color: 'rgba(255,255,255,0.55)', margin: '0 0 6px', fontWeight: '500' },
  heroName: { fontSize: '28px', fontWeight: '800', color: '#fff', margin: '0 0 8px', lineHeight: 1.2 },
  heroSub: { fontSize: '14px', color: 'rgba(255,255,255,0.5)', margin: '0 0 18px' },
  heroBadges: { display: 'flex', gap: '8px', flexWrap: 'wrap' as const },
  badge: { padding: '5px 12px', fontSize: '12px', fontWeight: '600', backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.85)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.15)' },
  badgeGreen: { backgroundColor: 'rgba(16,185,129,0.2)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.3)' },
  heroAvatarWrap: { flexShrink: 0 },
  avatarRing: { width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg,#a78bfa,#818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 4px rgba(167,139,250,0.25),0 8px 24px rgba(0,0,0,0.3)' },
  avatarInner: { width: '70px', height: '70px', borderRadius: '50%', background: 'linear-gradient(135deg,#6d28d9,#4c1d95)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: '800', color: '#fff' },

  // Stats
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '14px', marginBottom: '24px' },
  statCard: { backgroundColor: '#fff', borderRadius: '16px', padding: '20px', display: 'flex', gap: '14px', alignItems: 'flex-start', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', border: '1px solid #f1f3f5', position: 'relative' as const, overflow: 'hidden' },
  statIconBox: { width: '42px', height: '42px', borderRadius: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 },
  statBody: { flex: 1, minWidth: 0 },
  statLabel: { fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase' as const, letterSpacing: '0.5px', margin: '0 0 4px' },
  statValue: { fontSize: '20px', fontWeight: '800', color: '#111827', margin: '0 0 2px', lineHeight: 1.2 },
  statSub: { fontSize: '11px', color: '#d1d5db', margin: 0 },
  statBar: { position: 'absolute' as const, bottom: 0, left: 0, right: 0, height: '3px', opacity: 0.7 },

  // Sections
  section: { marginBottom: '24px' },
  sectionTitle: { fontSize: '16px', fontWeight: '700', color: '#111827', margin: '0 0 12px' },

  // Actions
  actionsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', gap: '10px' },
  actionCard: { display: 'flex', alignItems: 'center', gap: '14px', padding: '15px 16px', backgroundColor: '#fff', border: '1px solid #f1f3f5', borderRadius: '14px', cursor: 'pointer', textAlign: 'left' as const, boxShadow: '0 1px 4px rgba(0,0,0,0.04)', width: '100%', transition: 'box-shadow 0.18s ease' },
  actionIcon: { fontSize: '22px', lineHeight: 1, flexShrink: 0 },
  actionBody: { flex: 1, minWidth: 0 },
  actionLabel: { fontSize: '13.5px', fontWeight: '600', color: '#111827', margin: '0 0 2px' },
  actionSub: { fontSize: '12px', color: '#9ca3af', margin: 0 },
  actionChevron: { fontSize: '20px', color: '#d1d5db', fontWeight: '300', flexShrink: 0 },

  // Feature modals
  modalOverlay: { position: 'fixed' as const, inset: 0, backgroundColor: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
  modalSheet: { backgroundColor: '#fff', borderRadius: '20px', width: '100%', maxWidth: '520px', maxHeight: '85vh', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden', display: 'flex', flexDirection: 'column' as const },
  modalSheetHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 16px', borderBottom: '1px solid #f1f3f5', flexShrink: 0 },
  modalSheetTitle: { fontSize: '17px', fontWeight: '700', color: '#111827', margin: 0 },
  modalSheetClose: { width: '30px', height: '30px', border: 'none', backgroundColor: '#f3f4f6', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', color: '#6b7280', flexShrink: 0 },
  modalSheetBody: { overflowY: 'auto' as const, padding: '20px 24px 24px' },

  // Info card
  infoCard: { backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #f1f3f5', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden' },
  infoRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 20px', borderBottom: '1px solid #f9fafb' },
  infoRowLast: { borderBottom: 'none' },
  infoLabel: { fontSize: '13px', color: '#9ca3af', fontWeight: '500' },
  infoValue: { fontSize: '13px', fontWeight: '600', color: '#111827' },
};
