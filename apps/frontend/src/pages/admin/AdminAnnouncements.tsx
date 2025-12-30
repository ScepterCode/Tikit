import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'error';
  targetAudience: 'all' | 'organizers' | 'attendees' | 'admins';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'draft' | 'published' | 'scheduled' | 'archived';
  publishDate?: string;
  expiryDate?: string;
  createdBy: string;
  createdAt: string;
  views: number;
}

export function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterAudience, setFilterAudience] = useState<string>('all');
  const navigate = useNavigate();

  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    type: 'info' as const,
    targetAudience: 'all' as const,
    priority: 'medium' as const,
    publishDate: '',
    expiryDate: ''
  });

  // Mock data for now - replace with API call
  useEffect(() => {
    const mockAnnouncements: Announcement[] = [
      {
        id: '1',
        title: 'Platform Maintenance Scheduled',
        content: 'We will be performing scheduled maintenance on January 15th from 2:00 AM to 4:00 AM WAT. During this time, the platform may be temporarily unavailable.',
        type: 'warning',
        targetAudience: 'all',
        priority: 'high',
        status: 'published',
        publishDate: '2025-01-10T09:00:00.000Z',
        expiryDate: '2025-01-16T00:00:00.000Z',
        createdBy: 'Admin',
        createdAt: '2025-01-10T09:00:00.000Z',
        views: 1247
      },
      {
        id: '2',
        title: 'New Features Released',
        content: 'We\'ve added new analytics features for event organizers including real-time attendance tracking and revenue insights.',
        type: 'success',
        targetAudience: 'organizers',
        priority: 'medium',
        status: 'published',
        publishDate: '2025-01-05T10:30:00.000Z',
        createdBy: 'Admin',
        createdAt: '2025-01-05T10:30:00.000Z',
        views: 856
      },
      {
        id: '3',
        title: 'Security Update Required',
        content: 'Please update your passwords and enable two-factor authentication for enhanced security.',
        type: 'error',
        targetAudience: 'all',
        priority: 'urgent',
        status: 'published',
        publishDate: '2025-01-01T08:00:00.000Z',
        createdBy: 'Security Team',
        createdAt: '2025-01-01T08:00:00.000Z',
        views: 2103
      },
      {
        id: '4',
        title: 'Holiday Event Guidelines',
        content: 'Special guidelines for organizing events during the holiday season. Please review the updated policies.',
        type: 'info',
        targetAudience: 'organizers',
        priority: 'low',
        status: 'draft',
        createdBy: 'Admin',
        createdAt: '2024-12-20T14:15:00.000Z',
        views: 0
      }
    ];

    setTimeout(() => {
      setAnnouncements(mockAnnouncements);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredAnnouncements = announcements.filter(announcement => {
    const matchesStatus = filterStatus === 'all' || announcement.status === filterStatus;
    const matchesAudience = filterAudience === 'all' || announcement.targetAudience === filterAudience;
    return matchesStatus && matchesAudience;
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'info': return '#3b82f6';
      case 'warning': return '#f59e0b';
      case 'success': return '#16a34a';
      case 'error': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return '#16a34a';
      case 'medium': return '#f59e0b';
      case 'high': return '#ea580c';
      case 'urgent': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return '#6b7280';
      case 'published': return '#16a34a';
      case 'scheduled': return '#3b82f6';
      case 'archived': return '#9ca3af';
      default: return '#6b7280';
    }
  };

  const handleCreateAnnouncement = () => {
    const announcement: Announcement = {
      id: Date.now().toString(),
      ...newAnnouncement,
      status: 'draft',
      createdBy: 'Admin',
      createdAt: new Date().toISOString(),
      views: 0
    };

    setAnnouncements([announcement, ...announcements]);
    setNewAnnouncement({
      title: '',
      content: '',
      type: 'info',
      targetAudience: 'all',
      priority: 'medium',
      publishDate: '',
      expiryDate: ''
    });
    setShowCreateForm(false);
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <div style={styles.spinner}></div>
          <p>Loading announcements...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.titleSection}>
          <button onClick={() => navigate('/admin/dashboard')} style={styles.backButton}>
            ← Back
          </button>
          <h1 style={styles.title}>📢 Announcements</h1>
        </div>
        
        <button 
          onClick={() => setShowCreateForm(true)}
          style={styles.createButton}
        >
          + Create Announcement
        </button>
      </div>

      <div style={styles.stats}>
        <div style={styles.statCard}>
          <span style={styles.statNumber}>{announcements.length}</span>
          <span style={styles.statLabel}>Total Announcements</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statNumber}>{announcements.filter(a => a.status === 'published').length}</span>
          <span style={styles.statLabel}>Published</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statNumber}>{announcements.filter(a => a.priority === 'urgent').length}</span>
          <span style={styles.statLabel}>Urgent</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statNumber}>{announcements.reduce((sum, a) => sum + a.views, 0).toLocaleString()}</span>
          <span style={styles.statLabel}>Total Views</span>
        </div>
      </div>

      <div style={styles.controls}>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={styles.filterSelect}
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="scheduled">Scheduled</option>
          <option value="archived">Archived</option>
        </select>
        
        <select
          value={filterAudience}
          onChange={(e) => setFilterAudience(e.target.value)}
          style={styles.filterSelect}
        >
          <option value="all">All Audiences</option>
          <option value="all">Everyone</option>
          <option value="organizers">Organizers</option>
          <option value="attendees">Attendees</option>
          <option value="admins">Admins</option>
        </select>
      </div>

      {showCreateForm && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Create New Announcement</h3>
              <button 
                onClick={() => setShowCreateForm(false)}
                style={styles.closeButton}
              >
                ×
              </button>
            </div>
            
            <div style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Title</label>
                <input
                  type="text"
                  value={newAnnouncement.title}
                  onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                  style={styles.input}
                  placeholder="Enter announcement title"
                />
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Content</label>
                <textarea
                  value={newAnnouncement.content}
                  onChange={(e) => setNewAnnouncement({...newAnnouncement, content: e.target.value})}
                  style={styles.textarea}
                  placeholder="Enter announcement content"
                  rows={4}
                />
              </div>
              
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Type</label>
                  <select
                    value={newAnnouncement.type}
                    onChange={(e) => setNewAnnouncement({...newAnnouncement, type: e.target.value as any})}
                    style={styles.select}
                  >
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="success">Success</option>
                    <option value="error">Error</option>
                  </select>
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.label}>Priority</label>
                  <select
                    value={newAnnouncement.priority}
                    onChange={(e) => setNewAnnouncement({...newAnnouncement, priority: e.target.value as any})}
                    style={styles.select}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Target Audience</label>
                <select
                  value={newAnnouncement.targetAudience}
                  onChange={(e) => setNewAnnouncement({...newAnnouncement, targetAudience: e.target.value as any})}
                  style={styles.select}
                >
                  <option value="all">Everyone</option>
                  <option value="organizers">Organizers</option>
                  <option value="attendees">Attendees</option>
                  <option value="admins">Admins</option>
                </select>
              </div>
              
              <div style={styles.formActions}>
                <button 
                  onClick={() => setShowCreateForm(false)}
                  style={styles.cancelButton}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCreateAnnouncement}
                  style={styles.saveButton}
                >
                  Save as Draft
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={styles.announcementsList}>
        {filteredAnnouncements.map((announcement) => (
          <div key={announcement.id} style={styles.announcementCard}>
            <div style={styles.announcementHeader}>
              <div style={styles.announcementTitle}>
                {announcement.title}
              </div>
              <div style={styles.announcementBadges}>
                <span 
                  style={{
                    ...styles.typeBadge,
                    backgroundColor: getTypeColor(announcement.type)
                  }}
                >
                  {announcement.type}
                </span>
                <span 
                  style={{
                    ...styles.priorityBadge,
                    backgroundColor: getPriorityColor(announcement.priority)
                  }}
                >
                  {announcement.priority}
                </span>
                <span 
                  style={{
                    ...styles.statusBadge,
                    backgroundColor: getStatusColor(announcement.status)
                  }}
                >
                  {announcement.status}
                </span>
              </div>
            </div>
            
            <div style={styles.announcementContent}>
              {announcement.content}
            </div>
            
            <div style={styles.announcementMeta}>
              <div style={styles.metaInfo}>
                <span>👥 {announcement.targetAudience}</span>
                <span>👁️ {announcement.views} views</span>
                <span>👤 {announcement.createdBy}</span>
                <span>📅 {new Date(announcement.createdAt).toLocaleDateString()}</span>
              </div>
              
              <div style={styles.announcementActions}>
                <button style={styles.actionButton}>Edit</button>
                <button style={styles.actionButton}>Publish</button>
                <button style={styles.actionButton}>Archive</button>
                <button style={{...styles.actionButton, color: '#dc2626'}}>Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredAnnouncements.length === 0 && (
        <div style={styles.noResults}>
          <p>No announcements found for the selected criteria.</p>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  loading: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    height: '400px',
    gap: '16px',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #f3f4f6',
    borderTop: '4px solid #3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    flexWrap: 'wrap' as const,
    gap: '16px',
  },
  titleSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  backButton: {
    padding: '8px 16px',
    backgroundColor: '#6b7280',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#1f2937',
    margin: 0,
  },
  createButton: {
    padding: '12px 20px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  stats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '20px',
  },
  statCard: {
    backgroundColor: '#ffffff',
    padding: '20px',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '8px',
  },
  statNumber: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: '14px',
    color: '#6b7280',
  },
  controls: {
    display: 'flex',
    gap: '16px',
    marginBottom: '20px',
    flexWrap: 'wrap' as const,
  },
  filterSelect: {
    padding: '12px 16px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    backgroundColor: 'white',
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
    backgroundColor: 'white',
    borderRadius: '8px',
    width: '90%',
    maxWidth: '600px',
    maxHeight: '90vh',
    overflow: 'auto',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    borderBottom: '1px solid #e5e7eb',
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0,
  },
  closeButton: {
    fontSize: '24px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#6b7280',
  },
  form: {
    padding: '20px',
  },
  formGroup: {
    marginBottom: '16px',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
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
  },
  textarea: {
    width: '100%',
    padding: '12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    resize: 'vertical' as const,
  },
  select: {
    width: '100%',
    padding: '12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    backgroundColor: 'white',
  },
  formActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '20px',
  },
  cancelButton: {
    padding: '10px 20px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '14px',
  },
  saveButton: {
    padding: '10px 20px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  announcementsList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  announcementCard: {
    backgroundColor: '#ffffff',
    padding: '20px',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
  },
  announcementHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px',
  },
  announcementTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  announcementBadges: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap' as const,
  },
  typeBadge: {
    padding: '4px 8px',
    borderRadius: '4px',
    color: 'white',
    fontSize: '12px',
    fontWeight: '500',
    textTransform: 'capitalize' as const,
  },
  priorityBadge: {
    padding: '4px 8px',
    borderRadius: '4px',
    color: 'white',
    fontSize: '12px',
    fontWeight: '500',
    textTransform: 'capitalize' as const,
  },
  statusBadge: {
    padding: '4px 8px',
    borderRadius: '4px',
    color: 'white',
    fontSize: '12px',
    fontWeight: '500',
    textTransform: 'capitalize' as const,
  },
  announcementContent: {
    fontSize: '14px',
    color: '#374151',
    lineHeight: '1.6',
    marginBottom: '16px',
  },
  announcementMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    gap: '12px',
  },
  metaInfo: {
    display: 'flex',
    gap: '16px',
    fontSize: '12px',
    color: '#6b7280',
    flexWrap: 'wrap' as const,
  },
  announcementActions: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap' as const,
  },
  actionButton: {
    padding: '6px 12px',
    fontSize: '12px',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    backgroundColor: 'white',
    cursor: 'pointer',
    color: '#374151',
  },
  noResults: {
    textAlign: 'center' as const,
    padding: '40px',
    color: '#6b7280',
  },
};