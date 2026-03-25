import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import { useNavigate } from 'react-router-dom';
import { authenticatedFetch } from '../../utils/auth';

interface Broadcast {
  id: string;
  eventId: string;
  eventName: string;
  subject: string;
  message: string;
  recipientCount: number;
  sentAt: string;
  status: 'sent' | 'scheduled' | 'draft';
}

export function OrganizerBroadcast() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [showComposer, setShowComposer] = useState(false);
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  
  // Composer state
  const [formData, setFormData] = useState({
    eventId: '',
    subject: '',
    message: '',
    recipientType: 'all', // all, confirmed, pending
    scheduleDate: '',
    scheduleTime: ''
  });

  useEffect(() => {
    fetchEvents();
    fetchBroadcasts();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await authenticatedFetch('http://localhost:8000/api/events');
      const data = await response.json();
      if (data.success) {
        setEvents(data.data.events || []);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const fetchBroadcasts = async () => {
    // Mock data for now - replace with actual API call
    const mockBroadcasts: Broadcast[] = [
      {
        id: '1',
        eventId: 'evt1',
        eventName: 'Tech Conference 2024',
        subject: 'Event Reminder: Tomorrow!',
        message: 'Don\'t forget! Our event is tomorrow at 9 AM. See you there!',
        recipientCount: 150,
        sentAt: new Date(Date.now() - 86400000).toISOString(),
        status: 'sent'
      },
      {
        id: '2',
        eventId: 'evt2',
        eventName: 'Music Festival',
        subject: 'Venue Change Notification',
        message: 'Important update: The venue has been changed to National Stadium.',
        recipientCount: 300,
        sentAt: new Date(Date.now() - 172800000).toISOString(),
        status: 'sent'
      }
    ];
    setBroadcasts(mockBroadcasts);
  };

  const handleSendBroadcast = async () => {
    if (!formData.eventId || !formData.subject || !formData.message) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      // Mock sending - replace with actual API call
      const selectedEvent = events.find(e => e.id === formData.eventId);
      const newBroadcast: Broadcast = {
        id: Date.now().toString(),
        eventId: formData.eventId,
        eventName: selectedEvent?.title || 'Unknown Event',
        subject: formData.subject,
        message: formData.message,
        recipientCount: 0, // Would come from backend
        sentAt: new Date().toISOString(),
        status: formData.scheduleDate ? 'scheduled' : 'sent'
      };

      setBroadcasts([newBroadcast, ...broadcasts]);
      setShowComposer(false);
      setFormData({
        eventId: '',
        subject: '',
        message: '',
        recipientType: 'all',
        scheduleDate: '',
        scheduleTime: ''
      });

      alert('✅ Broadcast sent successfully!\n\nYour message has been delivered to all attendees.');
    } catch (error) {
      console.error('Error sending broadcast:', error);
      alert('Failed to send broadcast. Please try again.');
    }
  };

  const handleSaveDraft = () => {
    alert('Draft saved! You can continue editing later.');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return '#10b981';
      case 'scheduled':
        return '#f59e0b';
      case 'draft':
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return '✅';
      case 'scheduled':
        return '⏰';
      case 'draft':
        return '📝';
      default:
        return '📧';
    }
  };

  return (
    <div style={styles.container}>
      {/* Top Bar */}
      <header style={styles.header}>
        <h1 style={styles.logo}>Grooovy</h1>
        <div style={styles.userMenu}>
          <span style={styles.userName}>{user?.organizationName || user?.firstName}</span>
          <button onClick={() => signOut()} style={styles.logoutButton}>
            Logout
          </button>
        </div>
      </header>

      <div style={styles.layout}>
        {/* Sidebar */}
        <aside style={styles.sidebar}>
          <nav style={styles.nav}>
            <NavItem icon="📊" label="Dashboard" onClick={() => navigate('/organizer/dashboard')} />
            <NavItem icon="🎉" label="My Events" onClick={() => navigate('/organizer/events')} />
            <NavItem icon="➕" label="Create Event" onClick={() => navigate('/organizer/create-event')} />
            <NavItem icon="👥" label="Attendees" onClick={() => navigate('/organizer/attendees')} />
            <NavItem icon="💰" label="Financials" onClick={() => navigate('/organizer/financials')} />
            <NavItem icon="📢" label="Broadcast" active />
            <NavItem icon="📱" label="Scanner" onClick={() => navigate('/organizer/scanner')} />
            <NavItem icon="⚙️" label="Settings" onClick={() => navigate('/organizer/settings')} />
          </nav>
        </aside>

        {/* Main Content */}
        <main style={styles.main}>
          <div style={styles.titleRow}>
            <div>
              <h2 style={styles.pageTitle}>Broadcast Messages</h2>
              <p style={styles.pageSubtitle}>
                Send updates and announcements to your event attendees
              </p>
            </div>
            <button onClick={() => setShowComposer(true)} style={styles.composeButton}>
              ✉️ New Broadcast
            </button>
          </div>

          {/* Composer Modal */}
          {showComposer && (
            <div style={styles.modal}>
              <div style={styles.modalContent}>
                <div style={styles.modalHeader}>
                  <h3 style={styles.modalTitle}>Compose Broadcast Message</h3>
                  <button onClick={() => setShowComposer(false)} style={styles.closeButton}>
                    ✕
                  </button>
                </div>

                <div style={styles.composerForm}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Select Event *</label>
                    <select
                      value={formData.eventId}
                      onChange={(e) => setFormData({...formData, eventId: e.target.value})}
                      style={styles.select}
                      required
                    >
                      <option value="">Choose an event...</option>
                      {events.map(event => (
                        <option key={event.id} value={event.id}>
                          {event.title} ({event.tickets_sold || 0} attendees)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Recipients *</label>
                    <select
                      value={formData.recipientType}
                      onChange={(e) => setFormData({...formData, recipientType: e.target.value})}
                      style={styles.select}
                    >
                      <option value="all">All Attendees</option>
                      <option value="confirmed">Confirmed Attendees Only</option>
                      <option value="pending">Pending Attendees Only</option>
                    </select>
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Subject *</label>
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={(e) => setFormData({...formData, subject: e.target.value})}
                      placeholder="e.g., Important Event Update"
                      style={styles.input}
                      required
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Message *</label>
                    <textarea
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                      placeholder="Write your message here..."
                      style={styles.textarea}
                      rows={6}
                      required
                    />
                    <p style={styles.charCount}>{formData.message.length} / 500 characters</p>
                  </div>

                  <div style={styles.scheduleSection}>
                    <h4 style={styles.scheduleTitle}>Schedule (Optional)</h4>
                    <div style={styles.scheduleGrid}>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Date</label>
                        <input
                          type="date"
                          value={formData.scheduleDate}
                          onChange={(e) => setFormData({...formData, scheduleDate: e.target.value})}
                          style={styles.input}
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Time</label>
                        <input
                          type="time"
                          value={formData.scheduleTime}
                          onChange={(e) => setFormData({...formData, scheduleTime: e.target.value})}
                          style={styles.input}
                        />
                      </div>
                    </div>
                    <p style={styles.helpText}>
                      Leave empty to send immediately
                    </p>
                  </div>

                  <div style={styles.modalActions}>
                    <button onClick={handleSaveDraft} style={styles.draftButton}>
                      Save Draft
                    </button>
                    <button onClick={handleSendBroadcast} style={styles.sendButton}>
                      {formData.scheduleDate ? 'Schedule Broadcast' : 'Send Now'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Broadcast History */}
          <div style={styles.historySection}>
            <h3 style={styles.historyTitle}>Broadcast History</h3>
            
            {broadcasts.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>📢</div>
                <h3 style={styles.emptyTitle}>No broadcasts sent yet</h3>
                <p style={styles.emptyText}>
                  Click "New Broadcast" to send your first message to attendees
                </p>
              </div>
            ) : (
              <div style={styles.broadcastList}>
                {broadcasts.map((broadcast) => (
                  <div key={broadcast.id} style={styles.broadcastCard}>
                    <div style={styles.broadcastHeader}>
                      <div style={styles.broadcastInfo}>
                        <div style={styles.broadcastTitleRow}>
                          <h4 style={styles.broadcastSubject}>{broadcast.subject}</h4>
                          <span 
                            style={{
                              ...styles.broadcastStatus,
                              backgroundColor: getStatusColor(broadcast.status) + '20',
                              color: getStatusColor(broadcast.status)
                            }}
                          >
                            {getStatusIcon(broadcast.status)} {broadcast.status.toUpperCase()}
                          </span>
                        </div>
                        <p style={styles.broadcastEvent}>📍 {broadcast.eventName}</p>
                      </div>
                    </div>
                    
                    <p style={styles.broadcastMessage}>{broadcast.message}</p>
                    
                    <div style={styles.broadcastFooter}>
                      <span style={styles.broadcastMeta}>
                        👥 {broadcast.recipientCount} recipients
                      </span>
                      <span style={styles.broadcastMeta}>
                        📅 {new Date(broadcast.sentAt).toLocaleString()}
                      </span>
                    </div>

                    <div style={styles.broadcastActions}>
                      <button style={styles.actionButton}>View Details</button>
                      <button style={styles.actionButton}>Resend</button>
                      <button style={styles.actionButton}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tips Section */}
          <div style={styles.tipsSection}>
            <h4 style={styles.tipsTitle}>💡 Broadcasting Tips</h4>
            <ul style={styles.tipsList}>
              <li style={styles.tipItem}>Keep messages concise and clear</li>
              <li style={styles.tipItem}>Include important details like date, time, and location</li>
              <li style={styles.tipItem}>Use scheduling for time-sensitive announcements</li>
              <li style={styles.tipItem}>Test with a small group before sending to all attendees</li>
              <li style={styles.tipItem}>Include a call-to-action when appropriate</li>
            </ul>
          </div>
        </main>
      </div>
    </div>
  );
}

function NavItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: string;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      style={{
        ...styles.navItem,
        ...(active ? styles.navItemActive : {}),
      }}
      onClick={onClick}
    >
      <span style={styles.navIcon}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#ffffff',
    padding: '16px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #e5e7eb',
  },
  logo: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#667eea',
    margin: 0,
  },
  userMenu: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  userName: {
    fontSize: '14px',
    color: '#374151',
    fontWeight: '500',
  },
  logoutButton: {
    padding: '8px 16px',
    fontSize: '14px',
    backgroundColor: '#f3f4f6',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    color: '#374151',
  },
  layout: {
    display: 'flex',
  },
  sidebar: {
    width: '240px',
    backgroundColor: '#ffffff',
    borderRight: '1px solid #e5e7eb',
    minHeight: 'calc(100vh - 65px)',
    padding: '24px 0',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
    padding: '0 12px',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    fontSize: '14px',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    color: '#6b7280',
    textAlign: 'left' as const,
    transition: 'all 0.2s',
  },
  navItemActive: {
    backgroundColor: '#f5f7ff',
    color: '#667eea',
    fontWeight: '500',
  },
  navIcon: {
    fontSize: '18px',
  },
  main: {
    flex: 1,
    padding: '32px',
    maxWidth: '1200px',
  },
  titleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  pageTitle: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '4px',
  },
  pageSubtitle: {
    fontSize: '14px',
    color: '#6b7280',
  },
  composeButton: {
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '600',
    backgroundColor: '#667eea',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  modal: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '600px',
    maxHeight: '90vh',
    overflow: 'auto',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '24px',
    borderBottom: '1px solid #e5e7eb',
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0,
  },
  closeButton: {
    padding: '8px',
    fontSize: '20px',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: '#6b7280',
  },
  composerForm: {
    padding: '24px',
  },
  formGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '6px',
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    boxSizing: 'border-box' as const,
  },
  select: {
    width: '100%',
    padding: '12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    backgroundColor: 'white',
    boxSizing: 'border-box' as const,
  },
  textarea: {
    width: '100%',
    padding: '12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    resize: 'vertical' as const,
    boxSizing: 'border-box' as const,
  },
  charCount: {
    fontSize: '12px',
    color: '#6b7280',
    textAlign: 'right' as const,
    margin: '4px 0 0 0',
  },
  scheduleSection: {
    padding: '20px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  scheduleTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '12px',
  },
  scheduleGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  helpText: {
    fontSize: '12px',
    color: '#6b7280',
    margin: '8px 0 0 0',
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
  },
  draftButton: {
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '600',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  sendButton: {
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '600',
    backgroundColor: '#667eea',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  historySection: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '32px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    marginBottom: '24px',
  },
  historyTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '20px',
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '48px 24px',
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
    fontSize: '14px',
    color: '#6b7280',
  },
  broadcastList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  broadcastCard: {
    padding: '20px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    backgroundColor: '#f9fafb',
  },
  broadcastHeader: {
    marginBottom: '12px',
  },
  broadcastInfo: {
    flex: 1,
  },
  broadcastTitleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  broadcastSubject: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0,
  },
  broadcastStatus: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '600',
  },
  broadcastEvent: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0,
  },
  broadcastMessage: {
    fontSize: '14px',
    color: '#374151',
    lineHeight: '1.6',
    marginBottom: '16px',
  },
  broadcastFooter: {
    display: 'flex',
    gap: '16px',
    marginBottom: '12px',
  },
  broadcastMeta: {
    fontSize: '13px',
    color: '#6b7280',
  },
  broadcastActions: {
    display: 'flex',
    gap: '8px',
  },
  actionButton: {
    padding: '6px 12px',
    fontSize: '13px',
    backgroundColor: '#ffffff',
    color: '#374151',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  tipsSection: {
    backgroundColor: '#eff6ff',
    borderRadius: '12px',
    padding: '24px',
    border: '1px solid #dbeafe',
  },
  tipsTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: '12px',
  },
  tipsList: {
    margin: 0,
    paddingLeft: '20px',
  },
  tipItem: {
    fontSize: '14px',
    color: '#1e40af',
    marginBottom: '8px',
  },
};
