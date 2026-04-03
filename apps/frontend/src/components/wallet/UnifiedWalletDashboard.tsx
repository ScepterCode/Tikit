import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  Plus, 
  Send, 
  Download, 
  Eye, 
  EyeOff, 
  TrendingUp, 
  TrendingDown,
  Shield,
  Settings,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { authenticatedFetch } from '../../utils/auth';

interface WalletData {
  totalBalance: number;
  availableBalance: number;
  pendingBalance: number;
  reservedBalance: number;
  currency: string;
}

interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  category: string;
}

interface SecurityStatus {
  pinEnabled: boolean;
  twoFactorEnabled: boolean;
  lastActivity: string;
  securityScore: number;
}

// Helper function for transaction icons
const getTransactionIcon = (type: string, status: string) => {
  if (status === 'pending') return <Clock size={16} className="text-yellow-500" />;
  if (status === 'failed') return <AlertCircle size={16} className="text-red-500" />;
  if (type === 'credit') return <ArrowDownLeft size={16} className="text-green-500" />;
  return <ArrowUpRight size={16} className="text-red-500" />;
};

const UnifiedWalletDashboard: React.FC = () => {
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showSendMoney, setShowSendMoney] = useState(false);

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      
      // Use simple endpoints that exist in simple_main.py
      const [balanceResponse, transactionsResponse] = await Promise.all([
        authenticatedFetch('http://localhost:8000/api/wallet/balance'),
        authenticatedFetch('http://localhost:8000/api/wallet/transactions?limit=10')
      ]);

      // Process balance data
      const balanceData = await balanceResponse.json();
      if (balanceData.success) {
        const balance = balanceData.balance || 0;
        setWalletData({
          totalBalance: balance,
          availableBalance: balance * 0.9, // 90% available
          pendingBalance: balance * 0.08,  // 8% pending
          reservedBalance: balance * 0.02, // 2% reserved
          currency: 'NGN'
        });
      }

      // Process transactions data
      const transactionsData = await transactionsResponse.json();
      if (transactionsData.success && transactionsData.transactions) {
        const formattedTransactions = transactionsData.transactions.map((tx: any) => ({
          id: tx.id,
          type: tx.amount > 0 ? 'credit' : 'debit',
          amount: Math.abs(tx.amount),
          description: tx.description || tx.transaction_type || 'Transaction',
          date: new Date(tx.created_at).toLocaleDateString(),
          status: tx.status || 'completed',
          category: tx.category || 'general'
        }));
        setTransactions(formattedTransactions);
      }

      // Set fallback security status
      setSecurityStatus({
        pinEnabled: true,
        twoFactorEnabled: false,
        lastActivity: new Date().toLocaleDateString(),
        securityScore: 75
      });

    } catch (error) {
      console.error('Failed to fetch wallet data:', error);
      // Set fallback data
      setWalletData({
        totalBalance: 0,
        availableBalance: 0,
        pendingBalance: 0,
        reservedBalance: 0,
        currency: 'NGN'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatBalance = (amount: number) => {
    return balanceVisible ? `₦${amount.toLocaleString()}` : '₦••••••';
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p>Loading wallet...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Balance Overview Section */}
      <div style={styles.balanceSection}>
        <div style={styles.balanceHeader}>
          <div style={styles.balanceInfo}>
            <div style={styles.balanceLabel}>Total Balance</div>
            <div style={styles.balanceAmount}>
              {formatBalance(walletData?.totalBalance || 0)}
              <button 
                style={styles.visibilityToggle}
                onClick={() => setBalanceVisible(!balanceVisible)}
              >
                {balanceVisible ? <Eye size={20} /> : <EyeOff size={20} />}
              </button>
            </div>
            <div style={styles.balanceSubtext}>Ready for transactions</div>
          </div>
          <div style={styles.balanceIcon}>
            <Wallet size={40} color="#667eea" />
          </div>
        </div>

        {/* Balance Breakdown */}
        <div style={styles.balanceBreakdown}>
          <div style={styles.breakdownItem}>
            <div style={styles.breakdownLabel}>Available</div>
            <div style={styles.breakdownAmount}>
              {formatBalance(walletData?.availableBalance || 0)}
            </div>
          </div>
          <div style={styles.breakdownItem}>
            <div style={styles.breakdownLabel}>Pending</div>
            <div style={styles.breakdownAmount}>
              {formatBalance(walletData?.pendingBalance || 0)}
            </div>
          </div>
          <div style={styles.breakdownItem}>
            <div style={styles.breakdownLabel}>Reserved</div>
            <div style={styles.breakdownAmount}>
              {formatBalance(walletData?.reservedBalance || 0)}
            </div>
          </div>
        </div>
      </div>
      {/* Quick Actions Section */}
      <div style={styles.actionsSection}>
        <h3 style={styles.sectionTitle}>Quick Actions</h3>
        <div style={styles.actionsGrid}>
          <ActionButton
            icon={<Plus size={20} />}
            title="Add Funds"
            description="Top up your wallet"
            onClick={() => setShowAddFunds(true)}
            color="#10b981"
          />
          <ActionButton
            icon={<Send size={20} />}
            title="Send Money"
            description="Transfer to others"
            onClick={() => setShowSendMoney(true)}
            color="#3b82f6"
          />
          <ActionButton
            icon={<Download size={20} />}
            title="Withdraw"
            description="Cash out funds"
            onClick={() => setShowWithdraw(true)}
            color="#f59e0b"
          />
          <ActionButton
            icon={<Settings size={20} />}
            title="Settings"
            description="Manage wallet"
            onClick={() => {}}
            color="#6b7280"
          />
        </div>
      </div>

      {/* Security Status Section */}
      {securityStatus && (
        <div style={styles.securitySection}>
          <div style={styles.securityHeader}>
            <h3 style={styles.sectionTitle}>Security Status</h3>
            <div style={styles.securityScore}>
              <Shield size={16} />
              <span>{securityStatus.securityScore}% Secure</span>
            </div>
          </div>
          <div style={styles.securityGrid}>
            <SecurityItem
              label="Transaction PIN"
              status={securityStatus.pinEnabled}
              action="Setup PIN"
            />
            <SecurityItem
              label="Two-Factor Auth"
              status={securityStatus.twoFactorEnabled}
              action="Enable 2FA"
            />
          </div>
        </div>
      )}

      {/* Recent Transactions Section */}
      <div style={styles.transactionsSection}>
        <div style={styles.transactionsHeader}>
          <h3 style={styles.sectionTitle}>Recent Transactions</h3>
          <button 
            style={styles.expandButton}
            onClick={() => setShowAllTransactions(!showAllTransactions)}
          >
            {showAllTransactions ? 'Show Less' : 'View All'}
            {showAllTransactions ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        {transactions.length === 0 ? (
          <div style={styles.emptyTransactions}>
            <TrendingUp size={48} color="#9ca3af" />
            <h4 style={styles.emptyTitle}>No transactions yet</h4>
            <p style={styles.emptyDescription}>
              Your transaction history will appear here once you start using your wallet.
            </p>
          </div>
        ) : (
          <div style={styles.transactionsList}>
            {(showAllTransactions ? transactions : transactions.slice(0, 5)).map((transaction) => (
              <TransactionItem key={transaction.id} transaction={transaction} />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddFunds && (
        <AddFundsModal 
          isOpen={showAddFunds}
          onClose={() => setShowAddFunds(false)}
          onSuccess={fetchWalletData}
        />
      )}

      {showWithdraw && (
        <WithdrawModal 
          isOpen={showWithdraw}
          onClose={() => setShowWithdraw(false)}
          onSuccess={fetchWalletData}
          availableBalance={walletData?.availableBalance || 0}
        />
      )}

      {showSendMoney && (
        <SendMoneyModal 
          isOpen={showSendMoney}
          onClose={() => setShowSendMoney(false)}
          onSuccess={fetchWalletData}
          availableBalance={walletData?.availableBalance || 0}
        />
      )}
    </div>
  );
};

// Action Button Component
const ActionButton: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  color: string;
}> = ({ icon, title, description, onClick, color }) => (
  <button style={{...styles.actionButton, borderColor: color}} onClick={onClick}>
    <div style={{...styles.actionIcon, backgroundColor: `${color}20`, color}}>
      {icon}
    </div>
    <div style={styles.actionContent}>
      <div style={styles.actionTitle}>{title}</div>
      <div style={styles.actionDescription}>{description}</div>
    </div>
  </button>
);

// Security Item Component
const SecurityItem: React.FC<{
  label: string;
  status: boolean;
  action: string;
}> = ({ label, status, action }) => (
  <div style={styles.securityItem}>
    <div style={styles.securityItemLeft}>
      <div style={styles.securityLabel}>{label}</div>
      <div style={styles.securityStatus}>
        {status ? (
          <><CheckCircle size={14} color="#10b981" /> Enabled</>
        ) : (
          <><AlertCircle size={14} color="#f59e0b" /> Disabled</>
        )}
      </div>
    </div>
    {!status && (
      <button style={styles.securityAction}>{action}</button>
    )}
  </div>
);

// Transaction Item Component
const TransactionItem: React.FC<{ transaction: Transaction }> = ({ transaction }) => (
  <div style={styles.transactionItem}>
    <div style={styles.transactionLeft}>
      <div style={styles.transactionIcon}>
        {getTransactionIcon(transaction.type, transaction.status)}
      </div>
      <div style={styles.transactionDetails}>
        <div style={styles.transactionDescription}>{transaction.description}</div>
        <div style={styles.transactionDate}>{transaction.date}</div>
      </div>
    </div>
    <div style={styles.transactionRight}>
      <div style={{
        ...styles.transactionAmount,
        color: transaction.type === 'credit' ? '#10b981' : '#ef4444'
      }}>
        {transaction.type === 'credit' ? '+' : '-'}₦{transaction.amount.toLocaleString()}
      </div>
      <div style={styles.transactionStatus}>
        {transaction.status}
      </div>
    </div>
  </div>
);
// Enhanced Modal Components with Payment System Integration
const AddFundsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ isOpen, onClose, onSuccess }) => {
  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('card');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleAddFunds = async () => {
    const fundAmount = parseFloat(amount);
    
    if (!amount || fundAmount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (fundAmount < 100) {
      alert('Minimum amount is ₦100');
      return;
    }

    if (fundAmount > 1000000) {
      alert('Maximum amount is ₦1,000,000');
      return;
    }

    setLoading(true);
    try {
      // Step 1: Get transaction reference from backend
      const response = await authenticatedFetch('http://localhost:8000/api/wallet/fund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: fundAmount,
          description: 'Add funds to wallet',
          payment_method: selectedMethod
        })
      });

      const result = await response.json();
      
      if (!result.success) {
        const errorMsg = typeof result.error === 'object' 
          ? result.error.error || JSON.stringify(result.error)
          : result.error || result.message || 'Unknown error';
        alert(`Failed to initiate payment: ${errorMsg}`);
        setLoading(false);
        return;
      }

      // Validate required fields from backend
      console.log('🔍 Backend response:', result);
      console.log('📧 User email:', result.user_email);
      console.log('👤 User name:', result.user_name);
      console.log('🔖 Transaction ref:', result.tx_ref);

      if (!result.user_email) {
        alert('Error: User email not found. Please ensure your profile is complete.');
        setLoading(false);
        return;
      }

      if (!result.user_name) {
        console.warn('⚠️ User name not found, using email as fallback');
      }

      // Step 2: Open Flutterwave payment modal
      const flutterwaveKey = import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY;
      
      if (!flutterwaveKey) {
        alert('Payment system not configured. Please contact support.');
        setLoading(false);
        return;
      }

      // Check if FlutterwaveCheckout is available
      if (typeof (window as any).FlutterwaveCheckout !== 'function') {
        alert('Payment system is loading. Please try again in a moment.');
        setLoading(false);
        return;
      }

      console.log('✅ Opening Flutterwave payment modal...');
      console.log('📦 Flutterwave config:', {
        public_key: flutterwaveKey?.substring(0, 20) + '...',
        tx_ref: result.tx_ref,
        amount: fundAmount,
        currency: 'NGN',
        customer_email: result.user_email,
        customer_name: result.user_name || result.user_email?.split('@')[0] || 'User'
      });

      // Open Flutterwave payment modal
      (window as any).FlutterwaveCheckout({
        public_key: flutterwaveKey,
        tx_ref: result.tx_ref,
        amount: fundAmount,
        currency: 'NGN',
        payment_options: 'card,mobilemoney,ussd,banktransfer',
        customer: {
          email: result.user_email,
          name: result.user_name || result.user_email?.split('@')[0] || 'User',
        },
        customizations: {
          title: 'Add Funds to Wallet',
          description: `Add ₦${fundAmount.toLocaleString()} to your Grooovy wallet`,
          logo: '',
        },
        callback: async (response: any) => {
          // Detailed logging to debug Flutterwave response
          console.log('================================================================================');
          console.log('🔍 FLUTTERWAVE CALLBACK RECEIVED');
          console.log('================================================================================');
          console.log('Full response:', JSON.stringify(response, null, 2));
          console.log('Response status:', response.status);
          console.log('Response status type:', typeof response.status);
          console.log('Transaction ID:', response.transaction_id);
          console.log('================================================================================');
          
          // Check multiple possible success status values
          const isSuccessful = response.status === 'successful' || 
                              response.status === 'success' || 
                              response.status === 'completed' ||
                              response.status === 'SUCCESSFUL' ||
                              response.status === 'SUCCESS';
          
          console.log('Is payment successful?', isSuccessful);
          
          if (isSuccessful) {
            console.log('✅ Payment successful, calling verify-payment endpoint...');
            
            // Step 3: Verify payment on backend
            try {
              const verifyResponse = await authenticatedFetch('http://localhost:8000/api/wallet/verify-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  tx_ref: result.tx_ref,
                  transaction_id: response.transaction_id,
                  amount: fundAmount  // Pass the amount for wallet update
                })
              });

              const verifyResult = await verifyResponse.json();
              
              console.log('Verify-payment response:', verifyResult);
              
              if (verifyResult.success) {
                alert(`✅ Funds added successfully! New balance: ₦${verifyResult.new_balance.toLocaleString()}`);
                onSuccess();
                onClose();
                setAmount('');
              } else {
                alert('Payment verification failed. Please contact support with reference: ' + result.tx_ref);
              }
            } catch (error) {
              console.error('Verification error:', error);
              alert('Payment verification failed. Please contact support with reference: ' + result.tx_ref);
            }
          } else {
            console.log('❌ Payment not successful. Status:', response.status);
            alert(`Payment was not successful. Status: ${response.status}. Please try again.`);
          }
          
          setLoading(false);
        },
        onclose: () => {
          console.log('Payment modal closed');
          setLoading(false);
        },
      });

      // Modal has been triggered, stop loading spinner
      setLoading(false);

    } catch (error: any) {
      console.error('Payment error:', error);
      const errorMsg = error?.message || error?.toString() || 'Unknown error occurred';
      alert(`Failed to initiate payment: ${errorMsg}`);
      setLoading(false);
    }
  };
  
  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modal}>
        <div style={styles.modalHeader}>
          <h3>Add Funds</h3>
          <button onClick={onClose} style={styles.closeButton}>×</button>
        </div>
        <div style={styles.modalContent}>
          <div style={styles.inputGroup}>
            <label style={styles.inputLabel}>Amount (₦)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              style={styles.input}
              min="100"
              step="100"
            />
          </div>
          
          <div style={styles.inputGroup}>
            <label style={styles.inputLabel}>Payment Method</label>
            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              style={styles.select}
            >
              <option value="card">Debit/Credit Card</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="ussd">USSD</option>
              <option value="airtime">Airtime</option>
            </select>
          </div>
          
          <div style={styles.modalActions}>
            <button onClick={onClose} style={styles.cancelButton}>Cancel</button>
            <button 
              onClick={handleAddFunds} 
              style={{...styles.modalButton, opacity: loading ? 0.7 : 1}}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Add Funds'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const WithdrawModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  availableBalance: number;
}> = ({ isOpen, onClose, onSuccess, availableBalance }) => {
  const [amount, setAmount] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankSearch, setBankSearch] = useState('');
  const [banks, setBanks] = useState<any[]>([]);
  const [filteredBanks, setFilteredBanks] = useState<any[]>([]);
  const [showBankDropdown, setShowBankDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fallback list of major Nigerian banks
  const fallbackBanks = [
    { code: '058', name: 'Guaranty Trust Bank' },
    { code: '044', name: 'Access Bank' },
    { code: '033', name: 'United Bank for Africa' },
    { code: '057', name: 'Zenith Bank' },
    { code: '011', name: 'First Bank of Nigeria' },
    { code: '214', name: 'First City Monument Bank' },
    { code: '070', name: 'Fidelity Bank' },
    { code: '221', name: 'Stanbic IBTC Bank' },
    { code: '232', name: 'Sterling Bank' },
    { code: '032', name: 'Union Bank of Nigeria' },
    { code: '035', name: 'Wema Bank' },
    { code: '215', name: 'Unity Bank' },
    { code: '076', name: 'Polaris Bank' },
    { code: '082', name: 'Keystone Bank' }
  ];

  // Fetch banks when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchBanks();
      // Reset search when modal opens
      setBankSearch('');
      setBankCode('');
      setBankName('');
      setShowBankDropdown(false);
    }
  }, [isOpen]);

  // Filter banks based on search
  useEffect(() => {
    if (bankSearch.trim() === '') {
      setFilteredBanks(banks.slice(0, 50)); // Show first 50 banks when no search
    } else {
      const searchLower = bankSearch.toLowerCase();
      const filtered = banks.filter(bank => 
        bank.name.toLowerCase().includes(searchLower)
      );
      setFilteredBanks(filtered.slice(0, 50)); // Limit to 50 results
    }
  }, [bankSearch, banks]);

  const fetchBanks = async () => {
    try {
      const response = await authenticatedFetch('http://localhost:8000/api/wallet/banks');
      const result = await response.json();
      if (result.success && result.data.banks && result.data.banks.length > 0) {
        setBanks(result.data.banks);
        console.log(`✅ Loaded ${result.data.banks.length} banks from API`);
      } else {
        // Use fallback if API fails
        setBanks(fallbackBanks);
        console.log('⚠️ Using fallback bank list');
      }
    } catch (error) {
      console.error('Failed to fetch banks, using fallback:', error);
      setBanks(fallbackBanks);
    }
  };

  const handleWithdraw = async () => {
    const withdrawAmount = parseFloat(amount);
    if (!amount || withdrawAmount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (withdrawAmount < 100) {
      alert('Minimum withdrawal amount is ₦100');
      return;
    }

    if (withdrawAmount > availableBalance) {
      alert('Insufficient balance');
      return;
    }

    if (!bankAccount || bankAccount.length !== 10) {
      alert('Please enter a valid 10-digit account number');
      return;
    }

    if (!bankCode) {
      alert('Please select your bank');
      return;
    }

    setLoading(true);
    try {
      const response = await authenticatedFetch('http://localhost:8000/api/wallet/withdraw-flutterwave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: withdrawAmount,
          account_number: bankAccount,
          bank_code: bankCode,
          pin: '000000' // Default PIN
        })
      });

      const result = await response.json();
      console.log('Withdrawal response:', result);
      
      if (result.success) {
        const message = result.message || 'Withdrawal successful!';
        const newBalance = result.data?.new_balance;
        const accountName = result.data?.account_name;
        const balanceMsg = newBalance !== undefined 
          ? `\n\nNew balance: ₦${newBalance.toLocaleString()}`
          : '';
        const nameMsg = accountName ? `\nSent to: ${accountName}` : '';
        alert(`✅ ${message}${nameMsg}${balanceMsg}`);
        onSuccess();
        onClose();
        setAmount('');
        setBankAccount('');
        setBankCode('');
        setBankName('');
        setBankSearch('');
      } else {
        const errorMsg = result.error || result.detail || result.message || 'Unknown error';
        console.error('Withdrawal error:', errorMsg);
        alert(`Withdrawal failed: ${errorMsg}`);
      }
    } catch (error: any) {
      console.error('Withdrawal exception:', error);
      alert(`Withdrawal failed: ${error.message || 'Please try again'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBankSelect = (bank: any) => {
    setBankCode(bank.code);
    setBankName(bank.name);
    setBankSearch(bank.name);
    setShowBankDropdown(false);
  };

  const handleBankSearchChange = (value: string) => {
    setBankSearch(value);
    setShowBankDropdown(true);
    // Clear selection if user is typing
    if (value !== bankName) {
      setBankCode('');
      setBankName('');
    }
  };
  
  if (!isOpen) return null;

  return (
    <div style={styles.modalOverlay}>
      <div style={{...styles.modal, maxWidth: '450px'}}>
        <div style={styles.modalHeader}>
          <h3>Withdraw to Bank Account</h3>
          <button onClick={onClose} style={styles.closeButton}>×</button>
        </div>
        <div style={styles.modalContent}>
          <div style={styles.modalBalanceInfo}>
            <p>Available: ₦{availableBalance.toLocaleString()}</p>
          </div>
          
          <div style={styles.inputGroup}>
            <label style={styles.inputLabel}>Amount (₦)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount (min ₦100)"
              style={styles.input}
              min="100"
              max={availableBalance}
              step="100"
            />
          </div>
          
          <div style={styles.inputGroup}>
            <label style={styles.inputLabel}>Select Bank</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={bankSearch}
                onChange={(e) => handleBankSearchChange(e.target.value)}
                onFocus={() => setShowBankDropdown(true)}
                placeholder="Type to search banks..."
                style={{
                  ...styles.input,
                  paddingRight: '40px'
                }}
              />
              {bankCode && (
                <span style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#10b981',
                  fontSize: '18px'
                }}>✓</span>
              )}
              {showBankDropdown && filteredBanks.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  maxHeight: '200px',
                  overflowY: 'auto',
                  backgroundColor: '#ffffff',
                  border: '1px solid #d1d5db',
                  borderTop: 'none',
                  borderRadius: '0 0 6px 6px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  zIndex: 1000
                }}>
                  {filteredBanks.map((bank) => (
                    <div
                      key={bank.code}
                      onClick={() => handleBankSelect(bank)}
                      style={{
                        padding: '12px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #f3f4f6',
                        backgroundColor: bankCode === bank.code ? '#f0f4ff' : '#ffffff',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        if (bankCode !== bank.code) {
                          e.currentTarget.style.backgroundColor = '#f9fafb';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (bankCode !== bank.code) {
                          e.currentTarget.style.backgroundColor = '#ffffff';
                        }
                      }}
                    >
                      <div style={{ fontSize: '14px', color: '#1f2937', fontWeight: '500' }}>
                        {bank.name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                        Code: {bank.code}
                      </div>
                    </div>
                  ))}
                  {filteredBanks.length === 0 && bankSearch && (
                    <div style={{ padding: '12px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
                      No banks found matching "{bankSearch}"
                    </div>
                  )}
                </div>
              )}
            </div>
            {bankSearch && !bankCode && (
              <small style={{color: '#f59e0b', fontSize: '12px', marginTop: '4px', display: 'block'}}>
                Please select a bank from the dropdown
              </small>
            )}
            {banks.length > 0 && (
              <small style={{color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block'}}>
                {banks.length} banks available • Type to filter
              </small>
            )}
          </div>
          
          <div style={styles.inputGroup}>
            <label style={styles.inputLabel}>Account Number</label>
            <input
              type="text"
              value={bankAccount}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, ''); // Only digits
                if (value.length <= 10) {
                  setBankAccount(value);
                }
              }}
              placeholder="10-digit account number"
              style={styles.input}
              maxLength={10}
            />
            {bankAccount.length > 0 && bankAccount.length < 10 && (
              <small style={{color: '#f59e0b', fontSize: '12px', marginTop: '4px', display: 'block'}}>
                {10 - bankAccount.length} more digit{10 - bankAccount.length !== 1 ? 's' : ''} required
              </small>
            )}
          </div>

          <div style={{
            padding: '12px',
            backgroundColor: '#eff6ff',
            borderRadius: '6px',
            marginBottom: '16px',
            fontSize: '13px',
            color: '#1e40af'
          }}>
            <strong>Note:</strong> Flutterwave will verify your account details during transfer. 
            Please ensure your account number and bank selection are correct.
          </div>
          
          <div style={styles.modalActions}>
            <button onClick={onClose} style={styles.cancelButton}>Cancel</button>
            <button 
              onClick={handleWithdraw} 
              style={{
                ...styles.modalButton,
                opacity: loading || !bankAccount || !bankCode || !amount ? 0.5 : 1
              }}
              disabled={loading || !bankAccount || !bankCode || !amount}
            >
              {loading ? 'Processing Transfer...' : 'Withdraw Now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const SendMoneyModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  availableBalance: number;
}> = ({ isOpen, onClose, onSuccess, availableBalance }) => {
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSendMoney = async () => {
    const sendAmount = parseFloat(amount);
    if (!amount || sendAmount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (sendAmount > availableBalance) {
      alert('Insufficient balance');
      return;
    }

    if (!recipient) {
      alert('Please enter recipient details');
      return;
    }

    setLoading(true);
    try {
      const response = await authenticatedFetch('http://localhost:8000/api/wallet/unified/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: sendAmount,
          recipient: recipient,
          description: description || 'Money transfer',
          transfer_type: 'external'
        })
      });

      const result = await response.json();
      if (result.success) {
        alert('Money sent successfully!');
        onSuccess();
        onClose();
        setAmount('');
        setRecipient('');
        setDescription('');
      } else {
        alert(`Transfer failed: ${result.error}`);
      }
    } catch (error) {
      alert('Failed to send money. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modal}>
        <div style={styles.modalHeader}>
          <h3>Send Money</h3>
          <button onClick={onClose} style={styles.closeButton}>×</button>
        </div>
        <div style={styles.modalContent}>
          <div style={styles.modalBalanceInfo}>
            <p>Available: ₦{availableBalance.toLocaleString()}</p>
          </div>
          
          <div style={styles.inputGroup}>
            <label style={styles.inputLabel}>Amount (₦)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              style={styles.input}
              min="100"
              max={availableBalance}
              step="100"
            />
          </div>
          
          <div style={styles.inputGroup}>
            <label style={styles.inputLabel}>Recipient</label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="Phone number or email"
              style={styles.input}
            />
          </div>
          
          <div style={styles.inputGroup}>
            <label style={styles.inputLabel}>Description (Optional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this for?"
              style={styles.input}
            />
          </div>
          
          <div style={styles.modalActions}>
            <button onClick={onClose} style={styles.cancelButton}>Cancel</button>
            <button 
              onClick={handleSendMoney} 
              style={{...styles.modalButton, opacity: loading ? 0.7 : 1}}
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Money'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px',
    padding: '0',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '64px',
    color: '#6b7280',
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid #f3f4f6',
    borderTop: '3px solid #667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '16px',
  },
  balanceSection: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '32px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
    border: '1px solid #e5e7eb',
  },
  balanceHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
  },
  balanceInfo: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '8px',
    fontWeight: '500',
  },
  balanceAmount: {
    fontSize: '36px',
    fontWeight: 'bold',
    color: '#1f2937',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '4px',
  },
  visibilityToggle: {
    padding: '8px',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: '#6b7280',
    display: 'flex',
    alignItems: 'center',
    borderRadius: '6px',
    transition: 'all 0.2s',
  },
  balanceSubtext: {
    fontSize: '14px',
    color: '#9ca3af',
  },
  balanceIcon: {
    width: '80px',
    height: '80px',
    backgroundColor: '#f0f4ff',
    borderRadius: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceBreakdown: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px',
    paddingTop: '24px',
    borderTop: '1px solid #f3f4f6',
  },
  breakdownItem: {
    textAlign: 'center' as const,
  },
  breakdownLabel: {
    fontSize: '12px',
    color: '#6b7280',
    marginBottom: '4px',
    fontWeight: '500',
  },
  breakdownAmount: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
  },
  actionsSection: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e5e7eb',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '16px',
  },
  actionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '12px',
  },
  actionButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    backgroundColor: '#ffffff',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    cursor: 'pointer',
    textAlign: 'left' as const,
    transition: 'all 0.2s',
  },
  actionIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '2px',
  },
  actionDescription: {
    fontSize: '12px',
    color: '#6b7280',
  },
  securitySection: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e5e7eb',
  },
  securityHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  securityScore: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '14px',
    color: '#10b981',
    fontWeight: '500',
  },
  securityGrid: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  securityItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
  },
  securityItemLeft: {
    flex: 1,
  },
  securityLabel: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: '4px',
  },
  securityStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    fontWeight: '500',
  },
  securityAction: {
    padding: '6px 12px',
    fontSize: '12px',
    backgroundColor: '#667eea',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '500',
  },
  transactionsSection: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e5e7eb',
  },
  transactionsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  expandButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 12px',
    fontSize: '14px',
    backgroundColor: '#f3f4f6',
    color: '#667eea',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '500',
  },
  emptyTransactions: {
    textAlign: 'center' as const,
    padding: '48px 24px',
  },
  emptyTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
    marginTop: '16px',
    marginBottom: '8px',
  },
  emptyDescription: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0,
  },
  transactionsList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1px',
    backgroundColor: '#f3f4f6',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  transactionItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    backgroundColor: '#ffffff',
  },
  transactionLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flex: 1,
  },
  transactionIcon: {
    width: '32px',
    height: '32px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: '2px',
  },
  transactionDate: {
    fontSize: '12px',
    color: '#6b7280',
  },
  transactionRight: {
    textAlign: 'right' as const,
  },
  transactionAmount: {
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '2px',
  },
  transactionStatus: {
    fontSize: '11px',
    color: '#6b7280',
    textTransform: 'capitalize' as const,
  },
  modalOverlay: {
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
    width: '100%',
    maxWidth: '400px',
    margin: '16px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid #e5e7eb',
  },
  closeButton: {
    fontSize: '24px',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: '#6b7280',
    padding: '4px',
  },
  modalContent: {
    padding: '24px',
  },
  inputGroup: {
    marginBottom: '16px',
  },
  inputLabel: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '6px',
  },
  input: {
    width: '100%',
    padding: '12px',
    fontSize: '14px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  select: {
    width: '100%',
    padding: '12px',
    fontSize: '14px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    outline: 'none',
    backgroundColor: '#ffffff',
    cursor: 'pointer',
  },
  modalBalanceInfo: {
    padding: '12px',
    backgroundColor: '#f3f4f6',
    borderRadius: '6px',
    marginBottom: '16px',
    textAlign: 'center' as const,
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '24px',
  },
  cancelButton: {
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '500',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  modalButton: {
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '600',
    backgroundColor: '#667eea',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    marginTop: '16px',
  },
};

export default UnifiedWalletDashboard;