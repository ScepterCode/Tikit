import React, { useState, useEffect } from 'react';
import { Shield, Lock, Eye, EyeOff, AlertTriangle, CheckCircle } from 'lucide-react';
import { authenticatedFetch } from '../../utils/auth';

interface SecurityStatus {
  has_transaction_pin: boolean;
  is_locked_out: boolean;
  failed_attempts: number;
  lockout_remaining: number;
  security_recommendations: string[];
}

const WalletSecurity: React.FC = () => {
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus | null>(null);
  const [showSetPin, setShowSetPin] = useState(false);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    fetchSecurityStatus();
  }, []);

  const fetchSecurityStatus = async () => {
    try {
      const response = await authenticatedFetch('/api/wallet/security/status');
      if (response.success) {
        setSecurityStatus(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch security status:', error);
    }
  };

  const handleSetPin = async () => {
    if (pin !== confirmPin) {
      setMessage({type: 'error', text: 'PIN confirmation does not match'});
      return;
    }

    if (pin.length < 4 || pin.length > 6 || !/^\d+$/.test(pin)) {
      setMessage({type: 'error', text: 'PIN must be 4-6 digits'});
      return;
    }

    setLoading(true);
    try {
      const response = await authenticatedFetch('/api/wallet/security/set-pin', {
        method: 'POST',
        body: { pin, confirm_pin: confirmPin }
      });

      if (response.success) {
        setMessage({type: 'success', text: 'Transaction PIN set successfully'});
        setShowSetPin(false);
        setPin('');
        setConfirmPin('');
        fetchSecurityStatus();
      } else {
        setMessage({type: 'error', text: response.error || 'Failed to set PIN'});
      }
    } catch (error: any) {
      setMessage({type: 'error', text: error.message || 'Failed to set PIN'});
    } finally {
      setLoading(false);
    }
  };

  if (!securityStatus) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading security status...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <Shield size={24} color="#4F46E5" />
        <h2 style={styles.title}>Wallet Security</h2>
      </div>

      {message && (
        <div style={{
          ...styles.message,
          backgroundColor: message.type === 'success' ? '#10B981' : '#EF4444'
        }}>
          {message.text}
        </div>
      )}

      {securityStatus.is_locked_out && (
        <div style={styles.lockoutWarning}>
          <AlertTriangle size={20} color="#EF4444" />
          <div>
            <strong>Account Locked</strong>
            <p>Too many failed attempts. Try again in {Math.ceil(securityStatus.lockout_remaining / 60)} minutes.</p>
          </div>
        </div>
      )}

      <div style={styles.securityGrid}>
        {/* Transaction PIN Status */}
        <div style={styles.securityCard}>
          <div style={styles.cardHeader}>
            <Lock size={20} color={securityStatus.has_transaction_pin ? '#10B981' : '#EF4444'} />
            <h3>Transaction PIN</h3>
            {securityStatus.has_transaction_pin ? (
              <CheckCircle size={16} color="#10B981" />
            ) : (
              <AlertTriangle size={16} color="#EF4444" />
            )}
          </div>
          <p style={styles.cardDescription}>
            {securityStatus.has_transaction_pin 
              ? 'Your transaction PIN is active and protecting your withdrawals.'
              : 'Set up a transaction PIN to secure your withdrawals and transfers.'
            }
          </p>
          {!securityStatus.has_transaction_pin && (
            <button 
              style={styles.primaryButton}
              onClick={() => setShowSetPin(true)}
            >
              Set Transaction PIN
            </button>
          )}
        </div>

        {/* Failed Attempts */}
        {securityStatus.failed_attempts > 0 && (
          <div style={styles.securityCard}>
            <div style={styles.cardHeader}>
              <AlertTriangle size={20} color="#F59E0B" />
              <h3>Security Alert</h3>
            </div>
            <p style={styles.cardDescription}>
              {securityStatus.failed_attempts} failed authentication attempts detected.
            </p>
          </div>
        )}

        {/* Recommendations */}
        {securityStatus.security_recommendations.length > 0 && (
          <div style={styles.securityCard}>
            <div style={styles.cardHeader}>
              <Shield size={20} color="#4F46E5" />
              <h3>Security Recommendations</h3>
            </div>
            <ul style={styles.recommendationsList}>
              {securityStatus.security_recommendations.map((rec, index) => (
                <li key={index} style={styles.recommendationItem}>{rec}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Set PIN Modal */}
      {showSetPin && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3>Set Transaction PIN</h3>
              <button 
                style={styles.closeButton}
                onClick={() => setShowSetPin(false)}
              >
                ×
              </button>
            </div>
            
            <div style={styles.modalBody}>
              <p style={styles.modalDescription}>
                Create a 4-6 digit PIN to secure your wallet transactions.
              </p>
              
              <div style={styles.inputGroup}>
                <label style={styles.label}>Transaction PIN</label>
                <div style={styles.pinInputContainer}>
                  <input
                    type={showPin ? 'text' : 'password'}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="Enter 4-6 digit PIN"
                    style={styles.pinInput}
                    maxLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    style={styles.eyeButton}
                  >
                    {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Confirm PIN</label>
                <input
                  type={showPin ? 'text' : 'password'}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  placeholder="Confirm your PIN"
                  style={styles.pinInput}
                  maxLength={6}
                />
              </div>

              <div style={styles.modalActions}>
                <button
                  style={styles.secondaryButton}
                  onClick={() => setShowSetPin(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  style={styles.primaryButton}
                  onClick={handleSetPin}
                  disabled={loading || !pin || !confirmPin}
                >
                  {loading ? 'Setting PIN...' : 'Set PIN'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    maxWidth: '800px',
    margin: '0 auto'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '24px'
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1F2937',
    margin: 0
  },
  loading: {
    textAlign: 'center' as const,
    padding: '40px',
    color: '#6B7280'
  },
  message: {
    padding: '12px 16px',
    borderRadius: '8px',
    color: 'white',
    marginBottom: '20px',
    fontSize: '14px'
  },
  lockoutWarning: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '16px',
    backgroundColor: '#FEF2F2',
    border: '1px solid #FECACA',
    borderRadius: '8px',
    marginBottom: '20px'
  },
  securityGrid: {
    display: 'grid',
    gap: '20px',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))'
  },
  securityCard: {
    padding: '20px',
    backgroundColor: 'white',
    border: '1px solid #E5E7EB',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px'
  },
  cardDescription: {
    color: '#6B7280',
    fontSize: '14px',
    lineHeight: '1.5',
    marginBottom: '16px'
  },
  recommendationsList: {
    listStyle: 'none',
    padding: 0,
    margin: 0
  },
  recommendationItem: {
    padding: '8px 0',
    borderBottom: '1px solid #F3F4F6',
    fontSize: '14px',
    color: '#374151'
  },
  primaryButton: {
    backgroundColor: '#4F46E5',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  secondaryButton: {
    backgroundColor: 'white',
    color: '#374151',
    border: '1px solid #D1D5DB',
    padding: '10px 20px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer'
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
    zIndex: 1000
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '400px',
    maxHeight: '90vh',
    overflow: 'auto'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 20px 0',
    borderBottom: '1px solid #E5E7EB'
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#6B7280'
  },
  modalBody: {
    padding: '20px'
  },
  modalDescription: {
    color: '#6B7280',
    fontSize: '14px',
    marginBottom: '20px'
  },
  inputGroup: {
    marginBottom: '16px'
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '6px'
  },
  pinInputContainer: {
    position: 'relative' as const
  },
  pinInput: {
    width: '100%',
    padding: '12px',
    paddingRight: '40px',
    border: '1px solid #D1D5DB',
    borderRadius: '8px',
    fontSize: '16px',
    letterSpacing: '2px',
    textAlign: 'center' as const
  },
  eyeButton: {
    position: 'absolute' as const,
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#6B7280'
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '24px'
  }
};

export default WalletSecurity;