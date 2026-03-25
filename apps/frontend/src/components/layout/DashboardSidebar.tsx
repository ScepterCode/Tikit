import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { 
  HiHome, HiTicket, HiCreditCard, 
  HiUsers, 
  HiCog, 
  HiChartBar,
  HiSpeakerphone,
  HiQrcode,
  HiPlus,
  HiCalendar,
  HiCash,
  HiUserGroup,
  HiShieldCheck,
  HiBell,
  HiMenu,
  HiX
} from 'react-icons/hi';

interface SidebarUser {
  role: 'attendee' | 'organizer' | 'admin';
  firstName?: string;
  lastName?: string;
}

interface DashboardSidebarProps {
  user: SidebarUser;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function DashboardSidebar({ user, isCollapsed = false, onToggleCollapse }: DashboardSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

  const getMenuItems = () => {
    switch (user.role) {
      case 'attendee':
        return [
          { icon: HiHome, label: 'Dashboard', path: '/attendee/dashboard' },
          { icon: HiCalendar, label: 'Events', path: '/events' },
          { icon: HiTicket, label: 'My Tickets', path: '/attendee/tickets' },
          { icon: HiCreditCard, label: 'Wallet', path: '/attendee/wallet' },
          { icon: HiUsers, label: 'Referrals', path: '/attendee/referrals' },
          { icon: HiBell, label: 'Notifications', path: '/attendee/notifications' },
          { icon: HiCog, label: 'Profile', path: '/attendee/profile' },
        ];
      
      case 'organizer':
        return [
          { icon: HiHome, label: 'Dashboard', path: '/organizer/dashboard' },
          { icon: HiCalendar, label: 'My Events', path: '/organizer/events' },
          { icon: HiPlus, label: 'Create Event', path: '/organizer/create-event' },
          { icon: HiUserGroup, label: 'Attendees', path: '/organizer/attendees' },
          { icon: HiCreditCard, label: 'Wallet', path: '/organizer/wallet' },
          { icon: HiCash, label: 'Financials', path: '/organizer/financials' },
          { icon: HiChartBar, label: 'Analytics', path: '/organizer/analytics' },
          { icon: HiSpeakerphone, label: 'Broadcast', path: '/organizer/broadcast' },
          { icon: HiQrcode, label: 'Scanner', path: '/organizer/scanner' },
          { icon: HiCog, label: 'Settings', path: '/organizer/settings' },
        ];
      
      case 'admin':
        return [
          { icon: HiHome, label: 'Dashboard', path: '/admin/dashboard' },
          { icon: HiUsers, label: 'Users', path: '/admin/users' },
          { icon: HiCalendar, label: 'Events', path: '/admin/events' },
          { icon: HiCash, label: 'Financials', path: '/admin/financials' },
          { icon: HiChartBar, label: 'Analytics', path: '/admin/analytics' },
          { icon: HiSpeakerphone, label: 'Announcements', path: '/admin/announcements' },
          { icon: HiShieldCheck, label: 'Security', path: '/admin/security' },
          { icon: HiCog, label: 'Settings', path: '/admin/settings' },
        ];
      
      default:
        return [];
    }
  };

  const menuItems = getMenuItems();
  const isActive = (path: string) => location.pathname === path;

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleItemClick = (path: string) => {
    navigate(path);
    setIsMobileOpen(false);
  };

  const sidebarContent = (
    <div style={{ ...styles.sidebar, ...(isCollapsed ? styles.sidebarCollapsed : {}) }}>
      {/* Header */}
      <div style={styles.sidebarHeader}>
        {!isCollapsed && (
          <div style={styles.roleInfo}>
            <div style={styles.roleIcon}>
              {user.role === 'organizer' ? '🎪' : user.role === 'admin' ? '👑' : '🎉'}
            </div>
            <div style={styles.roleText}>
              <div style={styles.roleName}>
                {user.role === 'organizer' ? 'Organizer' : user.role === 'admin' ? 'Admin' : 'Attendee'}
              </div>
              <div style={styles.userName}>
                {user.firstName} {user.lastName}
              </div>
            </div>
          </div>
        )}
        
        {onToggleCollapse && (
          <button style={styles.collapseBtn} onClick={onToggleCollapse}>
            <HiMenu size={18} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav style={styles.nav}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <button
              key={item.path}
              style={{
                ...styles.navItem,
                ...(active ? styles.navItemActive : {}),
                ...(isCollapsed ? styles.navItemCollapsed : {})
              }}
              onClick={() => handleItemClick(item.path)}
              title={isCollapsed ? item.label : undefined}
            >
              <div style={{ ...styles.navIcon, ...(active ? styles.navIconActive : {}) }}>
                <Icon size={20} />
              </div>
              {!isCollapsed && (
                <span style={{ ...styles.navLabel, ...(active ? styles.navLabelActive : {}) }}>
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      {!isCollapsed && (
        <div style={styles.sidebarFooter}>
          <div style={styles.footerText}>
            Grooovy v2.0
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      {isDesktop && (
        <div style={styles.desktopSidebar}>
          {sidebarContent}
        </div>
      )}

      {/* Mobile Toggle Button */}
      {!isDesktop && (
        <button 
          style={styles.mobileToggle}
          onClick={() => setIsMobileOpen(!isMobileOpen)}
        >
          {isMobileOpen ? <HiX size={24} /> : <HiMenu size={24} />}
        </button>
      )}

      {/* Mobile Sidebar Overlay */}
      {!isDesktop && isMobileOpen && (
        <>
          <div style={styles.mobileOverlay} onClick={() => setIsMobileOpen(false)} />
          <div style={styles.mobileSidebar}>
            {sidebarContent}
          </div>
        </>
      )}
    </>
  );
}

const styles = {
  // Desktop Sidebar
  desktopSidebar: {
    display: 'block',
  },
  
  sidebar: {
    width: '280px',
    height: '100vh',
    backgroundColor: '#ffffff',
    borderRight: '1px solid #e5e7eb',
    display: 'flex',
    flexDirection: 'column' as const,
    position: 'fixed' as const,
    left: 0,
    top: 0,
    zIndex: 100,
    transition: 'width 0.3s ease',
  },
  
  sidebarCollapsed: {
    width: '80px',
  },

  // Header
  sidebarHeader: {
    padding: '20px',
    borderBottom: '1px solid #f1f3f5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: '80px',
  },
  
  roleInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flex: 1,
  },
  
  roleIcon: {
    fontSize: '32px',
    lineHeight: 1,
  },
  
  roleText: {
    flex: 1,
    minWidth: 0,
  },
  
  roleName: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#4f46e5',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  
  userName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#111827',
    marginTop: '2px',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  
  collapseBtn: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    backgroundColor: '#f9fafb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#6b7280',
    transition: 'all 0.2s ease',
    padding: 0,
  },

  // Navigation
  nav: {
    flex: 1,
    padding: '16px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    border: 'none',
    backgroundColor: 'transparent',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textAlign: 'left' as const,
    width: '100%',
  },
  
  navItemCollapsed: {
    justifyContent: 'center',
    padding: '12px',
  },
  
  navItemActive: {
    backgroundColor: '#f0f4ff',
    borderLeft: '3px solid #4f46e5',
  },
  
  navIcon: {
    color: '#6b7280',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  
  navIconActive: {
    color: '#4f46e5',
  },
  
  navLabel: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    whiteSpace: 'nowrap' as const,
  },
  
  navLabelActive: {
    color: '#4f46e5',
    fontWeight: '600',
  },

  // Footer
  sidebarFooter: {
    padding: '20px',
    borderTop: '1px solid #f1f3f5',
    textAlign: 'center' as const,
  },
  
  footerText: {
    fontSize: '12px',
    color: '#9ca3af',
    fontWeight: '500',
  },

  // Mobile
  mobileToggle: {
    position: 'fixed' as const,
    top: '16px',
    left: '16px',
    zIndex: 300,
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    backgroundColor: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#374151',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    padding: 0,
  },
  
  mobileOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 200,
  },
  
  mobileSidebar: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    width: '280px',
    height: '100vh',
    backgroundColor: '#ffffff',
    zIndex: 250,
    transform: 'translateX(0)',
    transition: 'transform 0.3s ease',
  },
};