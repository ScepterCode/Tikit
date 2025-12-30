import React from 'react';

export type PaymentMethod = 'wallet' | 'card' | 'bank_transfer' | 'ussd' | 'airtime';

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethod;
  onMethodChange: (method: PaymentMethod) => void;
  amount: number;
  userWalletBalance: number;
}

export function PaymentMethodSelector({ 
  selectedMethod, 
  onMethodChange, 
  amount, 
  userWalletBalance 
}: PaymentMethodSelectorProps) {
  const paymentMethods = [
    {
      id: 'wallet' as PaymentMethod,
      name: 'Wallet',
      description: `Balance: ₦${userWalletBalance.toLocaleString()}`,
      icon: '💳',
      available: userWalletBalance >= amount,
      fee: 0,
    },
    {
      id: 'card' as PaymentMethod,
      name: 'Debit/Credit Card',
      description: 'Visa, Mastercard, Verve',
      icon: '💳',
      available: true,
      fee: Math.round(amount * 0.015), // 1.5% fee
    },
    {
      id: 'bank_transfer' as PaymentMethod,
      name: 'Bank Transfer',
      description: 'Direct bank transfer',
      icon: '🏦',
      available: true,
      fee: 50, // Fixed fee
    },
    {
      id: 'ussd' as PaymentMethod,
      name: 'USSD',
      description: 'Pay with *737# or *901#',
      icon: '📱',
      available: true,
      fee: 0,
    },
    {
      id: 'airtime' as PaymentMethod,
      name: 'Airtime',
      description: 'Pay with airtime balance',
      icon: '📞',
      available: amount <= 10000, // Airtime payments limited to ₦10,000
      fee: Math.round(amount * 0.05), // 5% fee for airtime
    },
  ];

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Payment Method</h3>
      
      <div style={styles.methodsList}>
        {paymentMethods.map(method => {
          const totalAmount = amount + method.fee;
          const isSelected = selectedMethod === method.id;
          const canSelect = method.available;

          return (
            <label
              key={method.id}
              style={{
                ...styles.methodOption,
                ...(isSelected ? styles.selectedMethod : {}),
                ...(canSelect ? {} : styles.disabledMethod)
              }}
            >
              <input
                type="radio"
                name="paymentMethod"
                value={method.id}
                checked={isSelected}
                onChange={(e) => onMethodChange(e.target.value as PaymentMethod)}
                disabled={!canSelect}
                style={styles.radioInput}
              />
              
              <div style={styles.methodContent}>
                <div style={styles.methodHeader}>
                  <span style={styles.methodIcon}>{method.icon}</span>
                  <div style={styles.methodInfo}>
                    <div style={styles.methodName}>{method.name}</div>
                    <div style={styles.methodDescription}>{method.description}</div>
                  </div>
                </div>
                
                <div style={styles.methodPricing}>
                  {method.fee > 0 && (
                    <div style={styles.fee}>
                      Fee: ₦{method.fee.toLocaleString()}
                    </div>
                  )}
                  <div style={styles.total}>
                    Total: ₦{totalAmount.toLocaleString()}
                  </div>
                </div>
              </div>

              {!canSelect && (
                <div style={styles.unavailableReason}>
                  {method.id === 'wallet' && userWalletBalance < amount && 'Insufficient balance'}
                  {method.id === 'airtime' && amount > 10000 && 'Amount exceeds airtime limit'}
                </div>
              )}
            </label>
          );
        })}
      </div>

      {selectedMethod && (
        <div style={styles.selectedInfo}>
          <div style={styles.selectedTitle}>Payment Summary</div>
          <div style={styles.summaryRow}>
            <span>Subtotal:</span>
            <span>₦{amount.toLocaleString()}</span>
          </div>
          {paymentMethods.find(m => m.id === selectedMethod)?.fee! > 0 && (
            <div style={styles.summaryRow}>
              <span>Processing fee:</span>
              <span>₦{paymentMethods.find(m => m.id === selectedMethod)?.fee!.toLocaleString()}</span>
            </div>
          )}
          <div style={styles.summaryTotal}>
            <span>Total to pay:</span>
            <span>₦{(amount + (paymentMethods.find(m => m.id === selectedMethod)?.fee || 0)).toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    marginBottom: '24px',
  },
  title: {
    margin: '0 0 16px 0',
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
  },
  methodsList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
    marginBottom: '20px',
  },
  methodOption: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '16px',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    backgroundColor: 'white',
  },
  selectedMethod: {
    borderColor: '#667eea',
    backgroundColor: '#f0f4ff',
  },
  disabledMethod: {
    opacity: 0.5,
    cursor: 'not-allowed',
    backgroundColor: '#f9fafb',
  },
  radioInput: {
    marginTop: '2px',
    width: '16px',
    height: '16px',
  },
  methodContent: {
    flex: 1,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  methodHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  methodIcon: {
    fontSize: '24px',
  },
  methodInfo: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2px',
  },
  methodName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
  },
  methodDescription: {
    fontSize: '14px',
    color: '#6b7280',
  },
  methodPricing: {
    textAlign: 'right' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2px',
  },
  fee: {
    fontSize: '12px',
    color: '#ef4444',
  },
  total: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#059669',
  },
  unavailableReason: {
    position: 'absolute' as const,
    top: '50%',
    right: '16px',
    transform: 'translateY(-50%)',
    fontSize: '12px',
    color: '#ef4444',
    fontWeight: '500',
  },
  selectedInfo: {
    backgroundColor: '#f9fafb',
    padding: '16px',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
  },
  selectedTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '12px',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '6px',
    fontSize: '14px',
    color: '#6b7280',
  },
  summaryTotal: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '8px',
    paddingTop: '8px',
    borderTop: '1px solid #e5e7eb',
    fontSize: '16px',
    fontWeight: '700',
    color: '#1f2937',
  },
};