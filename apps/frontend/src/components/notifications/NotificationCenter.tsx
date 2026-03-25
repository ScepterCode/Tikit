import { useState } from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import { NotificationPreferences } from './NotificationPreferences';

export function NotificationCenter() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'broadcast':
        return '📢';
      case 'ticket_sale':
        return '🎫';
      case 'event_update':
        return '🎉';
      case 'event_cancelled':
        return '❌';
      case 'event_rescheduled':
        return '📅';
      case 'payment':
        return '💳';
      case 'security':
        return '🔒';
      case 'system':
        return '⚙️';
      case 'wallet':
        return '💰';
      case 'referral':
        return '🎁';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'broadcast':
        return '#667eea';
      case 'ticket_sale':
        return '#10b981';
      case 'event_update':
        return '#f59e0b';
      case 'event_cancelled':
        return '#ef4444';
      case 'payment':
        return '#8b5cf6';
      case 'security':
        return '#dc2626';
      case 'system':
        return '#374151';
      case 'wallet':
        return '#059669';
      case 'referral':
        return '#7c3aed';
      default:
        return '#6b7280';
    }
  };

  return (
    <div style={styles.container}>
      {/* Notification Bell */}
      <button
        style={styles.bellButton}
        onClick={() => setIsOpen(!isOpen)}
        title="Notifications"
      >
        <span style={styles.bellIcon}>🔔</span>
        {unreadCount > 0 && (
          <span style={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div style={styles.dropdown}>
          {/* Header */}
          <div style={styles.header}>
            <h3 style={styles.title}>Notifications</h3>
            <div style={styles.headerActions}>
              <button
                style={styles.preferencesButton}
                onClick={() => setShowPreferences(true)}
                title="Notification Preferences"
              >
                ⚙️
              </button>
              {unreadCount > 0 && (
                <button
                  style={styles.markAllButton}
                  onClick={() => {
                    markAllAsRead();
                  }}
                >
                  Mark all as read
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div style={styles.list}>
            {notifications.length === 0 ? (
              <div style={styles.empty}>
                <p style={styles.emptyText}>No notifications</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  style={{
                    ...styles.item,
                    ...(notification.read ? {} : styles.itemUnread),
                  }}
                  onClick={() => {
                    if (!notification.read) {
                      markAsRead(notification.id);
                    }
                  }}
                >
                  <span style={styles.icon}>
                    {getNotificationIcon(notification.type)}
                  </span>
                  <div style={styles.content}>
                    <p style={styles.itemTitle}>{notification.title}</p>
                    <p style={styles.itemMessage}>{notification.message}</p>
                    <p style={styles.itemTime}>
                      {new Date(notification.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {!notification.read && (
                    <div
                      style={{
                        ...styles.unreadDot,
                        backgroundColor: getNotificationColor(notification.type),
                      }}
                    />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div style={styles.footer}>
              <button
                style={styles.viewAllButton}
                onClick={() => {
                  // Navigate to notifications page
                  window.location.href = '/notifications';
                }}
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}

      {/* Notification Preferences Modal */}
      <NotificationPreferences 
        isOpen={showPreferences}
        onClose={() => setShowPreferences(false)}
      />

      {/* Overlay */}
      {isOpen && (
        <div
          style={styles.overlay}
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

const styles = {
  container: {
    position: 'relative' as const,
  },
  bellButton: {
    position: 'relative' as const,
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    fontSize: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.2s',
  },
  bellIcon: {
    fontSize: '24px',
  },
  badge: {
    position: 'absolute' as const,
    top: '-4px',
    right: '-4px',
    backgroundColor: '#ef4444',
    color: '#ffffff',
    borderRadius: '50%',
    width: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  dropdown: {
    position: 'absolute' as const,
    top: '100%',
    right: 0,
    marginTop: '8px',
    width: '360px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
    zIndex: 1000,
    maxHeight: '500px',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  header: {
    padding: '16px',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0,
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  preferencesButton: {
    fontSize: '16px',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '4px',
    transition: 'background-color 0.2s',
  },
  markAllButton: {
    fontSize: '12px',
    color: '#667eea',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '4px',
    transition: 'background-color 0.2s',
  },
  list: {
    flex: 1,
    overflowY: 'auto' as const,
    maxHeight: '400px',
  },
  item: {
    display: 'flex',
    gap: '12px',
    padding: '12px 16px',
    borderBottom: '1px solid #f3f4f6',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    alignItems: 'flex-start',
  },
  itemUnread: {
    backgroundColor: '#f9fafb',
  },
  icon: {
    fontSize: '20px',
    marginTop: '2px',
  },
  content: {
    flex: 1,
  },
  itemTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1f2937',
    margin: '0 0 4px 0',
  },
  itemMessage: {
    fontSize: '13px',
    color: '#6b7280',
    margin: '0 0 4px 0',
  },
  itemTime: {
    fontSize: '12px',
    color: '#9ca3af',
    margin: 0,
  },
  unreadDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    marginTop: '6px',
    flexShrink: 0,
  },
  empty: {
    padding: '32px 16px',
    textAlign: 'center' as const,
  },
  emptyText: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0,
  },
  footer: {
    padding: '12px 16px',
    borderTop: '1px solid #e5e7eb',
    textAlign: 'center' as const,
  },
  viewAllButton: {
    fontSize: '13px',
    color: '#667eea',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '8px 12px',
    borderRadius: '4px',
    transition: 'background-color 0.2s',
  },
  overlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
};
