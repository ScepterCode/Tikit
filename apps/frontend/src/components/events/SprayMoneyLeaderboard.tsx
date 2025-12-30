import React, { useState } from 'react';
import { useSprayMoneyLeaderboard } from '../../hooks/useSprayMoneyLeaderboard';

interface SprayMoneyLeaderboardProps {
  eventId: string;
  onSprayMoney: (amount: number, message: string) => void;
  isOnline?: boolean;
}

export function SprayMoneyLeaderboard({ eventId, onSprayMoney, isOnline = false }: SprayMoneyLeaderboardProps) {
  const { leaderboard, loading, error } = useSprayMoneyLeaderboard(eventId);
  const [showSprayForm, setShowSprayForm] = useState(false);
  const [sprayAmount, setSprayAmount] = useState('');
  const [sprayMessage, setSprayMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate total spray money
  const totalSprayMoney = leaderboard.reduce((sum, entry) => sum + entry.amount, 0);

  const handleSpraySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseInt(sprayAmount);
    if (!amount || amount < 100) {
      alert('Minimum spray amount is ₦100');
      return;
    }

    if (amount > 1000000) {
      alert('Maximum spray amount is ₦1,000,000');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSprayMoney(amount, sprayMessage);
      setSprayAmount('');
      setSprayMessage('');
      setShowSprayForm(false);
    } catch (error) {
      console.error('Error spraying money:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const quickSprayAmounts = [500, 1000, 2000, 5000, 10000];

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <div style={styles.spinner}></div>
          <p>Loading spray money leaderboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>
          <p>Error loading leaderboard: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.titleRow}>
          <h2 style={styles.title}>💰 Spray Money Leaderboard</h2>
          {isOnline && (
            <span style={styles.liveBadge}>
              <span style={styles.liveIndicator}></span>
              LIVE
            </span>
          )}
        </div>
        <p style={styles.subtitle}>
          Show your love and support for the couple! Your contributions will be displayed live.
        </p>
      </div>

      <div style={styles.totalSection}>
        <div style={styles.totalCard}>
          <div style={styles.totalLabel}>Total Spray Money</div>
          <div style={styles.totalAmount}>₦{totalSprayMoney.toLocaleString()}</div>
          <div style={styles.totalCount}>{leaderboard.length} contributors</div>
        </div>
      </div>

      <div style={styles.spraySection}>
        {!showSprayForm ? (
          <button
            onClick={() => setShowSprayForm(true)}
            style={styles.sprayButton}
          >
            💸 Spray Money
          </button>
        ) : (
          <form onSubmit={handleSpraySubmit} style={styles.sprayForm}>
            <h3 style={styles.formTitle}>Spray Money</h3>
            
            <div style={styles.quickAmounts}>
              <label style={styles.quickLabel}>Quick amounts:</label>
              <div style={styles.quickButtons}>
                {quickSprayAmounts.map(amount => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setSprayAmount(amount.toString())}
                    style={{
                      ...styles.quickButton,
                      ...(sprayAmount === amount.toString() ? styles.selectedQuick : {})
                    }}
                  >
                    ₦{amount.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            <div style={styles.formField}>
              <label style={styles.label}>Amount (₦):</label>
              <input
                type="number"
                min="100"
                max="1000000"
                value={sprayAmount}
                onChange={(e) => setSprayAmount(e.target.value)}
                placeholder="Enter amount"
                style={styles.input}
                required
              />
            </div>

            <div style={styles.formField}>
              <label style={styles.label}>Message (optional):</label>
              <textarea
                value={sprayMessage}
                onChange={(e) => setSprayMessage(e.target.value)}
                placeholder="Congratulations! Wishing you both happiness..."
                maxLength={200}
                style={styles.textarea}
              />
              <div style={styles.charCount}>
                {sprayMessage.length}/200 characters
              </div>
            </div>

            <div style={styles.formActions}>
              <button
                type="button"
                onClick={() => setShowSprayForm(false)}
                style={styles.cancelButton}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !sprayAmount}
                style={{
                  ...styles.submitButton,
                  ...(isSubmitting || !sprayAmount ? styles.disabledButton : {})
                }}
              >
                {isSubmitting ? 'Processing...' : `Spray ₦${parseInt(sprayAmount || '0').toLocaleString()}`}
              </button>
            </div>
          </form>
        )}
      </div>

      <div style={styles.leaderboardSection}>
        <h3 style={styles.leaderboardTitle}>Top Contributors</h3>
        
        {leaderboard.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>💰</div>
            <p style={styles.emptyText}>No contributions yet.</p>
            <p style={styles.emptySubtext}>Be the first to spray money and show your support!</p>
          </div>
        ) : (
          <div style={styles.leaderboardList}>
            {leaderboard.slice(0, 10).map((entry, index) => {
              const displayName = entry.user_name || 'Anonymous';
              const medals = ['🥇', '🥈', '🥉'];
              const medal = index < 3 ? medals[index] : null;

              return (
                <div
                  key={entry.user_id}
                  style={{
                    ...styles.leaderboardItem,
                    ...(index < 3 ? styles.topThree : {})
                  }}
                >
                  <div style={styles.rank}>
                    {medal || `#${index + 1}`}
                  </div>
                  <div style={styles.contributorInfo}>
                    <div style={styles.contributorName}>{displayName}</div>
                    {entry.message && (
                      <div style={styles.contributorMessage}>"{entry.message}"</div>
                    )}
                  </div>
                  <div style={styles.contributorAmount}>
                    ₦{entry.amount.toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {isOnline && (
        <div style={styles.liveInfo}>
          <p style={styles.liveInfoText}>
            💡 This leaderboard updates in real-time. Your contributions will appear instantly!
          </p>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '600px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  loading: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    padding: '40px',
    gap: '16px',
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid #f3f3f3',
    borderTop: '3px solid #667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  error: {
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    padding: '16px',
    borderRadius: '8px',
    textAlign: 'center' as const,
  },
  header: {
    marginBottom: '24px',
    textAlign: 'center' as const,
  },
  titleRow: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '8px',
  },
  title: {
    margin: '0',
    fontSize: '24px',
    fontWeight: '700',
    color: '#1f2937',
  },
  liveBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: '#dc2626',
    color: 'white',
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
  },
  liveIndicator: {
    width: '8px',
    height: '8px',
    backgroundColor: 'white',
    borderRadius: '50%',
    animation: 'pulse 2s infinite',
  },
  subtitle: {
    margin: '0',
    color: '#6b7280',
    fontSize: '14px',
  },
  totalSection: {
    marginBottom: '24px',
  },
  totalCard: {
    backgroundColor: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
    background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
    color: 'white',
    padding: '24px',
    borderRadius: '16px',
    textAlign: 'center' as const,
  },
  totalLabel: {
    fontSize: '14px',
    opacity: 0.9,
    marginBottom: '4px',
  },
  totalAmount: {
    fontSize: '32px',
    fontWeight: '700',
    marginBottom: '4px',
  },
  totalCount: {
    fontSize: '14px',
    opacity: 0.9,
  },
  spraySection: {
    marginBottom: '32px',
  },
  sprayButton: {
    width: '100%',
    backgroundColor: '#059669',
    color: 'white',
    border: 'none',
    padding: '16px',
    borderRadius: '12px',
    fontSize: '18px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  sprayForm: {
    backgroundColor: '#f9fafb',
    padding: '24px',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
  },
  formTitle: {
    margin: '0 0 20px 0',
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
  },
  quickAmounts: {
    marginBottom: '16px',
  },
  quickLabel: {
    display: 'block',
    marginBottom: '8px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
  },
  quickButtons: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap' as const,
  },
  quickButton: {
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    backgroundColor: 'white',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  selectedQuick: {
    backgroundColor: '#059669',
    color: 'white',
    borderColor: '#059669',
  },
  formField: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    marginBottom: '6px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '16px',
    boxSizing: 'border-box' as const,
  },
  textarea: {
    width: '100%',
    padding: '12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    minHeight: '80px',
    resize: 'vertical' as const,
    boxSizing: 'border-box' as const,
  },
  charCount: {
    fontSize: '12px',
    color: '#6b7280',
    textAlign: 'right' as const,
    marginTop: '4px',
  },
  formActions: {
    display: 'flex',
    gap: '12px',
  },
  cancelButton: {
    flex: 1,
    padding: '12px',
    border: '1px solid #d1d5db',
    backgroundColor: 'white',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  submitButton: {
    flex: 2,
    padding: '12px',
    backgroundColor: '#059669',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  disabledButton: {
    backgroundColor: '#d1d5db',
    cursor: 'not-allowed',
  },
  leaderboardSection: {
    marginBottom: '24px',
  },
  leaderboardTitle: {
    margin: '0 0 16px 0',
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '40px 20px',
    color: '#6b7280',
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  emptyText: {
    margin: '0 0 8px 0',
    fontSize: '16px',
    fontWeight: '500',
  },
  emptySubtext: {
    margin: '0',
    fontSize: '14px',
  },
  leaderboardList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  leaderboardItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px',
    backgroundColor: 'white',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
  },
  topThree: {
    background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
    borderColor: '#f59e0b',
  },
  rank: {
    fontSize: '20px',
    fontWeight: '700',
    minWidth: '40px',
    textAlign: 'center' as const,
  },
  contributorInfo: {
    flex: 1,
  },
  contributorName: {
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '2px',
  },
  contributorMessage: {
    fontSize: '14px',
    color: '#6b7280',
    fontStyle: 'italic',
  },
  contributorAmount: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#059669',
  },
  liveInfo: {
    backgroundColor: '#eff6ff',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #bfdbfe',
  },
  liveInfoText: {
    margin: '0',
    fontSize: '14px',
    color: '#1e40af',
  },
};
