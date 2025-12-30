import { useState } from 'react';

export interface PaymentError {
  code: string;
  message: string;
  details?: any;
}

interface PaymentErrorHandlerProps {
  error: string;
  onRetry: () => void;
  onCancel: () => void;
}

export function PaymentErrorHandler({ error, onRetry, onCancel }: PaymentErrorHandlerProps) {
  const [showDetails, setShowDetails] = useState(false);

  const getErrorSuggestion = (error: string): string => {
    if (error.toLowerCase().includes('insufficient')) {
      return 'Try using a different payment method or add funds to your wallet.';
    }
    if (error.toLowerCase().includes('declined')) {
      return 'Please check your card details or try a different card.';
    }
    if (error.toLowerCase().includes('network') || error.toLowerCase().includes('timeout')) {
      return 'Please check your internet connection and try again.';
    }
    if (error.toLowerCase().includes('expired')) {
      return 'Your session may have expired. Please try again.';
    }
    return 'Please try again or contact support if the problem persists.';
  };

  return (
    <div style={styles.container}>
      <div style={styles.errorCard}>
        <div style={styles.errorIcon}>❌</div>
        
        <div style={styles.errorContent}>
          <h3 style={styles.errorTitle}>Payment Failed</h3>
          <p style={styles.errorMessage}>{error}</p>
          <p style={styles.errorSuggestion}>{getErrorSuggestion(error)}</p>
        </div>

        <div style={styles.actions}>
          <button
            onClick={onRetry}
            style={styles.retryButton}
          >
            Try Again
          </button>
          <button
            onClick={onCancel}
            style={styles.cancelButton}
          >
            Cancel
          </button>
        </div>

        <button
          onClick={() => setShowDetails(!showDetails)}
          style={styles.detailsToggle}
        >
          {showDetails ? 'Hide' : 'Show'} Details
        </button>

        {showDetails && (
          <div style={styles.errorDetails}>
            <h4>Error Details:</h4>
            <p style={styles.detailsText}>{error}</p>
            <p style={styles.timestamp}>
              Time: {new Date().toLocaleString()}
            </p>
          </div>
        )}
      </div>

      <div style={styles.helpSection}>
        <p style={styles.helpText}>
          Still having trouble? <a href="/support" style={styles.helpLink}>Contact Support</a>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '500px',
    margin: '0 auto',
    padding: '20px',
  },
  errorCard: {
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '12px',
    padding: '24px',
    textAlign: 'center' as const,
    marginBottom: '16px',
  },
  errorIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  errorContent: {
    marginBottom: '24px',
  },
  errorTitle: {
    margin: '0 0 12px 0',
    fontSize: '20px',
    fontWeight: '600',
    color: '#dc2626',
  },
  errorMessage: {
    margin: '0 0 12px 0',
    fontSize: '16px',
    color: '#374151',
    lineHeight: '1.5',
  },
  errorSuggestion: {
    margin: '0',
    fontSize: '14px',
    color: '#6b7280',
    fontStyle: 'italic',
  },
  actions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
    marginBottom: '16px',
  },
  retryButton: {
    backgroundColor: '#059669',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  cancelButton: {
    backgroundColor: 'white',
    color: '#6b7280',
    border: '1px solid #d1d5db',
    padding: '12px 24px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  detailsToggle: {
    backgroundColor: 'transparent',
    color: '#6b7280',
    border: 'none',
    fontSize: '12px',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
  errorDetails: {
    marginTop: '16px',
    padding: '16px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    textAlign: 'left' as const,
  },
  detailsText: {
    margin: '8px 0',
    fontSize: '12px',
    color: '#374151',
    fontFamily: 'monospace',
  },
  timestamp: {
    margin: '8px 0 0 0',
    fontSize: '12px',
    color: '#6b7280',
  },
  helpSection: {
    textAlign: 'center' as const,
    padding: '16px',
    backgroundColor: '#f3f4f6',
    borderRadius: '8px',
  },
  helpText: {
    margin: '0',
    fontSize: '14px',
    color: '#6b7280',
  },
  helpLink: {
    color: '#667eea',
    textDecoration: 'none',
    fontWeight: '600',
  },
};
