import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { PaymentMethodSelector, PaymentMethod } from '../components/tickets/PaymentMethodSelector';
import { PaymentErrorHandler } from '../components/tickets/PaymentErrorHandler';

interface CheckoutItem {
  tierId: string;
  quantity: number;
  price: number;
  tierName?: string;
}

interface PurchaseData {
  eventId: string;
  items: CheckoutItem[];
  paymentMethod: string;
  groupBuyId?: string;
}

interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}

export function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [purchaseData, setPurchaseData] = useState<PurchaseData | null>(null);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('wallet');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [step, setStep] = useState<'review' | 'payment' | 'processing' | 'success' | 'error'>('review');

  useEffect(() => {
    const data = location.state?.purchaseData;
    if (!data) {
      navigate('/events');
      return;
    }
    setPurchaseData(data);
  }, [location.state, navigate]);

  const calculateTotal = () => {
    if (!purchaseData) return 0;
    return purchaseData.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const calculateFees = (subtotal: number) => {
    const processingFee = Math.round(subtotal * 0.015); // 1.5% processing fee
    const serviceFee = 100; // Fixed service fee
    return { processingFee, serviceFee };
  };

  const handlePayment = async () => {
    if (!purchaseData || !user) return;

    setLoading(true);
    setStep('processing');
    setPaymentError(null);

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock payment logic
      const total = calculateTotal();
      const { processingFee, serviceFee } = calculateFees(total);
      const finalAmount = total + processingFee + serviceFee;

      // Simulate different payment outcomes
      const paymentResult = await mockPaymentProcess(paymentMethod, finalAmount);

      if (paymentResult.success) {
        // Create tickets
        await createTickets(paymentResult.transactionId!);
        setStep('success');
      } else {
        setPaymentError(paymentResult.error || 'Payment failed');
        setStep('error');
      }
    } catch (error) {
      setPaymentError('An unexpected error occurred');
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  const mockPaymentProcess = async (method: PaymentMethod, amount: number): Promise<PaymentResult> => {
    // Simulate different payment scenarios
    if (method === 'wallet') {
      // Check wallet balance (mock)
      const walletBalance = user?.walletBalance || 0;
      if (walletBalance < amount) {
        return { success: false, error: 'Insufficient wallet balance' };
      }
      return { success: true, transactionId: `TXN_${Date.now()}` };
    }

    if (method === 'card') {
      // Simulate card payment (90% success rate)
      const success = Math.random() > 0.1;
      return success 
        ? { success: true, transactionId: `CARD_${Date.now()}` }
        : { success: false, error: 'Card payment declined' };
    }

    if (method === 'bank_transfer') {
      // Bank transfer always succeeds in mock
      return { success: true, transactionId: `BANK_${Date.now()}` };
    }

    return { success: false, error: 'Invalid payment method' };
  };

  const createTickets = async (transactionId: string) => {
    // Mock ticket creation
    console.log('Creating tickets for transaction:', transactionId);
    // In real implementation, this would call the backend API
  };

  const handleRetryPayment = () => {
    setStep('payment');
    setPaymentError(null);
  };

  const handleGoToTickets = () => {
    navigate('/attendee/tickets');
  };

  if (!purchaseData) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner}></div>
        <p>Loading checkout...</p>
      </div>
    );
  }

  const subtotal = calculateTotal();
  const { processingFee, serviceFee } = calculateFees(subtotal);
  const total = subtotal + processingFee + serviceFee;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={() => navigate(-1)} style={styles.backButton}>
          ← Back
        </button>
        <h1 style={styles.title}>Checkout</h1>
      </div>

      <div style={styles.content}>
        {/* Order Summary */}
        <div style={styles.orderSummary}>
          <h2>Order Summary</h2>
          
          <div style={styles.items}>
            {purchaseData.items.map((item, index) => (
              <div key={index} style={styles.item}>
                <div style={styles.itemInfo}>
                  <span style={styles.itemName}>{item.tierName || `Tier ${item.tierId}`}</span>
                  <span style={styles.itemQuantity}>Qty: {item.quantity}</span>
                </div>
                <span style={styles.itemPrice}>₦{(item.price * item.quantity).toLocaleString()}</span>
              </div>
            ))}
          </div>

          <div style={styles.fees}>
            <div style={styles.feeItem}>
              <span>Subtotal</span>
              <span>₦{subtotal.toLocaleString()}</span>
            </div>
            <div style={styles.feeItem}>
              <span>Processing Fee (1.5%)</span>
              <span>₦{processingFee.toLocaleString()}</span>
            </div>
            <div style={styles.feeItem}>
              <span>Service Fee</span>
              <span>₦{serviceFee.toLocaleString()}</span>
            </div>
            <div style={styles.totalItem}>
              <span>Total</span>
              <span>₦{total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Payment Section */}
        <div style={styles.paymentSection}>
          {step === 'review' && (
            <div>
              <h2>Review & Pay</h2>
              <div style={styles.userInfo}>
                <h3>Billing Information</h3>
                <p><strong>Name:</strong> {user?.firstName} {user?.lastName}</p>
                <p><strong>Phone:</strong> {user?.phoneNumber}</p>
                <p><strong>Email:</strong> {user?.email || 'Not provided'}</p>
              </div>
              
              <button 
                onClick={() => setStep('payment')} 
                style={styles.continueButton}
              >
                Continue to Payment
              </button>
            </div>
          )}

          {step === 'payment' && (
            <div>
              <h2>Payment Method</h2>
              <PaymentMethodSelector
                selectedMethod={paymentMethod}
                onMethodChange={setPaymentMethod}
                amount={total}
                userWalletBalance={user?.walletBalance || 0}
              />
              
              <button 
                onClick={handlePayment}
                disabled={loading}
                style={styles.payButton}
              >
                {loading ? 'Processing...' : `Pay ₦${total.toLocaleString()}`}
              </button>
            </div>
          )}

          {step === 'processing' && (
            <div style={styles.processing}>
              <div style={styles.spinner}></div>
              <h2>Processing Payment</h2>
              <p>Please wait while we process your payment...</p>
            </div>
          )}

          {step === 'success' && (
            <div style={styles.success}>
              <div style={styles.successIcon}>✅</div>
              <h2>Payment Successful!</h2>
              <p>Your tickets have been purchased successfully.</p>
              <div style={styles.successActions}>
                <button onClick={handleGoToTickets} style={styles.primaryButton}>
                  View My Tickets
                </button>
                <button onClick={() => navigate('/events')} style={styles.secondaryButton}>
                  Browse More Events
                </button>
              </div>
            </div>
          )}

          {step === 'error' && (
            <div style={styles.error}>
              <PaymentErrorHandler
                error={paymentError || 'Payment failed'}
                onRetry={handleRetryPayment}
                onCancel={() => navigate('/events')}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  loading: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    height: '50vh',
    gap: '16px',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  header: {
    marginBottom: '32px',
  },
  backButton: {
    background: 'none',
    border: '1px solid #ddd',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    marginBottom: '16px',
    fontSize: '14px',
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1f2937',
    margin: '0',
  },
  content: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '32px',
  },
  orderSummary: {
    backgroundColor: '#f9fafb',
    padding: '24px',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
  },
  items: {
    marginBottom: '24px',
  },
  item: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px solid #e5e7eb',
  },
  itemInfo: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  itemName: {
    fontWeight: '500',
    color: '#1f2937',
  },
  itemQuantity: {
    fontSize: '14px',
    color: '#6b7280',
  },
  itemPrice: {
    fontWeight: '600',
    color: '#1f2937',
  },
  fees: {
    borderTop: '2px solid #e5e7eb',
    paddingTop: '16px',
  },
  feeItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    fontSize: '14px',
    color: '#6b7280',
  },
  totalItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 0',
    fontSize: '18px',
    fontWeight: '700',
    color: '#1f2937',
    borderTop: '1px solid #e5e7eb',
    marginTop: '8px',
  },
  paymentSection: {
    backgroundColor: 'white',
    padding: '24px',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
  },
  userInfo: {
    marginBottom: '24px',
    padding: '16px',
    backgroundColor: '#f3f4f6',
    borderRadius: '8px',
  },
  continueButton: {
    width: '100%',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    padding: '16px',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  payButton: {
    width: '100%',
    backgroundColor: '#059669',
    color: 'white',
    border: 'none',
    padding: '16px',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '24px',
  },
  processing: {
    textAlign: 'center' as const,
    padding: '40px',
  },
  success: {
    textAlign: 'center' as const,
    padding: '40px',
  },
  successIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  successActions: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center',
    marginTop: '24px',
  },
  primaryButton: {
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  secondaryButton: {
    backgroundColor: 'white',
    color: '#667eea',
    border: '1px solid #667eea',
    padding: '12px 24px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  error: {
    // Styles handled by PaymentErrorHandler component
  },
};