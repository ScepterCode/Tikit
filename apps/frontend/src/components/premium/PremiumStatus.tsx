import { useState } from 'react';
import { useMembership } from '../../hooks/useMembership';
import { PremiumUpgradeModal } from '../modals/PremiumUpgradeModal';

interface PremiumStatusProps {
  showUpgradeButton?: boolean;
  compact?: boolean;
}

export function PremiumStatus({ showUpgradeButton = true, compact = false }: PremiumStatusProps) {
  const { membership, isPremium, isVip, isExpired, daysRemaining, loading } = useMembership();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  if (loading) {
    return (
      <div style={compact ? styles.compactContainer : styles.container}>
        <div style={styles.loading}>Loading membership...</div>
      </div>
    );
  }

  if (!membership) {
    return null;
  }

  const getTierIcon = () => {
    if (isVip) return '👑';
    if (isPremium) return '✨';
    return '🆓';
  };

  const getTierName = () => {
    if (isVip) return 'VIP';
    if (isPremium) return 'Premium';
    return 'Free';
  };

  const getTierColor = () => {
    if (isVip) return '#8b5cf6';
    if (isPremium) return '#667eea';
    return '#6b7280';
  };

  const getStatusMessage = () => {
    if (isExpired) {
      return 'Membership expired';
    }
    
    if (isPremium && daysRemaining !== null) {
      if (daysRemaining <= 7) {
        return `Expires in ${daysRemaining} days`;
      }
      return `Active until ${new Date(membership.expires_at! * 1000).toLocaleDateString()}`;
    }
    
    if (isPremium && !membership.expires_at) {
      return 'Lifetime membership';
    }
    
    return 'Active';
  };

  if (compact) {
    return (
      <>
        <div style={styles.compactContainer}>
          <div style={{ ...styles.compactBadge, backgroundColor: getTierColor() + '20', color: getTierColor() }}>
            <span style={styles.tierIcon}>{getTierIcon()}</span>
            <span style={styles.tierText}>{getTierName()}</span>
          </div>
          {!isPremium && showUpgradeButton && (
            <button
              style={styles.compactUpgradeButton}
              onClick={() => setShowUpgradeModal(true)}
            >
              Upgrade
            </button>
          )}
        </div>

        {showUpgradeModal && (
          <PremiumUpgradeModal
            onClose={() => setShowUpgradeModal(false)}
            onSuccess={() => {
              // Refresh will happen automatically via the hook
            }}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div style={styles.container}>
        <div style={styles.statusCard}>
          <div style={styles.statusHeader}>
            <div style={styles.tierInfo}>
              <span style={styles.tierIcon}>{getTierIcon()}</span>
              <div>
                <h3 style={{ ...styles.tierName, color: getTierColor() }}>
                  {getTierName()} Member
                </h3>
                <p style={styles.statusMessage}>{getStatusMessage()}</p>
              </div>
            </div>
            
            {!isPremium && showUpgradeButton && (
              <button
                style={styles.upgradeButton}
                onClick={() => setShowUpgradeModal(true)}
              >
                🚀 Upgrade Now
              </button>
            )}
          </div>

          {/* Features List */}
          <div style={styles.featuresSection}>
            <h4 style={styles.featuresTitle}>Your Features</h4>
            <div style={styles.featuresList}>
              {membership.features.map((feature, index) => (
                <div key={index} style={styles.featureItem}>
                  <span style={styles.featureIcon}>✅</span>
                  <span style={styles.featureText}>
                    {formatFeatureName(feature)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Upgrade Prompt for Free Users */}
          {!isPremium && (
            <div style={styles.upgradePrompt}>
              <h4 style={styles.upgradePromptTitle}>🔓 Unlock Premium Features</h4>
              <div style={styles.premiumFeatures}>
                <div style={styles.premiumFeature}>🔐 Access secret events</div>
                <div style={styles.premiumFeature}>🎭 Anonymous ticket purchases</div>
                <div style={styles.premiumFeature}>📊 Advanced analytics</div>
                <div style={styles.premiumFeature}>⚡ Priority support</div>
              </div>
              {showUpgradeButton && (
                <button
                  style={styles.upgradeButton}
                  onClick={() => setShowUpgradeModal(true)}
                >
                  Start Premium Trial
                </button>
              )}
            </div>
          )}

          {/* Expiration Warning */}
          {isPremium && daysRemaining !== null && daysRemaining <= 7 && (
            <div style={styles.expirationWarning}>
              <span style={styles.warningIcon}>⚠️</span>
              <div>
                <strong>Membership Expiring Soon</strong>
                <p style={styles.warningText}>
                  Your {getTierName()} membership expires in {daysRemaining} days.
                </p>
              </div>
              <button
                style={styles.renewButton}
                onClick={() => setShowUpgradeModal(true)}
              >
                Renew
              </button>
            </div>
          )}
        </div>
      </div>

      {showUpgradeModal && (
        <PremiumUpgradeModal
          onClose={() => setShowUpgradeModal(false)}
          onSuccess={() => {
            // Refresh will happen automatically via the hook
          }}
          initialTier={isPremium ? 'vip' : 'premium'}
        />
      )}
    </>
  );
}

function formatFeatureName(feature: string): string {
  const featureNames: Record<string, string> = {
    'basic_events': 'Create and manage events',
    'public_events': 'Public event listings',
    'secret_events': 'Secret event access',
    'anonymous_tickets': 'Anonymous ticket purchases',
    'priority_support': 'Priority customer support',
    'advanced_analytics': 'Advanced event analytics',
    'custom_branding': 'Custom event branding',
    'early_location_reveal': 'Early location reveals',
    'exclusive_events': 'VIP exclusive events',
    'anonymous_chat': 'Anonymous attendee chat',
    'custom_invite_codes': 'Custom invite codes',
    'white_label_events': 'White-label event pages',
    'standard_support': 'Standard support'
  };
  
  return featureNames[feature] || feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

const styles = {
  container: {
    width: '100%',
  },
  compactContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  compactBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
  },
  compactUpgradeButton: {
    padding: '4px 12px',
    fontSize: '12px',
    fontWeight: '600',
    backgroundColor: '#667eea',
    color: '#ffffff',
    border: 'none',
    borderRadius: '16px',
    cursor: 'pointer',
  },
  loading: {
    padding: '20px',
    textAlign: 'center' as const,
    color: '#6b7280',
  },
  statusCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e5e7eb',
  },
  statusHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
  },
  tierInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  tierIcon: {
    fontSize: '32px',
  },
  tierName: {
    fontSize: '20px',
    fontWeight: '700',
    margin: '0 0 4px 0',
  },
  statusMessage: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0,
  },
  upgradeButton: {
    padding: '12px 20px',
    fontSize: '14px',
    fontWeight: '600',
    backgroundColor: '#667eea',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  featuresSection: {
    marginBottom: '24px',
  },
  featuresTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '12px',
  },
  featuresList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '8px',
  },
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  featureIcon: {
    fontSize: '14px',
  },
  featureText: {
    fontSize: '14px',
    color: '#374151',
  },
  upgradePrompt: {
    backgroundColor: '#f5f7ff',
    border: '1px solid #c7d2fe',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '16px',
  },
  upgradePromptTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '12px',
  },
  premiumFeatures: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '8px',
    marginBottom: '16px',
  },
  premiumFeature: {
    fontSize: '14px',
    color: '#4f46e5',
  },
  expirationWarning: {
    backgroundColor: '#fef3c7',
    border: '1px solid #fbbf24',
    borderRadius: '8px',
    padding: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  warningIcon: {
    fontSize: '20px',
  },
  warningText: {
    fontSize: '14px',
    color: '#92400e',
    margin: '4px 0 0 0',
  },
  renewButton: {
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: '600',
    backgroundColor: '#f59e0b',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    marginLeft: 'auto',
  },
  tierText: {
    fontSize: '12px',
    fontWeight: '600',
  },
};