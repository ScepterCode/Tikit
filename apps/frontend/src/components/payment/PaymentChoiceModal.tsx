import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import { useNavigate } from 'react-router-dom';

interface PaymentChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUseWallet: () => void;
  onUseCard: () => void;
  totalAmount: number;
  eventTitle: string;
  ticketDetails: {
    quantity: number;
    tierName: string;
    unitPrice: number;
  };
}

export function PaymentChoiceModal({
  isOpen,
  onClose,
  onUseWallet,
  onUseCard,
  totalAmount,
  eventTitle,
  ticketDetails
}: PaymentChoiceModalProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchWalletBalance();
    }
  }, [isOpen]);

  const fetchWalletBalance = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/wallet/balance`, {
        headers: {
          'Authorization': `Bearer ${user?.session?.access_token}`,
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        setWalletBalance(data.balance || 0);
      } else {
        setError('Unable to fetch wallet balance');
        setWalletBalance(0);
      }
    } catch (err) {
      console.error('Error fetching wallet balance:', err);
      setError('Unable to fetch wallet balance');
      setWalletBalance(0);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const hasSufficientFunds = walletBalance !== null && walletBalance >= totalAmount;
  const shortfall = walletBalance !== null ? Math.max(0, totalAmount - walletBalance) : 0;
  const newBalance = walletBalance !== null ? walletBalance - totalAmount : 0;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>Choose Payment Method</h2>
          <button style={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Purchase Summary */}
        <div style={styles.summary}>
          <div style={styles.summaryRow}>
            <span style={styles.summaryLabel}>Event:</span>
            <span style={styles.summaryValue}>{eventTitle}</span>
          </div>
          <div style={styles.summaryRow}>
            <span style={styles.summaryLabel}>Ticket:</span>
            <span style={styles.summaryValue}>
              {ticketDetails.quantity}x {ticketDetails.tierName}
            </span>
          </div>
          <div style={styles.summaryRow}>
            <span style={styles.summaryLabel}>Total:</span>
            <span style={styles.summaryValueBold}>₦{totalAmount.toLocaleString()}</span>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div style={styles.loadingContainer}>
            <div style={styles.spinner}></div>
            <p style={styles.loadingText}>Checking wallet balance...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div style={styles.errorContainer}>
            <p style={styles.errorText}>⚠️ {error}</p>
            <p style={styles.errorSubtext}>You can still pay with card</p>
          </div>
        )}

        {/* Payment Options */}
        {!loading && walletBalance !== null && (
          <>
            {/* Wallet Balance Display */}
            <div style={styles.balanceCard}>
              <div style={styles.balanceIcon}>💰</div>
              <div style={styles.balanceInfo}>
                <div style={styles.balanceLabel}>Your Wallet Balance</div>
                <div style={styles.balanceAmount}>₦{walletBalance.toLocaleString()}</div>
              </div>
            </div>

            {/* Sufficient Funds - Show Both Options */}
            {hasSufficientFunds && (
              <div style={styles.optionsContainer}>
                <div style={styles.successMessage}>
                  ✅ You have sufficient funds in your wallet
                </div>

                {/* Use Wallet Option */}
                <button
                  style={styles.optionButton}
                  onClick={onUseWallet}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#059669';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#10b981';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={styles.optionIcon}>💳</div>
                  <div style={styles.optionContent}>
                    <div style={styles.optionTitle}>Use Wallet Balance</div>
                    <div style={styles.optionDescription}>
                      Pay ₦{totalAmount.toLocaleString()} from wallet
                    </div>
                    <div style={styles.optionMeta}>
                      New balance: ₦{newBalance.toLocaleString()}
                    </div>
                  </div>
                  <div style={styles.optionArrow}>→</div>
                </button>

                {/* Pay with Card Option */}
                <button
                  style={{ ...styles.optionButton, ...styles.optionButtonSecondary }}
                  onClick={onUseCard}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#5a67d8';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#667eea';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={styles.optionIcon}>💳</div>
                  <div style={styles.optionContent}>
                    <div style={styles.optionTitle}>Pay with Card</div>
                    <div style={styles.optionDescription}>
                      Use Flutterwave secure payment
                    </div>
                    <div style={styles.optionMeta}>
                      Card, Bank Transfer, USSD
                    </div>
                  </div>
                  <div style={styles.optionArrow}>→</div>
                </button>
              </div>
            )}

            {/* Insufficient Funds - Show Warning and Card Option */}
            {!hasSufficientFunds && walletBalance > 0 && (
              <div style={styles.optionsContainer}>
                <div style={styles.warningMessage}>
                  <div style={styles.warningIcon}>⚠️</div>
                  <div style={styles.warningContent}>
                    <div style={styles.warningTitle}>Insufficient Wallet Balance</div>
                    <div style={styles.warningText}>
                      You need ₦{totalAmount.toLocaleString()} but have ₦{walletBalance.toLocaleString()}
                    </div>
                    <div style={styles.warningShortfall}>
                      Short by: ₦{shortfall.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Pay with Card Option */}
                <button
                  style={styles.optionButton}
                  onClick={onUseCard}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#5a67d8';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#667eea';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={styles.optionIcon}>💳</div>
                  <div style={styles.optionContent}>
                    <div style={styles.optionTitle}>Pay with Card</div>
                    <div style={styles.optionDescription}>
                      Complete purchase now with card
                    </div>
                    <div style={styles.optionMeta}>
                      Card, Bank Transfer, USSD
                    </div>
                  </div>
                  <div style={styles.optionArrow}>→</div>
                </button>

                {/* Top Up Wallet Option */}
                <button
                  style={{ ...styles.optionButton, ...styles.optionButtonSecondary }}
                  onClick={() => {
                    onClose();
                    navigate('/attendee/wallet');
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#059669';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#10b981';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={styles.optionIcon}>💰</div>
                  <div style={styles.optionContent}>
                    <div style={styles.optionTitle}>Top Up Wallet</div>
                    <div style={styles.optionDescription}>
                      Add funds to your wallet first
                    </div>
                    <div style={styles.optionMeta}>
                      Then return to purchase
                    </div>
                  </div>
                  <div style={styles.optionArrow}>→</div>
                </button>
              </div>
            )}

            {/* Zero Balance - Show Card Option Only */}
            {walletBalance === 0 && (
              <div style={styles.optionsContainer}>
                <div style={styles.infoMessage}>
                  💡 Your wallet is empty. You can pay with card or top up your wallet.
                </div>

                {/* Pay with Card Option */}
                <button
                  style={styles.optionButton}
                  onClick={onUseCard}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#5a67d8';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#667eea';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={styles.optionIcon}>💳</div>
                  <div style={styles.optionContent}>
                    <div style={styles.optionTitle}>Pay with Card</div>
                    <div style={styles.optionDescription}>
                      Complete purchase now
                    </div>
                    <div style={styles.optionMeta}>
                      Card, Bank Transfer, USSD
                    </div>
                  </div>
                  <div style={styles.optionArrow}>→</div>
                </button>

                {/* Top Up Wallet Option */}
                <button
                  style={{ ...styles.optionButton, ...styles.optionButtonSecondary }}
                  onClick={() => {
                    onClose();
                    navigate('/attendee/wallet');
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#059669';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#10b981';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={styles.optionIcon}>💰</div>
                  <div style={styles.optionContent}>
                    <div style={styles.optionTitle}>Top Up Wallet</div>
                    <div style={styles.optionDescription}>
                      Add funds to your wallet
                    </div>
                    <div style={styles.optionMeta}>
                      Then return to purchase
                    </div>
                  </div>
                  <div style={styles.optionArrow}>→</div>
                </button>
              </div>
            )}
          </>
        )}

        {/* Cancel Button */}
        <div style={styles.footer}>
          <button style={styles.cancelButton} onClick={onClose}>
            Cancel
          </button>
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    maxWidth: '500px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
  },
  header: {
    padding: '24px',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#111827',
    margin: 0,
  },
  closeButton: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
    fontSize: '20px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  },
  summary: {
    padding: '20px 24px',
    backgroundColor: '#f9fafb',
    borderBottom: '1px solid #e5e7eb',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
  },
  summaryLabel: {
    fontSize: '14px',
    color: '#6b7280',
  },
  summaryValue: {
    fontSize: '14px',
    color: '#374151',
    fontWeight: '500',
  },
  summaryValueBold: {
    fontSize: '16px',
    color: '#111827',
    fontWeight: '700',
  },
  loadingContainer: {
    padding: '40px 24px',
    textAlign: 'center' as const,
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #f3f4f6',
    borderTop: '4px solid #667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 16px',
  },
  loadingText: {
    fontSize: '14px',
    color: '#6b7280',
  },
  errorContainer: {
    padding: '24px',
    textAlign: 'center' as const,
  },
  errorText: {
    fontSize: '14px',
    color: '#dc2626',
    marginBottom: '8px',
  },
  errorSubtext: {
    fontSize: '12px',
    color: '#6b7280',
  },
  balanceCard: {
    margin: '24px',
    padding: '20px',
    backgroundColor: '#f0f9ff',
    border: '2px solid #bfdbfe',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  balanceIcon: {
    fontSize: '32px',
  },
  balanceInfo: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: '12px',
    color: '#1e40af',
    fontWeight: '600',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    marginBottom: '4px',
  },
  balanceAmount: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1e3a8a',
  },
  optionsContainer: {
    padding: '0 24px 24px',
  },
  successMessage: {
    padding: '12px 16px',
    backgroundColor: '#d1fae5',
    color: '#065f46',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    marginBottom: '16px',
    textAlign: 'center' as const,
  },
  warningMessage: {
    padding: '16px',
    backgroundColor: '#fef3c7',
    border: '2px solid #fbbf24',
    borderRadius: '12px',
    marginBottom: '16px',
    display: 'flex',
    gap: '12px',
  },
  warningIcon: {
    fontSize: '24px',
    flexShrink: 0,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#92400e',
    marginBottom: '4px',
  },
  warningText: {
    fontSize: '13px',
    color: '#78350f',
    marginBottom: '4px',
  },
  warningShortfall: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#dc2626',
  },
  infoMessage: {
    padding: '12px 16px',
    backgroundColor: '#e0e7ff',
    color: '#3730a3',
    borderRadius: '8px',
    fontSize: '14px',
    marginBottom: '16px',
    textAlign: 'center' as const,
  },
  optionButton: {
    width: '100%',
    padding: '16px',
    backgroundColor: '#667eea',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '12px',
    transition: 'all 0.2s',
    boxShadow: '0 2px 8px rgba(102, 126, 234, 0.2)',
  },
  optionButtonSecondary: {
    backgroundColor: '#10b981',
    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.2)',
  },
  optionIcon: {
    fontSize: '32px',
    flexShrink: 0,
  },
  optionContent: {
    flex: 1,
    textAlign: 'left' as const,
  },
  optionTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: '4px',
  },
  optionDescription: {
    fontSize: '13px',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: '4px',
  },
  optionMeta: {
    fontSize: '11px',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  optionArrow: {
    fontSize: '24px',
    color: '#ffffff',
    flexShrink: 0,
  },
  footer: {
    padding: '16px 24px',
    borderTop: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'center',
  },
  cancelButton: {
    padding: '10px 24px',
    backgroundColor: '#f3f4f6',
    border: 'none',
    borderRadius: '8px',
    color: '#374151',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
};
