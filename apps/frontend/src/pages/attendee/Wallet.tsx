import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export function Wallet() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [amount, setAmount] = useState('');

  const handleAddFunds = () => {
    // Mock add funds functionality
    alert(`Adding ₦${amount} to wallet (Mock functionality)`);
    setShowAddFunds(false);
    setAmount('');
  };

  return (
    <div style={styles.container}>
      {/* Top Bar */}
      <header style={styles.header}>
        <h1 style={styles.logo}>Tikit</h1>
        <div style={styles.userMenu}>
          <span style={styles.userName}>
            {user?.firstName} {user?.lastName}
          </span>
          <button onClick={logout} style={styles.logoutButton}>
            Logout
          </button>
        </div>
      </header>

      <div style={styles.layout}>
        {/* Sidebar */}
        <aside style={styles.sidebar}>
          <nav style={styles.nav}>
            <NavItem icon="🏠" label="Dashboard" onClick={() => navigate('/attendee/dashboard')} />
            <NavItem icon="🎫" label="My Tickets" onClick={() => navigate('/attendee/tickets')} />
            <NavItem icon="💰" label="Wallet" active />
            <NavItem icon="🎉" label="Browse Events" onClick={() => navigate('/events')} />
            <NavItem icon="🎁" label="Referrals" onClick={() => navigate('/attendee/referrals')} />
            <NavItem icon="👤" label="Profile" onClick={() => navigate('/attendee/profile')} />
          </nav>
        </aside>

        {/* Main Content */}
        <main style={styles.main}>
          <div style={styles.pageHeader}>
            <h2 style={styles.pageTitle}>My Wallet</h2>
            <button 
              style={styles.primaryButton} 
              onClick={() => setShowAddFunds(true)}
            >
              Add Funds
            </button>
          </div>

          {/* Wallet Balance Card */}
          <div style={styles.balanceCard}>
            <div style={styles.balanceHeader}>
              <h3 style={styles.balanceTitle}>Available Balance</h3>
              <span style={styles.balanceAmount}>₦{user?.walletBalance?.toLocaleString() || '0'}</span>
            </div>
            <div style={styles.balanceActions}>
              <button 
                style={styles.actionButton}
                onClick={() => setShowAddFunds(true)}
              >
                💳 Add Funds
              </button>
              <button style={styles.actionButton}>
                📤 Send Money
              </button>
              <button style={styles.actionButton}>
                📥 Request Money
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div style={styles.quickActions}>
            <h3 style={styles.sectionTitle}>Quick Add</h3>
            <div style={styles.amountGrid}>
              {['1000', '2000', '5000', '10000'].map((amt) => (
                <button
                  key={amt}
                  style={styles.amountButton}
                  onClick={() => {
                    setAmount(amt);
                    setShowAddFunds(true);
                  }}
                >
                  ₦{parseInt(amt).toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Transaction History */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Recent Transactions</h3>
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>💳</div>
              <h4 style={styles.emptyTitle}>No transactions yet</h4>
              <p style={styles.emptyText}>
                Your transaction history will appear here once you start using your wallet.
              </p>
            </div>
          </div>

          {/* Add Funds Modal */}
          {showAddFunds && (
            <div style={styles.modal}>
              <div style={styles.modalContent}>
                <div style={styles.modalHeader}>
                  <h3 style={styles.modalTitle}>Add Funds</h3>
                  <button 
                    style={styles.closeButton}
                    onClick={() => setShowAddFunds(false)}
                  >
                    ✕
                  </button>
                </div>
                <div style={styles.modalBody}>
                  <label style={styles.label}>Amount (₦)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    style={styles.input}
                    placeholder="Enter amount"
                    min="100"
                  />
                  <div style={styles.modalActions}>
                    <button 
                      style={styles.secondaryButton}
                      onClick={() => setShowAddFunds(false)}
                    >
                      Cancel
                    </button>
                    <button 
                      style={styles.primaryButton}
                      onClick={handleAddFunds}
                      disabled={!amount || parseInt(amount) < 100}
                    >
                      Add ₦{amount ? parseInt(amount).toLocaleString() : '0'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function NavItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: string;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      style={{
        ...styles.navItem,
        ...(active ? styles.navItemActive : {}),
      }}
      onClick={onClick}
    >
      <span style={styles.navIcon}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#ffffff',
    padding: '16px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #e5e7eb',
  },
  logo: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#667eea',
    margin: 0,
  },
  userMenu: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  userName: {
    fontSize: '14px',
    color: '#374151',
    fontWeight: '500',
  },
  logoutButton: {
    padding: '8px 16px',
    fontSize: '14px',
    backgroundColor: '#f3f4f6',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    color: '#374151',
  },
  layout: {
    display: 'flex',
  },
  sidebar: {
    width: '240px',
    backgroundColor: '#ffffff',
    borderRight: '1px solid #e5e7eb',
    minHeight: 'calc(100vh - 65px)',
    padding: '24px 0',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
    padding: '0 12px',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    fontSize: '14px',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    color: '#6b7280',
    textAlign: 'left' as const,
    transition: 'all 0.2s',
  },
  navItemActive: {
    backgroundColor: '#f5f7ff',
    color: '#667eea',
    fontWeight: '500',
  },
  navIcon: {
    fontSize: '18px',
  },
  main: {
    flex: 1,
    padding: '32px',
    maxWidth: '1200px',
  },
  pageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px',
  },
  pageTitle: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#1f2937',
    margin: 0,
  },
  balanceCard: {
    backgroundColor: '#667eea',
    padding: '32px',
    borderRadius: '16px',
    marginBottom: '32px',
    color: '#ffffff',
  },
  balanceHeader: {
    marginBottom: '24px',
  },
  balanceTitle: {
    fontSize: '16px',
    fontWeight: '500',
    marginBottom: '8px',
    opacity: 0.9,
  },
  balanceAmount: {
    fontSize: '36px',
    fontWeight: 'bold',
  },
  balanceActions: {
    display: 'flex',
    gap: '12px',
  },
  actionButton: {
    padding: '12px 16px',
    fontSize: '14px',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  quickActions: {
    marginBottom: '32px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '16px',
  },
  amountGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: '12px',
  },
  amountButton: {
    padding: '16px',
    fontSize: '16px',
    fontWeight: '600',
    backgroundColor: '#ffffff',
    color: '#667eea',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  section: {
    marginBottom: '32px',
  },
  emptyState: {
    backgroundColor: '#ffffff',
    padding: '48px 32px',
    borderRadius: '12px',
    textAlign: 'center' as const,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  emptyTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '8px',
  },
  emptyText: {
    fontSize: '14px',
    color: '#6b7280',
  },
  modal: {
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
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '400px',
    margin: '20px',
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
    background: 'none',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    color: '#6b7280',
  },
  modalBody: {
    padding: '24px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '8px',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    fontSize: '16px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    marginBottom: '24px',
    outline: 'none',
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
  },
  primaryButton: {
    flex: 1,
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '600',
    backgroundColor: '#667eea',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  secondaryButton: {
    flex: 1,
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '600',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
};