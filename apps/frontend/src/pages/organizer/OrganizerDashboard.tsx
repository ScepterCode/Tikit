import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/FastAPIAuthContext';
import { useNavigate } from 'react-router-dom';
import { DashboardNavbar } from '../../components/layout/DashboardNavbar';
import { OrganizerSidebar, ORG_SIDEBAR_WIDTH, ORG_SIDEBAR_BREAK } from '../../components/layout/OrganizerSidebar';
import { SprayMoneyLeaderboard } from '../../components/events/SprayMoneyLeaderboard';
import { WeddingAnalytics } from '../../components/events/WeddingAnalytics';

export function OrganizerDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < ORG_SIDEBAR_BREAK);
  const [activeFeature, setActiveFeature] = useState<'spray-money' | 'analytics' | null>(null);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < ORG_SIDEBAR_BREAK);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleLogout = async () => { await signOut(); navigate('/'); };

  const orgName = user?.organizationName || `${user?.firstName} ${user?.lastName}`.trim();
  const initials = `${user?.firstName?.charAt(0) ?? ''}${user?.lastName?.charAt(0) ?? ''}`.toUpperCase() || '??';

  const mainPadding = isMobile
    ? '96px 16px 60px'
    : `96px 40px 60px ${ORG_SIDEBAR_WIDTH + 40}px`;

  const stats = [
    { label: 'Total Events',    value: '0',  sub: 'All time',    icon: '🎉', color: '#4f46e5', bg: '#eef2ff' },
    { label: 'Tickets Sold',    value: '0',  sub: 'This month',  icon: '🎫', color: '#059669', bg: '#ecfdf5' },
    { label: 'Revenue',         value: '₦0', sub: 'This month',  icon: '💰', color: '#d97706', bg: '#fffbeb' },
    { label: 'Total Attendees', value: '0',  sub: 'All events',  icon: '👥', color: '#7c3aed', bg: '#f5f3ff' },
  ];

  const quickActions = [
    { icon: '➕', label: 'Create Event',   sub: 'Set up a new event',         path: '/organizer/create-event' },
    { icon: '📱', label: 'Scan Tickets',   sub: 'Verify attendee tickets',    path: '/organizer/scanner' },
    { icon: '📢', label: 'Broadcast',      sub: 'Message your attendees',     path: '/organizer/broadcast' },
    { icon: '📊', label: 'Analytics',      sub: 'Check event performance',    path: '/organizer/analytics' },
    { icon: '👥', label: 'Attendees',      sub: 'Manage your audience',       path: '/organizer/attendees' },
    { icon: '💰', label: 'Financials',     sub: 'Revenue & payouts',          path: '/organizer/financials' },
  ];

  const specialEvents = [
    { icon: '💒', label: 'Wedding Event',    desc: 'Aso-ebi, food RSVP & spray money',    badge: 'Cultural',    badgeBg: '#fef3c7', badgeColor: '#92400e', onClick: () => navigate('/organizer/create-event?template=wedding') },
    { icon: '🔒', label: 'Hidden Event',     desc: 'Private event with 4-digit access code', badge: 'Private',  badgeBg: '#f3f4f6', badgeColor: '#374151', onClick: () => { const code = Math.floor(1000 + Math.random() * 9000); alert(`Hidden event created!\nAccess code: ${code}\nShare this with invitees.`); } },
    { icon: '👥', label: 'Group Buy Event',  desc: 'Enable group purchases for bulk discounts', badge: 'Savings', badgeBg: '#ecfdf5', badgeColor: '#065f46', onClick: () => navigate('/organizer/create-event?feature=group-buy') },
    { icon: '📞', label: 'USSD Integration', desc: 'Sell tickets via *7477# for feature phones', badge: 'Offline', badgeBg: '#eef2ff', badgeColor: '#3730a3', onClick: () => alert('USSD Integration Setup:\n\n1. Contact Africa\'s Talking for shortcode\n2. Configure webhook endpoint\n3. Test with *7477#') },
  ];

  const managementItems = [
    { icon: '💸', label: 'Spray Money Leaderboard', desc: 'View live wedding contributions',        onClick: () => setActiveFeature('spray-money') },
    { icon: '📊', label: 'Wedding Analytics',        desc: 'Food RSVP, aso-ebi sales & totals',     onClick: () => setActiveFeature('analytics') },
    { icon: '📱', label: 'QR Code Scanner',          desc: 'Verify tickets with duplicate detection', onClick: () => navigate('/organizer/scanner') },
    { icon: '📢', label: 'WhatsApp Broadcast',       desc: 'Send messages to all attendees',         onClick: () => navigate('/organizer/broadcast') },
    { icon: '💳', label: 'Payment Methods',          desc: 'Card, bank, Opay, Palmpay & airtime',    onClick: () => navigate('/organizer/financials') },
    { icon: '📈', label: 'Real-time Updates',        desc: 'Live capacity and sales tracking',       onClick: () => navigate('/organizer/analytics') },
  ];

  return (
    <div style={s.root}>
      <DashboardNavbar user={user!} onLogout={handleLogout} />
      <OrganizerSidebar />

      <main style={{ ...s.main, padding: mainPadding }}>

        {/* ── Hero ── */}
        <div style={s.hero}>
          <div style={s.heroOrb1} />
          <div style={s.heroOrb2} />
          <div style={s.heroContent}>
            <div style={s.heroLeft}>
              <p style={s.heroGreet}>Welcome back 👋</p>
              <h1 style={s.heroName}>{orgName}</h1>
              <p style={s.heroSub}>
                {user?.state ? `Managing events across ${user.state}` : 'Ready to create amazing events'}
              </p>
              <div style={s.heroBadges}>
                <span style={s.badge}>🎪 Organizer</span>
                {user?.isVerified
                  ? <span style={{ ...s.badge, ...s.badgeGreen }}>✓ Verified</span>
                  : <span style={{ ...s.badge, ...s.badgeAmber }}>⚠ Unverified</span>}
              </div>
            </div>
            <div style={s.heroRight}>
              <div style={s.avatarRing}>
                <div style={s.avatarInner}>{initials}</div>
              </div>
              <button style={s.createBtn} onClick={() => navigate('/organizer/create-event')}>
                + Create Event
              </button>
            </div>
          </div>
        </div>

        {/* ── Unverified banner ── */}
        {!user?.isVerified && (
          <div style={s.banner}>
            <div>
              <p style={s.bannerTitle}>⚠️ Account Not Verified</p>
              <p style={s.bannerText}>Complete verification to start selling tickets and receiving payments.</p>
            </div>
            <button style={s.bannerBtn}>Verify Now</button>
          </div>
        )}

        {/* ── Stats ── */}
        <div style={s.statsGrid}>
          {stats.map((stat) => (
            <div key={stat.label} style={s.statCard}>
              <div style={{ ...s.statIconBox, backgroundColor: stat.bg, color: stat.color }}>{stat.icon}</div>
              <div style={s.statBody}>
                <p style={s.statLabel}>{stat.label}</p>
                <p style={s.statValue}>{stat.value}</p>
                <p style={s.statSub}>{stat.sub}</p>
              </div>
              <div style={{ ...s.statBar, backgroundColor: stat.color }} />
            </div>
          ))}
        </div>

        {/* ── Quick Actions ── */}
        <section style={s.section}>
          <h2 style={s.sectionTitle}>Quick Actions</h2>
          <div style={s.actionsGrid}>
            {quickActions.map((a) => (
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

        {/* ── Special Events ── */}
        <section style={s.section}>
          <h2 style={s.sectionTitle}>Create Special Events</h2>
          <div style={s.specialGrid}>
            {specialEvents.map((e) => (
              <button key={e.label} style={s.specialCard} onClick={e.onClick}>
                <div style={s.specialCardTop}>
                  <div style={s.specialIconWrap}>{e.icon}</div>
                  <span style={{ ...s.specialBadge, backgroundColor: e.badgeBg, color: e.badgeColor }}>{e.badge}</span>
                </div>
                <p style={s.specialLabel}>{e.label}</p>
                <p style={s.specialDesc}>{e.desc}</p>
              </button>
            ))}
          </div>
        </section>

        {/* ── Event Management ── */}
        <section style={s.section}>
          <h2 style={s.sectionTitle}>Event Management</h2>
          <div style={s.mgmtGrid}>
            {managementItems.map((m) => (
              <button key={m.label} style={s.mgmtCard} onClick={m.onClick}>
                <span style={s.mgmtIcon}>{m.icon}</span>
                <div style={s.mgmtBody}>
                  <p style={s.mgmtLabel}>{m.label}</p>
                  <p style={s.mgmtDesc}>{m.desc}</p>
                </div>
                <span style={s.mgmtChevron}>›</span>
              </button>
            ))}
          </div>
        </section>

        {/* ── Recent Events ── */}
        <section style={s.section}>
          <h2 style={s.sectionTitle}>Recent Events</h2>
          <div style={s.emptyCard}>
            <div style={s.emptyIconWrap}><span style={s.emptyIcon}>🎉</span></div>
            <h3 style={s.emptyTitle}>No events yet</h3>
            <p style={s.emptyText}>Get started by creating your first event!</p>
            <button style={s.emptyBtn} onClick={() => navigate('/organizer/create-event')}>
              Create Your First Event
            </button>
          </div>
        </section>

      </main>

      {/* ── Feature modals ── */}
      {activeFeature && (
        <div style={s.modalOverlay} onClick={() => setActiveFeature(null)}>
          <div style={s.modalSheet} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalHead}>
              <p style={s.modalTitle}>
                {activeFeature === 'spray-money' ? '💸 Spray Money Leaderboard' : '📊 Wedding Analytics'}
              </p>
              <button style={s.modalClose} onClick={() => setActiveFeature(null)}>✕</button>
            </div>
            <div style={s.modalBody}>
              {activeFeature === 'spray-money' && (
                <SprayMoneyLeaderboard
                  eventId="demo-wedding-event"
                  onSprayMoney={async (amount, message) => {
                    alert(`Successfully sprayed ₦${amount.toLocaleString()}!${message ? `\n"${message}"` : ''}`);
                  }}
                  isOnline={true}
                />
              )}
              {activeFeature === 'analytics' && (
                <WeddingAnalytics eventId="demo-wedding-event" />
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

const s = {
  root: { minHeight: '100vh', backgroundColor: '#f5f6fa', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' },
  main: { maxWidth: '1100px' },

  // Hero
  hero: { position: 'relative' as const, background: 'linear-gradient(135deg,#1e1b4b 0%,#312e81 55%,#4c1d95 100%)', borderRadius: '20px', marginBottom: '24px', overflow: 'hidden' },
  heroOrb1: { position: 'absolute' as const, width: '260px', height: '260px', borderRadius: '50%', background: 'rgba(167,139,250,0.15)', top: '-80px', right: '-40px', pointerEvents: 'none' as const },
  heroOrb2: { position: 'absolute' as const, width: '180px', height: '180px', borderRadius: '50%', background: 'rgba(99,102,241,0.2)', bottom: '-60px', left: '20%', pointerEvents: 'none' as const },
  heroContent: { position: 'relative' as const, zIndex: 1, padding: '36px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' as const },
  heroLeft: { flex: 1, minWidth: 0 },
  heroGreet: { fontSize: '13px', color: 'rgba(255,255,255,0.55)', margin: '0 0 6px', fontWeight: '500' },
  heroName: { fontSize: '28px', fontWeight: '800', color: '#fff', margin: '0 0 8px', lineHeight: 1.2 },
  heroSub: { fontSize: '14px', color: 'rgba(255,255,255,0.5)', margin: '0 0 18px' },
  heroBadges: { display: 'flex', gap: '8px', flexWrap: 'wrap' as const },
  badge: { padding: '5px 12px', fontSize: '12px', fontWeight: '600', backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.85)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.15)' },
  badgeGreen: { backgroundColor: 'rgba(16,185,129,0.2)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.3)' },
  badgeAmber: { backgroundColor: 'rgba(245,158,11,0.2)', color: '#fcd34d', border: '1px solid rgba(245,158,11,0.3)' },
  heroRight: { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '16px', flexShrink: 0 },
  avatarRing: { width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg,#a78bfa,#818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 4px rgba(167,139,250,0.25),0 8px 24px rgba(0,0,0,0.3)' },
  avatarInner: { width: '70px', height: '70px', borderRadius: '50%', background: 'linear-gradient(135deg,#6d28d9,#4c1d95)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: '800', color: '#fff' },
  createBtn: { padding: '10px 20px', fontSize: '13px', fontWeight: '700', background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '12px', cursor: 'pointer', whiteSpace: 'nowrap' as const, backdropFilter: 'blur(4px)' },

  // Banner
  banner: { backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '16px', padding: '16px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' as const },
  bannerTitle: { fontSize: '14px', fontWeight: '700', color: '#92400e', margin: '0 0 3px' },
  bannerText: { fontSize: '13px', color: '#b45309', margin: 0 },
  bannerBtn: { padding: '9px 18px', fontSize: '13px', fontWeight: '700', backgroundColor: '#f59e0b', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', flexShrink: 0 },

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

  // Quick Actions (row style)
  actionsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', gap: '10px' },
  actionCard: { display: 'flex', alignItems: 'center', gap: '14px', padding: '15px 16px', backgroundColor: '#fff', border: '1px solid #f1f3f5', borderRadius: '14px', cursor: 'pointer', textAlign: 'left' as const, boxShadow: '0 1px 4px rgba(0,0,0,0.04)', width: '100%' },
  actionIcon: { fontSize: '22px', lineHeight: 1, flexShrink: 0 },
  actionBody: { flex: 1, minWidth: 0 },
  actionLabel: { fontSize: '13.5px', fontWeight: '600', color: '#111827', margin: '0 0 2px' },
  actionSub: { fontSize: '12px', color: '#9ca3af', margin: 0 },
  actionChevron: { fontSize: '20px', color: '#d1d5db', fontWeight: '300', flexShrink: 0 },

  // Special Events (cards with badge)
  specialGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(230px,1fr))', gap: '14px' },
  specialCard: { backgroundColor: '#fff', borderRadius: '18px', border: '1px solid #f1f3f5', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', padding: '20px', cursor: 'pointer', textAlign: 'left' as const, width: '100%' },
  specialCardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' },
  specialIconWrap: { fontSize: '30px', lineHeight: 1 },
  specialBadge: { fontSize: '10px', fontWeight: '700', padding: '3px 9px', borderRadius: '20px', textTransform: 'uppercase' as const, letterSpacing: '0.4px' },
  specialLabel: { fontSize: '15px', fontWeight: '700', color: '#111827', margin: '0 0 6px' },
  specialDesc: { fontSize: '12.5px', color: '#6b7280', margin: 0, lineHeight: 1.55 },

  // Management (row style)
  mgmtGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '10px' },
  mgmtCard: { display: 'flex', alignItems: 'center', gap: '14px', padding: '15px 16px', backgroundColor: '#fff', border: '1px solid #f1f3f5', borderRadius: '14px', cursor: 'pointer', textAlign: 'left' as const, boxShadow: '0 1px 4px rgba(0,0,0,0.04)', width: '100%' },
  mgmtIcon: { fontSize: '22px', lineHeight: 1, flexShrink: 0, width: '32px', textAlign: 'center' as const },
  mgmtBody: { flex: 1, minWidth: 0 },
  mgmtLabel: { fontSize: '13.5px', fontWeight: '600', color: '#111827', margin: '0 0 2px' },
  mgmtDesc: { fontSize: '12px', color: '#9ca3af', margin: 0 },
  mgmtChevron: { fontSize: '20px', color: '#d1d5db', fontWeight: '300', flexShrink: 0 },

  // Empty state
  emptyCard: { backgroundColor: '#fff', borderRadius: '20px', border: '1px solid #f1f3f5', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', padding: '56px 32px', textAlign: 'center' as const, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '12px' },
  emptyIconWrap: { width: '80px', height: '80px', borderRadius: '22px', backgroundColor: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px' },
  emptyIcon: { fontSize: '36px', lineHeight: 1 },
  emptyTitle: { fontSize: '18px', fontWeight: '700', color: '#111827', margin: 0 },
  emptyText: { fontSize: '13.5px', color: '#9ca3af', margin: 0 },
  emptyBtn: { padding: '11px 24px', fontSize: '13.5px', fontWeight: '700', background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', marginTop: '4px' },

  // Feature modals
  modalOverlay: { position: 'fixed' as const, inset: 0, backgroundColor: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
  modalSheet: { backgroundColor: '#fff', borderRadius: '20px', width: '100%', maxWidth: '560px', maxHeight: '85vh', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden', display: 'flex', flexDirection: 'column' as const },
  modalHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 16px', borderBottom: '1px solid #f1f3f5', flexShrink: 0 },
  modalTitle: { fontSize: '17px', fontWeight: '700', color: '#111827', margin: 0 },
  modalClose: { width: '30px', height: '30px', border: 'none', backgroundColor: '#f3f4f6', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', color: '#6b7280', flexShrink: 0 },
  modalBody: { overflowY: 'auto' as const, padding: '20px 24px 24px' },
};
