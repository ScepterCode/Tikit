import { useState } from 'react';
import { authenticatedFetch } from '../../utils/auth';
import { useMembership } from '../../hooks/useMembership';

interface SecretInviteModalProps {
  onClose: () => void;
  onSuccess: (event: any) => void;
}

export function SecretInviteModal({ onClose, onSuccess }: SecretInviteModalProps) {
  const { isPremium, membership } = useMembership();
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validatedEvent, setValidatedEvent] = useState<any>(null);

  const handleValidateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (inviteCode.length !== 8) {
      setError('Invite code must be 8 characters');
      return;
    }

    if (!isPremium) {
      setError('Premium membership required to access secret events');
      return;
    }

    setLoading(true);
    
    try {
      const response = await authenticatedFetch('http://localhost:8000/api/secret-events/validate-invite', {
        method: 'POST',
        body: JSON.stringify({ invite_code: inviteCode })
      });
      
      const data = await response.json();
      
      if (data.success && data.data) {
        setValidatedEvent(data.data.event);
      } else {
        setError(data.error || 'Invalid invite code');
      }
    } catch (error) {
      console.error('Error validating invite code:', error);
      setError('Failed to validate invite code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAccessEvent = () => {
    if (validatedEvent) {
      onSuccess(validatedEvent);
      onClose();
    }
  };

  const formatTimeRemaining = (seconds: number) => {
    if (seconds <= 0) return 'Location revealed!';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m until location reveal`;
    } else {
      return `${minutes}m until location reveal`;
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>🔐 Secret Event Access</h2>
          <button style={styles.closeButton} onClick={onClose}>✕</button>
        </div>

        {!isPremium && (
          <div style={styles.premiumRequired}>
            <div style={styles.premiumIcon}>✨</div>
            <div>
              <h3 style={styles.premiumTitle}>Premium Membership Required</h3>
              <p style={styles.premiumText}>
                Secret events are exclusive to Premium and VIP members. Upgrade your membership to access hidden events with anonymous ticketing.
              </p>
            </div>
          </div>
        )}

        {isPremium && !validatedEvent && (
          <div style={styles.content}>
            <p style={styles.description}>
              Enter your 8-character secret invite code to unlock an exclusive event. 
              {membership?.tier === 'vip' && (
                <span style={styles.vipBenefit}> As a VIP member, you'll get early location access!</span>
              )}
            </p>

            <form onSubmit={handleValidateCode} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Secret Invite Code</label>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
                    setInviteCode(value);
                    setError('');
                  }}
                  style={styles.input}
                  placeholder="Enter 8-character code"
                  maxLength={8}
                  autoFocus
                  required
                />
                {error && <p style={styles.error}>{error}</p>}
              </div>

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
                  style={styles.validateButton}
                  disabled={loading || inviteCode.length !== 8}
                >
                  {loading ? 'Validating...' : 'Validate Code'}
                </button>
              </div>
            </form>
          </div>
        )}

        {validatedEvent && (
          <div style={styles.content}>
            <div style={styles.eventCard}>
              <div style={styles.eventHeader}>
                <h3 style={styles.eventTitle}>{validatedEvent.title}</h3>
                <div style={styles.secretBadge}>🔐 Secret Event</div>
              </div>
              
              <div style={styles.eventDetails}>
                <div style={styles.eventDetail}>
                  <span style={styles.detailIcon}>📅</span>
                  <span>{new Date(validatedEvent.start_date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</span>
                </div>
                
                <div style={styles.eventDetail}>
                  <span style={styles.detailIcon}>📍</span>
                  <div>
                    <span>{validatedEvent.venue}</span>
                    {!validatedEvent.location_revealed && (
                      <div style={styles.locationReveal}>
                        <span style={styles.revealIcon}>⏰</span>
                        <span style={styles.revealText}>
                          {formatTimeRemaining(validatedEvent.location_reveal_countdown)}
                        </span>
                      </div>
                    )}
                    {validatedEvent.location_revealed && (
                      <div style={styles.locationRevealed}>
                        <span style={styles.revealIcon}>✅</span>
                        <span style={styles.revealText}>Exact location revealed!</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div style={styles.eventDetail}>
                  <span style={styles.detailIcon}>👥</span>
                  <span>{validatedEvent.current_attendees} / {validatedEvent.max_attendees} attendees</span>
                </div>
                
                {validatedEvent.description && (
                  <div style={styles.eventDescription}>
                    <p>{validatedEvent.description}</p>
                  </div>
                )}
              </div>

              <div style={styles.privacyFeatures}>
                <h4 style={styles.featuresTitle}>🎭 Privacy Features</h4>
                <div style={styles.featuresList}>
                  {validatedEvent.anonymous_purchases_allowed && (
                    <div style={styles.feature}>
                      <span style={styles.featureIcon}>✅</span>
                      <span>Anonymous ticket purchases available</span>
                    </div>
                  )}
                  {validatedEvent.attendee_list_hidden && (
                    <div style={styles.feature}>
                      <span style={styles.featureIcon}>✅</span>
                      <span>Attendee list hidden for privacy</span>
                    </div>
                  )}
                  <div style={styles.feature}>
                    <span style={styles.featureIcon}>✅</span>
                    <span>Secret location with timed reveal</span>
                  </div>
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
                  onClick={handleAccessEvent}
                  style={styles.accessButton}
                >
                  🎫 Access Event
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
    maxWidth: '600px',
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
  description: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '24px',
    lineHeight: '1.5',
  },
  vipBenefit: {
    color: '#8b5cf6',
    fontWeight: '600',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
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
    padding: '16px',
    fontSize: '18px',
    fontWeight: 'bold',
    textAlign: 'center' as const,
    border: '2px solid #d1d5db',
    borderRadius: '8px',
    backgroundColor: '#ffffff',
    letterSpacing: '4px',
    fontFamily: 'monospace',
  },
  error: {
    fontSize: '14px',
    color: '#dc2626',
    margin: 0,
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
  validateButton: {
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '600',
    backgroundColor: '#667eea',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  accessButton: {
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '600',
    backgroundColor: '#10b981',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  eventCard: {
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '20px',
    backgroundColor: '#f9fafb',
  },
  eventHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px',
  },
  eventTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1f2937',
    margin: 0,
  },
  secretBadge: {
    padding: '4px 12px',
    fontSize: '12px',
    fontWeight: '600',
    backgroundColor: '#8b5cf6',
    color: '#ffffff',
    borderRadius: '20px',
  },
  eventDetails: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
    marginBottom: '20px',
  },
  eventDetail: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
  },
  detailIcon: {
    fontSize: '16px',
    width: '20px',
  },
  locationReveal: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginTop: '4px',
  },
  locationRevealed: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginTop: '4px',
  },
  revealIcon: {
    fontSize: '14px',
  },
  revealText: {
    fontSize: '12px',
    color: '#8b5cf6',
    fontWeight: '600',
  },
  eventDescription: {
    marginTop: '12px',
    padding: '12px',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
  },
  privacyFeatures: {
    marginBottom: '20px',
  },
  featuresTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '12px',
  },
  featuresList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  feature: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  featureIcon: {
    fontSize: '14px',
    color: '#10b981',
  },
};