import React, { useState } from 'react';
import { X, Check, Crown, Star, Zap, Lock } from 'lucide-react';

interface MembershipUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier: 'regular' | 'special' | 'legend';
  onUpgrade: (tier: 'special' | 'legend') => Promise<void>;
}

export function MembershipUpgradeModal({
  isOpen,
  onClose,
  currentTier,
  onUpgrade
}: MembershipUpgradeModalProps) {
  const [selectedTier, setSelectedTier] = useState<'special' | 'legend' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const tiers = {
    regular: {
      name: 'Regular',
      price: 0,
      icon: Lock,
      color: 'gray',
      features: [
        'Create public events',
        'Basic analytics',
        'Standard support',
        'Attendee features'
      ]
    },
    special: {
      name: 'Special',
      price: 10,
      icon: Star,
      color: 'purple',
      features: [
        'Everything in Regular',
        '🎭 Secret Events with location reveals',
        '⭐ Priority event listing',
        '🎨 Custom event branding',
        '📊 Advanced analytics dashboard',
        '📧 Email marketing (500/month)',
        '🚫 Remove Tikit branding'
      ]
    },
    legend: {
      name: 'Legend',
      price: 30,
      icon: Crown,
      color: 'yellow',
      features: [
        'Everything in Special',
        '🤖 AI Event Assistant Bot',
        '🚀 Marketing automation tools',
        '📱 SMS marketing campaigns',
        '📧 Unlimited email marketing',
        '🧠 AI-powered analytics',
        '⚡ 24/7 Priority support',
        '🏷️ White label options',
        '🔌 API access',
        '🌐 Custom domain'
      ]
    }
  };

  const handleUpgrade = async () => {
    if (!selectedTier) return;
    
    try {
      setLoading(true);
      setError(null);
      await onUpgrade(selectedTier);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to start trial');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px',
      overflow: 'auto'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        maxWidth: '1200px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '32px',
          color: 'white',
          position: 'relative'
        }}>
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'white'
            }}
          >
            <X size={24} />
          </button>

          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '12px' }}>
              Upgrade Your Membership
            </h2>
            <p style={{ fontSize: '18px', opacity: 0.9 }}>
              Start your 7-day free trial • No credit card required
            </p>
          </div>
        </div>

        {/* Tier Comparison */}
        <div style={{
          padding: '40px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px'
        }}>
          {/* Regular Tier */}
          <div style={{
            border: '2px solid #e5e7eb',
            borderRadius: '12px',
            padding: '24px',
            opacity: currentTier === 'regular' ? 1 : 0.6
          }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <Lock size={48} color="#6b7280" style={{ margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
                Regular
              </h3>
              <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#6b7280' }}>
                Free
              </div>
              <p style={{ color: '#6b7280', marginTop: '8px' }}>
                {currentTier === 'regular' ? 'Current Plan' : 'Basic features'}
              </p>
            </div>

            <div style={{ marginBottom: '24px' }}>
              {tiers.regular.features.map((feature, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '12px'
                }}>
                  <Check size={20} color="#10b981" />
                  <span style={{ color: '#374151' }}>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Special Tier */}
          <div style={{
            border: selectedTier === 'special' ? '3px solid #9333ea' : '2px solid #e5e7eb',
            borderRadius: '12px',
            padding: '24px',
            position: 'relative',
            background: selectedTier === 'special' ? '#faf5ff' : 'white',
            cursor: currentTier === 'regular' ? 'pointer' : 'default',
            transform: selectedTier === 'special' ? 'scale(1.02)' : 'scale(1)',
            transition: 'all 0.2s'
          }}
          onClick={() => currentTier === 'regular' && setSelectedTier('special')}
          >
            {currentTier === 'special' && (
              <div style={{
                position: 'absolute',
                top: '-12px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#10b981',
                color: 'white',
                padding: '4px 16px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                CURRENT PLAN
              </div>
            )}

            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <Star size={48} color="#9333ea" style={{ margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px', color: '#9333ea' }}>
                Special
              </h3>
              <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#9333ea' }}>
                $10
                <span style={{ fontSize: '18px', fontWeight: 'normal', color: '#6b7280' }}>/month</span>
              </div>
              <p style={{ color: '#6b7280', marginTop: '8px' }}>
                For serious organizers
              </p>
            </div>

            <div style={{ marginBottom: '24px' }}>
              {tiers.special.features.map((feature, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '12px'
                }}>
                  <Check size={20} color="#9333ea" />
                  <span style={{ color: '#374151' }}>{feature}</span>
                </div>
              ))}
            </div>

            {currentTier === 'regular' && (
              <button
                onClick={() => setSelectedTier('special')}
                style={{
                  width: '100%',
                  background: selectedTier === 'special' ? '#9333ea' : '#e9d5ff',
                  color: selectedTier === 'special' ? 'white' : '#9333ea',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                {selectedTier === 'special' ? '✓ Selected' : 'Select Special'}
              </button>
            )}
          </div>

          {/* Legend Tier */}
          <div style={{
            border: selectedTier === 'legend' ? '3px solid #eab308' : '2px solid #e5e7eb',
            borderRadius: '12px',
            padding: '24px',
            position: 'relative',
            background: selectedTier === 'legend' ? '#fefce8' : 'white',
            cursor: currentTier !== 'legend' ? 'pointer' : 'default',
            transform: selectedTier === 'legend' ? 'scale(1.02)' : 'scale(1)',
            transition: 'all 0.2s'
          }}
          onClick={() => currentTier !== 'legend' && setSelectedTier('legend')}
          >
            <div style={{
              position: 'absolute',
              top: '-12px',
              right: '16px',
              background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
              color: 'white',
              padding: '4px 12px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              MOST POPULAR
            </div>

            {currentTier === 'legend' && (
              <div style={{
                position: 'absolute',
                top: '-12px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#10b981',
                color: 'white',
                padding: '4px 16px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                CURRENT PLAN
              </div>
            )}

            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <Crown size={48} color="#eab308" style={{ margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px', color: '#eab308' }}>
                Legend
              </h3>
              <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#eab308' }}>
                $30
                <span style={{ fontSize: '18px', fontWeight: 'normal', color: '#6b7280' }}>/month</span>
              </div>
              <p style={{ color: '#6b7280', marginTop: '8px' }}>
                For power users
              </p>
            </div>

            <div style={{ marginBottom: '24px' }}>
              {tiers.legend.features.map((feature, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '12px'
                }}>
                  <Check size={20} color="#eab308" />
                  <span style={{ color: '#374151' }}>{feature}</span>
                </div>
              ))}
            </div>

            {currentTier !== 'legend' && (
              <button
                onClick={() => setSelectedTier('legend')}
                style={{
                  width: '100%',
                  background: selectedTier === 'legend' ? '#eab308' : '#fef3c7',
                  color: selectedTier === 'legend' ? 'white' : '#eab308',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                {selectedTier === 'legend' ? '✓ Selected' : 'Select Legend'}
              </button>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            margin: '0 40px 20px',
            padding: '12px',
            background: '#fee2e2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            color: '#991b1b'
          }}>
            {error}
          </div>
        )}

        {/* Action Buttons */}
        {currentTier === 'regular' && selectedTier && (
          <div style={{
            padding: '0 40px 40px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <button
              onClick={handleUpgrade}
              disabled={loading}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                padding: '16px',
                borderRadius: '12px',
                fontWeight: 'bold',
                fontSize: '18px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {loading ? (
                'Starting Trial...'
              ) : (
                <>
                  <Zap size={20} />
                  Start 7-Day Free Trial
                </>
              )}
            </button>

            <div style={{
              textAlign: 'center',
              fontSize: '14px',
              color: '#6b7280'
            }}>
              <p>✓ No credit card required</p>
              <p>✓ Cancel anytime during trial</p>
              <p>✓ Full access to all features</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
