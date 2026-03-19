import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const NAV_GROUPS = [
  {
    label: 'Main',
    items: [
      { icon: '🏠', label: 'Dashboard',     path: '/organizer/dashboard' },
      { icon: '🎉', label: 'My Events',     path: '/organizer/events' },
      { icon: '➕', label: 'Create Event',  path: '/organizer/create-event' },
    ],
  },
  {
    label: 'Management',
    items: [
      { icon: '👥', label: 'Attendees',   path: '/organizer/attendees' },
      { icon: '💰', label: 'Financials',  path: '/organizer/financials' },
      { icon: '📊', label: 'Analytics',   path: '/organizer/analytics' },
    ],
  },
  {
    label: 'Tools',
    items: [
      { icon: '📢', label: 'Broadcast', path: '/organizer/broadcast' },
      { icon: '📱', label: 'Scanner',   path: '/organizer/scanner' },
      { icon: '⚙️', label: 'Settings',  path: '/organizer/settings' },
    ],
  },
];

const SIDEBAR_W = 240;
const BREAK = 900;

export function OrganizerSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < BREAK);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < BREAK);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const close = () => setDrawerOpen(false);

  const navContent = (
    <nav style={s.nav}>
      {NAV_GROUPS.map((group) => (
        <div key={group.label} style={s.group}>
          <span style={s.groupLabel}>{group.label}</span>
          {group.items.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.label}
                style={{ ...s.navItem, ...(isActive ? s.navItemActive : {}) }}
                onClick={() => { navigate(item.path); close(); }}
              >
                <span style={s.navIcon}>{item.icon}</span>
                <span style={s.navLabel}>{item.label}</span>
                {isActive && <span style={s.activePip} />}
              </button>
            );
          })}
        </div>
      ))}
    </nav>
  );

  if (!isMobile) {
    return (
      <aside style={s.desktopSidebar}>
        {navContent}
      </aside>
    );
  }

  return (
    <>
      <button style={s.hamburger} onClick={() => setDrawerOpen(true)} aria-label="Open menu">
        <span style={s.bar} />
        <span style={s.bar} />
        <span style={s.bar} />
      </button>

      {drawerOpen && <div style={s.backdrop} onClick={close} />}

      <aside style={{ ...s.drawer, ...(drawerOpen ? s.drawerOpen : {}) }}>
        <div style={s.drawerHeader}>
          <span style={s.drawerLabel}>Menu</span>
          <button style={s.closeBtn} onClick={close}>✕</button>
        </div>
        {navContent}
      </aside>
    </>
  );
}

export const ORG_SIDEBAR_WIDTH = SIDEBAR_W;
export const ORG_SIDEBAR_BREAK = BREAK;

const s = {
  desktopSidebar: { position: 'fixed' as const, top: '64px', left: 0, width: `${SIDEBAR_W}px`, height: 'calc(100vh - 64px)', backgroundColor: '#ffffff', borderRight: '1px solid #f1f3f5', overflowY: 'auto' as const, zIndex: 100, paddingBottom: '24px' },

  hamburger: { position: 'fixed' as const, top: '78px', left: '16px', zIndex: 150, display: 'flex', flexDirection: 'column' as const, gap: '5px', padding: '9px 10px', backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '10px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
  bar: { display: 'block', width: '18px', height: '2px', backgroundColor: '#374151', borderRadius: '2px' },
  backdrop: { position: 'fixed' as const, inset: 0, backgroundColor: 'rgba(15,23,42,0.4)', zIndex: 200, backdropFilter: 'blur(3px)' },
  drawer: { position: 'fixed' as const, top: '64px', left: 0, height: 'calc(100vh - 64px)', width: `${SIDEBAR_W}px`, backgroundColor: '#ffffff', borderRight: '1px solid #f1f3f5', zIndex: 250, transform: 'translateX(-100%)', transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)', overflowY: 'auto' as const, boxShadow: '4px 0 24px rgba(0,0,0,0.1)', paddingBottom: '24px' },
  drawerOpen: { transform: 'translateX(0)' },
  drawerHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 16px 12px', borderBottom: '1px solid #f1f3f5' },
  drawerLabel: { fontSize: '11px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase' as const, letterSpacing: '0.8px' },
  closeBtn: { width: '28px', height: '28px', borderRadius: '6px', border: 'none', backgroundColor: '#f3f4f6', color: '#6b7280', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', padding: 0 },

  nav: { padding: '12px 10px', display: 'flex', flexDirection: 'column' as const, gap: '4px' },
  group: { marginBottom: '8px' },
  groupLabel: { display: 'block', padding: '6px 10px 4px', fontSize: '10px', fontWeight: '700', color: '#c4c9d4', textTransform: 'uppercase' as const, letterSpacing: '0.8px' },
  navItem: { display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', fontSize: '13.5px', fontWeight: '500', backgroundColor: 'transparent', border: 'none', borderRadius: '10px', cursor: 'pointer', color: '#6b7280', textAlign: 'left' as const, transition: 'all 0.15s ease', width: '100%', position: 'relative' as const },
  navItemActive: { backgroundColor: '#eef2ff', color: '#4f46e5', fontWeight: '600' },
  navIcon: { fontSize: '16px', lineHeight: 1, width: '20px', textAlign: 'center' as const, flexShrink: 0 },
  navLabel: { flex: 1 },
  activePip: { width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#4f46e5', flexShrink: 0 },
};
