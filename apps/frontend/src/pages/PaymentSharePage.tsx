import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authenticatedFetch } from '../utils/auth';

export function PaymentSharePage() {
  const { purchaseId, shareId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [purchaseData, setPurchaseData] = useState<any>(null);
  const [shareData, setShareData] = useState<any>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPurchaseData();
  }, [purchaseId]);

  const fetchPurchaseData = async () => {
    try {
      const response = await fetch(
        `http://localhost:8000/api/tickets/bulk-purchase/${purchaseId}`
      );
      
      const data = await response.json();
      
      if (data.success) {
        setPurchaseData(data.data.bulk_purchase);
        
        // Find the specific share
        const share = data.data.shares.find((s: any) => s.id === shareId);
        setShareData(share);
        
        if (!share) {
          setError('Payment link not found');
        } else if (share.status === 'paid') {
          setError('This payment link has already been used');
        }
      } else {
        setError('Bulk purchase not found');
      }
    } catch (error) {
      console.error('Error fetching purchase data:', error);
      setError('Failed to load payment information');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    setProcessing(true);
    setError('');
    
    try {
      const response = await authenticatedFetch(
        `http://localhost:8000/api/tickets/bulk-purchase/${purchaseId}/pay-share`,
        {
          method: 'POST',
          body: JSON.stringify({
            share_id: shareId,
            payment_method: 'wallet'
          })
        }
      );
      
      const data = await response.json();
      
      if (data.success) {
        alert('Payment successful! Your ticket will be issued once all payments are complete.');
        navigate('/attendee/tickets');
      } else {
        setError(data.error?.message || 'Payment failed');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      setError('Failed to process payment. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.errorCard}>
          <div style={styles.errorIcon}>⚠️</div>
          <h2 style={styles.errorTitle}>Oops!</h2>
          <p style={styles.errorMessage}>{error}</p>
          <button onClick={() => navigate('/')} style={styles.homeButton}>
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  if (!purchaseData || !shareData) {
    return null;
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.logo}>🎵 Grooovy</h1>
        </div>

        <div style={styles.content}>
          <h2 style={styles.title}>🎫 Group Ticket Payment</h2>
          <p style={styles.subtitle}>
            You've been invited to join a group ticket purchase!
          </p>

          <div style={styles.eventInfo}>
            <h3 style={styles.eventTitle}>{purchaseData.event_title}</h3>
            <div style={styles.eventDetails}>
              <div style={styles.eventDetail}>
                <span style={styles.detailLabel}>Your Share:</span>
                <span style={styles.detailValue}>
                  Ticket #{shareData.share_number}
                </span>
              </div>
              <div style={styles.eventDetail}>
                <span style={styles.detailLabel}>Amount:</span>
                <span style={styles.amount}>
                  ₦{shareData.amount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div style={styles.groupInfo}>
            <h4 style={styles.groupTitle}>Group Purchase Details</h4>
            <div style={styles.groupDetail}>
              <span>Total Tickets:</span>
              <span>{purchaseData.quantity}</span>
            </div>
            <div style={styles.groupDetail}>
              <span>Organized by:</span>
              <span>{purchaseData.buyer_name}</span>
            </div>
            {purchaseData.discount_percentage > 0 && (
              <div style={styles.groupDetail}>
                <span>Bulk Discount:</span>
                <span style={styles.discount}>
                  {purchaseData.discount_percentage}% off
                </span>
              </div>
            )}
          </div>

          <div style={styles.paymentSection}>
            <h4 style={styles.paymentTitle}>Payment Method</h4>
            <div style={styles.paymentMethod}>
              <div style={styles.methodIcon}>💰</div>
              <div style={styles.methodInfo}>
                <div style={styles.methodName}>Wallet</div>
                <div style={styles.methodDesc}>Pay from your Grooovy wallet</div>
              </div>
            </div>
          </div>

          <button
            onClick={handlePayment}
            disabled={processing}
            style={styles.payButton}
          >
            {processing ? 'Processing...' : `Pay ₦${shareData.amount.toLocaleString()}`}
          </button>

          <p style={styles.note}>
            💡 Your ticket will be issued once all group members complete their payments.
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f9fafb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  loading: {
    fontSize: '18px',
    color: '#6b7280',
  },
  errorCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '48px',
    maxWidth: '500px',
    textAlign: 'center' as const,
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },
  errorIcon: {
    fontSize: '64px',
    marginBottom: '16px',
  },
  errorTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '12px',
  },
  errorMessage: {
    fontSize: '16px',
    color: '#6b7280',
    marginBottom: '24px',
  },
  homeButton: {
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '600',
    backgroundColor: '#667eea',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    maxWidth: '600px',
    width: '100%',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
  },
  header: {
    backgroundColor: '#667eea',
    padding: '24px',
    textAlign: 'center' as const,
  },
  logo: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#ffffff',
    margin: 0,
  },
  content: {
    padding: '32px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '8px',
    textAlign: 'center' as const,
  },
  subtitle: {
    fontSize: '16px',
    color: '#6b7280',
    marginBottom: '32px',
    textAlign: 'center' as const,
  },
  eventInfo: {
    backgroundColor: '#f9fafb',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '24px',
  },
  eventTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '16px',
  },
  eventDetails: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  eventDetail: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: '14px',
    color: '#6b7280',
  },
  detailValue: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
  },
  amount: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#667eea',
  },
  groupInfo: {
    backgroundColor: '#f9fafb',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '24px',
  },
  groupTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '12px',
  },
  groupDetail: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '14px',
    color: '#374151',
    marginBottom: '8px',
  },
  discount: {
    color: '#10b981',
    fontWeight: '600',
  },
  paymentSection: {
    marginBottom: '24px',
  },
  paymentTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '12px',
  },
  paymentMethod: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    border: '2px solid #667eea',
  },
  methodIcon: {
    fontSize: '32px',
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
  },
  methodDesc: {
    fontSize: '14px',
    color: '#6b7280',
  },
  payButton: {
    width: '100%',
    padding: '16px',
    fontSize: '16px',
    fontWeight: '600',
    backgroundColor: '#667eea',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    marginBottom: '16px',
  },
  note: {
    fontSize: '14px',
    color: '#6b7280',
    textAlign: 'center' as const,
    lineHeight: '1.5',
  },
};
