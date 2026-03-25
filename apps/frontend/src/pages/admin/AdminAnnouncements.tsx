import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import { useNavigate } from 'react-router';
import { authenticatedFetch } from '../../utils/auth';
import { NotificationCenter } from '../../components/notifications/NotificationCenter';

interface Announcement {
  id: string;
  title: string;
  message: string;
  target_roles: string[];
  created_at: string;
  sent_count: number;
  status: 'draft' | 'sent' | 'scheduled';
}

export function AdminAnnouncements() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showComposer, setShowComposer] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    target_roles: [] as string[],
    schedule_date: ''
  });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch('http://localhost:8000/api/admin/announcements');
      if (response.success && response.data) {
        setAnnouncements(response.data);
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
      // Set mock data for now
      setAnnouncements([
        {
          id: '1',
          title: 'Platform Maintenance Notice',
          message: 'We will be performing scheduled maintenance on Sunday from 2-4 AM.',
          target_roles: ['attendee', 'organizer'],
          created_at: new Date().toISOString(),
          sent_count: 1250,
          status: 'sent'
        },
        {
          id: '2',
          title: 'New Payment Methods Available',
          message: 'We have added support for mobile money and bank transfers.',
          target_roles: ['attendee'],
          created_at: new Date(Date.now() - 86400000).toISOString(),
          sent_count: 890,
          status: 'sent'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendAnnouncement = async () => {
    if (!formData.title || !formData.message) {
      alert('Please fill in title and message');
      return;
    }

    if (formData.target_roles.length === 0) {
      alert('Please select at least one target audience');
      return;
    }

    try {
      setLoading(true);
      const response = await authenticatedFetch('http://localhost:8000/api/notifications/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          message: formData.message,
          target_roles: formData.target_roles
        })
      });

      if (response.success) {
        alert('✅ Announcement sent successfully!');
        setShowComposer(false);
        setFormData({ title: '', message: '', target_roles: [], schedule_date: '' });
        fetchAnnouncements();
      } else {
        alert(`Failed to send announcement: ${response.error}`);
      }
    } catch (error) {
      console.error('Error sending announcement:', error);
      alert('Failed to send announcement. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleToggle = (role: string) => {
    setFormData(prev => ({
      ...prev,
      target_roles: prev.target_roles.includes(role)
        ? prev.target_roles.filter(r => r !== role)
        : [...prev.target_roles, role]
    }));
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <h1 style={styles.logo}>Grooovy Admin</h1>
        <div style={styles.userMenu}>
          <NotificationCenter />
          <span style={styles.userName}>Admin: {user?.firstName}</span>
          <button onClick={() => signOut()} style={styles.logoutButton}>
            Logout
          </button>
        </div>
      </header>

      <div style={styles.layout}>
        {/* Sidebar */}
        <aside style={styles.sidebar}>
          <nav style={styles.nav}>
            <NavItem icon="📊" label="Dashboard" onClick={() => navigate('/admin/dashboard')} />
            <NavItem icon="👥" label="Users" onClick={() => navigate('/admin/users')} />
            <NavItem icon="🎉" label="Events" onClick={() => navigate('/admin/events')} />
            <NavItem icon="💰" label="Financials" onClick={() => navigate('/admin/financials')} />
            <NavItem icon="📈" label="Analytics" onClick={() => navigate('/admin/analytics')} />
            <NavItem icon="🔒" label="Security" onClick={() => navigate('/admin/security')} />
            <NavItem icon="📢" label="Announcements" active />
            <NavItem icon="⚙️" label="Settings" onClick={() => navigate('/admin/settings')} />
          </nav>
        </aside>

        {/* Main Content */}
        <main style={styles.main}>
          <div style={styles.titleRow}>
            <div>
              <h2 style={styles.pageTitle}>System Announcements</h2>
              <p style={styles.pageSubtitle}>
                Send platform-wide announcements to users
              </p>
            </div>
            <button 
              onClick={() => setShowComposer(true)} 
              style={styles.composeButton}
              disabled={loading}
            >
              📢 New Announcement
            </button>
          </div>

          {/* Composer Modal */}
          {showComposer && (
            <div style={styles.modalOverlay}>
              <div style={styles.modal}>
                <div style={styles.modalHeader}>
                  <h3 style={styles.modalTitle}>Create System Announcement</h3>
                  <button onClick={() => setShowComposer(false)} style={styles.closeButton}>
                    ×
                  </button>
                </div>
                
                <div style={styles.modalContent}>
                  {/* Title */}
                  <div style={styles.inputGroup}>
                    <label style={styles.inputLabel}>Title *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter announcement title"
                      style={styles.input}
                    />
                  </div>

                  {/* Message */}
                  <div style={styles.inputGroup}>
                    <label style={styles.inputLabel}>Message *</label>
                    <textarea
                      value={formData.message}
                      onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                      placeholder="Enter your announcement message"
                      style={styles.textarea}
                      rows={4}
                    />
                  </div>

                  {/* Target Audience */}
                  <div style={styles.inputGroup}>
                    <label style={styles.inputLabel}>Target Audience *</label>
                    <div style={styles.roleSelector}>
                      {[
                        { key: 'attendee', label: 'Attendees', icon: '👥' },
                        { key: 'organizer', label: 'Organizers', icon: '🎯' },
                        { key: 'admin', label: 'Admins', icon: '⚙️' }
                      ].map(role => (
                        <button
                          key={role.key}
                          type="button"
                          onClick={() => handleRoleToggle(role.key)}
                          style={{
                            ...styles.roleButton,
                            ...(formData.target_roles.includes(role.key) ? styles.roleButtonActive : {})
                          }}
                        >
                          <span style={styles.roleIcon}>{role.icon}</span>
                          {role.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Priority Level */}
                  <div style={styles.inputGroup}>
                    <label style={styles.inputLabel}>Priority Level</label>
                    <select style={styles.select}>
                      <option value="normal">Normal</option>
                      <option value="high">High Priority</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>

                  {/* Actions */}
                  <div style={styles.modalActions}>
                    <button 
                      onClick={() => setShowComposer(false)} 
                      style={styles.cancelButton}
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSendAnnouncement} 
                      style={{...styles.sendButton, opacity: loading ? 0.7 : 1}}
                      disabled={loading}
                    >
                      {loading ? 'Sending...' : 'Send Announcement'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Announcements History */}
          <div style={styles.historySection}>
            <h3 style={styles.historyTitle}>Announcement History</h3>
            
            {loading ? (
              <div style={styles.loadingState}>
                <div style={styles.spinner}></div>
                <p>Loading announcements...</p>
              </div>
            ) : announcements.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>📢</div>
                <h3 style={styles.emptyTitle}>No announcements sent yet</h3>
                <p style={styles.emptyText}>
                  Click "New Announcement" to send your first system-wide message
                </p>
              </div>
            ) : (
              <div style={styles.announcementsList}>
                {announcements.map((announcement) => (
                  <div key={announcement.id} style={styles.announcementCard}>
                    <div style={styles.announcementHeader}>
                      <div style={styles.announcementInfo}>
                        <h4 style={styles.announcementTitle}>{announcement.title}</h4>
                        <p style={styles.announcementMeta}>
                          Sent to {announcement.target_roles.join(', ')} • 
                          {announcement.sent_count} recipients • 
                          {new Date(announcement.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div style={styles.announcementStatus}>
                        <span style={{
                          ...styles.statusBadge,
                          backgroundColor: announcement.status === 'sent' ? '#10b981' : '#f59e0b'
                        }}>
                          {announcement.status}
                        </span>
                      </div>
                    </div>
                    <p style={styles.announcementMessage}>{announcement.message}</p>
                  </div>
                ))}
              </div>
            )}
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
    backgroundColor: '#1f2937',
    padding: '16px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#ffffff',
    margin: 0,
  },
  userMenu: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  userName: {
    fontSize: '14px',
    color: '#ffffff',
    fontWeight: '500',
  },
  logoutButton: {
    padding: '8px 16px',
    fontSize: '14px',
    backgroundColor: '#374151',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    color: '#ffffff',
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
    alignItems: 'flex-start',
    marginBottom: '32px',
  },
  pageTitle: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#1f2937',
    margin: '0 0 4px 0',
  },
  pageSubtitle: {
    fontSize: '16px',
    color: '#6b7280',
    margin: 0,
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
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s',
  },
  modalOverlay: {
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
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '600px',
    margin: '16px',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '24px 24px 0 24px',
    marginBottom: '24px',
  },
  modalTitle: {
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
  modalContent: {
    padding: '0 24px 24px 24px',
  },
  inputGroup: {
    marginBottom: '20px',
  },
  inputLabel: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '6px',
  },
  input: {
    width: '100%',
    padding: '12px',
    fontSize: '14px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  textarea: {
    width: '100%',
    padding: '12px',
    fontSize: '14px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    outline: 'none',
    resize: 'vertical' as const,
    fontFamily: 'inherit',
    transition: 'border-color 0.2s',
  },
  select: {
    width: '100%',
    padding: '12px',
    fontSize: '14px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    outline: 'none',
    backgroundColor: '#ffffff',
    cursor: 'pointer',
  },
  roleSelector: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap' as const,
  },
  roleButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 12px',
    fontSize: '14px',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  roleButtonActive: {
    backgroundColor: '#667eea',
    color: '#ffffff',
    borderColor: '#667eea',
  },
  roleIcon: {
    fontSize: '16px',
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '24px',
  },
  cancelButton: {
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '500',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  sendButton: {
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '600',
    backgroundColor: '#667eea',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  historySection: {
    marginTop: '32px',
  },
  historyTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '16px',
  },
  loadingState: {
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
  emptyState: {
    backgroundColor: '#ffffff',
    padding: '48px',
    borderRadius: '12px',
    textAlign: 'center' as const,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  emptyTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '8px',
  },
  emptyText: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0,
  },
  announcementsList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  announcementCard: {
    backgroundColor: '#ffffff',
    padding: '24px',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e5e7eb',
  },
  announcementHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px',
  },
  announcementInfo: {
    flex: 1,
  },
  announcementTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
    margin: '0 0 4px 0',
  },
  announcementMeta: {
    fontSize: '12px',
    color: '#6b7280',
    margin: 0,
  },
  announcementStatus: {
    marginLeft: '16px',
  },
  statusBadge: {
    padding: '4px 8px',
    fontSize: '12px',
    fontWeight: '500',
    color: '#ffffff',
    borderRadius: '4px',
    textTransform: 'capitalize' as const,
  },
  announcementMessage: {
    fontSize: '14px',
    color: '#374151',
    margin: 0,
    lineHeight: '1.5',
  },
};

export default AdminAnnouncements;