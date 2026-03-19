import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiUser, HiChevronDown, HiLogout, HiCog, HiTicket, HiBell } from 'react-icons/hi';

interface NavUser {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email?: string;
  state: string;
  role: string;
  walletBalance: number;
  referralCode: string;
  isVerified: boolean;
}

interface DashboardNavbarProps {
  user: NavUser;
  onLogout: () => void;
}

export function DashboardNavbar({ user, onLogout }: DashboardNavbarProps) {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 600);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 600);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const firstName = user.firstName || (user as any).first_name || '';
  const lastName = user.lastName || (user as any).last_name || '';
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || '??';

  return (
    <header style={{ ...styles.navbar, ...(scrolled ? styles.navbarScrolled : {}) }}>

      {/* Left — Logo + badge */}
      <div style={styles.navLeft}>
        <div style={styles.logo} onClick={() => navigate(user.role === 'organizer' ? '/organizer/dashboard' : '/attendee/dashboard')}>
          <span style={styles.logoIcon}>🎵</span>
          <span style={styles.logoText}>Grooovy</span>
        </div>
        {!isMobile && <span style={styles.roleBadge}>{user.role === 'organizer' ? 'Organizer' : 'Attendee'}</span>}
      </div>

      {/* Right — icon buttons + user */}
      <div style={styles.navRight}>

        <button style={styles.iconBtn} title="Notifications" onClick={() => navigate('/attendee/notifications')}>
          <HiBell size={18} />
          <span style={styles.notifDot} />
        </button>

        {!isMobile && (
          <button style={styles.iconBtn} title="My Tickets" onClick={() => navigate('/attendee/tickets')}>
            <HiTicket size={18} />
          </button>
        )}

        {/* User dropdown */}
        <div style={styles.dropdownWrapper} ref={dropdownRef}>
          <button style={styles.userBtn} onClick={() => setDropdownOpen(!dropdownOpen)}>
            <div style={styles.avatar}>{initials}</div>
            {!isMobile && <span style={styles.userBtnName}>{firstName}</span>}
            <div style={{ ...styles.chevron, ...(dropdownOpen ? styles.chevronOpen : {}) }}>
              <HiChevronDown size={14} />
            </div>
          </button>

          {dropdownOpen && (
            <div style={{ ...styles.dropdown, ...(isMobile ? styles.dropdownMobile : {}) }}>

              {/* Header */}
              <div style={styles.ddHeader}>
                <div style={styles.ddAvatar}>{initials}</div>
                <div style={styles.ddUserInfo}>
                  <div style={styles.ddName}>{firstName} {lastName}</div>
                  <div style={styles.ddPhone}>{user.phoneNumber}</div>
                  <span style={styles.ddBadge}>{user.role === 'organizer' ? '🎪 Organizer' : '🎉 Attendee'}</span>
                </div>
              </div>

              {/* Details */}
              <div style={styles.ddDetails}>
                <div style={styles.ddDetailItem}>
                  <span style={styles.ddDetailLabel}>State</span>
                  <span style={styles.ddDetailValue}>{user.state || '—'}</span>
                </div>
                <div style={styles.ddDetailItem}>
                  <span style={styles.ddDetailLabel}>Wallet</span>
                  <span style={styles.ddDetailValue}>₦{(user.walletBalance || 0).toLocaleString()}</span>
                </div>
                <div style={styles.ddDetailItem}>
                  <span style={styles.ddDetailLabel}>Referral Code</span>
                  <span style={styles.ddDetailValue}>{user.referralCode || '—'}</span>
                </div>
                <div style={styles.ddDetailItem}>
                  <span style={styles.ddDetailLabel}>Verified</span>
                  <span style={{ ...styles.ddVerified, ...(user.isVerified ? styles.ddVerifiedYes : styles.ddVerifiedNo) }}>
                    {user.isVerified ? '✓ Yes' : '✗ No'}
                  </span>
                </div>
              </div>

              {/* Menu */}
              <div style={styles.ddMenu}>
                <button style={styles.ddItem} onClick={() => { navigate('/attendee/profile'); setDropdownOpen(false); }}>
                  <span style={styles.ddItemIcon}><HiUser size={15} /></span>
                  My Profile
                </button>
                <button style={styles.ddItem} onClick={() => { navigate('/attendee/settings'); setDropdownOpen(false); }}>
                  <span style={styles.ddItemIcon}><HiCog size={15} /></span>
                  Settings
                </button>

                <div style={styles.ddDivider} />

                <button
                  style={{ ...styles.ddItem, ...styles.ddItemDanger }}
                  onClick={() => { setDropdownOpen(false); onLogout(); }}
                >
                  <span style={{ ...styles.ddItemIcon, ...styles.ddItemIconDanger }}>
                    <HiLogout size={15} />
                  </span>
                  Sign Out
                </button>
              </div>

            </div>
          )}
        </div>
      </div>
    </header>
  );
}

