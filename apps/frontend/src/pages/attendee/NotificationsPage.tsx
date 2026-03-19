import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/FastAPIAuthContext';
import { useNavigate } from 'react-router-dom';
import { DashboardNavbar } from '../../components/layout/DashboardNavbar';
import { DashboardSidebar, SIDEBAR_WIDTH, SIDEBAR_BREAK } from '../../components/layout/DashboardSidebar';
import {
  HiBell, HiTicket, HiCurrencyDollar, HiCalendar,
  HiUserGroup, HiSpeakerphone, HiCheckCircle, HiTrash, HiDotsVertical,
} from 'react-icons/hi';

type Category = 'all' | 'tickets' | 'payments' | 'events' | 'system';
type NotifType = 'ticket' | 'payment' | 'event' | 'group' | 'promo' | 'system';

interface Notification {
  id: string;
  type: NotifType;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const TYPE_CAT: Record<NotifType, Category> = {
  ticket: 'tickets', payment: 'payments', event: 'events',
  group: 'events', promo: 'system', system: 'system',
};

const TYPE_COLORS: Record<NotifType, { bg: string; color: string }> = {
  ticket:  { bg: '#ede9fe', color: '#7c3aed' },
  payment: { bg: '#d1fae5', color: '#059669' },
  event:   { bg: '#fef3c7', color: '#d97706' },
  group:   { bg: '#dbeafe', color: '#2563eb' },
  promo:   { bg: '#fce7f3', color: '#db2777' },
  system:  { bg: '#f0fdf4', color: '#16a34a' },
};

const INITIAL: Notification[] = [
  { id: '1', type: 'ticket',  title: 'Ticket Confirmed',    message: 'Your ticket for Afrobeats Night 2025 has been confirmed. Check your wallet for the QR code.', time: '2 min ago',   read: false },
  { id: '2', type: 'payment', title: 'Wallet Funded',       message: '₦15,000 has been successfully added to your wallet via Paystack.',                             time: '1 hr ago',    read: false },
  { id: '3', type: 'event',   title: 'Event Starting Soon', message: "Sarah & John's Wedding starts in 2 hours. Don't forget your ticket!",                          time: '2 hrs ago',   read: false },
  { id: '4', type: 'group',   title: 'Group Buy Complete',  message: 'Your group buy for Lagos Jazz Festival is complete. All 5 members have paid.',                 time: '5 hrs ago',   read: true  },
  { id: '5', type: 'promo',   title: '🎉 Special Offer',    message: 'Get 20% off tickets to Detty December events this weekend. Code: GROOOVY20.',                  time: 'Yesterday',   read: true  },
  { id: '6', type: 'payment', title: 'Refund Processed',    message: '₦8,500 refunded to your wallet for cancelled event: Tech Summit Lagos.',                       time: 'Yesterday',   read: true  },
  { id: '7', type: 'event',   title: 'New Event Near You',  message: '"Naija Food Festival" has been listed in Lagos. Early bird tickets available.',                 time: '2 days ago',  read: true  },
  { id: '8', type: 'system',  title: 'Account Verified',    message: 'Your Grooovy account has been verified. You now have access to exclusive events.',             time: '3 days ago',  read: true  },
  { id: '9', type: 'ticket',  title: 'Transfer Received',   message: 'Chidi Okafor transferred a VIP ticket for Afrobeats Night 2025 to you.',                       time: '4 days ago',  read: true  },
  { id: '10',type: 'promo',   title: 'Referral Reward',     message: 'You earned ₦2,000 referral bonus! Your friend Amaka signed up using your code.',               time: '5 days ago',  read: true  },
];

const TYPE_ICON: Record<NotifType, JSX.Element> = {
  ticket:  <HiTicket size={17} />,
  payment: <HiCurrencyDollar size={17} />,
  event:   <HiCalendar size={17} />,
  group:   <HiUserGroup size={17} />,
  promo:   <HiSpeakerphone size={17} />,
  system:  <HiCheckCircle size={17} />,
};

const CATS: { key: Category; label: string }[] = [
  { key: 'all',      label: 'All' },
  { key: 'tickets',  label: 'Tickets' },
  { key: 'payments', label: 'Payments' },
  { key: 'events',   label: 'Events' },
  { key: 'system',   label: 'System' },
];

export function NotificationsPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < SIDEBAR_BREAK);
  const [items, setItems] = useState<Notification[]>(INITIAL);
  const [category, setCategory] = useState<Category>('all');
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < SIDEBAR_BREAK);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleLogout = async () => { await signOut(); navigate('/'); };

  const unread = items.filter((n) => !n.read).length;
  const filtered = items.filter((n) => category === 'all' || TYPE_CAT[n.type] === category);
  const markRead = (id: string) => setItems((p) => p.map((n) => n.id === id ? { ...n, read: true } : n));
  const del = (id: string) => setItems((p) => p.filter((n) => n.id !== id));
  const markAllRead = () => setItems((p) => p.map((n) => ({ ...n, read: true })));
  const clearAll = () => setItems([]);

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
          <div style={s.headerLeft}>
            <h1 style={s.pageTitle}>
              Notifications
              {unread > 0 && <span style={s.unreadBadge}>{unread}</span>}
            </h1>
            <p style={s.pageSub}>{unread > 0 ? `${unread} unread message${unread > 1 ? 's' : ''}` : 'You\'re all caught up!'}</p>
          </div>
          <div style={s.headerActions}>
            {unread > 0 && (
              <button style={s.markAllBtn} onClick={markAllRead}>
                <HiCheckCircle size={14} />
                {!isMobile && 'Mark all read'}
              </button>
            )}
            {items.length > 0 && (
              <button style={s.clearBtn} onClick={clearAll}>
                <HiTrash size={14} />
                {!isMobile && 'Clear all'}
              </button>
            )}
          </div>
        </div>

        {/* Category filter */}
        <div style={s.filterBar}>
          {CATS.map((cat) => {
            const count = cat.key === 'all'
              ? items.filter((n) => !n.read).length
              : items.filter((n) => !n.read && TYPE_CAT[n.type] === cat.key).length;
            return (
              <button
                key={cat.key}
                style={{ ...s.filterTab, ...(category === cat.key ? s.filterTabActive : {}) }}
                onClick={() => setCategory(cat.key)}
              >
                {cat.label}
                {count > 0 && (
                  <span style={{ ...s.filterBadge, ...(category === cat.key ? s.filterBadgeActive : {}) }}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* List */}
        <div style={s.list}>
          {filtered.length === 0 ? (
            <div style={s.emptyCard}>
              <div style={s.emptyIconWrap}><HiBell size={36} style={{ color: '#d1d5db' }} /></div>
              <p style={s.emptyTitle}>No notifications here</p>
              <p style={s.emptyText}>
                {category === 'all' ? "You're all caught up!" : `No ${category} notifications yet.`}
              </p>
            </div>
          ) : (
            filtered.map((n) => {
              const clr = TYPE_COLORS[n.type];
              return (
                <div
                  key={n.id}
                  style={{ ...s.card, ...(n.read ? {} : s.cardUnread) }}
                  onClick={() => { markRead(n.id); setOpenMenu(null); }}
                >
                  {!n.read && <span style={s.unreadDot} />}
                  <div style={{ ...s.notifIcon, backgroundColor: clr.bg, color: clr.color }}>
                    {TYPE_ICON[n.type]}
                  </div>
                  <div style={s.notifBody}>
                    <div style={s.notifTop}>
                      <span style={{ ...s.notifTitle, ...(n.read ? {} : s.notifTitleBold) }}>{n.title}</span>
                      <span style={s.notifTime}>{n.time}</span>
                    </div>
                    <p style={s.notifMsg}>{n.message}</p>
                  </div>
                  <div style={s.menuWrap}>
                    <button
                      style={s.menuBtn}
                      onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === n.id ? null : n.id); }}
                    >
                      <HiDotsVertical size={15} />
                    </button>
                    {openMenu === n.id && (
                      <div style={s.menuDrop}>
                        {!n.read && (
                          <button style={s.menuItem} onClick={(e) => { e.stopPropagation(); markRead(n.id); setOpenMenu(null); }}>
                            <HiCheckCircle size={13} /> Mark read
                          </button>
                        )}
                        <button style={{ ...s.menuItem, ...s.menuItemRed }} onClick={(e) => { e.stopPropagation(); del(n.id); setOpenMenu(null); }}>
                          <HiTrash size={13} /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

      </main>
    </div>
  );
}

const s = {
  root: { minHeight: '100vh', backgroundColor: '#f5f6fa', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' },
  main: { maxWidth: '1100px' },

  pageHeader: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' as const },
  headerLeft: { flex: 1 },
  pageTitle: { fontSize: '24px', fontWeight: '800', color: '#111827', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: '10px' },
  unreadBadge: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: '22px', height: '22px', padding: '0 6px', fontSize: '11px', fontWeight: '700', backgroundColor: '#4f46e5', color: '#fff', borderRadius: '20px' },
  pageSub: { fontSize: '13px', color: '#9ca3af', margin: 0 },
  headerActions: { display: 'flex', gap: '8px', flexWrap: 'wrap' as const },
  markAllBtn: { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', fontSize: '13px', fontWeight: '600', color: '#4f46e5', backgroundColor: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: '10px', cursor: 'pointer', whiteSpace: 'nowrap' as const },
  clearBtn: { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', fontSize: '13px', fontWeight: '600', color: '#dc2626', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', cursor: 'pointer', whiteSpace: 'nowrap' as const },

  filterBar: { display: 'flex', gap: '6px', padding: '6px', backgroundColor: '#fff', border: '1px solid #f1f3f5', borderRadius: '14px', marginBottom: '16px', overflowX: 'auto' as const, flexWrap: 'nowrap' as const },
  filterTab: { display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', fontSize: '13px', fontWeight: '500', color: '#6b7280', backgroundColor: 'transparent', border: 'none', borderRadius: '10px', cursor: 'pointer', whiteSpace: 'nowrap' as const, transition: 'all 0.15s ease', flexShrink: 0 },
  filterTabActive: { backgroundColor: '#4f46e5', color: '#fff', fontWeight: '600' },
  filterBadge: { minWidth: '18px', height: '18px', padding: '0 5px', fontSize: '10px', fontWeight: '700', backgroundColor: '#e5e7eb', color: '#374151', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' },
  filterBadgeActive: { backgroundColor: 'rgba(255,255,255,0.25)', color: '#fff' },

  list: { display: 'flex', flexDirection: 'column' as const, gap: '8px' },
  card: { position: 'relative' as const, display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '16px', backgroundColor: '#fff', border: '1px solid #f1f3f5', borderRadius: '16px', cursor: 'pointer', transition: 'box-shadow 0.15s ease', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' },
  cardUnread: { backgroundColor: '#fafbff', borderColor: '#c7d2fe', boxShadow: '0 1px 6px rgba(79,70,229,0.08)' },
  unreadDot: { position: 'absolute' as const, top: '18px', left: '-3px', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#4f46e5', border: '2px solid #fff' },
  notifIcon: { width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  notifBody: { flex: 1, minWidth: 0 },
  notifTop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' },
  notifTitle: { fontSize: '13.5px', fontWeight: '500', color: '#374151', margin: 0 },
  notifTitleBold: { fontWeight: '700', color: '#111827' },
  notifTime: { fontSize: '11px', color: '#9ca3af', whiteSpace: 'nowrap' as const, flexShrink: 0 },
  notifMsg: { fontSize: '12.5px', color: '#6b7280', margin: 0, lineHeight: '1.5' },

  menuWrap: { position: 'relative' as const, flexShrink: 0 },
  menuBtn: { width: '28px', height: '28px', borderRadius: '8px', border: 'none', backgroundColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#9ca3af' },
  menuDrop: { position: 'absolute' as const, top: '100%', right: 0, marginTop: '4px', backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', overflow: 'hidden', zIndex: 10, minWidth: '130px' },
  menuItem: { display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '9px 14px', fontSize: '13px', fontWeight: '500', color: '#374151', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' as const },
  menuItemRed: { color: '#dc2626' },

  emptyCard: { backgroundColor: '#fff', borderRadius: '20px', border: '1px solid #f1f3f5', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', padding: '64px 32px', textAlign: 'center' as const, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '10px' },
  emptyIconWrap: { width: '76px', height: '76px', borderRadius: '20px', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px' },
  emptyTitle: { fontSize: '18px', fontWeight: '700', color: '#111827', margin: 0 },
  emptyText: { fontSize: '13px', color: '#9ca3af', margin: 0 },
};
