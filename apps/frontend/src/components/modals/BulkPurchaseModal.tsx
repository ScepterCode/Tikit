import { useState } from 'react';
import { authenticatedFetch } from '../../utils/auth';

interface BulkPurchaseModalProps {
  event: any;
  onClose: () => void;
  onSuccess: (purchaseData: any) => void;
}

export function BulkPurchaseModal({ event, onClose, onSuccess }: BulkPurchaseModalProps) {
  const [formData, setFormData] = useState({
    quantity: 10,
    buyerType: 'individual',
    organizationName: '',
    enableSplitPayment: true,
  });
  const [loading, setLoading] = useState(false);

  const ticketPrice = event.ticket_price || 0;
  const totalAmount = ticketPrice * formData.quantity;
  
  // Calculate discount
  let discountPercentage = 0;
  if (formData.quantity >= 21) discountPercentage = 15;
  else if (formData.quantity >= 11) discountPercentage = 10;
  else if (formData.quantity >= 6) discountPercentage = 5;
  
  const discountAmount = totalAmount * (discountPercentage / 100);
  const finalAmount = totalAmount - discountAmount;
  const perPersonAmount = finalAmount / formData.quantity;

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await authenticatedFetch('http://localhost:8000/api/tickets/bulk-purchase', {
        method: 'POST',
        body: JSON.stringify({
          event_id: event.id,
          quantity: formData.quantity,
          buyer_type: formData.buyerType,
          organization_name: formData.buyerType === 'organization' ? formData.organizationName : undefined,
          enable_split_payment: formData.enableSplitPayment
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        onSuccess(data.data);
        onClose();
      } else {
        alert(`Failed to create bulk purchase: ${data.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating bulk purchase:', error);
      alert('Failed to create bulk purchase. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>🎫 Bulk Purchase</h2>
          <button style={styles.closeButton} onClick={onClose}>✕</button>
        </div>

        <div style={styles.eventInfo}>
          <h3 style={styles.eventTitle}>{event.title}</h3>
          <p style={styles.eventDetail}>Ticket Price: ₦{ticketPrice.toLocaleString()}</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Number of Tickets *</label>
            <input
              type="number"
              value={formData.quantity}
              onChange={(e) => handleChange('quantity', parseInt(e.target.value) || 1)}
              style={styles.input}
              min="1"
              required
            />
            <p style={styles.hint}>
              {formData.quantity >= 6 && `🎉 ${discountPercentage}% bulk discount applied!`}
              {formData.quantity < 6 && '💡 Buy 6+ tickets to get a discount'}
            </p>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Buyer Type *</label>
            <select
              value={formData.buyerType}
              onChange={(e) => handleChange('buyerType', e.target.value)}
              style={styles.select}
            >
              <option value="individual">Individual</option>
              <option value="organization">Organization</option>
            </select>
          </div>

          {formData.buyerType === 'organization' && (
            <div style={styles.formGroup}>
              <label style={styles.label}>Organization Name *</label>
              <input
                type="text"
                value={formData.organizationName}
                onChange={(e) => handleChange('organizationName', e.target.value)}
                style={styles.input}
                placeholder="Enter organization name"
                required
              />
            </div>
          )}

          <div style={styles.formGroup}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.enableSplitPayment}
                onChange={(e) => handleChange('enableSplitPayment', e.target.checked)}
                style={styles.checkbox}
              />
              <span>Enable split payment (share cost with others)</span>
            </label>
            <p style={styles.hint}>
              {formData.enableSplitPayment 
                ? 'You\'ll get shareable payment links for each ticket'
                : 'You\'ll pay the full amount now'}
            </p>
          </div>

          <div style={styles.summary}>
            <h3 style={styles.summaryTitle}>Order Summary</h3>
            <div style={styles.summaryRow}>
              <span>Tickets ({formData.quantity}x)</span>
              <span>₦{totalAmount.toLocaleString()}</span>
            </div>
            {discountPercentage > 0 && (
              <div style={styles.summaryRow}>
                <span>Bulk Discount ({discountPercentage}%)</span>
                <span style={styles.discount}>-₦{discountAmount.toLocaleString()}</span>
              </div>
            )}
            <div style={styles.summaryTotal}>
              <span>Total</span>
              <span>₦{finalAmount.toLocaleString()}</span>
            </div>
            {formData.enableSplitPayment && (
              <div style={styles.perPerson}>
                <span>Per person</span>
                <span>₦{perPersonAmount.toLocaleString()}</span>
              </div>
            )}
          </div>

          <div style={styles.buttonGroup}>
            <button
              type="button"
              onClick={onClose}
              style={styles.cancelButton}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={styles.submitButton}
              disabled={loading}
            >
              {loading ? 'Processing...' : formData.enableSplitPayment ? 'Create & Get Links' : 'Purchase Now'}
            </button>
          </div>
        </form>
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
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '24px',
    maxWidth: '600px',
    width: '90%',
    maxHeight: '90vh',
    overflow: 'auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1f2937',
    margin: 0,
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#6b7280',
    padding: '4px',
  },
  eventInfo: {
    backgroundColor: '#f9fafb',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '24px',
  },
  eventTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '8px',
  },
  eventDetail: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0,
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
  },
  input: {
    padding: '12px',
    fontSize: '14px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    backgroundColor: '#ffffff',
  },
  select: {
    padding: '12px',
    fontSize: '14px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    backgroundColor: '#ffffff',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#374151',
    cursor: 'pointer',
  },
  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
  },
  hint: {
    fontSize: '12px',
    color: '#6b7280',
    margin: 0,
  },
  summary: {
    backgroundColor: '#f9fafb',
    padding: '16px',
    borderRadius: '8px',
    marginTop: '8px',
  },
  summaryTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '12px',
  },
  summaryRow: {
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
  summaryTotal: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
    paddingTop: '12px',
    borderTop: '1px solid #e5e7eb',
    marginTop: '8px',
  },
  perPerson: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '14px',
    color: '#667eea',
    fontWeight: '500',
    marginTop: '8px',
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '8px',
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
  submitButton: {
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
