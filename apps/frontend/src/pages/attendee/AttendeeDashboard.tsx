import { useAuth } from '../../contexts/FastAPIAuthContext';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { SprayMoneyLeaderboard } from '../../components/events/SprayMoneyLeaderboard';
import { GroupBuyCreator } from '../../components/tickets/GroupBuyCreator';
import { GroupBuyStatus } from '../../components/tickets/GroupBuyStatus';

export function AttendeeDashboard() {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [activeFeature, setActiveFeature] = useState<string | null>(null);

  // Mock data for demonstration
  const mockEvent = {
    id: 'demo-wedding-event',
    title: 'Sarah & John\'s Wedding',
    tiers: [
      { id: 'vip', name: 'VIP Table', price: 50000, capacity: 20, sold: 5 },
      { id: 'regular', name: 'Regular Seat', price: 25000, capacity: 100, sold: 45 },
      { id: 'standing', name: 'Standing Room', price: 10000, capacity: 200, sold: 120 }
    ]
  };

  const mockGroupBuy = {
    id: 'demo-group-buy',
    eventId: 'demo-wedding-event',
    initiatorName: 'John Organizer',
    tierId: 'regular',
    tierName: 'Regular Seat',
    pricePerPerson: 15000,
    totalParticipants: 5,
    currentParticipants: 3,
    participants: [
      { name: 'Alice Johnson', joined: true, paidAt: '2024-01-15T10:00:00Z' },
      { name: 'Bob Smith', joined: true, paidAt: '2024-01-15T11:00:00Z' },
      { name: 'Carol Davis', joined: true, paidAt: '2024-01-15T12:00:00Z' },
      { name: 'David Wilson', joined: true },
      { name: 'Eve Brown', joined: false }
    ],
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    status: 'active' as const
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const handleSprayMoney = async (amount: number, message: string) => {
    console.log('Spray money:', { amount, message });
    alert(`Successfully sprayed ₦${amount.toLocaleString()}! ${message ? `Message: "${message}"` : ''}`);
  };

  const handleGroupBuyCreated = () => {
    alert('Group buy created successfully! In a real app, this would redirect to the group buy page.');
    setActiveFeature(null);
  };

  const handleAccessHiddenEvent = () => {
    const code = prompt('Enter 4-digit event code:');
    if (code && code.length === 4) {
      alert(`Accessing hidden event with code: ${code}`);
      // In real app, this would validate the code and redirect
    } else {
      alert('Invalid code. Please enter a 4-digit code.');
    }
  };

  // Debug logging
  // console.log('AttendeeDashboard - Auth State:', { user, loading });

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.errorMessage}>
          <h3>Authentication Error</h3>
          <p>Unable to load user data. Please try logging in again.</p>
          <button onClick={() => navigate('/auth/login')} style={styles.loginButton}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.logo}>🎵 Grooovy</h1>
          <span style={styles.roleTag}>Attendee</span>
        </div>
        <div style={styles.headerRight}>
          <div style={styles.userInfo}>
            <span style={styles.userName}>
              {user.firstName} {user.lastName}
            </span>
            <span style={styles.userPhone}>{user.phoneNumber}</span>
          </div>
          <button onClick={handleLogout} style={styles.logoutButton}>
            Logout
          </button>
        </div>
      </header>

      <div style={styles.layout}>
        {/* Sidebar */}
        <aside style={styles.sidebar}>
          <nav style={styles.nav}>
            <NavItem icon="🏠" label="Dashboard" active />
            <NavItem icon="🎫" label="My Tickets" onClick={() => navigate('/attendee/tickets')} />
            <NavItem icon="💰" label="Wallet" onClick={() => navigate('/attendee/wallet')} />
            <NavItem icon="🎉" label="Browse Events" onClick={() => navigate('/events')} />
            <NavItem icon="👥" label="Group Buys" onClick={() => setActiveFeature('group-buy')} />
            <NavItem icon="💸" label="Spray Money" onClick={() => setActiveFeature('spray-money')} />
            <NavItem icon="🔒" label="Hidden Events" onClick={handleAccessHiddenEvent} />
            <NavItem icon="🎁" label="Referrals" onClick={() => navigate('/attendee/referrals')} />
            <NavItem icon="👤" label="Profile" onClick={() => navigate('/attendee/profile')} />
          </nav>
        </aside>

        {/* Main Content */}
        <main style={styles.main}>
          {/* Feature Modal/Overlay */}
          {activeFeature && (
            <div style={styles.featureOverlay}>
              <div style={styles.featureModal}>
                <div style={styles.featureHeader}>
                  <h2 style={styles.featureTitle}>
                    {activeFeature === 'spray-money' && '💸 Spray Money'}
                    {activeFeature === 'group-buy' && '👥 Create Group Buy'}
                    {activeFeature === 'group-buy-status' && '📈 Group Buy Status'}
                  </h2>
                  <button 
                    onClick={() => setActiveFeature(null)}
                    style={styles.closeButton}
                  >
                    ✕
                  </button>
                </div>
                <div style={styles.featureContent}>
                  {activeFeature === 'spray-money' && (
                    <SprayMoneyLeaderboard
                      eventId={mockEvent.id}
                      onSprayMoney={handleSprayMoney}
                      isOnline={true}
                    />
                  )}
                  {activeFeature === 'group-buy' && (
                    <GroupBuyCreator
                      event={mockEvent}
                      onGroupBuyCreated={handleGroupBuyCreated}
                    />
                  )}
                  {activeFeature === 'group-buy-status' && (
                    <GroupBuyStatus 
                      groupBuy={mockGroupBuy} 
                      onJoin={() => console.log('Joining group buy')}
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Welcome Section */}
          <section style={styles.welcomeSection}>
            <h2 style={styles.welcomeTitle}>
              Welcome back, {user.firstName}! 👋
            </h2>
            <p style={styles.welcomeSubtitle}>
              Ready to discover amazing events in {user.state}?
            </p>
          </section>

          {/* Stats Grid */}
          <section style={styles.statsSection}>
            <div style={styles.statsGrid}>
              <StatsCard
                icon="🎫"
                title="Active Tickets"
                value="0"
                subtitle="Ready to use"
                color="#667eea"
              />
              <StatsCard
                icon="💰"
                title="Wallet Balance"
                value={`₦${(user.walletBalance || 0).toLocaleString()}`}
                subtitle="Available funds"
                color="#10b981"
              />
              <StatsCard
                icon="🎁"
                title="Referral Code"
                value={user.referralCode || 'N/A'}
                subtitle="Share with friends"
                color="#f59e0b"
              />
              <StatsCard
                icon="📅"
                title="Upcoming Events"
                value="0"
                subtitle="This month"
                color="#8b5cf6"
              />
            </div>
          </section>

          {/* Enhanced Quick Actions */}
          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>Quick Actions</h3>
            <div style={styles.actionsGrid}>
              <ActionCard
                icon="🔍"
                title="Browse Events"
                description="Discover events near you"
                onClick={() => navigate('/events')}
              />
              <ActionCard
                icon="🎫"
                title="My Tickets"
                description="View your tickets"
                onClick={() => navigate('/attendee/tickets')}
              />
              <ActionCard
                icon="💰"
                title="Add Funds"
                description="Top up your wallet"
                onClick={() => navigate('/attendee/wallet')}
              />
              <ActionCard
                icon="🎁"
                title="Invite Friends"
                description="Earn referral rewards"
                onClick={() => navigate('/attendee/referrals')}
              />
            </div>
          </section>

          {/* Feature Access Section */}
          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>🎉 Special Features</h3>
            <div style={styles.featuresGrid}>
              <FeatureCard
                icon="💸"
                title="Spray Money"
                description="Contribute to wedding celebrations with live leaderboard"
                badge="Live Updates"
                onClick={() => setActiveFeature('spray-money')}
              />
              <FeatureCard
                icon="👥"
                title="Group Buy"
                description="Create group purchases and save money together"
                badge="Save Money"
                onClick={() => setActiveFeature('group-buy')}
              />
              <FeatureCard
                icon="📈"
                title="Group Buy Status"
                description="Track your group buy progress in real-time"
                badge="Real-time"
                onClick={() => setActiveFeature('group-buy-status')}
              />
              <FeatureCard
                icon="🔒"
                title="Hidden Events"
                description="Access private events with special codes"
                badge="Exclusive"
                onClick={handleAccessHiddenEvent}
              />
              <FeatureCard
                icon="📱"
                title="Offline Wallet"
                description="Access your tickets without internet"
                badge="Works Offline"
                onClick={() => navigate('/attendee/wallet')}
              />
              <FeatureCard
                icon="📞"
                title="USSD Access"
                description="Buy tickets via *7477# without internet"
                badge="No Internet Needed"
                onClick={() => alert('Dial *7477# from your phone to access USSD menu')}
              />
            </div>
          </section>

          {/* Payment Methods Section */}
          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>💳 Available Payment Methods</h3>
            <div style={styles.paymentGrid}>
              <PaymentMethodCard icon="💳" name="Card Payment" description="Visa, Mastercard via Paystack" />
              <PaymentMethodCard icon="🏦" name="Bank Transfer" description="Direct bank account transfer" />
              <PaymentMethodCard icon="📱" name="Opay" description="Mobile money payment" />
              <PaymentMethodCard icon="📱" name="Palmpay" description="Mobile money payment" />
              <PaymentMethodCard icon="📞" name="Airtime" description="Pay with phone credit" />
              <PaymentMethodCard icon="🎁" name="Sponsorship" description="Request someone to pay" />
            </div>
          </section>

          {/* User Info */}
          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>Account Information</h3>
            <div style={styles.infoGrid}>
              <InfoItem label="Full Name" value={`${user.firstName || ''} ${user.lastName || ''}`} />
              <InfoItem label="Phone Number" value={user.phoneNumber || 'N/A'} />
              <InfoItem label="Email" value={user.email || 'Not provided'} />
              <InfoItem label="State" value={user.state || 'N/A'} />
              <InfoItem label="Account Type" value={user.role || 'N/A'} />
              <InfoItem label="Verified" value={user.isVerified ? 'Yes' : 'No'} />
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

// Navigation Item Component
function NavItem({ 
  icon, 
  label, 
  active = false, 
  onClick 
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
        ...(active ? styles.navItemActive : {})
      }}
      onClick={onClick}
    >
      <span style={styles.navIcon}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

// Stats Card Component
function StatsCard({
  icon,
  title,
  value,
  subtitle,
  color,
}: {
  icon: string;
  title: string;
  value: string;
  subtitle: string;
  color: string;
}) {
  return (
    <div style={styles.statsCard}>
      <div style={{ ...styles.statsIcon, backgroundColor: color + '20', color }}>
        {icon}
      </div>
      <div style={styles.statsContent}>
        <p style={styles.statsTitle}>{title}</p>
        <p style={styles.statsValue}>{value}</p>
        <p style={styles.statsSubtitle}>{subtitle}</p>
      </div>
    </div>
  );
}

// Feature Card Component
function FeatureCard({
  icon,
  title,
  description,
  badge,
  onClick,
}: {
  icon: string;
  title: string;
  description: string;
  badge: string;
  onClick: () => void;
}) {
  return (
    <button style={styles.featureCard} onClick={onClick}>
      <div style={styles.featureCardHeader}>
        <div style={styles.featureIcon}>{icon}</div>
        <span style={styles.featureBadge}>{badge}</span>
      </div>
      <h4 style={styles.modalFeatureTitle}>{title}</h4>
      <p style={styles.featureDescription}>{description}</p>
    </button>
  );
}

// Payment Method Card Component
function PaymentMethodCard({
  icon,
  name,
  description,
}: {
  icon: string;
  name: string;
  description: string;
}) {
  return (
    <div style={styles.paymentCard}>
      <div style={styles.paymentIcon}>{icon}</div>
      <div style={styles.paymentContent}>
        <h5 style={styles.paymentName}>{name}</h5>
        <p style={styles.paymentDescription}>{description}</p>
      </div>
    </div>
  );
}
function ActionCard({
  icon,
  title,
  description,
  onClick,
}: {
  icon: string;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button style={styles.actionCard} onClick={onClick}>
      <div style={styles.actionIcon}>{icon}</div>
      <h4 style={styles.actionTitle}>{title}</h4>
      <p style={styles.actionDescription}>{description}</p>
    </button>
  );
}

// Info Item Component
function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.infoItem}>
      <span style={styles.infoLabel}>{label}</span>
      <span style={styles.infoValue}>{value}</span>
    </div>
  );
}

