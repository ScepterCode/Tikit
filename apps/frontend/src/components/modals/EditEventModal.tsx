import { useState, useEffect } from 'react';

interface EditEventModalProps {
  event: any;
  onClose: () => void;
  onSave: (eventId: string, updates: any) => Promise<void>;
}

export function EditEventModal({ event, onClose, onSave }: EditEventModalProps) {
  const [formData, setFormData] = useState({
    title: event.title || '',
    description: event.description || '',
    date: event.start_date ? event.start_date.split('T')[0] : '',
    time: event.start_date ? event.start_date.split('T')[1]?.substring(0, 5) : '',
    venue: event.venue || '',
    category: event.category || 'conference',
    status: event.status || 'active',
    enableLivestream: event.enableLivestream || false,
    postponementReason: '',
    notifyAttendees: true,
  });
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [changesSummary, setChangesSummary] = useState<string[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));

    // Track changes for notification
    trackChanges(name, newValue);
  };

  const trackChanges = (field: string, newValue: any) => {
    const changes: string[] = [];
    
    if (field === 'venue' && newValue !== event.venue) {
      changes.push(`Venue changed to: ${newValue}`);
    }
    if (field === 'date' && newValue !== event.start_date?.split('T')[0]) {
      changes.push(`Date changed to: ${new Date(newValue).toLocaleDateString()}`);
    }
    if (field === 'time' && newValue !== event.start_date?.split('T')[1]?.substring(0, 5)) {
      changes.push(`Time changed to: ${newValue}`);
    }
    if (field === 'status' && newValue === 'postponed') {
      changes.push('Event has been postponed');
    }
    if (field === 'status' && newValue === 'cancelled') {
      changes.push('Event has been cancelled');
    }
    
    if (changes.length > 0) {
      setHasChanges(true);
      setChangesSummary(prev => [...new Set([...prev, ...changes])]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Confirm if there are significant changes
    if (hasChanges && formData.notifyAttendees) {
      const confirmMessage = `The following changes will be made and attendees will be notified:\n\n${changesSummary.join('\n')}\n\nContinue?`;
      if (!confirm(confirmMessage)) {
        return;
      }
    }
    
    setLoading(true);
    
    try {
      await onSave(event.id, {
        ...formData,
        changes: changesSummary,
      });
      onClose();
    } catch (error) {
      console.error('Error updating event:', error);
      alert('Failed to update event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>Edit Event</h2>
          <button style={styles.closeButton} onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Event Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                style={styles.input}
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                style={styles.select}
                required
              >
                <option value="conference">Conference</option>
                <option value="workshop">Workshop</option>
                <option value="concert">Concert</option>
                <option value="party">Party</option>
                <option value="wedding">Wedding</option>
                <option value="sports">Sports</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Date *</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                style={styles.input}
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Time *</label>
              <input
                type="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
                style={styles.input}
                required
              />
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Venue *</label>
            <input
              type="text"
              name="venue"
              value={formData.venue}
              onChange={handleChange}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              style={styles.textarea}
              rows={4}
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              style={styles.select}
            >
              <option value="active">Active</option>
              <option value="cancelled">Cancelled</option>
              <option value="postponed">Postponed</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {(formData.status === 'postponed' || formData.status === 'cancelled') && (
            <div style={styles.formGroup}>
              <label style={styles.label}>Reason for {formData.status === 'postponed' ? 'Postponement' : 'Cancellation'}</label>
              <textarea
                name="postponementReason"
                value={formData.postponementReason}
                onChange={handleChange}
                style={styles.textarea}
                placeholder="Explain the reason to attendees..."
                rows={3}
              />
            </div>
          )}

          <div style={styles.formGroup}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="enableLivestream"
                checked={formData.enableLivestream}
                onChange={handleChange}
                style={styles.checkbox}
              />
              <span>Enable Livestream & Spray Money</span>
            </label>
          </div>

          {hasChanges && (
            <div style={styles.changesAlert}>
              <h4 style={styles.changesTitle}>⚠️ Important Changes Detected</h4>
              <ul style={styles.changesList}>
                {changesSummary.map((change, index) => (
                  <li key={index}>{change}</li>
                ))}
              </ul>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="notifyAttendees"
                  checked={formData.notifyAttendees}
                  onChange={handleChange}
                  style={styles.checkbox}
                />
                <span>Notify all ticket holders about these changes</span>
              </label>
            </div>
          )}

          <div style={styles.buttonGroup}>
            <button
              type="button"
              onClick={onClose}
              style={styles.cancelButton}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={styles.submitButton}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
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
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '24px',
    maxWidth: '800px',
    width: '90%',
    maxHeight: '90vh',
    overflow: 'auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1f2937',
    margin: 0,
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#6b7280',
    padding: '4px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '16px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
  },
  input: {
    padding: '12px',
    fontSize: '14px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    backgroundColor: '#ffffff',
  },
  select: {
    padding: '12px',
    fontSize: '14px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    backgroundColor: '#ffffff',
  },
  textarea: {
    padding: '12px',
    fontSize: '14px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    backgroundColor: '#ffffff',
    resize: 'vertical' as const,
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '16px',
  },
  cancelButton: {
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '600',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  submitButton: {
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '600',
    backgroundColor: '#667eea',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    cursor: 'pointer',
  },
  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
  },
  changesAlert: {
    backgroundColor: '#fef3c7',
    border: '1px solid #fbbf24',
    borderRadius: '8px',
    padding: '16px',
    marginTop: '16px',
  },
  changesTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#92400e',
    marginBottom: '8px',
  },
  changesList: {
    fontSize: '13px',
    color: '#78350f',
    marginBottom: '12px',
    paddingLeft: '20px',
  },
};
