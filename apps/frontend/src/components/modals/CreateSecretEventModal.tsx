import { useState } from 'react';
import { authenticatedFetch } from '../../utils/auth';
import { useMembership } from '../../hooks/useMembership';

interface CreateSecretEventModalProps {
  onClose: () => void;
  onSuccess: (event: any) => void;
}

export function CreateSecretEventModal({ onClose, onSuccess }: CreateSecretEventModalProps) {
  const { isPremium, isVip, membership } = useMembership();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdEvent, setCreatedEvent] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    venue: '', // Secret full address
    public_venue: 'Lagos Island', // Vague public location
    start_date: '',
    end_date: '',
    premium_tier_required: 'premium',
    location_reveal_hours: 2,
    max_attendees: 100,
    price: 5000,
    anonymous_purchases_allowed: true,
    attendee_list_hidden: true
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
              type === 'number' ? Number(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isPremium) {
      setError('Premium membership required to create secret events');
      return;
    }

    if (!formData.title || !formData.venue || !formData.start_date) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      const response = await authenticatedFetch('http://localhost:8000/api/secret-events/create', {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        setCreatedEvent(data.data);
      } else {
        setError(data.error || 'Failed to create secret event');
      }
    } catch (error) {
      console.error('Error creating secret event:', error);
      setError('Failed to create secret event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyInviteCode = () => {
    if (createdEvent?.master_invite_code) {
      navigator.clipboard.writeText(createdEvent.master_invite_code);
      alert('Invite code copied to clipboard!');
    }
  };

  const handleFinish = () => {
    if (createdEvent) {
      onSuccess(createdEvent);
    }
    onClose();
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>🔐 Create Secret Event</h2>
          <button style={styles.closeButton} onClick={onClose}>✕</button>
        </div>

        {!isPremium && (
          <div style={styles.premiumRequired}>
            <div style={styles.premiumIcon}>✨</div>
            <div>
              <h3 style={styles.premiumTitle}>Premium Membership Required</h3>
              <p style={styles.premiumText}>
                Only Premium and VIP members can create secret events with invite codes and location reveals.
              </p>
            </div>
          </div>
        )}

        {isPremium && !createdEvent && (
          <div style={styles.content}>
            <div style={styles.infoBox}>
              <h3 style={styles.infoTitle}>🎭 Secret Event Features</h3>
              <div style={styles.featuresList}>
                <div style={styles.feature}>✅ Invite-only access with unique codes</div>
                <div style={styles.feature}>✅ Hidden location with timed reveals</div>
                <div style={styles.feature}>✅ Anonymous ticket purchasing</div>
                <div style={styles.feature}>✅ Private attendee lists</div>
                {isVip && (
                  <div style={styles.feature}>👑 VIP: Early location access for VIP attendees</div>
                )}
              </div>
            </div>

            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Event Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    style={styles.input}
                    placeholder="Secret Party 2026"
                    required
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Access Level</label>
                  <select
                    name="premium_tier_required"
                    value={formData.premium_tier_required}
                    onChange={handleInputChange}
                    style={styles.select}
                  >
                    <option value="premium">Premium Members</option>
                    {isVip && <option value="vip">VIP Members Only</option>}
                  </select>
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  style={styles.textarea}
                  placeholder="An exclusive gathering for our premium community..."
                  rows={3}
                />
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Secret Venue (Full Address) *</label>
                  <input
                    type="text"
                    name="venue"
                    value={formData.venue}
                    onChange={handleInputChange}
                    style={styles.input}
                    placeholder="123 Hidden Street, Victoria Island, Lagos"
                    required
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Public Location (Vague)</label>
                  <input
                    type="text"
                    name="public_venue"
                    value={formData.public_venue}
                    onChange={handleInputChange}
                    style={styles.input}
                    placeholder="Lagos Island"
                  />
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Start Date & Time *</label>
                  <input
                    type="datetime-local"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleInputChange}
                    style={styles.input}
                    required
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>End Date & Time</label>
                  <input
                    type="datetime-local"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleInputChange}
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Location Reveal (Hours Before)</label>
                  <select
                    name="location_reveal_hours"
                    value={formData.location_reveal_hours}
                    onChange={handleInputChange}
                    style={styles.select}
                  >
                    <option value={1}>1 hour before</option>
                    <option value={2}>2 hours before</option>
                    <option value={4}>4 hours before</option>
                    <option value={6}>6 hours before</option>
                    <option value={12}>12 hours before</option>
                    <option value={24}>24 hours before</option>
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Max Attendees</label>
                  <input
                    type="number"
                    name="max_attendees"
                    value={formData.max_attendees}
                    onChange={handleInputChange}
                    style={styles.input}
                    min="10"
                    max="1000"
                  />
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Ticket Price (₦)</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    style={styles.input}
                    min="0"
                    step="100"
                  />
                </div>
              </div>

              <div style={styles.checkboxGroup}>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="anonymous_purchases_allowed"
                    checked={formData.anonymous_purchases_allowed}
                    onChange={handleInputChange}
                  />
                  <span>Allow anonymous ticket purchases</span>
                </label>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="attendee_list_hidden"
                    checked={formData.attendee_list_hidden}
                    onChange={handleInputChange}
                  />
                  <span>Hide attendee list for privacy</span>
                </label>
              </div>

              {error && <div style={styles.error}>{error}</div>}

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
                  style={styles.createButton}
                  disabled={loading}
                >
                  {loading ? 'Creating...' : '🔐 Create Secret Event'}
                </button>
              </div>
            </form>
          </div>
        )}

        {createdEvent && (
          <div style={styles.content}>
            <div style={styles.successCard}>
              <div style={styles.successHeader}>
                <h3 style={styles.successTitle}>🎉 Secret Event Created!</h3>
                <div style={styles.successBadge}>Event ID: {createdEvent.event_id.slice(0, 8)}</div>
              </div>

              <div style={styles.inviteCodeSection}>
                <h4 style={styles.inviteTitle}>🔑 Master Invite Code</h4>
                <div style={styles.inviteCodeBox}>
                  <span style={styles.inviteCode}>{createdEvent.master_invite_code}</span>
                  <button
                    onClick={handleCopyInviteCode}
                    style={styles.copyButton}
                  >
                    📋 Copy
                  </button>
                </div>
                <p style={styles.inviteNote}>
                  Share this code with your exclusive guests. They'll need Premium membership to access the event.
                </p>
              </div>

              <div style={styles.eventSummary}>
                <h4 style={styles.summaryTitle}>📋 Event Summary</h4>
                <div style={styles.summaryDetails}>
                  <div style={styles.summaryItem}>
                    <span style={styles.summaryLabel}>Public Location:</span>
                    <span>{createdEvent.public_venue}</span>
                  </div>
                  <div style={styles.summaryItem}>
                    <span style={styles.summaryLabel}>Location Reveal:</span>
                    <span>{new Date(createdEvent.location_reveal_time).toLocaleString()}</span>
                  </div>
                  <div style={styles.summaryItem}>
                    <span style={styles.summaryLabel}>Access Level:</span>
                    <span>{formData.premium_tier_required.toUpperCase()} members</span>
                  </div>
                </div>
              </div>

              <div style={styles.nextSteps}>
                <h4 style={styles.nextStepsTitle}>🚀 Next Steps</h4>
                <div style={styles.stepsList}>
                  <div style={styles.step}>1. Share the invite code with your exclusive guests</div>
                  <div style={styles.step}>2. Guests will validate the code to access event details</div>
                  <div style={styles.step}>3. Location will be revealed automatically before the event</div>
                  <div style={styles.step}>4. Monitor attendance through your organizer dashboard</div>
                </div>
              </div>

              <div style={styles.buttonGroup}>
                <button
                  onClick={onClose}
                  style={styles.cancelButton}
                >
                  Close
                </button>
                <button
                  onClick={handleFinish}
                  style={styles.finishButton}
                >
                  ✅ Done
                </button>
              </div>
            </div>
          </div>
        )}
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
    padding: '20px',
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    maxWidth: '800px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '24px 24px 0 24px',
    borderBottom: '1px solid #e5e7eb',
    marginBottom: '24px',
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1f2937',
    margin: 0,
  },
  closeButton: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
  },
  content: {
    padding: '0 24px 24px 24px',
  },
  premiumRequired: {
    padding: '24px',
    backgroundColor: '#fef3c7',
    border: '1px solid #fbbf24',
    borderRadius: '12px',
    margin: '0 24px 24px 24px',
    display: 'flex',
    gap: '16px',
    alignItems: 'flex-start',
  },
  premiumIcon: {
    fontSize: '32px',
  },
  premiumTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#92400e',
    margin: '0 0 8px 0',
  },
  premiumText: {
    fontSize: '14px',
    color: '#92400e',
    margin: 0,
    lineHeight: '1.5',
  },
  infoBox: {
    backgroundColor: '#f0f9ff',
    border: '1px solid #0ea5e9',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '24px',
  },
  infoTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#0c4a6e',
    margin: '0 0 12px 0',
  },
  featuresList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  feature: {
    fontSize: '14px',
    color: '#0c4a6e',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
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
  checkboxGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#374151',
  },
  error: {
    padding: '12px',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    color: '#dc2626',
    fontSize: '14px',
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
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
  createButton: {
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '600',
    backgroundColor: '#8b5cf6',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  finishButton: {
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '600',
    backgroundColor: '#10b981',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  successCard: {
    border: '1px solid #10b981',
    borderRadius: '12px',
    padding: '24px',
    backgroundColor: '#f0fdf4',
  },
  successHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  successTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#065f46',
    margin: 0,
  },
  successBadge: {
    padding: '4px 12px',
    fontSize: '12px',
    fontWeight: '600',
    backgroundColor: '#10b981',
    color: '#ffffff',
    borderRadius: '20px',
  },
  inviteCodeSection: {
    marginBottom: '24px',
  },
  inviteTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#065f46',
    marginBottom: '12px',
  },
  inviteCodeBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    backgroundColor: '#ffffff',
    border: '2px solid #10b981',
    borderRadius: '8px',
    marginBottom: '8px',
  },
  inviteCode: {
    fontSize: '24px',
    fontWeight: 'bold',
    fontFamily: 'monospace',
    letterSpacing: '4px',
    color: '#065f46',
    flex: 1,
  },
  copyButton: {
    padding: '8px 16px',
    fontSize: '12px',
    fontWeight: '600',
    backgroundColor: '#10b981',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  inviteNote: {
    fontSize: '12px',
    color: '#065f46',
    margin: 0,
  },
  eventSummary: {
    marginBottom: '24px',
  },
  summaryTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#065f46',
    marginBottom: '12px',
  },
  summaryDetails: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  summaryItem: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '14px',
  },
  summaryLabel: {
    fontWeight: '600',
    color: '#065f46',
  },
  nextSteps: {
    marginBottom: '24px',
  },
  nextStepsTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#065f46',
    marginBottom: '12px',
  },
  stepsList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  step: {
    fontSize: '14px',
    color: '#065f46',
    paddingLeft: '8px',
  },
};