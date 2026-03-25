import { useState } from 'react';
import { useMembership } from '../../hooks/useMembership';

interface PremiumUpgradeModalProps {
  onClose: () => void;
  onSuccess?: () => void;
  initialTier?: 'premium' | 'vip';
}

export function PremiumUpgradeModal({ onClose, onSuccess, initialTier = 'premium' }: PremiumUpgradeModalProps) {
  const { pricing, upgradeMembership, loading } = useMembership();
  const [selectedTier, setSelectedTier] = useState<'premium' | 'vip'>(initialTier);
  const [selectedDuration, setSelectedDuration] = useState<'monthly' | 'yearly' | 'lifetime'>('monthly');
  const [error, setError] = useState('');

  const handleUpgrade = async () => {
    setError('');
    
    const result = await upgradeMembership(selectedTier, selectedDuration);
    
    if (result.success) {
      onSuccess?.();
      onClose();
    } else {
      setError(result.error || 'Upgrade failed');
    }
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getSelectedPrice = () => {
    if (!pricing) return 0;
    return pricing[selectedTier][selectedDuration];
  };

  const getSavings = () => {
    if (!pricing || selectedDuration === 'monthly') return null;
    
    const monthlyPrice = pricing[selectedTier].monthly;
    const selectedPrice = pricing[selectedTier][selectedDuration];
    
    if (selectedDuration === 'yearly') {
      const yearlyMonthly = selectedPrice / 12;
      const savings = ((monthlyPrice - yearlyMonthly) / monthlyPrice) * 100;
      return Math.round(savings);
    }
    
    return null;
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>🚀 Upgrade to Premium</h2>
          <button style={styles.closeButton} onClick={onClose}>✕</button>
        </div>

        <div style={styles.content}>
          {/* Tier Selection */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Choose Your Plan</h3>
            <div style={styles.tierGrid}>
              <div 
                style={{
                  ...styles.tierCard,
                  ...(selectedTier === 'premium' ? styles.tierCardSelected : {})
                }}
                onClick={() => setSelectedTier('premium')}
              >
                <div style={styles.tierHeader}>
                  <h4 style={styles.tierName}>✨ Premium</h4>
                  <div style={styles.tierBadge}>Most Popular</div>
                </div>
                <ul style={styles.featureList}>
                  <li>🔐 Access to secret events</li>
                  <li>🎭 Anonymous ticket purchases</li>
                  <li>📊 Advanced analytics</li>
                  <li>🎨 Custom branding</li>
                  <li>⚡ Priority support</li>
                </ul>
              </div>

              <div 
                style={{
                  ...styles.tierCard,
                  ...(selectedTier === 'vip' ? styles.tierCardSelected : {})
                }}
                onClick={() => setSelectedTier('vip')}
              >
                <div style={styles.tierHeader}>
                  <h4 style={styles.tierName}>👑 VIP</h4>
                  <div style={styles.tierBadge}>Ultimate</div>
                </div>
                <ul style={styles.featureList}>
                  <li>✨ All Premium features</li>
                  <li>🕐 Early location reveals</li>
                  <li>🎪 Exclusive VIP events</li>
                  <li>💬 Anonymous chat</li>
                  <li>🎫 Custom invite codes</li>
                  <li>🏷️ White-label events</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Duration Selection */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Billing Period</h3>
            <div style={styles.durationGrid}>
              {['monthly', 'yearly', 'lifetime'].map((duration) => (
                <div
                  key={duration}
                  style={{
                    ...styles.durationCard,
                    ...(selectedDuration === duration ? styles.durationCardSelected : {})
                  }}
                  onClick={() => setSelectedDuration(duration as any)}
                >
                  <div style={styles.durationName}>
                    {duration === 'monthly' && '📅 Monthly'}
                    {duration === 'yearly' && '🗓️ Yearly'}
                    {duration === 'lifetime' && '♾️ Lifetime'}
                  </div>
                  <div style={styles.durationPrice}>
                    {pricing && formatPrice(pricing[selectedTier][duration as keyof typeof pricing.premium])}
                  </div>
                  {duration === 'yearly' && getSavings() && (
                    <div style={styles.savingsBadge}>Save {getSavings()}%</div>
                  )}
                  {duration === 'lifetime' && (
                    <div style={styles.savingsBadge}>Best Value</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div style={styles.summary}>
            <div style={styles.summaryRow}>
              <span>Plan:</span>
              <span>{selectedTier.toUpperCase()}</span>
            </div>
            <div style={styles.summaryRow}>
              <span>Billing:</span>
              <span>{selectedDuration}</span>
            </div>
            <div style={styles.summaryRow}>
              <span>Total:</span>
              <span style={styles.totalPrice}>{formatPrice(getSelectedPrice())}</span>
            </div>
          </div>

          {error && <div style={styles.error}>{error}</div>}

          {/* Action Buttons */}
          <div style={styles.buttonGroup}>
            <button
              style={styles.cancelButton}
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              style={styles.upgradeButton}
              onClick={handleUpgrade}
              disabled={loading}
            >
              {loading ? 'Processing...' : `Upgrade to ${selectedTier.toUpperCase()}`}
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
  section: {
    marginBottom: '32px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '16px',
  },
  tierGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  tierCard: {
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    padding: '20px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  tierCardSelected: {
    borderColor: '#667eea',
    backgroundColor: '#f5f7ff',
  },
  tierHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  tierName: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0,
  },
  tierBadge: {
    padding: '4px 8px',
    fontSize: '12px',
    fontWeight: '600',
    backgroundColor: '#667eea',
    color: '#ffffff',
    borderRadius: '12px',
  },
  featureList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  durationGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
  },
  durationCard: {
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    padding: '16px',
    textAlign: 'center' as const,
    cursor: 'pointer',
    transition: 'all 0.2s',
    position: 'relative' as const,
  },
  durationCardSelected: {
    borderColor: '#667eea',
    backgroundColor: '#f5f7ff',
  },
  durationName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '8px',
  },
  durationPrice: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#667eea',
  },
  savingsBadge: {
    position: 'absolute' as const,
    top: '-8px',
    right: '-8px',
    padding: '4px 8px',
    fontSize: '10px',
    fontWeight: '600',
    backgroundColor: '#10b981',
    color: '#ffffff',
    borderRadius: '12px',
  },
  summary: {
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '24px',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
    fontSize: '14px',
    color: '#6b7280',
  },
  totalPrice: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1f2937',
  },
  error: {
    padding: '12px',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    color: '#dc2626',
    fontSize: '14px',
    marginBottom: '16px',
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
  upgradeButton: {
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