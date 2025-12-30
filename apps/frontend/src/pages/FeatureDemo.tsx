import { useState } from 'react';
import { SprayMoneyLeaderboard } from '../components/events/SprayMoneyLeaderboard';
import { WeddingAnalytics } from '../components/events/WeddingAnalytics';
import { GroupBuyCreator } from '../components/tickets/GroupBuyCreator';
import { GroupBuyStatus } from '../components/tickets/GroupBuyStatus';

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

export function FeatureDemo() {
  const [activeTab, setActiveTab] = useState('spray-money');

  const handleSprayMoney = async (amount: number, message: string) => {
    // Simulate spray money transaction
    console.log('Spray money:', { amount, message });
    alert(`Successfully sprayed ₦${amount.toLocaleString()}! ${message ? `Message: "${message}"` : ''}`);
  };

  const handleGroupBuyCreated = () => {
    alert('Group buy created successfully! In a real app, this would redirect to the group buy page.');
  };

  const tabs = [
    { id: 'spray-money', label: '💰 Spray Money Leaderboard', icon: '💰' },
    { id: 'wedding-analytics', label: '📊 Wedding Analytics', icon: '📊' },
    { id: 'group-buy-creator', label: '👥 Create Group Buy', icon: '👥' },
    { id: 'group-buy-status', label: '📈 Group Buy Status', icon: '📈' },
  ];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>🎉 Tikit Feature Demonstration</h1>
        <p style={styles.subtitle}>
          Explore the key features that make Tikit special for Nigerian events
        </p>
      </div>

      <div style={styles.tabContainer}>
        <div style={styles.tabList}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                ...styles.tab,
                ...(activeTab === tab.id ? styles.activeTab : {})
              }}
            >
              <span style={styles.tabIcon}>{tab.icon}</span>
              <span style={styles.tabLabel}>{tab.label}</span>
            </button>
          ))}
        </div>

        <div style={styles.tabContent}>
          {activeTab === 'spray-money' && (
            <div style={styles.featureSection}>
              <div style={styles.featureHeader}>
                <h2>💰 Live Spray Money Leaderboard</h2>
                <p>Real-time wedding money spraying with leaderboard updates</p>
              </div>
              <SprayMoneyLeaderboard
                eventId={mockEvent.id}
                onSprayMoney={handleSprayMoney}
                isOnline={true}
              />
              <div style={styles.featureInfo}>
                <h4>Key Features:</h4>
                <ul>
                  <li>Real-time leaderboard updates using Supabase</li>
                  <li>Quick spray amounts (₦500 - ₦10,000)</li>
                  <li>Custom messages with contributions</li>
                  <li>Live indicator showing real-time updates</li>
                  <li>Top 3 contributors get special medals</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'wedding-analytics' && (
            <div style={styles.featureSection}>
              <div style={styles.featureHeader}>
                <h2>📊 Wedding Analytics Dashboard</h2>
                <p>Comprehensive analytics for wedding organizers</p>
              </div>
              <WeddingAnalytics eventId={mockEvent.id} />
              <div style={styles.featureInfo}>
                <h4>Analytics Include:</h4>
                <ul>
                  <li>Food RSVP breakdown by meal type</li>
                  <li>Aso-ebi sales by tier and color</li>
                  <li>Total spray money collected</li>
                  <li>Ticket sales summary</li>
                  <li>Real-time updates as guests respond</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'group-buy-creator' && (
            <div style={styles.featureSection}>
              <div style={styles.featureHeader}>
                <h2>👥 Group Buy Creator</h2>
                <p>Create group purchases to save money on tickets</p>
              </div>
              <GroupBuyCreator
                event={mockEvent}
                onGroupBuyCreated={handleGroupBuyCreated}
              />
              <div style={styles.featureInfo}>
                <h4>Group Buy Features:</h4>
                <ul>
                  <li>2-100 participants per group</li>
                  <li>Automatic cost calculation and savings display</li>
                  <li>Flexible expiration times (6-72 hours)</li>
                  <li>Individual payment links for each participant</li>
                  <li>Automatic refunds if group doesn't fill</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'group-buy-status' && (
            <div style={styles.featureSection}>
              <div style={styles.featureHeader}>
                <h2>📈 Group Buy Status Tracker</h2>
                <p>Real-time tracking of group buy progress</p>
              </div>
              <GroupBuyStatus groupBuy={mockGroupBuy} />
              <div style={styles.featureInfo}>
                <h4>Status Features:</h4>
                <ul>
                  <li>Real-time participant tracking</li>
                  <li>Payment status for each member</li>
                  <li>Progress bar and countdown timer</li>
                  <li>Automatic completion when full</li>
                  <li>Share links for easy invitation</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={styles.footer}>
        <div style={styles.footerSection}>
          <h3>🚀 Additional Features Available</h3>
          <div style={styles.featureGrid}>
            <div style={styles.featureCard}>
              <h4>🎫 Ticket Verification</h4>
              <p>QR code scanning with offline queue support</p>
            </div>
            <div style={styles.featureCard}>
              <h4>🔒 Hidden Events</h4>
              <p>Private events with 4-digit access codes</p>
            </div>
            <div style={styles.featureCard}>
              <h4>📱 USSD Support</h4>
              <p>Buy tickets via *7477# without internet</p>
            </div>
            <div style={styles.featureCard}>
              <h4>💳 Multiple Payments</h4>
              <p>Card, bank transfer, Opay, Palmpay, airtime</p>
            </div>
            <div style={styles.featureCard}>
              <h4>🌐 Offline Wallet</h4>
              <p>Access tickets without internet connection</p>
            </div>
            <div style={styles.featureCard}>
              <h4>📊 Real-time Updates</h4>
              <p>Live capacity and sales updates via Supabase</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  header: {
    backgroundColor: 'white',
    padding: '32px 24px',
    textAlign: 'center' as const,
    borderBottom: '1px solid #e5e7eb',
  },
  title: {
    margin: '0 0 12px 0',
    fontSize: '36px',
    fontWeight: '700',
    color: '#1f2937',
  },
  subtitle: {
    margin: '0',
    fontSize: '18px',
    color: '#6b7280',
  },
  tabContainer: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '24px',
  },
  tabList: {
    display: 'flex',
    gap: '8px',
    marginBottom: '24px',
    overflowX: 'auto' as const,
    padding: '4px',
    backgroundColor: 'white',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 16px',
    border: 'none',
    backgroundColor: 'transparent',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    color: '#6b7280',
    whiteSpace: 'nowrap' as const,
    transition: 'all 0.2s',
  },
  activeTab: {
    backgroundColor: '#667eea',
    color: 'white',
  },
  tabIcon: {
    fontSize: '16px',
  },
  tabLabel: {
    fontSize: '14px',
  },
  tabContent: {
    backgroundColor: 'white',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    overflow: 'hidden',
  },
  featureSection: {
    padding: '32px',
  },
  featureHeader: {
    marginBottom: '24px',
    textAlign: 'center' as const,
  },
  featureInfo: {
    marginTop: '32px',
    padding: '24px',
    backgroundColor: '#f8fafc',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
  },
  footer: {
    backgroundColor: 'white',
    padding: '48px 24px',
    borderTop: '1px solid #e5e7eb',
  },
  footerSection: {
    maxWidth: '1200px',
    margin: '0 auto',
    textAlign: 'center' as const,
  },
  featureGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
    marginTop: '24px',
  },
  featureCard: {
    padding: '20px',
    backgroundColor: '#f8fafc',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    textAlign: 'left' as const,
  },
};