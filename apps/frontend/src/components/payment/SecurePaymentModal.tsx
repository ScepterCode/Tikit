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

interface FlutterwaveResponse {
  transaction_id: string;
  tx_ref: string;
  flw_ref: string;
  status: string;
}

declare global {
  interface Window {
    FlutterwaveCheckout: (options: any) => void;
  }
}

export function SecurePaymentModal({
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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [processing, setProcessing] = useState(false);
  const [userWalletBalance, setUserWalletBalance] = useState(0);
  const [step, setStep] = useState<'method' | 'processing' | 'success' | 'error'>('method');
  const [transactionRef, setTransactionRef] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      // Load Flutterwave script
      const script = document.createElement('script');
      script.src = 'https://checkout.flutterwave.com/v3.js';
      script.async = true;
      document.body.appendChild(script);

      // Fetch user wallet balance
      fetchWalletBalance();

      return () => {
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
      };
    }
  }, [isOpen]);

  const fetchWalletBalance = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/wallet/balance`, {
        headers: {
          'Authorization': `Bearer ${user?.session?.access_token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setUserWalletBalance(data.balance);
      }
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
      setUserWalletBalance(0);
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
          await handleFlutterwavePayment(reference);
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
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/payments/wallet`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user?.session?.access_token}`,
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

  const handleFlutterwavePayment = async (reference: string) => {
    // Support multiple credential formats - use what the user has configured
    const flutterwaveKey = (
      import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY || 
      import.meta.env.VITE_FLUTTERWAVE_CLIENT_ID ||
      import.meta.env.VITE_FLUTTERWAVE_LIVE_PUBLIC_KEY
    );
    
    if (!flutterwaveKey) {
      throw new Error('Payment system not configured');
    }
    
    // Flutterwave Inline payment - handles everything client-side
    window.FlutterwaveCheckout({
      public_key: flutterwaveKey,
      tx_ref: reference,
      amount: amount,
      currency: 'NGN',
      payment_options: 'card,mobilemoney,ussd,banktransfer',
      customer: {
        email: user?.email,
        phone_number: user?.phoneNumber || '',
        name: `${user?.firstName} ${user?.lastName}`,
      },
      customizations: {
        title: 'Grooovy Ticket Purchase',
        description: `${ticketDetails.quantity}x ${ticketDetails.tierName} - ${eventTitle}`,
        logo: '',
      },
      meta: {
        event_id: eventId,
        user_id: user?.id,
        ticket_quantity: ticketDetails.quantity,
        ticket_tier: ticketDetails.tierName,
      },
      callback: async (response: FlutterwaveResponse) => {
        if (response.status === 'successful') {
          // Payment successful - verify on backend
          await verifyPayment(response.transaction_id, reference);
        } else {
          setProcessing(false);
          onError('Payment was not successful');
        }
      },
      onclose: () => {
        setProcessing(false);
        onError('Payment cancelled');
      },
    });
  };

  const verifyPayment = async (transactionId: string, txRef: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/payments/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.session?.access_token}`,
        },
        body: JSON.stringify({ 
          transaction_id: transactionId,
          tx_ref: txRef 
        }),
      });

      const data = await response.json();
      
      if (data.success && (data.status === 'successful' || data.verification_method === 'inline')) {
        setStep('success');
        onSuccess({
          reference: txRef,
          method: 'flutterwave',
          amount,
          transaction_id: transactionId,
          flw_ref: data.flw_ref,
          verification_method: data.verification_method || 'api'
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

              <div style={styles.securityNotice}>
                🔒 Your payment is secured with 256-bit SSL encryption
              </div>

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
  securityNotice: {
    backgroundColor: '#f0f9ff',
    color: '#0369a1',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '14px',
    textAlign: 'center' as const,
    marginBottom: '24px',
    border: '1px solid #bae6fd',
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