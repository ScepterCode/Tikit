import React, { useState, useEffect } from 'react';
import { authenticatedFetch } from '../../utils/auth';

interface NotificationPreference {
  type: string;
  label: string;
  description: string;
  email: boolean;
  push: boolean;
  sms: boolean;
}

interface NotificationPreferencesProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationPreferences({ isOpen, onClose }: NotificationPreferencesProps) {
  const [preferences, setPreferences] = useState<NotificationPreference[]>([
    {
      type: 'broadcast',
      label: 'System Announcements',
      description: 'Important platform updates and announcements',
      email: true,
      push: true,
      sms: false
    },
    {
      type: 'ticket_sale',
      label: 'Ticket Sales',
      description: 'Notifications about ticket purchases and sales',
      email: true,
      push: true,
      sms: true
    },
    {
      type: 'event_update',
      label: 'Event Updates',
      description: 'Changes to events you\'re attending or organizing',
      email: true,
      push: true,
      sms: false
    },
    {
      type: 'payment',
      label: 'Payment Notifications',
      description: 'Payment confirmations and wallet updates',
      email: true,
      push: true,
      sms: true
    },
    {
      type: 'security',
      label: 'Security Alerts',
      description: 'Login attempts and security-related notifications',
      email: true,
      push: true,
      sms: true
    },
    {
      type: 'referral',
      label: 'Referral Updates',
      description: 'Updates about your referral program activity',
      email: true,
      push: false,
      sms: false
    }
  ]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchPreferences();
    }
  }, [isOpen]);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch('http://localhost:8000/api/notifications/preferences');
      if (response.success && response.data) {
        setPreferences(response.data);
      }
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (type: string, channel: 'email' | 'push' | 'sms', enabled: boolean) => {
    try {
      const response = await authenticatedFetch('http://localhost:8000/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          channel,
          enabled
        })
      });

      if (response.success) {
        setPreferences(prev => prev.map(pref => 
          pref.type === type 
            ? { ...pref, [channel]: enabled }
            : pref
        ));
      }
    } catch (error) {
      console.error('Error updating preference:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>Notification Preferences</h2>
          <button onClick={onClose} style={styles.closeButton}>×</button>
        </div>

        <div style={styles.content}>
          <p style={styles.description}>
            Choose how you want to receive different types of notifications
          </p>

          {loading ? (
            <div style={styles.loading}>
              <div style={styles.spinner}></div>
              <p>Loading preferences...</p>
            </div>
          ) : (
            <div style={styles.preferencesList}>
              {/* Header Row */}
              <div style={styles.headerRow}>
                <div style={styles.typeColumn}>Notification Type</div>
                <div style={styles.channelColumn}>Email</div>
                <div style={styles.channelColumn}>Push</div>
                <div style={styles.channelColumn}>SMS</div>
              </div>

              {/* Preference Rows */}
              {preferences.map((pref) => (
                <div key={pref.type} style={styles.preferenceRow}>
                  <div style={styles.typeInfo}>
                    <div style={styles.typeLabel}>{pref.label}</div>
                    <div style={styles.typeDescription}>{pref.description}</div>
                  </div>
                  
                  <div style={styles.channelToggle}>
                    <label style={styles.toggle}>
                      <input
                        type="checkbox"
                        checked={pref.email}
                        onChange={(e) => updatePreference(pref.type, 'email', e.target.checked)}
                        style={styles.checkbox}
                      />
                      <span style={styles.slider}></span>
                    </label>
                  </div>
                  
                  <div style={styles.channelToggle}>
                    <label style={styles.toggle}>
                      <input
                        type="checkbox"
                        checked={pref.push}
                        onChange={(e) => updatePreference(pref.type, 'push', e.target.checked)}
                        style={styles.checkbox}
                      />
                      <span style={styles.slider}></span>
                    </label>
                  </div>
                  
                  <div style={styles.channelToggle}>
                    <label style={styles.toggle}>
                      <input
                        type="checkbox"
                        checked={pref.sms}
                        onChange={(e) => updatePreference(pref.type, 'sms', e.target.checked)}
                        style={styles.checkbox}
                      />
                      <span style={styles.slider}></span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={styles.footer}>
            <div style={styles.footerNote}>
              <strong>Note:</strong> Security alerts will always be sent via email for your protection.
            </div>
            <button onClick={onClose} style={styles.doneButton}>
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1001,
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '700px',
    margin: '16px',
    maxHeight: '90vh',
    overflow: 'hidden',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '24px',
    borderBottom: '1px solid #e5e7eb',
  },
  title: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0,
  },
  closeButton: {
    fontSize: '24px',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: '#6b7280',
    padding: '4px',
  },
  content: {
    padding: '24px',
    overflowY: 'auto' as const,
    maxHeight: 'calc(90vh - 120px)',
  },
  description: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '24px',
  },
  loading: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    padding: '48px',
    color: '#6b7280',
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid #f3f4f6',
    borderTop: '3px solid #667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '16px',
  },
  preferencesList: {
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  headerRow: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr 1fr',
    gap: '16px',
    padding: '16px',
    backgroundColor: '#f9fafb',
    borderBottom: '1px solid #e5e7eb',
    fontWeight: '600',
    fontSize: '14px',
    color: '#374151',
  },
  typeColumn: {
    textAlign: 'left' as const,
  },
  channelColumn: {
    textAlign: 'center' as const,
  },
  preferenceRow: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr 1fr',
    gap: '16px',
    padding: '16px',
    borderBottom: '1px solid #f3f4f6',
    alignItems: 'center',
  },
  typeInfo: {
    textAlign: 'left' as const,
  },
  typeLabel: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: '4px',
  },
  typeDescription: {
    fontSize: '12px',
    color: '#6b7280',
  },
  channelToggle: {
    display: 'flex',
    justifyContent: 'center',
  },
  toggle: {
    position: 'relative' as const,
    display: 'inline-block',
    width: '44px',
    height: '24px',
  },
  checkbox: {
    opacity: 0,
    width: 0,
    height: 0,
  },
  slider: {
    position: 'absolute' as const,
    cursor: 'pointer',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#ccc',
    transition: '0.4s',
    borderRadius: '24px',
  },
  footer: {
    marginTop: '24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerNote: {
    fontSize: '12px',
    color: '#6b7280',
    flex: 1,
  },
  doneButton: {
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '600',
    backgroundColor: '#667eea',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
};