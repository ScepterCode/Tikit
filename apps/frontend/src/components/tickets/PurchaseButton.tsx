import React, { useState } from 'react';
import { PaymentModal } from '../payment/PaymentModal';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import { useNavigate } from 'react-router';

interface PurchaseButtonProps {
  eventId: string;
  eventTitle: string;
  tierName: string;
  unitPrice: number;
  quantity: number;
  totalAmount: number;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function PurchaseButton({
  eventId,
  eventTitle,
  tierName,
  unitPrice,
  quantity,
  totalAmount,
  disabled = false,
  className = '',
  style = {}
}: PurchaseButtonProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePurchaseClick = () => {
    if (!user) {
      // Redirect to login if not authenticated
      navigate('/login', { 
        state: { 
          returnTo: `/events/${eventId}`,
          message: 'Please log in to purchase tickets'
        }
      });
      return;
    }

    // Open payment modal
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = async (transactionData: any) => {
    setIsProcessing(true);
    
    try {
      // Create tickets after successful payment
      const response = await fetch('http://localhost:8000/api/tickets/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.access_token}`,
        },
        body: JSON.stringify({
          event_id: eventId,
          quantity: quantity,
          tier_name: tierName,
          payment_reference: transactionData.reference,
          transaction_id: transactionData.transaction_id,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Show success message
        alert(`🎉 Purchase successful! ${quantity} ticket(s) have been added to your account.`);
        
        // Navigate to tickets page
        navigate('/attendee/tickets');
      } else {
        throw new Error(data.error?.message || 'Failed to create tickets');
      }
    } catch (error) {
      console.error('Error creating tickets:', error);
      alert('Payment was successful, but there was an issue creating your tickets. Please contact support.');
    } finally {
      setIsProcessing(false);
      setShowPaymentModal(false);
    }
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
    alert(`Payment failed: ${error}`);
    setShowPaymentModal(false);
  };

  const handleCloseModal = () => {
    if (!isProcessing) {
      setShowPaymentModal(false);
    }
  };

  const defaultStyle = {
    padding: '12px 24px',
    border: 'none',
    borderRadius: '8px',
    backgroundColor: disabled ? '#d1d5db' : '#667eea',
    color: 'white',
    fontSize: '16px',
    fontWeight: '600',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    ...style
  };

  return (
    <>
      <button
        onClick={handlePurchaseClick}
        disabled={disabled || isProcessing}
        className={className}
        style={defaultStyle}
        onMouseEnter={(e) => {
          if (!disabled && !isProcessing) {
            e.currentTarget.style.backgroundColor = '#5a67d8';
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled && !isProcessing) {
            e.currentTarget.style.backgroundColor = '#667eea';
          }
        }}
      >
        {isProcessing ? (
          <>
            <div style={spinnerStyle}></div>
            Processing...
          </>
        ) : (
          <>
            🎫 Buy {quantity > 1 ? `${quantity} Tickets` : 'Ticket'} - ₦{totalAmount.toLocaleString()}
          </>
        )}
      </button>

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={handleCloseModal}
        onSuccess={handlePaymentSuccess}
        onError={handlePaymentError}
        amount={totalAmount}
        eventTitle={eventTitle}
        ticketDetails={{
          quantity,
          tierName,
          unitPrice
        }}
        eventId={eventId}
      />
    </>
  );
}

const spinnerStyle = {
  width: '16px',
  height: '16px',
  border: '2px solid transparent',
  borderTop: '2px solid white',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
};

// Add spinner animation if not already present
if (!document.querySelector('#spinner-animation')) {
  const style = document.createElement('style');
  style.id = 'spinner-animation';
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}