// Styles
const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  errorMessage: {
    textAlign: 'center' as const,
    padding: '24px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e5e7eb',
    maxWidth: '400px',
  },
  loginButton: {
    marginTop: '16px',
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '600',
    backgroundColor: '#667eea',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  header: {
    backgroundColor: '#ffffff',
    padding: '16px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  logo: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#667eea',
    margin: 0,
  },
  roleTag: {
    padding: '4px 8px',
    fontSize: '12px',
    backgroundColor: '#f0f9ff',
    color: '#0369a1',
    borderRadius: '4px',
    fontWeight: '500',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'flex-end',
  },
  userName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
  },
  userPhone: {
    fontSize: '12px',
    color: '#6b7280',
  },
  logoutButton: {
    padding: '8px 16px',
    fontSize: '14px',
    backgroundColor: '#f3f4f6',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    cursor: 'pointer',
    color: '#374151',
    fontWeight: '500',
    transition: 'all 0.2s ease',
  },
  layout: {
    display: 'flex',
  },
  sidebar: {
    width: '240px',
    backgroundColor: '#ffffff',
    borderRight: '1px solid #e5e7eb',
    minHeight: 'calc(100vh - 73px)',
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
    transition: 'all 0.2s ease',
    fontWeight: '500',
  },
  navItemActive: {
    backgroundColor: '#f5f7ff',
    color: '#667eea',
    fontWeight: '600',
  },
  navIcon: {
    fontSize: '18px',
  },
  main: {
    flex: 1,
    padding: '32px',
    maxWidth: '1200px',
  },
  welcomeSection: {
    marginBottom: '32px',
  },
  welcomeTitle: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '8px',
    margin: 0,
  },
  welcomeSubtitle: {
    fontSize: '16px',
    color: '#6b7280',
    margin: 0,
  },
  statsSection: {
    marginBottom: '32px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
  },
  statsCard: {
    backgroundColor: '#ffffff',
    padding: '24px',
    borderRadius: '12px',
    display: 'flex',
    gap: '16px',
    alignItems: 'flex-start',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e5e7eb',
  },
  statsIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
  },
  statsContent: {
    flex: 1,
  },
  statsTitle: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '4px',
    margin: 0,
  },
  statsValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '2px',
    margin: 0,
  },
  statsSubtitle: {
    fontSize: '12px',
    color: '#9ca3af',
    margin: 0,
  },
  section: {
    marginBottom: '32px',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '16px',
    margin: 0,
  },
  actionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
  },
  actionCard: {
    backgroundColor: '#ffffff',
    padding: '24px',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    cursor: 'pointer',
    textAlign: 'left' as const,
    transition: 'all 0.2s ease',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  actionIcon: {
    fontSize: '32px',
    marginBottom: '12px',
  },
  actionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '4px',
    margin: 0,
  },
  actionDescription: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0,
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '16px',
    backgroundColor: '#ffffff',
    padding: '24px',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  infoLabel: {
    fontSize: '12px',
    color: '#6b7280',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: '14px',
    color: '#1f2937',
    fontWeight: '600',
  },
  // Feature Modal Styles
  featureOverlay: {
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
    padding: '20px',
  },
  featureModal: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    maxWidth: '800px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },
  featureHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '24px 24px 0 24px',
    borderBottom: '1px solid #e5e7eb',
    marginBottom: '24px',
  },
  featureTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1f2937',
    margin: 0,
  },
  closeButton: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
  },
  featureContent: {
    padding: '0 24px 24px 24px',
  },
  // Feature Cards
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px',
  },
  featureCard: {
    backgroundColor: '#ffffff',
    padding: '24px',
    borderRadius: '16px',
    border: '1px solid #e5e7eb',
    cursor: 'pointer',
    textAlign: 'left' as const,
    transition: 'all 0.2s ease',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    position: 'relative' as const,
  },
  featureCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px',
  },
  featureIcon: {
    fontSize: '32px',
  },
  featureBadge: {
    padding: '4px 8px',
    fontSize: '11px',
    fontWeight: '600',
    backgroundColor: '#f0f9ff',
    color: '#0369a1',
    borderRadius: '12px',
    textTransform: 'uppercase' as const,
  },
  modalFeatureTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '8px',
    margin: 0,
  },
  featureDescription: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0,
    lineHeight: '1.5',
  },
  // Payment Methods
  paymentGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
  },
  paymentCard: {
    backgroundColor: '#ffffff',
    padding: '20px',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  paymentIcon: {
    fontSize: '24px',
    width: '40px',
    textAlign: 'center' as const,
  },
  paymentContent: {
    flex: 1,
  },
  paymentName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1f2937',
    margin: '0 0 4px 0',
  },
  paymentDescription: {
    fontSize: '12px',
    color: '#6b7280',
    margin: 0,
  },
};