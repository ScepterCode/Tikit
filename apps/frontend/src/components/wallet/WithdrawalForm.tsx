import React, { useState, useEffect } from 'react';
import { ArrowDownLeft, CreditCard, Smartphone, MapPin, Bitcoin, AlertCircle } from 'lucide-react';
import { authenticatedFetch } from '../../utils/auth';

interface WithdrawalMethod {
  method: string;
  name: string;
  limits: { min: number; max: number };
  fees: { instant: number; standard: number };
  processing_times: { instant: string; standard: string };
}

interface BankAccount {
  id: string;
  account_number: string;
  account_name: string;
  bank_name: string;
  is_primary: boolean;
}

const WithdrawalForm: React.FC = () => {
  const [methods, setMethods] = useState<WithdrawalMethod[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [processingType, setProcessingType] = useState<'standard' | 'instant'>('standard');
  const [selectedAccount, setSelectedAccount] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    fetchWithdrawalMethods();
    fetchBankAccounts();
  }, []);

  const fetchWithdrawalMethods = async () => {
    try {
      const response = await authenticatedFetch('/api/wallet/withdrawal-methods');
      if (response.success) {
        setMethods(response.data.methods);
      }
    } catch (error) {
      console.error('Failed to fetch withdrawal methods:', error);
    }
  };

  const fetchBankAccounts = async () => {
    try {
      const response = await authenticatedFetch('/api/wallet/bank-accounts');
      if (response.success) {
        setBankAccounts(response.data.accounts);
      }
    } catch (error) {
      console.error('Failed to fetch bank accounts:', error);
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'bank_transfer': return <CreditCard size={20} />;
      case 'mobile_money': return <Smartphone size={20} />;
      case 'cash_pickup': return <MapPin size={20} />;
      case 'crypto': return <Bitcoin size={20} />;
      default: return <ArrowDownLeft size={20} />;
    }
  };

  const selectedMethodData = methods.find(m => m.method === selectedMethod);
  const fee = selectedMethodData ? selectedMethodData.fees[processingType] : 0;
  const totalDeduction = parseFloat(amount || '0') + fee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedMethod || !amount || !pin) {
      setMessage({type: 'error', text: 'Please fill in all required fields'});
      return;
    }

    const amountNum = parseFloat(amount);
    if (selectedMethodData) {
      if (amountNum < selectedMethodData.limits.min) {
        setMessage({type: 'error', text: `Minimum withdrawal is ₦${selectedMethodData.limits.min.toLocaleString()}`});
        return;
      }
      if (amountNum > selectedMethodData.limits.max) {
        setMessage({type: 'error', text: `Maximum withdrawal is ₦${selectedMethodData.limits.max.toLocaleString()}`});
        return;
      }
    }

    setLoading(true);
    try {
      const withdrawalData = {
        amount: amountNum,
        method: selectedMethod,
        processing_type: processingType,
        pin: pin,
        destination: selectedMethod === 'bank_transfer' 
          ? { account_id: selectedAccount }
          : { type: selectedMethod }
      };

      const response = await authenticatedFetch('/api/wallet/withdraw', {
        method: 'POST',
        body: withdrawalData
      });

      if (response.success) {
        setMessage({type: 'success', text: 'Withdrawal initiated successfully!'});
        // Reset form
        setAmount('');
        setPin('');
        setSelectedAccount('');
      } else {
        setMessage({type: 'error', text: response.error || 'Withdrawal failed'});
      }
    } catch (error: any) {
      setMessage({type: 'error', text: error.message || 'Withdrawal failed'});
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <ArrowDownLeft size={24} color="#4F46E5" />
        <h2 style={styles.title}>Withdraw Funds</h2>
      </div>

      {message && (
        <div style={{
          ...styles.message,
          backgroundColor: message.type === 'success' ? '#10B981' : '#EF4444'
        }}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} style={styles.form}>
        {/* Withdrawal Method Selection */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Select Withdrawal Method</h3>
          <div style={styles.methodGrid}>
            {methods.map((method) => (
              <div
                key={method.method}
                style={{
                  ...styles.methodCard,
                  ...(selectedMethod === method.method ? styles.selectedCard : {})
                }}
                onClick={() => setSelectedMethod(method.method)}
              >
                <div style={styles.methodHeader}>
                  {getMethodIcon(method.method)}
                  <span style={styles.methodName}>{method.name}</span>
                </div>
                <div style={styles.methodDetails}>
                  <p>Min: ₦{method.limits.min.toLocaleString()}</p>
                  <p>Max: ₦{method.limits.max.toLocaleString()}</p>
                  <p>Fee: ₦{method.fees.standard}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Amount Input */}
        {selectedMethod && (
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Withdrawal Amount</h3>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Amount (₦)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                style={styles.input}
                min={selectedMethodData?.limits.min}
                max={selectedMethodData?.limits.max}
              />
              {selectedMethodData && (
                <p style={styles.hint}>
                  Min: ₦{selectedMethodData.limits.min.toLocaleString()} - Max: ₦{selectedMethodData.limits.max.toLocaleString()}
                </p>
              )}
            </div>

            {/* Processing Type */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>Processing Speed</label>
              <div style={styles.radioGroup}>
                <label style={styles.radioLabel}>
                  <input
                    type="radio"
                    value="standard"
                    checked={processingType === 'standard'}
                    onChange={(e) => setProcessingType(e.target.value as 'standard' | 'instant')}
                  />
                  <span>Standard (₦{selectedMethodData?.fees.standard}) - {selectedMethodData?.processing_times.standard}</span>
                </label>
                <label style={styles.radioLabel}>
                  <input
                    type="radio"
                    value="instant"
                    checked={processingType === 'instant'}
                    onChange={(e) => setProcessingType(e.target.value as 'standard' | 'instant')}
                  />
                  <span>Instant (₦{selectedMethodData?.fees.instant}) - {selectedMethodData?.processing_times.instant}</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Bank Account Selection */}
        {selectedMethod === 'bank_transfer' && (
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Select Bank Account</h3>
            {bankAccounts.length > 0 ? (
              <div style={styles.accountGrid}>
                {bankAccounts.map((account) => (
                  <div
                    key={account.id}
                    style={{
                      ...styles.accountCard,
                      ...(selectedAccount === account.id ? styles.selectedCard : {})
                    }}
                    onClick={() => setSelectedAccount(account.id)}
                  >
                    <div style={styles.accountInfo}>
                      <strong>{account.account_name}</strong>
                      <p>{account.bank_name}</p>
                      <p>****{account.account_number.slice(-4)}</p>
                      {account.is_primary && <span style={styles.primaryBadge}>Primary</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={styles.noAccounts}>
                <AlertCircle size={20} color="#F59E0B" />
                <p>No bank accounts found. Please add a bank account first.</p>
              </div>
            )}
          </div>
        )}

        {/* Transaction PIN */}
        {selectedMethod && amount && (
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Security Verification</h3>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Transaction PIN</label>
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter your transaction PIN"
                style={styles.input}
                maxLength={6}
              />
            </div>
          </div>
        )}

        {/* Summary */}
        {selectedMethod && amount && (
          <div style={styles.summary}>
            <h3 style={styles.sectionTitle}>Withdrawal Summary</h3>
            <div style={styles.summaryRow}>
              <span>Withdrawal Amount:</span>
              <span>₦{parseFloat(amount || '0').toLocaleString()}</span>
            </div>
            <div style={styles.summaryRow}>
              <span>Processing Fee:</span>
              <span>₦{fee.toLocaleString()}</span>
            </div>
            <div style={styles.summaryRow}>
              <span>Processing Time:</span>
              <span>{selectedMethodData?.processing_times[processingType]}</span>
            </div>
            <div style={{...styles.summaryRow, ...styles.totalRow}}>
              <span><strong>Total Deduction:</strong></span>
              <span><strong>₦{totalDeduction.toLocaleString()}</strong></span>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          style={{
            ...styles.submitButton,
            ...(loading ? styles.disabledButton : {})
          }}
          disabled={loading || !selectedMethod || !amount || !pin || (selectedMethod === 'bank_transfer' && !selectedAccount)}
        >
          {loading ? 'Processing...' : 'Initiate Withdrawal'}
        </button>
      </form>
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    maxWidth: '600px',
    margin: '0 auto'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '24px'
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1F2937',
    margin: 0
  },
  message: {
    padding: '12px 16px',
    borderRadius: '8px',
    color: 'white',
    marginBottom: '20px',
    fontSize: '14px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px'
  },
  section: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '12px',
    border: '1px solid #E5E7EB'
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: '16px'
  },
  methodGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '12px'
  },
  methodCard: {
    padding: '16px',
    border: '2px solid #E5E7EB',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  selectedCard: {
    borderColor: '#4F46E5',
    backgroundColor: '#F8FAFC'
  },
  methodHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px'
  },
  methodName: {
    fontWeight: '500',
    color: '#1F2937'
  },
  methodDetails: {
    fontSize: '12px',
    color: '#6B7280'
  },
  inputGroup: {
    marginBottom: '16px'
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '6px'
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '1px solid #D1D5DB',
    borderRadius: '8px',
    fontSize: '16px'
  },
  hint: {
    fontSize: '12px',
    color: '#6B7280',
    marginTop: '4px'
  },
  radioGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px'
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    cursor: 'pointer'
  },
  accountGrid: {
    display: 'grid',
    gap: '12px'
  },
  accountCard: {
    padding: '16px',
    border: '2px solid #E5E7EB',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  accountInfo: {
    fontSize: '14px'
  },
  primaryBadge: {
    backgroundColor: '#10B981',
    color: 'white',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    marginLeft: '8px'
  },
  noAccounts: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '16px',
    backgroundColor: '#FEF3C7',
    borderRadius: '8px',
    color: '#92400E'
  },
  summary: {
    backgroundColor: '#F9FAFB',
    padding: '20px',
    borderRadius: '12px',
    border: '1px solid #E5E7EB'
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
    fontSize: '14px'
  },
  totalRow: {
    borderTop: '1px solid #E5E7EB',
    paddingTop: '8px',
    marginTop: '8px'
  },
  submitButton: {
    backgroundColor: '#4F46E5',
    color: 'white',
    border: 'none',
    padding: '16px',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
    cursor: 'not-allowed'
  }
};

export default WithdrawalForm;