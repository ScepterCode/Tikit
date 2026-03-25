import { useState } from 'react';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/SupabaseAuthContext';

interface SprayMoneyWidgetProps {
  eventId: string;
  onSuccess?: () => void;
  compact?: boolean;
}

export function SprayMoneyWidget({ eventId, onSuccess, compact = false }: SprayMoneyWidgetProps) {
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const quickAmounts = [500, 1000, 2000, 5000, 10000];

  const handleSpray = async (sprayAmount?: number) => {
    if (!user) {
      alert('Please login to spray money');
      return;
    }

    const finalAmount = sprayAmount || parseInt(amount);
    
    if (!finalAmount || finalAmount < 100) {
      alert('Minimum spray amount is ₦100');
      return;
    }

    if (finalAmount > 1000000) {
      alert('Maximum spray amount is ₦1,000,000');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiService.request(`/events/${eventId}/spray-money`, {
        method: 'POST',
        body: {
          amount: finalAmount,
          message: message,
          is_anonymous: isAnonymous
        }
      });

      if (response.data.success) {
        alert(`Successfully sprayed ₦${finalAmount.toLocaleString()}! 🎉`);
        setAmount('');
        setMessage('');
        setShowForm(false);
        if (onSuccess) {
          onSuccess();
        }
      } else {
        throw new Error('Failed to spray money');
      }
    } catch (error: any) {
      console.error('Error spraying money:', error);
      const errorMessage = error.response?.data?.error?.message || 'Failed to spray money';
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (compact) {
    return (
      <div style={styles.compactContainer}>
        <div style={styles.quickButtons}>
          {quickAmounts.map(amt => (
            <button
              key={amt}
              onClick={() => handleSpray(amt)}
              disabled={isSubmitting || !user}
              style={{
                ...styles.quickButton,
                ...(isSubmitting ? styles.disabledButton : {})
              }}
            >
              💸 ₦{(amt / 1000).toFixed(0)}k
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          disabled={!user}
          style={{
            ...styles.mainButton,
            ...(!user ? styles.disabledButton : {})
          }}
        >
          💸 Spray Money
        </button>
      ) : (
        <div style={styles.form}>
          <div style={styles.formHeader}>
            <h3 style={styles.formTitle}>Spray Money</h3>
            <button
              onClick={() => setShowForm(false)}
              style={styles.closeButton}
            >
              ✕
            </button>
          </div>

          <div style={styles.quickAmountsSection}>
            <label style={styles.label}>Quick amounts:</label>
            <div style={styles.quickButtonsGrid}>
              {quickAmounts.map(amt => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setAmount(amt.toString())}
                  style={{
                    ...styles.quickAmountButton,
                    ...(amount === amt.toString() ? styles.selectedAmount : {})
                  }}
                >
                  ₦{amt.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          <div style={styles.formField}>
            <label style={styles.label}>Custom Amount (₦):</label>
            <input
              type="number"
              min="100"
              max="1000000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              style={styles.input}
            />
          </div>

          <div style={styles.formField}>
            <label style={styles.label}>Message (optional):</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Congratulations! 🎉"
              maxLength={200}
              style={styles.textarea}
            />
          </div>

          <div style={styles.checkboxField}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                style={styles.checkbox}
              />
              <span>Spray anonymously</span>
            </label>
          </div>

          <button
            onClick={() => handleSpray()}
            disabled={isSubmitting || !amount}
            style={{
              ...styles.submitButton,
              ...(isSubmitting || !amount ? styles.disabledButton : {})
            }}
          >
            {isSubmitting ? 'Processing...' : `Spray ₦${parseInt(amount || '0').toLocaleString()}`}
          </button>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  compactContainer: {
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  mainButton: {
    width: '100%',
    backgroundColor: '#059669',
    color: 'white',
    border: 'none',
    padding: '14px 20px',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  quickButtons: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap' as const,
  },
  quickButton: {
    backgroundColor: '#059669',
    color: 'white',
    border: 'none',
    padding: '10px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  form: {
    backgroundColor: '#f9fafb',
    padding: '20px',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
  },
  formHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  formTitle: {
    margin: '0',
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    color: '#6b7280',
    padding: '0',
    width: '24px',
    height: '24px',
  },
  quickAmountsSection: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
  },
  quickButtonsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px',
  },
  quickAmountButton: {
    padding: '10px',
    border: '1px solid #d1d5db',
    backgroundColor: 'white',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  selectedAmount: {
    backgroundColor: '#059669',
    color: 'white',
    borderColor: '#059669',
  },
  formField: {
    marginBottom: '16px',
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '16px',
    boxSizing: 'border-box' as const,
  },
  textarea: {
    width: '100%',
    padding: '12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    minHeight: '60px',
    resize: 'vertical' as const,
    boxSizing: 'border-box' as const,
  },
  checkboxField: {
    marginBottom: '16px',
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
    width: '16px',
    height: '16px',
    cursor: 'pointer',
  },
  submitButton: {
    width: '100%',
    backgroundColor: '#059669',
    color: 'white',
    border: 'none',
    padding: '14px',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  disabledButton: {
    backgroundColor: '#d1d5db',
    cursor: 'not-allowed',
  },
};
