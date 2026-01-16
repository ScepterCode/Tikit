import { useAuth } from '../../contexts/FastAPIAuthContext';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { WeddingAnalytics } from '../../components/events/WeddingAnalytics';
import { SprayMoneyLeaderboard } from '../../components/events/SprayMoneyLeaderboard';

export function OrganizerDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeFeature, setActiveFeature] = useState<string | null>(null);

  // Mock data for demonstration
  const mockEventId = 'demo-wedding-event';

  const handleSprayMoney = async (amount: number, message: string) => {
    console.log('Spray money:', { amount, message });
    alert(`Successfully sprayed ₦${amount.toLocaleString()}! ${message ? `Message: "${message}"` : ''}`);
  };

  const handleCreateHiddenEvent = () => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    alert(`Hidden event created! Access code: ${code}\nShare this code with invitees.`);
  };

  const handleCreateWeddingEvent = () => {
    navigate('/organizer/create-event?template=wedding');
  };

  const handleSetupUSSD = () => {
    alert('USSD Integration Setup:\n\n1. Contact Africa\'s Talking for shortcode\n2. Configure webhook endpoint\n3. Test with *7477#\n\nYour events will be accessible via USSD!');
  };

  return (
    <div style={styles.container}>
      {/* Top Bar */}
      <header style={styles.header}>
        <h1 style={styles.logo}>Grooovy</h1>
        <div style={styles.userMenu}>
          <span style={styles.userName}>{user?.organizationName || user?.firstName}</span>
          <button onClick={() => signOut()} style={styles.logoutButton}>
            Logout
          </button>
        </div>
      </header>

      <div style={styles.layout}>
        {/* Sidebar */}
        <aside style={styles.sidebar}>
          <nav style={styles.nav}>
            <NavItem icon="📊" label="Dashboard" active />
            <NavItem icon="🎉" label="My Events" onClick={() => navigate('/organizer/events')} />
            <NavItem icon="➕" label="Create Event" onClick={() => navigate('/organizer/create-event')} />
            <NavItem icon="👥" label="Attendees" onClick={() => navigate('/organizer/attendees')} />
            <NavItem icon="💰" label="Financials" onClick={() => navigate('/organizer/financials')} />
            <NavItem icon="📢" label="Broadcast" onClick={() => navigate('/organizer/broadcast')} />
            <NavItem icon="📱" label="Scanner" onClick={() => navigate('/organizer/scanner')} />
            <NavItem icon="📊" label="Analytics" onClick={() => setActiveFeature('analytics')} />
            <NavItem icon="💸" label="Spray Money" onClick={() => setActiveFeature('spray-money')} />
            <NavItem icon="⚙️" label="Settings" onClick={() => navigate('/organizer/settings')} />
          </nav>
        </aside>

        {/* Main Content */}
        <main style={styles.main}>
          {/* Feature Modal/Overlay */}
          {activeFeature && (
            <div style={styles.featureOverlay}>
              <div style={styles.featureModal}>
                <div style={styles.featureHeader}>
                  <h2 style={styles.featureModalTitle}>
                    {activeFeature === 'analytics' && '📊 Wedding Analytics'}
                    {activeFeature === 'spray-money' && '💸 Spray Money Leaderboard'}
                  </h2>
                  <button 
                    onClick={() => setActiveFeature(null)}
                    style={styles.closeButton}
                  >
                    ✕
                  </button>
                </div>
                <div style={styles.featureContent}>
                  {activeFeature === 'analytics' && (
                    <WeddingAnalytics eventId={mockEventId} />
                  )}
                  {activeFeature === 'spray-money' && (
                    <SprayMoneyLeaderboard
                      eventId={mockEventId}
                      onSprayMoney={handleSprayMoney}
                      isOnline={true}
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          <div style={styles.titleRow}>
            <div>
              <h2 style={styles.pageTitle}>Dashboard</h2>
              <p style={styles.pageSubtitle}>
                Welcome back, {user?.organizationName || user?.firstName}!
              </p>
            </div>
            <button
              style={styles.createButton}
              onClick={() => navigate('/organizer/create-event')}
            >
              ➕ Create Event
            </button>
          </div>

          {/* Verification Banner */}
          {!user?.isVerified && (
            <div style={styles.banner}>
              <div>
                <strong>⚠️ Account Not Verified</strong>
                <p style={styles.bannerText}>
                  Complete verification to start selling tickets and receiving payments.
                </p>
              </div>
              <button style={styles.bannerButton}>Verify Now</button>
            </div>
          )}

          {/* Stats Cards */}
          <div style={styles.statsGrid}>
            <StatsCard
              icon="🎉"
              title="Total Events"
              value="0"
              subtitle="All time"
              trend="+0%"
              color="#667eea"
            />
            <StatsCard
              icon="🎫"
              title="Tickets Sold"
              value="0"
              subtitle="This month"
              trend="+0%"
              color="#10b981"
            />
            <StatsCard
              icon="💰"
              title="Revenue"
              value="₦0"
              subtitle="This month"
              trend="+0%"
              color="#f59e0b"
            />
            <StatsCard
              icon="👥"
              title="Total Attendees"
              value="0"
              subtitle="All events"
              trend="+0%"
              color="#8b5cf6"
            />
          </div>

          {/* Enhanced Quick Actions */}
          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>Quick Actions</h3>
            <div style={styles.actionsGrid}>
              <ActionCard
                icon="➕"
                title="Create Event"
                description="Set up a new event"
                onClick={() => navigate('/organizer/create-event')}
              />
              <ActionCard
                icon="📱"
                title="Scan Tickets"
                description="Verify attendee tickets"
                onClick={() => navigate('/organizer/scanner')}
              />
              <ActionCard
                icon="📢"
                title="Send Broadcast"
                description="Message your attendees"
                onClick={() => navigate('/organizer/broadcast')}
              />
              <ActionCard
                icon="📊"
                title="View Analytics"
                description="Check event performance"
                onClick={() => navigate('/organizer/analytics')}
              />
            </div>
          </section>

          {/* Feature Creation Section */}
          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>🎉 Create Special Events</h3>
            <div style={styles.featuresGrid}>
              <FeatureCard
                icon="💒"
                title="Wedding Event"
                description="Create wedding with aso-ebi, food RSVP, and spray money"
                badge="Cultural Features"
                onClick={handleCreateWeddingEvent}
              />
              <FeatureCard
                icon="🔒"
                title="Hidden Event"
                description="Create private event with 4-digit access code"
                badge="Private"
                onClick={handleCreateHiddenEvent}
              />
              <FeatureCard
                icon="👥"
                title="Group Buy Event"
                description="Enable group purchases for bulk discounts"
                badge="Save Money"
                onClick={() => navigate('/organizer/create-event?feature=group-buy')}
              />
              <FeatureCard
                icon="📞"
                title="USSD Integration"
                description="Enable ticket sales via *7477# for feature phones"
                badge="No Internet Needed"
                onClick={handleSetupUSSD}
              />
            </div>
          </section>

          {/* Management Features */}
          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>📊 Event Management</h3>
            <div style={styles.managementGrid}>
              <ManagementCard
                icon="💸"
                title="Spray Money Leaderboard"
                description="View live wedding contributions"
                onClick={() => setActiveFeature('spray-money')}
              />
              <ManagementCard
                icon="📊"
                title="Wedding Analytics"
                description="Food RSVP, aso-ebi sales, totals"
                onClick={() => setActiveFeature('analytics')}
              />
              <ManagementCard
                icon="📱"
                title="QR Code Scanner"
                description="Verify tickets with duplicate detection"
                onClick={() => navigate('/organizer/scanner')}
              />
              <ManagementCard
                icon="📢"
                title="WhatsApp Broadcast"
                description="Send messages to all attendees"
                onClick={() => navigate('/organizer/broadcast')}
              />
              <ManagementCard
                icon="💰"
                title="Payment Methods"
                description="Card, bank, Opay, Palmpay, airtime, sponsorship"
                onClick={() => navigate('/organizer/financials')}
              />
              <ManagementCard
                icon="📈"
                title="Real-time Updates"
                description="Live capacity and sales tracking"
                onClick={() => navigate('/organizer/analytics')}
              />
            </div>
          </section>

          {/* Recent Events */}
          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>Recent Events</h3>
            <div style={styles.emptyState}>
              <p style={styles.emptyText}>
                You haven't created any events yet. Get started by creating your first event!
              </p>
              <button
                style={styles.primaryButton}
                onClick={() => navigate('/organizer/create-event')}
              >
                Create Your First Event
              </button>
            </div>
          </section>
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

function StatsCard({
  icon,
  title,
  value,
  subtitle,
  trend,
  color,
}: {
  icon: string;
  title: string;
  value: string;
  subtitle: string;
  trend: string;
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
        <div style={styles.statsFooter}>
          <span style={styles.statsSubtitle}>{subtitle}</span>
          <span style={styles.statsTrend}>{trend}</span>
        </div>
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
      <h4 style={styles.featureTitle}>{title}</h4>
      <p style={styles.featureDescription}>{description}</p>
    </button>
  );
}

// Management Card Component
function ManagementCard({
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
    <button style={styles.managementCard} onClick={onClick}>
      <div style={styles.managementIcon}>{icon}</div>
      <div style={styles.managementContent}>
        <h5 style={styles.managementTitle}>{title}</h5>
        <p style={styles.managementDescription}>{description}</p>
      </div>
      <div style={styles.managementArrow}>→</div>
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
  titleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
  },
  pageTitle: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '4px',
  },
  pageSubtitle: {
    fontSize: '14px',
    color: '#6b7280',
  },
  createButton: {
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '600',
    backgroundColor: '#667eea',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  banner: {
    backgroundColor: '#fef3c7',
    padding: '16px 20px',
    borderRadius: '12px',
    marginBottom: '24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    border: '1px solid #fbbf24',
  },
  bannerText: {
    fontSize: '14px',
    color: '#92400e',
    marginTop: '4px',
  },
  bannerButton: {
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: '600',
    backgroundColor: '#f59e0b',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '20px',
    marginBottom: '32px',
  },
  statsCard: {
    backgroundColor: '#ffffff',
    padding: '20px',
    borderRadius: '12px',
    display: 'flex',
    gap: '16px',
    alignItems: 'flex-start',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
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
    fontSize: '12px',
    color: '#6b7280',
    marginBottom: '4px',
  },
  statsValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '4px',
  },
  statsFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsSubtitle: {
    fontSize: '12px',
    color: '#9ca3af',
  },
  statsTrend: {
    fontSize: '12px',
    color: '#10b981',
    fontWeight: '500',
  },
  section: {
    marginBottom: '32px',
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
    gap: '16px',
  },
  actionCard: {
    backgroundColor: '#ffffff',
    padding: '24px',
    borderRadius: '12px',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left' as const,
    transition: 'all 0.2s',
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
  },
  actionDescription: {
    fontSize: '14px',
    color: '#6b7280',
  },
  emptyState: {
    backgroundColor: '#ffffff',
    padding: '48px',
    borderRadius: '12px',
    textAlign: 'center' as const,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  emptyText: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '16px',
  },
  primaryButton: {
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '600',
    backgroundColor: '#667eea',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
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
    maxWidth: '900px',
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
  featureModalTitle: {
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
  featureTitle: {
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
  // Management Cards
  managementGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '16px',
  },
  managementCard: {
    backgroundColor: '#ffffff',
    padding: '20px',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    cursor: 'pointer',
    textAlign: 'left' as const,
    transition: 'all 0.2s ease',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  managementIcon: {
    fontSize: '24px',
    width: '40px',
    textAlign: 'center' as const,
  },
  managementContent: {
    flex: 1,
  },
  managementTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
    margin: '0 0 4px 0',
  },
  managementDescription: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0,
  },
  managementArrow: {
    fontSize: '18px',
    color: '#9ca3af',
  },
};
