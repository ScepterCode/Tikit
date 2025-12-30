import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface ReferralData {
  totalReferrals: number;
  activeReferrals: number;
  totalEarnings: number;
  pendingEarnings: number;
  referralCode: string;
  referralLink: string;
}

interface ReferralHistory {
  id: string;
  referredUser: string;
  dateReferred: string;
  status: 'pending' | 'active' | 'completed';
  earnings: number;
}

export function Referrals() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [referralHistory, setReferralHistory] = useState<ReferralHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Mock data - replace with API call
    const mockReferralData: ReferralData = {
      totalReferrals: 12,
      activeReferrals: 8,
      totalEarnings: 24000,
      pendingEarnings: 6000,
      referralCode: user?.referralCode || 'TIKIT123',
      referralLink: `https://tikit.com/register?ref=${user?.referralCode || 'TIKIT123'}`
    };

    const mockHistory: ReferralHistory[] = [
      {
        id: '1',
        referredUser: 'John D.',
        dateReferred: '2025-12-28T10:30:00.000Z',
        status: 'completed',
        earnings: 2000
      },
      {
        id: '2',
        referredUser: 'Sarah M.',
        dateReferred: '2025-12-25T14:15:00.000Z',
        status: 'active',
        earnings: 2000
      },
      {
        id: '3',
        referredUser: 'Mike J.',
        dateReferred: '2025-12-22T09:45:00.000Z',
        status: 'pending',
        earnings: 0
      },
      {
        id: '4',
        referredUser: 'Emma W.',
        dateReferred: '2025-12-20T16:20:00.000Z',
        status: 'completed',
        earnings: 2000
      }
    ];

    setTimeout(() => {
      setReferralData(mockReferralData);
      setReferralHistory(mockHistory);
      setLoading(false);
    }, 1000);
  }, [user]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareReferral = (platform: string) => {
    const message = `Join Tikit and get amazing event tickets! Use my referral code: ${referralData?.referralCode}`;
    const url = referralData?.referralLink;
    
    switch (platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(message + ' ' + url)}`);
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(url || '')}`);
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url || '')}`);
        break;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#16a34a';
      case 'active': return '#3b82f6';
      case 'pending': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <div style={styles.spinner}></div>
          <p>Loading referral data...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button onClick={() => navigate('/attendee/dashboard')} style={styles.backButton}>
          ← Back to Dashboard
        </button>
        <h1 style={styles.title}>🎁 Referral Program</h1>
      </div>

      {/* Stats Overview */}
      {referralData && (
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>👥</div>
            <div style={styles.statContent}>
              <span style={styles.statNumber}>{referralData.totalReferrals}</span>
              <span style={styles.statLabel}>Total Referrals</span>
            </div>
          </div>
          
          <div style={styles.statCard}>
            <div style={styles.statIcon}>✅</div>
            <div style={styles.statContent}>
              <span style={styles.statNumber}>{referralData.activeReferrals}</span>
              <span style={styles.statLabel}>Active Referrals</span>
            </div>
          </div>
          
          <div style={styles.statCard}>
            <div style={styles.statIcon}>💰</div>
            <div style={styles.statContent}>
              <span style={styles.statNumber}>₦{referralData.totalEarnings.toLocaleString()}</span>
              <span style={styles.statLabel}>Total Earnings</span>
            </div>
          </div>
          
          <div style={styles.statCard}>
            <div style={styles.statIcon}>⏳</div>
            <div style={styles.statContent}>
              <span style={styles.statNumber}>₦{referralData.pendingEarnings.toLocaleString()}</span>
              <span style={styles.statLabel}>Pending Earnings</span>
            </div>
          </div>
        </div>
      )}

      {/* Referral Code Section */}
      {referralData && (
        <div style={styles.referralSection}>
          <h2 style={styles.sectionTitle}>Your Referral Code</h2>
          <div style={styles.referralCard}>
            <div style={styles.referralCodeSection}>
              <div style={styles.codeContainer}>
                <span style={styles.codeLabel}>Referral Code:</span>
                <span style={styles.referralCode}>{referralData.referralCode}</span>
                <button 
                  onClick={() => copyToClipboard(referralData.referralCode)}
                  style={styles.copyButton}
                >
                  {copied ? '✓ Copied!' : '📋 Copy'}
                </button>
              </div>
              
              <div style={styles.linkContainer}>
                <span style={styles.linkLabel}>Referral Link:</span>
                <div style={styles.linkBox}>
                  <span style={styles.referralLink}>{referralData.referralLink}</span>
                  <button 
                    onClick={() => copyToClipboard(referralData.referralLink)}
                    style={styles.copyButton}
                  >
                    {copied ? '✓ Copied!' : '📋 Copy'}
                  </button>
                </div>
              </div>
            </div>
            
            <div style={styles.shareSection}>
              <h3 style={styles.shareTitle}>Share with Friends</h3>
              <div style={styles.shareButtons}>
                <button 
                  onClick={() => shareReferral('whatsapp')}
                  style={{...styles.shareButton, backgroundColor: '#25d366'}}
                >
                  📱 WhatsApp
                </button>
                <button 
                  onClick={() => shareReferral('twitter')}
                  style={{...styles.shareButton, backgroundColor: '#1da1f2'}}
                >
                  🐦 Twitter
                </button>
                <button 
                  onClick={() => shareReferral('facebook')}
                  style={{...styles.shareButton, backgroundColor: '#4267b2'}}
                >
                  📘 Facebook
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* How It Works */}
      <div style={styles.howItWorksSection}>
        <h2 style={styles.sectionTitle}>How It Works</h2>
        <div style={styles.stepsGrid}>
          <div style={styles.step}>
            <div style={styles.stepNumber}>1</div>
            <h3 style={styles.stepTitle}>Share Your Code</h3>
            <p style={styles.stepDescription}>
              Share your unique referral code or link with friends and family
            </p>
          </div>
          
          <div style={styles.step}>
            <div style={styles.stepNumber}>2</div>
            <h3 style={styles.stepTitle}>Friend Registers</h3>
            <p style={styles.stepDescription}>
              Your friend signs up using your referral code and makes their first purchase
            </p>
          </div>
          
          <div style={styles.step}>
            <div style={styles.stepNumber}>3</div>
            <h3 style={styles.stepTitle}>Earn Rewards</h3>
            <p style={styles.stepDescription}>
              You both get ₦2,000 credited to your wallets when they buy their first ticket
            </p>
          </div>
        </div>
      </div>

      {/* Referral History */}
      <div style={styles.historySection}>
        <h2 style={styles.sectionTitle}>Referral History</h2>
        <div style={styles.historyTable}>
          <div style={styles.tableHeader}>
            <span>Referred User</span>
            <span>Date</span>
            <span>Status</span>
            <span>Earnings</span>
          </div>
          
          {referralHistory.map((referral) => (
            <div key={referral.id} style={styles.tableRow}>
              <span style={styles.userName}>{referral.referredUser}</span>
              <span style={styles.date}>
                {new Date(referral.dateReferred).toLocaleDateString()}
              </span>
              <span 
                style={{
                  ...styles.status,
                  backgroundColor: getStatusColor(referral.status)
                }}
              >
                {referral.status}
              </span>
              <span style={styles.earnings}>
                {referral.earnings > 0 ? `₦${referral.earnings.toLocaleString()}` : '-'}
              </span>
            </div>
          ))}
        </div>
        
        {referralHistory.length === 0 && (
          <div style={styles.emptyState}>
            <p>No referrals yet. Start sharing your code to earn rewards!</p>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
    backgroundColor: '#f9fafb',
    minHeight: '100vh',
  },
  loading: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    height: '400px',
    gap: '16px',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #f3f4f6',
    borderTop: '4px solid #3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '30px',
  },
  backButton: {
    padding: '8px 16px',
    backgroundColor: '#6b7280',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#1f2937',
    margin: 0,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '30px',
  },
  statCard: {
    backgroundColor: '#ffffff',
    padding: '24px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e5e7eb',
  },
  statIcon: {
    fontSize: '32px',
    width: '60px',
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: '12px',
  },
  statContent: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  statNumber: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: '14px',
    color: '#6b7280',
  },
  referralSection: {
    marginBottom: '30px',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '16px',
  },
  referralCard: {
    backgroundColor: '#ffffff',
    padding: '30px',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  referralCodeSection: {
    marginBottom: '30px',
  },
  codeContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px',
    flexWrap: 'wrap' as const,
  },
  codeLabel: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
  },
  referralCode: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#3b82f6',
    padding: '8px 16px',
    backgroundColor: '#f0f9ff',
    borderRadius: '8px',
    border: '2px solid #3b82f6',
  },
  copyButton: {
    padding: '8px 16px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  linkContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  linkLabel: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
  },
  linkBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
  },
  referralLink: {
    flex: 1,
    fontSize: '14px',
    color: '#6b7280',
    wordBreak: 'break-all' as const,
  },
  shareSection: {
    borderTop: '1px solid #e5e7eb',
    paddingTop: '20px',
  },
  shareTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '12px',
  },
  shareButtons: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap' as const,
  },
  shareButton: {
    padding: '10px 20px',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  howItWorksSection: {
    marginBottom: '30px',
  },
  stepsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
  },
  step: {
    backgroundColor: '#ffffff',
    padding: '24px',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    textAlign: 'center' as const,
  },
  stepNumber: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#3b82f6',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    fontWeight: 'bold',
    margin: '0 auto 16px',
  },
  stepTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '8px',
  },
  stepDescription: {
    fontSize: '14px',
    color: '#6b7280',
    lineHeight: '1.5',
  },
  historySection: {
    backgroundColor: '#ffffff',
    padding: '24px',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
  },
  historyTable: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1px',
    backgroundColor: '#f3f4f6',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  tableHeader: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr 1fr',
    gap: '16px',
    padding: '16px',
    backgroundColor: '#f9fafb',
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
  },
  tableRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr 1fr',
    gap: '16px',
    padding: '16px',
    backgroundColor: '#ffffff',
    fontSize: '14px',
    alignItems: 'center',
  },
  userName: {
    fontWeight: '500',
    color: '#1f2937',
  },
  date: {
    color: '#6b7280',
  },
  status: {
    padding: '4px 8px',
    borderRadius: '4px',
    color: 'white',
    fontSize: '12px',
    fontWeight: '500',
    textTransform: 'capitalize' as const,
    textAlign: 'center' as const,
  },
  earnings: {
    fontWeight: '600',
    color: '#16a34a',
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '40px',
    color: '#6b7280',
  },
};