import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GroupBuyCreator } from '../tickets/GroupBuyCreator';
import { SprayMoneyLeaderboard } from '../events/SprayMoneyLeaderboard';

const MOCK_EVENT = {
  id: 'demo',
  title: 'Demo Event',
  tiers: [
    { id: 't1', name: 'Regular', price: 5000,  capacity: 200, sold: 80 },
    { id: 't2', name: 'VIP',     price: 15000, capacity: 50,  sold: 20 },
    { id: 't3', name: 'Table',   price: 50000, capacity: 10,  sold: 3  },
  ],
};

interface SidebarProps {
  onFeature?: (feature: string) => void;
  onHiddenEvent?: () => void;
}

type NavItem = {
  icon: string;
  label: string;
  path?: string;
  feature?: string;
  hiddenEvent?: boolean;
};

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: 'Main',
    items: [
      { icon: '🏠', label: 'Dashboard',     path: '/attendee/dashboard' },
      { icon: '🎫', label: 'My Tickets',    path: '/attendee/tickets' },
      { icon: '💰', label: 'Wallet',        path: '/attendee/wallet' },
      { icon: '🎉', label: 'Browse Events', path: '/events' },
    ],
  },
  {
    label: 'Community',
    items: [
      { icon: '👥', label: 'Group Buys',    feature: 'group-buy' },
      { icon: '💸', label: 'Spray Money',   feature: 'spray-money' },
      { icon: '🎁', label: 'Referrals',     path: '/attendee/referrals' },
    ],
  },
  {
    label: 'Account',
    items: [
      { icon: '👤', label: 'Profile',       path: '/attendee/profile' },
      { icon: '🔔', label: 'Notifications', path: '/attendee/notifications' },
      { icon: '🔒', label: 'Hidden Events', hiddenEvent: true },
    ],
  },
];

const SIDEBAR_W = 240;
const BREAK = 900;

