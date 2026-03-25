import { useState } from 'react';
import { authenticatedFetch } from '../../utils/auth';

interface AccessCodeModalProps {
  onClose: () => void;
  onSuccess: (event: any) => void;
}

export function AccessCodeModal({ onClose, onSuccess }: AccessCodeModalProps) {
  const [accessCode, setAccessCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (accessCode.length !== 4) {
      setError('Access code must be 4 digits');
      return;
    }

    setLoading(true);
    
    try {
      const response = await authenticatedFetch('http://localhost:8000/api/events/validate-access-code', {
        method: 'POST',
        body: JSON.stringify({ access_code: accessCode })
      });
      
      const data = await response.json();
      
      if (data.success && data.data) {
        onSuccess(data.data);
        onClose();
      } else {
        setError(data.error?.message || 'Invalid access code');
      }
    } catch (error) {
      console.error('Error validating access code:', error);
      setError('Failed to validate access code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>🔐 Enter Access Code</h2>
          <button style={styles.closeButton} onClick={onClose}>✕</button>
        </div>

        <p style={styles.description}>
          Have a secret invite? Enter the 4-digit access code to unlock the hidden event.
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Access Code</label>
            <input
              type="text"
              value={accessCode}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                setAccessCode(value);
                setError('');
              }}
              style={styles.input}
              placeholder="Enter 4-digit code"
              maxLength={4}
              autoFocus
              required
            />
            {error && <p style={styles.error}>{error}</p>}
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
              disabled={loading || accessCode.length !== 4}
            >
              {loading ? 'Validating...' : 'Unlock Event'}
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
    padding: '32px',
    maxWidth: '450px',
    width: '90%',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
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
  description: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '24px',
    lineHeight: '1.5',
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
    padding: '16px',
    fontSize: '24px',
    fontWeight: 'bold',
    textAlign: 'center' as const,
    border: '2px solid #d1d5db',
    borderRadius: '8px',
    backgroundColor: '#ffffff',
    letterSpacing: '8px',
  },
  error: {
    fontSize: '14px',
    color: '#dc2626',
    margin: 0,
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
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
    opacity: 1,
  },
};
