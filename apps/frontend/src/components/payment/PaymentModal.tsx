import React, { useState, useEffect } from 'react';
import { PaymentMethodSelector, PaymentMethod } from '../tickets/PaymentMethodSelector';
import { useAuth } from '../../contexts/SupabaseAuthContext';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (transactionData: any) => void;
  onError: (error: string) => void;
  amount: number;
  eventTitle: string;
  ticketDetails: {
    quantity: number;
    tierName: string;
    unitPrice: number;
  };
  eventId: string;
}

interface PaystackResponse {
  reference: string;
  status: string;
  trans: string;
  transaction: string;
  trxref: string;
  redirecturl: string;
}

declare global {
  interface Window {
    PaystackPop: {
      setup: (options: any) => {
        openIframe: () => void;
      };
    };
  }
}

export function PaymentModal({
  isOpen,
  onClose,
  onSuccess,
  onError,
  amount,
  eventTitle,
  ticketDetails,
  eventId
}: PaymentModalProps) {
  const { user } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('wallet');
  const [processing, setProcessing] = useState(false);
  const [userWalletBalance, setUserWalletBalance] = useState(10000); // Default balance
  const [step, setStep] = useState<'method' | 'processing' | 'success' | 'error'>('method');
  const [transactionRef, setTransactionRef] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      // Load Paystack script
      const script = document.createElement('script');
      script.src = 'https://js.paystack.co/v1/inline.js';
      script.async = true;
      document.body.appendChild(script);

      // Fetch user wallet balance
      fetchWalletBalance();

      return () => {
        document.body.removeChild(script);
      };
    }
  }, [isOpen]);

  const fetchWalletBalance = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/payments/balance', {
        headers: {
          'Authorization': `Bearer ${user?.access_token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setUserWalletBalance(data.balance);
      }
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
    }
  };

  const generateTransactionRef = () => {
    return `TKT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const handlePayment = async () => {
    if (!user) {
      onError('Please log in to continue');
      return;
    }

    setProcessing(true);
    const reference = generateTransactionRef();
    setTransactionRef(reference);

    try {
      switch (paymentMethod) {
        case 'wallet':
          await handleWalletPayment(reference);
          break;
        case 'card':
          await handleCardPayment(reference);
          break;
        case 'bank_transfer':
          await handleBankTransfer(reference);
          break;
        case 'ussd':
          await handleUSSDPayment(reference);
          break;
        case 'airtime':
          await handleAirtimePayment(reference);
          break;
        default:
          throw new Error('Unsupported payment method');
      }
    } catch (error) {
      console.error('Payment error:', error);
      setStep('error');
      onError(error instanceof Error ? error.message : 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleWalletPayment = async (reference: string) => {
    const response = await fetch('http://localhost:8000/api/payments/wallet', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user?.access_token}`,
      },
      body: JSON.stringify({
        amount: amount * 100, // Convert to kobo
        reference,
        event_id: eventId,
        ticket_details: ticketDetails,
      }),
    });

    const data = await response.json();
    
    if (data.success) {
      setStep('success');
      onSuccess({
        reference,
        method: 'wallet',
        amount,
        transaction_id: data.transaction_id,
      });
    } else {
      throw new Error(data.error?.message || 'Wallet payment failed');
    }
  };

  const handleCardPayment = async (reference: string) => {
    const paystackKey = process.env.REACT_APP_PAYSTACK_PUBLIC_KEY || 'pk_test_your_key_here';
    
    const handler = window.PaystackPop.setup({
      key: paystackKey,
      email: user?.email,
      amount: amount * 100, // Convert to kobo
      currency: 'NGN',
      ref: reference,
      metadata: {
        event_id: eventId,
        user_id: user?.id,
        ticket_quantity: ticketDetails.quantity,
        ticket_tier: ticketDetails.tierName,
      },
      callback: async (response: PaystackResponse) => {
        // Verify payment on backend
        await verifyPayment(response.reference, 'card');
      },
      onClose: () => {
        setProcessing(false);
        onError('Payment cancelled');
      },
    });

    handler.openIframe();
  };

  const handleBankTransfer = async (reference: string) => {
    const response = await fetch('http://localhost:8000/api/payments/bank-transfer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user?.access_token}`,
      },
      body: JSON.stringify({
        amount: amount * 100,
        reference,
        event_id: eventId,
        ticket_details: ticketDetails,
      }),
    });

    const data = await response.json();
    
    if (data.success) {
      // Show bank details for transfer
      setStep('processing');
      // In a real app, you'd show bank details and wait for confirmation
      setTimeout(() => {
        setStep('success');
        onSuccess({
          reference,
          method: 'bank_transfer',
          amount,
          bank_details: data.bank_details,
        });
      }, 3000);
    } else {
      throw new Error(data.error?.message || 'Bank transfer setup failed');
    }
  };

  const handleUSSDPayment = async (reference: string) => {
    const response = await fetch('http://localhost:8000/api/payments/ussd', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user?.access_token}`,
      },
      body: JSON.stringify({
        amount: amount * 100,
        reference,
        event_id: eventId,
        bank: 'gtb', // Default to GTB, could be user selectable
      }),
    });

    const data = await response.json();
    
    if (data.success) {
      setStep('processing');
      // Show USSD code to user
      setTimeout(() => {
        setStep('success');
        onSuccess({
          reference,
          method: 'ussd',
          amount,
          ussd_code: data.ussd_code,
        });
      }, 5000);
    } else {
      throw new Error(data.error?.message || 'USSD payment setup failed');
    }
  };

  const handleAirtimePayment = async (reference: string) => {
    const response = await fetch('http://localhost:8000/api/payments/airtime', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user?.access_token}`,
      },
      body: JSON.stringify({
        amount: amount * 100,
        reference,
        event_id: eventId,
        phone: user?.phone,
      }),
    });

    const data = await response.json();
    
    if (data.success) {
      setStep('success');
      onSuccess({
        reference,
        method: 'airtime',
        amount,
        transaction_id: data.transaction_id,
      });
    } else {
      throw new Error(data.error?.message || 'Airtime payment failed');
    }
  };

  const verifyPayment = async (reference: string, method: string) => {
    try {
      const response = await fetch('http://localhost:8000/api/payments/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.access_token}`,
        },
        body: JSON.stringify({ reference }),
      });

      const data = await response.json();
      
      if (data.success && data.status === 'success') {
        setStep('success');
        onSuccess({
          reference,
          method,
          amount,
          transaction_id: data.transaction_id,
        });
      } else {
        throw new Error('Payment verification failed');
      }
    } catch (error) {
      setStep('error');
      onError('Payment verification failed');
    }
  };

  if (!isOpen) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>
            {step === 'method' && '💳 Complete Payment'}
            {step === 'processing' && '⏳ Processing Payment'}
            {step === 'success' && '✅ Payment Successful'}
            {step === 'error' && '❌ Payment Failed'}
          </h2>
          <button onClick={onClose} style={styles.closeButton}>×</button>
        </div>

        <div style={styles.content}>
          {step === 'method' && (
            <>
              <div style={styles.orderSummary}>
                <h3 style={styles.summaryTitle}>Order Summary</h3>
                <div style={styles.eventInfo}>
                  <div style={styles.eventTitle}>{eventTitle}</div>
                  <div style={styles.ticketInfo}>
                    {ticketDetails.quantity}x {ticketDetails.tierName} @ ₦{ticketDetails.unitPrice.toLocaleString()}
                  </div>
                </div>
                <div style={styles.totalAmount}>
                  Total: ₦{amount.toLocaleString()}
                </div>
              </div>

              <PaymentMethodSelector
                selectedMethod={paymentMethod}
                onMethodChange={setPaymentMethod}
                amount={amount}
                userWalletBalance={userWalletBalance}
              />

              <div style={styles.actions}>
                <button onClick={onClose} style={styles.cancelButton}>
                  Cancel
                </button>
                <button 
                  onClick={handlePayment} 
                  disabled={processing}
                  style={styles.payButton}
                >
                  {processing ? 'Processing...' : `Pay ₦${amount.toLocaleString()}`}
                </button>
              </div>
            </>
          )}

          {step === 'processing' && (
            <div style={styles.processingState}>
              <div style={styles.spinner}></div>
              <h3>Processing your payment...</h3>
              <p>Please wait while we confirm your payment.</p>
              {paymentMethod === 'bank_transfer' && (
                <div style={styles.bankDetails}>
                  <h4>Transfer to:</h4>
                  <p><strong>Bank:</strong> GTBank</p>
                  <p><strong>Account:</strong> 0123456789</p>
                  <p><strong>Amount:</strong> ₦{amount.toLocaleString()}</p>
                  <p><strong>Reference:</strong> {transactionRef}</p>
                </div>
              )}
              {paymentMethod === 'ussd' && (
                <div style={styles.ussdCode}>
                  <h4>Dial this code:</h4>
                  <p style={styles.code}>*737*000*{amount}*{transactionRef.slice(-6)}#</p>
                  <p>Follow the prompts to complete payment</p>
                </div>
              )}
            </div>
          )}

          {step === 'success' && (
            <div style={styles.successState}>
              <div style={styles.successIcon}>🎉</div>
              <h3>Payment Successful!</h3>
              <p>Your ticket has been purchased successfully.</p>
              <div style={styles.transactionDetails}>
                <p><strong>Reference:</strong> {transactionRef}</p>
                <p><strong>Amount:</strong> ₦{amount.toLocaleString()}</p>
                <p><strong>Method:</strong> {paymentMethod}</p>
              </div>
              <button onClick={onClose} style={styles.doneButton}>
                Done
              </button>
            </div>
          )}

          {step === 'error' && (
            <div style={styles.errorState}>
              <div style={styles.errorIcon}>❌</div>
              <h3>Payment Failed</h3>
              <p>There was an issue processing your payment. Please try again.</p>
              <div style={styles.actions}>
                <button onClick={() => setStep('method')} style={styles.retryButton}>
                  Try Again
                </button>
                <button onClick={onClose} style={styles.cancelButton}>
                  Cancel
                </button>
              </div>
            </div>
          )}
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
    backgroundColor: 'white',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '24px 24px 0 24px',
    borderBottom: '1px solid #e5e7eb',
    paddingBottom: '16px',
    marginBottom: '24px',
  },
  title: {
    margin: 0,
    fontSize: '20px',
    fontWeight: '700',
    color: '#1f2937',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#6b7280',
    padding: '4px',
    borderRadius: '4px',
  },
  content: {
    padding: '0 24px 24px 24px',
  },
  orderSummary: {
    backgroundColor: '#f9fafb',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '24px',
  },
  summaryTitle: {
    margin: '0 0 12px 0',
    fontSize: '16px',
    fontWeight: '600',
    color: '#374151',
  },
  eventInfo: {
    marginBottom: '12px',
  },
  eventTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '4px',
  },
  ticketInfo: {
    fontSize: '14px',
    color: '#6b7280',
  },
  totalAmount: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#059669',
    textAlign: 'right' as const,
  },
  actions: {
    display: 'flex',
    gap: '12px',
    marginTop: '24px',
  },
  cancelButton: {
    flex: 1,
    padding: '12px 24px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    backgroundColor: 'white',
    color: '#374151',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  payButton: {
    flex: 2,
    padding: '12px 24px',
    border: 'none',
    borderRadius: '8px',
    backgroundColor: '#667eea',
    color: 'white',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  processingState: {
    textAlign: 'center' as const,
    padding: '40px 20px',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #e5e7eb',
    borderTop: '4px solid #667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 20px auto',
  },
  bankDetails: {
    backgroundColor: '#f0f4ff',
    padding: '16px',
    borderRadius: '8px',
    marginTop: '20px',
    textAlign: 'left' as const,
  },
  ussdCode: {
    backgroundColor: '#f0f4ff',
    padding: '16px',
    borderRadius: '8px',
    marginTop: '20px',
  },
  code: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#667eea',
    fontFamily: 'monospace',
    backgroundColor: 'white',
    padding: '12px',
    borderRadius: '4px',
    border: '2px dashed #667eea',
  },
  successState: {
    textAlign: 'center' as const,
    padding: '40px 20px',
  },
  successIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  transactionDetails: {
    backgroundColor: '#f0fdf4',
    padding: '16px',
    borderRadius: '8px',
    marginTop: '20px',
    textAlign: 'left' as const,
  },
  doneButton: {
    padding: '12px 32px',
    border: 'none',
    borderRadius: '8px',
    backgroundColor: '#059669',
    color: 'white',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '20px',
  },
  errorState: {
    textAlign: 'center' as const,
    padding: '40px 20px',
  },
  errorIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  retryButton: {
    flex: 1,
    padding: '12px 24px',
    border: 'none',
    borderRadius: '8px',
    backgroundColor: '#667eea',
    color: 'white',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
  },
};

// Add CSS animation for spinner
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);