export function DashboardSidebar({ onFeature, onHiddenEvent }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < BREAK);
  const [hiddenCode, setHiddenCode] = useState('');
  const [hiddenError, setHiddenError] = useState('');
  const [showHiddenModal, setShowHiddenModal] = useState(false);
  const [activeFeature, setActiveFeature] = useState<'group-buy' | 'spray-money' | null>(null);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < BREAK);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const close = () => setDrawerOpen(false);

  const handleClick = (item: NavItem) => {
    if (item.path) {
      navigate(item.path);
      close();
    } else if (item.feature) {
      close();
      if (onFeature) {
        onFeature(item.feature);
      } else {
        setActiveFeature(item.feature as 'group-buy' | 'spray-money');
      }
    } else if (item.hiddenEvent) {
      close();
      if (onHiddenEvent) {
        onHiddenEvent();
      } else {
        setHiddenCode('');
        setHiddenError('');
        setShowHiddenModal(true);
      }
    }
  };

  const handleHiddenSubmit = () => {
    if (hiddenCode.length === 4 && /^\d{4}$/.test(hiddenCode)) {
      alert(`Accessing hidden event with code: ${hiddenCode}`);
      setShowHiddenModal(false);
      setHiddenCode('');
    } else {
      setHiddenError('Enter a valid 4-digit code.');
    }
  };

  const navContent = (
    <nav style={s.nav}>
      {NAV_GROUPS.map((group) => (
        <div key={group.label} style={s.group}>
          <span style={s.groupLabel}>{group.label}</span>
          {group.items.map((item) => {
            const isActive = item.path ? location.pathname === item.path : false;
            return (
              <button
                key={item.label}
                style={{ ...s.navItem, ...(isActive ? s.navItemActive : {}) }}
                onClick={() => handleClick(item)}
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

  // ── Desktop: permanent fixed sidebar ──────────────────────────────────────
  if (!isMobile) {
    return (
      <>
        <aside style={s.desktopSidebar}>
          {navContent}
        </aside>

        {/* Hidden event modal */}
        {showHiddenModal && <HiddenModal
          code={hiddenCode}
          error={hiddenError}
          onChange={(v) => { setHiddenCode(v); setHiddenError(''); }}
          onSubmit={handleHiddenSubmit}
          onClose={() => setShowHiddenModal(false)}
        />}

        {/* Feature modal */}
        {activeFeature && <FeatureModal
          feature={activeFeature}
          onClose={() => setActiveFeature(null)}
        />}
      </>
    );
  }

  // ── Mobile: hamburger + drawer ─────────────────────────────────────────────
  return (
    <>
      {/* Hamburger */}
      <button style={s.hamburger} onClick={() => setDrawerOpen(true)} aria-label="Open menu">
        <span style={s.bar} />
        <span style={s.bar} />
        <span style={s.bar} />
      </button>

      {/* Backdrop */}
      {drawerOpen && <div style={s.backdrop} onClick={close} />}

      {/* Drawer */}
      <aside style={{ ...s.drawer, ...(drawerOpen ? s.drawerOpen : {}) }}>
        <div style={s.drawerHeader}>
          <span style={s.drawerLabel}>Menu</span>
          <button style={s.closeBtn} onClick={close}>✕</button>
        </div>
        {navContent}
      </aside>

      {/* Hidden event modal */}
      {showHiddenModal && <HiddenModal
        code={hiddenCode}
        error={hiddenError}
        onChange={(v) => { setHiddenCode(v); setHiddenError(''); }}
        onSubmit={handleHiddenSubmit}
        onClose={() => setShowHiddenModal(false)}
      />}

      {/* Feature modal */}
      {activeFeature && <FeatureModal
        feature={activeFeature}
        onClose={() => setActiveFeature(null)}
      />}
    </>
  );
}

// ─── Hidden Event Modal ──────────────────────────────────────────────────────
function HiddenModal({ code, error, onChange, onSubmit, onClose }: {
  code: string;
  error: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}) {
  return (
    <div style={s.modalOverlay} onClick={onClose}>
      <div style={s.modal} onClick={(e) => e.stopPropagation()}>
        <div style={s.modalHead}>
          <div>
            <p style={s.modalTitle}>🔒 Hidden Events</p>
            <p style={s.modalSub}>Enter the 4-digit code from the organiser</p>
          </div>
          <button style={s.modalClose} onClick={onClose}>✕</button>
        </div>
        <div style={s.modalBody}>
          <div style={s.codeRow}>
            {[0,1,2,3].map((i) => (
              <input
                key={i}
                id={`hcode-${i}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={code[i] || ''}
                style={{ ...s.codeBox, ...(error ? s.codeBoxErr : {}) }}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  const arr = code.split('');
                  arr[i] = val;
                  onChange(arr.join('').slice(0, 4));
                  if (val) {
                    const next = document.getElementById(`hcode-${i + 1}`);
                    if (next) (next as HTMLInputElement).focus();
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Backspace' && !code[i]) {
                    const prev = document.getElementById(`hcode-${i - 1}`);
                    if (prev) (prev as HTMLInputElement).focus();
                  }
                }}
              />
            ))}
          </div>
          {error && <p style={s.codeError}>{error}</p>}
          <div style={s.modalFoot}>
            <button style={s.modalCancel} onClick={onClose}>Cancel</button>
            <button
              style={{ ...s.modalConfirm, ...(code.length < 4 ? s.modalConfirmDisabled : {}) }}
              onClick={onSubmit}
              disabled={code.length < 4}
            >
              Access Event
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Feature Modal (Group Buy / Spray Money) ─────────────────────────────────
function FeatureModal({ feature, onClose }: { feature: 'group-buy' | 'spray-money'; onClose: () => void }) {
  const title = feature === 'group-buy' ? '👥 Group Buys' : '💸 Spray Money';
  return (
    <div style={fm.overlay} onClick={onClose}>
      <div style={fm.sheet} onClick={(e) => e.stopPropagation()}>
        <div style={fm.head}>
          <p style={fm.title}>{title}</p>
          <button style={fm.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={fm.body}>
          {feature === 'group-buy' && (
            <GroupBuyCreator event={MOCK_EVENT} onGroupBuyCreated={onClose} />
          )}
          {feature === 'spray-money' && (
            <SprayMoneyLeaderboard
              eventId="demo"
              onSprayMoney={async (amount, message) => {
                alert(`Sprayed ₦${amount.toLocaleString()}${message ? `: "${message}"` : ''}`);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

const fm = {
  overlay: { position: 'fixed' as const, inset: 0, backgroundColor: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
  sheet: { backgroundColor: '#fff', borderRadius: '20px', width: '100%', maxWidth: '520px', maxHeight: '85vh', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden', display: 'flex', flexDirection: 'column' as const },
  head: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 16px', borderBottom: '1px solid #f1f3f5', flexShrink: 0 },
  title: { fontSize: '17px', fontWeight: '700', color: '#111827', margin: 0 },
  closeBtn: { width: '30px', height: '30px', border: 'none', backgroundColor: '#f3f4f6', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', color: '#6b7280', flexShrink: 0 },
  body: { overflowY: 'auto' as const, padding: '20px 24px 24px' },
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const s = {
  // Desktop permanent sidebar
  desktopSidebar: {
    position: 'fixed' as const,
    top: '64px',
    left: 0,
    width: `${SIDEBAR_W}px`,
    height: 'calc(100vh - 64px)',
    backgroundColor: '#ffffff',
    borderRight: '1px solid #f1f3f5',
    overflowY: 'auto' as const,
    zIndex: 100,
    paddingBottom: '24px',
  },

  // Mobile drawer
  hamburger: {
    position: 'fixed' as const,
    top: '78px',
    left: '16px',
    zIndex: 150,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '5px',
    padding: '9px 10px',
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '10px',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  bar: {
    display: 'block',
    width: '18px',
    height: '2px',
    backgroundColor: '#374151',
    borderRadius: '2px',
  },
  backdrop: {
    position: 'fixed' as const,
    inset: 0,
    backgroundColor: 'rgba(15,23,42,0.4)',
    zIndex: 200,
    backdropFilter: 'blur(3px)',
  },
  drawer: {
    position: 'fixed' as const,
    top: '64px',
    left: 0,
    height: 'calc(100vh - 64px)',
    width: `${SIDEBAR_W}px`,
    backgroundColor: '#ffffff',
    borderRight: '1px solid #f1f3f5',
    zIndex: 250,
    transform: 'translateX(-100%)',
    transition: 'transform 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
    overflowY: 'auto' as const,
    boxShadow: '4px 0 24px rgba(0,0,0,0.1)',
    paddingBottom: '24px',
  },
  drawerOpen: {
    transform: 'translateX(0)',
  },
  drawerHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 16px 12px',
    borderBottom: '1px solid #f1f3f5',
  },
  drawerLabel: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#9ca3af',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.8px',
  },
  closeBtn: {
    width: '28px',
    height: '28px',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    padding: 0,
  },

  // Nav
  nav: {
    padding: '12px 10px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  group: {
    marginBottom: '8px',
  },
  groupLabel: {
    display: 'block',
    padding: '6px 10px 4px',
    fontSize: '10px',
    fontWeight: '700',
    color: '#c4c9d4',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.8px',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '9px 12px',
    fontSize: '13.5px',
    fontWeight: '500',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    color: '#6b7280',
    textAlign: 'left' as const,
    transition: 'all 0.15s ease',
    width: '100%',
    position: 'relative' as const,
  },
  navItemActive: {
    backgroundColor: '#eef2ff',
    color: '#4f46e5',
    fontWeight: '600',
  },
  navIcon: {
    fontSize: '16px',
    lineHeight: 1,
    width: '20px',
    textAlign: 'center' as const,
    flexShrink: 0,
  },
  navLabel: {
    flex: 1,
  },
  activePip: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#4f46e5',
    flexShrink: 0,
  },

  // Hidden event modal
  modalOverlay: {
    position: 'fixed' as const,
    inset: 0,
    backgroundColor: 'rgba(15,23,42,0.5)',
    backdropFilter: 'blur(4px)',
    zIndex: 500,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: '20px',
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
    overflow: 'hidden',
  },
  modalHead: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: '24px 24px 16px',
    borderBottom: '1px solid #f1f3f5',
  },
  modalTitle: {
    fontSize: '17px',
    fontWeight: '700',
    color: '#111827',
    margin: '0 0 4px',
  },
  modalSub: {
    fontSize: '13px',
    color: '#9ca3af',
    margin: 0,
  },
  modalClose: {
    width: '30px',
    height: '30px',
    border: 'none',
    backgroundColor: '#f3f4f6',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    color: '#6b7280',
    flexShrink: 0,
  },
  modalBody: {
    padding: '24px',
  },
  codeRow: {
    display: 'flex',
    justifyContent: 'center',
    gap: '12px',
    marginBottom: '8px',
  },
  codeBox: {
    width: '56px',
    height: '64px',
    fontSize: '24px',
    fontWeight: '700',
    textAlign: 'center' as const,
    border: '2px solid #e5e7eb',
    borderRadius: '14px',
    outline: 'none',
    color: '#111827',
    backgroundColor: '#f9fafb',
    transition: 'border-color 0.15s ease',
  },
  codeBoxErr: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  codeError: {
    fontSize: '12px',
    color: '#ef4444',
    textAlign: 'center' as const,
    margin: '8px 0 0',
  },
  modalFoot: {
    display: 'flex',
    gap: '10px',
    marginTop: '20px',
  },
  modalCancel: {
    flex: 1,
    padding: '11px',
    fontSize: '14px',
    fontWeight: '600',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
  },
  modalConfirm: {
    flex: 1,
    padding: '11px',
    fontSize: '14px',
    fontWeight: '600',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
  },
  modalConfirmDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
};

export const SIDEBAR_WIDTH = SIDEBAR_W;
export const SIDEBAR_BREAK = BREAK;