const styles = {
  navbar: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    zIndex: 200,
    height: '64px',
    backgroundColor: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 28px',
    borderBottom: '1px solid #f1f3f5',
    transition: 'box-shadow 0.25s ease, border-color 0.25s ease',
  },
  navbarScrolled: {
    boxShadow: '0 2px 16px rgba(0, 0, 0, 0.07)',
    borderBottomColor: '#e5e7eb',
  },
  navLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
  },
  logoIcon: {
    fontSize: '26px',
    lineHeight: 1,
  },
  logoText: {
    fontSize: '20px',
    fontWeight: '800',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    letterSpacing: '-0.5px',
  },
  roleBadge: {
    padding: '3px 10px',
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '0.5px',
    textTransform: 'uppercase' as const,
    background: 'linear-gradient(135deg, #e0e7ff 0%, #ede9fe 100%)',
    color: '#4f46e5',
    borderRadius: '20px',
    border: '1px solid #c7d2fe',
  },
  navRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  iconBtn: {
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    border: '1px solid #e5e7eb',
    backgroundColor: '#f9fafb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#6b7280',
    transition: 'all 0.18s ease',
    position: 'relative' as const,
    padding: 0,
  },
  notifDot: {
    position: 'absolute' as const,
    top: '7px',
    right: '7px',
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    backgroundColor: '#ef4444',
    border: '1.5px solid #ffffff',
  },
  dropdownWrapper: {
    position: 'relative' as const,
    marginLeft: '4px',
  },
  userBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '5px 10px 5px 5px',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    backgroundColor: '#f9fafb',
    cursor: 'pointer',
    transition: 'all 0.18s ease',
  },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: '700',
    color: '#ffffff',
    flexShrink: 0,
    letterSpacing: '0.5px',
  },
  userBtnName: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#111827',
    whiteSpace: 'nowrap' as const,
  },
  chevron: {
    color: '#9ca3af',
    transition: 'transform 0.2s ease',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
  },
  chevronOpen: {
    transform: 'rotate(180deg)',
  },
  dropdown: {
    position: 'absolute' as const,
    top: 'calc(100% + 8px)',
    right: 0,
    width: '280px',
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '16px',
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06)',
    overflow: 'hidden',
  },
  dropdownMobile: {
    right: '-8px',
    width: '260px',
  },
  ddHeader: {
    padding: '16px',
    backgroundColor: '#fafbff',
    borderBottom: '1px solid #f1f3f5',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  ddAvatar: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    fontWeight: '700',
    color: '#ffffff',
    flexShrink: 0,
    letterSpacing: '0.5px',
  },
  ddUserInfo: {
    flex: 1,
    minWidth: 0,
  },
  ddName: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#111827',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  ddPhone: {
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '1px',
  },
  ddBadge: {
    marginTop: '5px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '2px 8px',
    fontSize: '10px',
    fontWeight: '700',
    letterSpacing: '0.5px',
    textTransform: 'uppercase' as const,
    background: 'linear-gradient(135deg, #e0e7ff, #ede9fe)',
    color: '#4f46e5',
    borderRadius: '20px',
    border: '1px solid #c7d2fe',
  },
  ddDetails: {
    padding: '12px 16px',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
    borderBottom: '1px solid #f1f3f5',
  },
  ddDetailItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2px',
  },
  ddDetailLabel: {
    fontSize: '10px',
    fontWeight: '600',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    color: '#9ca3af',
  },
  ddDetailValue: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#374151',
  },
  ddVerified: {
    fontSize: '12px',
    fontWeight: '600',
  },
  ddVerifiedYes: {
    color: '#10b981',
  },
  ddVerifiedNo: {
    color: '#f59e0b',
  },
  ddMenu: {
    padding: '8px',
  },
  ddItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    width: '100%',
    padding: '9px 10px',
    border: 'none',
    backgroundColor: 'transparent',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    color: '#374151',
    transition: 'all 0.15s ease',
    textAlign: 'left' as const,
  },
  ddItemDanger: {
    color: '#dc2626',
  },
  ddItemIcon: {
    width: '30px',
    height: '30px',
    borderRadius: '8px',
    backgroundColor: '#f3f4f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  ddItemIconDanger: {
    backgroundColor: '#fef2f2',
    color: '#dc2626',
  },
  ddDivider: {
    height: '1px',
    backgroundColor: '#f1f3f5',
    margin: '4px 8px',
  },
};