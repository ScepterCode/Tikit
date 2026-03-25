import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import { authenticatedFetch } from '../../utils/auth';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  event_id?: string;
  is_read: boolean;
  created_at: number;
}

export function EventChangeNotification() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Poll for new notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const response = await authenticatedFetch('http://localhost:8000/api/notifications');
      const data = await response.json();
      
      if (data.success) {
        const notifs = data.data.notifications || [];
        setNotifications(notifs);
        setUnreadCount(notifs.filter((n: Notification) => !n.is_read).length);
      }
    } catch (error) {
      console.debug('Error fetching notifications:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await authenticatedFetch(
        `http://localhost:8000/api/notifications/${notificationId}/read`,
        { method: 'PUT' }
      );
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.debug('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await authenticatedFetch(
        'http://localhost:8000/api/notifications/mark-all-read',
        { method: 'PUT' }
      );
      
      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.debug('Error marking all notifications as read:', error);
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (!user) return null;

  return (
    <div style={styles.container}>
      <button
        style={styles.bellButton}
        onClick={() => setShowNotifications(!showNotifications)}
      >
        🔔
        {unreadCount > 0 && (
          <span style={styles.badge}>{unreadCount}</span>
        )}
      </button>

      {showNotifications && (
        <div style={styles.dropdown}>
          <div style={styles.header}>
            <h3 style={styles.title}>Notifications</h3>
            {unreadCount > 0 && (
              <button style={styles.markAllButton} onClick={markAllAsRead}>
                Mark all read
              </button>
            )}
          </div>

          <div style={styles.notificationsList}>
            {notifications.length === 0 ? (
              <div style={styles.emptyState}>
                <span style={styles.emptyIcon}>📭</span>
                <p style={styles.emptyText}>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  style={{
                    ...styles.notificationItem,
                    ...(notification.is_read ? {} : styles.unreadItem)
                  }}
                  onClick={() => !notification.is_read && markAsRead(notification.id)}
                >
                  <div style={styles.notificationContent}>
                    <h4 style={styles.notificationTitle}>
                      {notification.type === 'event_update' && '📅 '}
                      {notification.title}
                    </h4>
                    <p style={styles.notificationMessage}>
                      {notification.message}
                    </p>
                    <span style={styles.notificationTime}>
                      {formatTime(notification.created_at)}
                    </span>
                  </div>
                  {!notification.is_read && (
                    <div style={styles.unreadDot}></div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
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
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '6px',
    transition: 'background-color 0.2s',
  },
  badge: {
    position: 'absolute' as const,
    top: '2px',
    right: '2px',
    backgroundColor: '#dc2626',
    color: 'white',
    borderRadius: '50%',
    width: '18px',
    height: '18px',
    fontSize: '11px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdown: {
    position: 'absolute' as const,
    top: '100%',
    right: '0',
    width: '350px',
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
    zIndex: 1000,
    maxHeight: '400px',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    borderBottom: '1px solid #e5e7eb',
  },
  title: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0,
  },
  markAllButton: {
    fontSize: '12px',
    color: '#667eea',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
  notificationsList: {
    maxHeight: '300px',
    overflowY: 'auto' as const,
  },
  emptyState: {
    padding: '32px',
    textAlign: 'center' as const,
  },
  emptyIcon: {
    fontSize: '32px',
    marginBottom: '8px',
    display: 'block',
  },
  emptyText: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0,
  },
  notificationItem: {
    display: 'flex',
    padding: '12px 16px',
    borderBottom: '1px solid #f3f4f6',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  unreadItem: {
    backgroundColor: '#f0f9ff',
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1f2937',
    margin: '0 0 4px 0',
  },
  notificationMessage: {
    fontSize: '13px',
    color: '#6b7280',
    margin: '0 0 4px 0',
    lineHeight: '1.4',
    whiteSpace: 'pre-line' as const,
  },
  notificationTime: {
    fontSize: '11px',
    color: '#9ca3af',
  },
  unreadDot: {
    width: '8px',
    height: '8px',
    backgroundColor: '#3b82f6',
    borderRadius: '50%',
    marginTop: '6px',
    marginLeft: '8px',
  },
};