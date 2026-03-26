import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { useNotifications } from '../hooks/useNotifications';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
  data?: any;
}

export function NotificationsPage() {
  const { user } = useAuth();
  const { notifications, markAsRead, markAllAsRead } = useNotifications();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filteredNotifications = notifications.filter(notification => 
    filter === 'all' || !notification.read
  );

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <DashboardLayout>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>Notifications</h1>
          <div style={styles.actions}>
            <div style={styles.filterButtons}>
              <button
                style={{
                  ...styles.filterButton,
                  ...(filter === 'all' ? styles.activeFilter : {})
                }}
                onClick={() => setFilter('all')}
              >
                All ({notifications.length})
              </button>
              <button
                style={{
                  ...styles.filterButton,
                  ...(filter === 'unread' ? styles.activeFilter : {})
                }}
                onClick={() => setFilter('unread')}
              >
                Unread ({notifications.filter(n => !n.read).length})
              </button>
            </div>
            {notifications.some(n => !n.read) && (
              <button
                style={styles.markAllButton}
                onClick={markAllAsRead}
              >
                Mark all as read
              </button>
            )}
          </div>
        </div>

        <div style={styles.content}>
          {filteredNotifications.length === 0 ? (
            <div style={styles.empty}>
              <div style={styles.emptyIcon}>🔔</div>
              <h3 style={styles.emptyTitle}>
                {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
              </h3>
              <p style={styles.emptyText}>
                {filter === 'unread' 
                  ? 'All caught up! You have no unread notifications.'
                  : 'You\'ll see notifications here when you have updates about your events, tickets, and account.'
                }
              </p>
            </div>
          ) : (
            <div style={styles.notificationsList}>
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  style={{
                    ...styles.notificationItem,
                    ...(notification.read ? {} : styles.unreadItem)
                  }}
                  onClick={() => {
                    if (!notification.read) {
                      markAsRead(notification.id);
                    }
                  }}
                >
                  <div style={styles.notificationIcon}>
                    <span style={{ fontSize: '24px' }}>
                      {getNotificationIcon(notification.type)}
                    </span>
                  </div>
                  <div style={styles.notificationContent}>
                    <div style={styles.notificationHeader}>
                      <h4 style={styles.notificationTitle}>
                        {notification.title}
                      </h4>
                      <span style={styles.notificationTime}>
                        {formatDate(notification.created_at)}
                      </span>
                    </div>
                    <p style={styles.notificationMessage}>
                      {notification.message}
                    </p>
                    {notification.data && (
                      <div style={styles.notificationData}>
                        {notification.data.event_id && (
                          <span style={styles.dataTag}>Event ID: {notification.data.event_id}</span>
                        )}
                        {notification.data.amount && (
                          <span style={styles.dataTag}>Amount: ₦{notification.data.amount}</span>
                        )}
                      </div>
                    )}
                  </div>
                  {!notification.read && (
                    <div
                      style={{
                        ...styles.unreadDot,
                        backgroundColor: getNotificationColor(notification.type)
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

const styles = {
  container: {
    padding: '24px',
    maxWidth: '800px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap' as const,
    gap: '16px',
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1f2937',
    margin: 0,
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap' as const,
  },
  filterButtons: {
    display: 'flex',
    backgroundColor: '#f3f4f6',
    borderRadius: '8px',
    padding: '4px',
  },
  filterButton: {
    padding: '8px 16px',
    border: 'none',
    backgroundColor: 'transparent',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
    color: '#6b7280',
  },
  activeFilter: {
    backgroundColor: '#ffffff',
    color: '#1f2937',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
  },
  markAllButton: {
    padding: '8px 16px',
    backgroundColor: '#667eea',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  content: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
  },
  empty: {
    padding: '64px 32px',
    textAlign: 'center' as const,
  },
  emptyIcon: {
    fontSize: '64px',
    marginBottom: '16px',
  },
  emptyTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '8px',
  },
  emptyText: {
    fontSize: '16px',
    color: '#6b7280',
    lineHeight: '1.5',
    maxWidth: '400px',
    margin: '0 auto',
  },
  notificationsList: {
    display: 'flex',
    flexDirection: 'column' as const,
  },
  notificationItem: {
    display: 'flex',
    alignItems: 'flex-start',
    padding: '20px',
    borderBottom: '1px solid #f3f4f6',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    gap: '16px',
  },
  unreadItem: {
    backgroundColor: '#f9fafb',
  },
  notificationIcon: {
    flexShrink: 0,
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    backgroundColor: '#f3f4f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationContent: {
    flex: 1,
    minWidth: 0,
  },
  notificationHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '8px',
    gap: '12px',
  },
  notificationTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0,
    lineHeight: '1.4',
  },
  notificationTime: {
    fontSize: '12px',
    color: '#9ca3af',
    flexShrink: 0,
  },
  notificationMessage: {
    fontSize: '14px',
    color: '#6b7280',
    lineHeight: '1.5',
    margin: '0 0 8px 0',
  },
  notificationData: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap' as const,
  },
  dataTag: {
    fontSize: '12px',
    backgroundColor: '#e5e7eb',
    color: '#374151',
    padding: '2px 8px',
    borderRadius: '4px',
  },
  unreadDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    flexShrink: 0,
    marginTop: '8px',
  },
};