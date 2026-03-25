import React from 'react';
import { ArrowLeft, Settings } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import UnifiedWalletDashboard from '../../components/wallet/UnifiedWalletDashboard';

const OrganizerWallet: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button style={styles.backButton} onClick={() => navigate('/organizer/dashboard')}>
          <ArrowLeft size={20} />
        </button>
        <div style={styles.headerContent}>
          <h1 style={styles.title}>Organizer Wallet</h1>
          <p style={styles.subtitle}>Unified wallet management for event organizers</p>
        </div>
        <div style={styles.headerActions}>
          <button style={styles.settingsButton}>
            <Settings size={20} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.content}>
        <UnifiedWalletDashboard />
      </div>
    </div>
  );
};

// Feature Card Component (removed as no longer needed)

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#ffffff',
    padding: '24px 32px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    borderBottom: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  backButton: {
    padding: '8px',
    backgroundColor: '#f3f4f6',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#374151',
    transition: 'all 0.2s',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1f2937',
    margin: 0,
  },
  subtitle: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '4px 0 0 0',
  },
  headerActions: {
    display: 'flex',
    gap: '8px',
  },
  settingsButton: {
    padding: '8px',
    backgroundColor: '#f3f4f6',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#374151',
    transition: 'all 0.2s',
  },
  content: {
    padding: '32px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
};

export default OrganizerWallet;