import React, { useState, useEffect } from 'react';
import { Wallet, PiggyBank, Building2, Shield, Plus, ArrowUpRight, ArrowDownLeft, TrendingUp, Settings, ArrowRightLeft } from 'lucide-react';
import { authenticatedFetch } from '../../utils/auth';

interface WalletData {
  id: string;
  name: string;
  type: 'main' | 'savings' | 'business' | 'escrow';
  balance: number;
  currency: string;
  interestRate?: number;
  goal?: number;
  description: string;
  is_active: boolean;
  is_default: boolean;
  total_interest_earned?: number;
}

const MultiWalletDashboard: React.FC = () => {
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferData, setTransferData] = useState({
    from_wallet: '',
    to_wallet: '',
    amount: '',
    description: ''
  });

  useEffect(() => {
    fetchWallets();
  }, []);

  const fetchWallets = async () => {
    try {
      setLoading(true);
      
      // Fetch real wallet data from unified wallet service
      const response = await authenticatedFetch('http://localhost:8000/api/wallet/unified/balance');
      const data = await response.json();
      
      if (data.success) {
        // Convert unified wallet response to multi-wallet format
        const mainWallet: WalletData = {
          id: 'main',
          name: 'Main Wallet',
          type: 'main',
          balance: data.data.total_balance || 0,
          currency: 'NGN',
          description: 'Your primary wallet for daily transactions',
          is_active: true,
          is_default: true
        };
        
        // Try to fetch additional wallet types if available
        const multiWalletResponse = await authenticatedFetch('http://localhost:8000/api/wallet/multi-wallets');
        const multiData = await multiWalletResponse.json();
        
        if (multiData.success && multiData.data.wallets) {
          setWallets([mainWallet, ...multiData.data.wallets]);
        } else {
          // If multi-wallet not available, show main wallet only
          setWallets([mainWallet]);
        }
      } else {
        // Fallback to basic wallet structure
        const basicWallet: WalletData = {
          id: 'main',
          name: 'Main Wallet',
          type: 'main',
          balance: 0,
          currency: 'NGN',
          description: 'Your primary wallet for daily transactions',
          is_active: true,
          is_default: true
        };
        setWallets([basicWallet]);
      }
    } catch (error) {
      console.error('Failed to fetch wallets:', error);
      // Fallback wallet on error
      const fallbackWallet: WalletData = {
        id: 'main',
        name: 'Main Wallet',
        type: 'main',
        balance: 0,
        currency: 'NGN',
        description: 'Your primary wallet for daily transactions',
        is_active: true,
        is_default: true
      };
      setWallets([fallbackWallet]);
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async () => {
    try {
      const response = await authenticatedFetch('http://localhost:8000/api/wallet/unified/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from_wallet_type: transferData.from_wallet,
          to_wallet_type: transferData.to_wallet,
          amount: parseFloat(transferData.amount),
          description: transferData.description || 'Wallet transfer'
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setShowTransferModal(false);
        setTransferData({ from_wallet: '', to_wallet: '', amount: '', description: '' });
        fetchWallets(); // Refresh wallet data
        alert('Transfer completed successfully!');
      } else {
        alert(`Transfer failed: ${data.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Transfer failed:', error);
      alert('Transfer failed. Please try again.');
    }
  };

  const getWalletIcon = (type: string) => {
    switch (type) {
      case 'savings': return <PiggyBank size={24} color="#10b981" />;
      case 'business': return <Building2 size={24} color="#3b82f6" />;
      case 'escrow': return <Shield size={24} color="#f59e0b" />;
      default: return <Wallet size={24} color="#667eea" />;
    }
  };

  const getWalletColor = (type: string) => {
    switch (type) {
      case 'savings': return '#10b981';
      case 'business': return '#3b82f6';
      case 'escrow': return '#f59e0b';
      default: return '#667eea';
    }
  };

  const totalBalance = wallets.reduce((sum, wallet) => sum + wallet.balance, 0);

  if (loading) {
    return (
      <div style={styles.loadingState}>
        <div style={styles.spinner}></div>
        <p>Loading wallets...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Multi-Wallet System</h2>
          <p style={styles.subtitle}>Manage multiple wallets for different purposes</p>
        </div>
        <button style={styles.createButton} onClick={() => setShowCreateModal(true)}>
          <Plus size={16} />
          Create Wallet
        </button>
      </div>

      {/* Total Balance Summary */}
      <div style={styles.summaryCard}>
        <div style={styles.summaryContent}>
          <div style={styles.summaryLabel}>Total Balance Across All Wallets</div>
          <div style={styles.summaryAmount}>₦{totalBalance.toLocaleString()}</div>
          <div style={styles.summarySubtext}>{wallets.length} active wallets</div>
        </div>
        <div style={styles.summaryIcon}>
          <TrendingUp size={32} color="#667eea" />
        </div>
      </div>

      {/* Wallets Grid */}
      <div style={styles.walletsGrid}>
        {wallets.map((wallet) => (
          <WalletCard key={wallet.id} wallet={wallet} onTransfer={() => setShowTransferModal(true)} />
        ))}
        
        {/* Create New Wallet Card */}
        <button style={styles.createCard} onClick={() => setShowCreateModal(true)}>
          <div style={styles.createIcon}>
            <Plus size={32} color="#9ca3af" />
          </div>
          <h3 style={styles.createTitle}>Create New Wallet</h3>
          <p style={styles.createDescription}>Set up a specialized wallet for savings, business, or escrow</p>
        </button>
      </div>

      {/* Quick Actions */}
      <div style={styles.actionsSection}>
        <h3 style={styles.sectionTitle}>Quick Actions</h3>
        <div style={styles.actionsGrid}>
          <ActionCard
            icon={<ArrowRightLeft size={20} />}
            title="Transfer Between Wallets"
            description="Move funds between your different wallets"
            onClick={() => setShowTransferModal(true)}
          />
          <ActionCard
            icon={<Settings size={20} />}
            title="Auto-Save Rules"
            description="Set up automatic transfers to savings"
            onClick={() => {}}
          />
          <ActionCard
            icon={<TrendingUp size={20} />}
            title="Savings Goals"
            description="Track progress on your financial goals"
            onClick={() => {}}
          />
        </div>
      </div>

      {/* Transfer Modal */}
      {showTransferModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Transfer Between Wallets</h3>
              <button 
                style={styles.closeButton}
                onClick={() => setShowTransferModal(false)}
              >
                ×
              </button>
            </div>
            <div style={styles.modalContent}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>From Wallet</label>
                <select
                  value={transferData.from_wallet}
                  onChange={(e) => setTransferData({...transferData, from_wallet: e.target.value})}
                  style={styles.select}
                >
                  <option value="">Select source wallet</option>
                  {wallets.map(wallet => (
                    <option key={wallet.id} value={wallet.type}>
                      {wallet.name} (₦{wallet.balance.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>To Wallet</label>
                <select
                  value={transferData.to_wallet}
                  onChange={(e) => setTransferData({...transferData, to_wallet: e.target.value})}
                  style={styles.select}
                >
                  <option value="">Select destination wallet</option>
                  {wallets.map(wallet => (
                    <option key={wallet.id} value={wallet.type}>
                      {wallet.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Amount (₦)</label>
                <input
                  type="number"
                  value={transferData.amount}
                  onChange={(e) => setTransferData({...transferData, amount: e.target.value})}
                  style={styles.input}
                  placeholder="Enter amount"
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Description (Optional)</label>
                <input
                  type="text"
                  value={transferData.description}
                  onChange={(e) => setTransferData({...transferData, description: e.target.value})}
                  style={styles.input}
                  placeholder="Transfer description"
                />
              </div>

              <div style={styles.modalActions}>
                <button 
                  style={styles.cancelButton}
                  onClick={() => setShowTransferModal(false)}
                >
                  Cancel
                </button>
                <button 
                  style={styles.confirmButton}
                  onClick={handleTransfer}
                >
                  Transfer Funds
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Wallet Card Component
const WalletCard: React.FC<{ 
  wallet: WalletData; 
  onTransfer: () => void;
}> = ({ wallet, onTransfer }) => {
  const color = getWalletColor(wallet.type);
  const progress = wallet.goal ? (wallet.balance / wallet.goal) * 100 : 0;

  return (
    <div style={styles.walletCard}>
      <div style={styles.walletHeader}>
        <div style={{ ...styles.walletIcon, backgroundColor: `${color}20` }}>
          {getWalletIcon(wallet.type)}
        </div>
        <div style={styles.walletBadges}>
          {wallet.is_default && (
            <span style={styles.defaultBadge}>Default</span>
          )}
          <button style={styles.walletMenu}>⋯</button>
        </div>
      </div>
      
      <div style={styles.walletContent}>
        <h3 style={styles.walletName}>{wallet.name}</h3>
        <div style={styles.walletBalance}>₦{wallet.balance.toLocaleString()}</div>
        <p style={styles.walletDescription}>{wallet.description}</p>
        
        {wallet.interestRate && (
          <div style={styles.interestSection}>
            <div style={styles.interestBadge}>
              {wallet.interestRate}% APY
            </div>
            {wallet.total_interest_earned && (
              <div style={styles.interestEarned}>
                ₦{wallet.total_interest_earned.toLocaleString()} earned
              </div>
            )}
          </div>
        )}
        
        {wallet.goal && (
          <div style={styles.progressSection}>
            <div style={styles.progressLabel}>
              Goal: ₦{wallet.goal.toLocaleString()} ({progress.toFixed(1)}%)
            </div>
            <div style={styles.progressBar}>
              <div 
                style={{
                  ...styles.progressFill,
                  width: `${Math.min(progress, 100)}%`,
                  backgroundColor: color
                }}
              />
            </div>
          </div>
        )}
      </div>
      
      <div style={styles.walletActions}>
        <button style={styles.walletActionButton}>
          <ArrowUpRight size={14} />
          Send
        </button>
        <button style={styles.walletActionButton} onClick={onTransfer}>
          <ArrowRightLeft size={14} />
          Transfer
        </button>
      </div>
    </div>
  );
};

// Action Card Component
const ActionCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}> = ({ icon, title, description, onClick }) => (
  <button style={styles.actionCard} onClick={onClick}>
    <div style={styles.actionIcon}>{icon}</div>
    <div style={styles.actionContent}>
      <h4 style={styles.actionTitle}>{title}</h4>
      <p style={styles.actionDescription}>{description}</p>
    </div>
  </button>
);

// Helper functions
const getWalletIcon = (type: string) => {
  switch (type) {
    case 'savings': return <PiggyBank size={24} color="#10b981" />;
    case 'business': return <Building2 size={24} color="#3b82f6" />;
    case 'escrow': return <Shield size={24} color="#f59e0b" />;
    default: return <Wallet size={24} color="#667eea" />;
  }
};

const getWalletColor = (type: string) => {
  switch (type) {
    case 'savings': return '#10b981';
    case 'business': return '#3b82f6';
    case 'escrow': return '#f59e0b';
    default: return '#667eea';
  }
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px',
  },
  loadingState: {
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
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#1f2937',
    margin: '0 0 4px 0',
  },
  subtitle: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0,
  },
  createButton: {
    padding: '12px 20px',
    backgroundColor: '#667eea',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s',
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '24px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryContent: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '8px',
  },
  summaryAmount: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '4px',
  },
  summarySubtext: {
    fontSize: '12px',
    color: '#9ca3af',
  },
  summaryIcon: {
    width: '56px',
    height: '56px',
    backgroundColor: '#f0f4ff',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '16px',
  },
  walletCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.2s',
  },
  walletHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  walletIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletBadges: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  defaultBadge: {
    padding: '2px 6px',
    backgroundColor: '#dcfce7',
    color: '#166534',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: '600',
    textTransform: 'uppercase' as const,
  },
  walletMenu: {
    padding: '4px 8px',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: '#9ca3af',
    fontSize: '16px',
  },
  walletContent: {
    marginBottom: '16px',
  },
  walletName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
    margin: '0 0 8px 0',
  },
  walletBalance: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '8px',
  },
  walletDescription: {
    fontSize: '12px',
    color: '#6b7280',
    margin: '0 0 12px 0',
  },
  interestSection: {
    marginBottom: '12px',
  },
  interestBadge: {
    display: 'inline-block',
    padding: '4px 8px',
    backgroundColor: '#dcfce7',
    color: '#166534',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '600',
    marginBottom: '4px',
  },
  interestEarned: {
    fontSize: '11px',
    color: '#10b981',
    fontWeight: '500',
  },
  progressSection: {
    marginTop: '12px',
  },
  progressLabel: {
    fontSize: '11px',
    color: '#6b7280',
    marginBottom: '6px',
  },
  progressBar: {
    width: '100%',
    height: '6px',
    backgroundColor: '#f3f4f6',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: '3px',
    transition: 'width 0.3s ease',
  },
  walletActions: {
    display: 'flex',
    gap: '8px',
  },
  walletActionButton: {
    flex: 1,
    padding: '8px 12px',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    transition: 'all 0.2s',
  },
  createCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '32px 20px',
    border: '2px dashed #d1d5db',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center' as const,
    transition: 'all 0.2s',
    minHeight: '200px',
  },
  createIcon: {
    width: '48px',
    height: '48px',
    backgroundColor: '#f9fafb',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '12px',
  },
  createTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#374151',
    margin: '0 0 8px 0',
  },
  createDescription: {
    fontSize: '12px',
    color: '#6b7280',
    margin: 0,
  },
  actionsSection: {
    marginTop: '8px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '16px',
  },
  actionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '12px',
  },
  actionCard: {
    backgroundColor: '#ffffff',
    padding: '16px',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    textAlign: 'left' as const,
    transition: 'all 0.2s',
  },
  actionIcon: {
    width: '36px',
    height: '36px',
    backgroundColor: '#f0f4ff',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#667eea',
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1f2937',
    margin: '0 0 4px 0',
  },
  actionDescription: {
    fontSize: '12px',
    color: '#6b7280',
    margin: 0,
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
  modalTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0,
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
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '6px',
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '16px',
    boxSizing: 'border-box' as const,
  },
  select: {
    width: '100%',
    padding: '12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '16px',
    backgroundColor: '#ffffff',
    boxSizing: 'border-box' as const,
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
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
  confirmButton: {
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

export default MultiWalletDashboard;