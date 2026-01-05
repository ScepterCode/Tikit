import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';
import { TicketSelector } from '../components/tickets/TicketSelector';
import { GroupBuyCreator } from '../components/tickets/GroupBuyCreator';
import { GroupBuyStatus } from '../components/tickets/GroupBuyStatus';
import { SprayMoneyLeaderboard } from '../components/events/SprayMoneyLeaderboard';
import { WeddingTicketPurchase } from '../components/tickets/WeddingTicketPurchase';

interface AsoEbiTier {
  name: string;
  price: number;
  color: string;
}

interface FoodOption {
  name: string;
  dietaryInfo: string;
}

interface Event {
  id: string;
  title: string;
  description: string;
  eventType: string;
  startDate: string;
  endDate: string;
  venue: string;
  state: string;
  lga: string;
  capacity: number;
  ticketsSold: number;
  tiers: EventTier[];
  culturalFeatures?: {
    asoEbiTiers?: AsoEbiTier[];
    foodOptions?: FoodOption[];
    sprayMoneyEnabled?: boolean;
  };
  images?: string[];
  status: string;
  isOnline: boolean;
  streamUrl?: string;
  organizer: {
    id: string;
    name: string;
    organizationName?: string;
  };
}

interface EventTier {
  id: string;
  name: string;
  price: number;
  description: string;
  capacity: number;
  sold: number;
  benefits: string[];
}

export function EventDetails() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user } = useSupabaseAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'tickets' | 'groupbuy' | 'spray'>('details');
  const [groupBuys, setGroupBuys] = useState<any[]>([]);

  useEffect(() => {
    fetchEventDetails();
    fetchGroupBuys();
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      // Mock event data - replace with actual API call
      const mockEvent: Event = {
        id: eventId || '1',
        title: 'Lagos Music Festival 2024',
        description: 'The biggest music festival in West Africa featuring top artists from across the continent. Experience amazing performances, cultural displays, and unforgettable moments.',
        eventType: 'concert',
        startDate: '2024-03-15T18:00:00Z',
        endDate: '2024-03-17T23:00:00Z',
        venue: 'Tafawa Balewa Square, Lagos',
        state: 'Lagos',
        lga: 'Lagos Island',
        capacity: 10000,
        ticketsSold: 3500,
        isOnline: false,
        status: 'published',
        organizer: {
          id: 'org1',
          name: 'Lagos Events Ltd',
          organizationName: 'Lagos Events Limited'
        },
        tiers: [
          {
            id: 'regular',
            name: 'Regular',
            price: 5000,
            description: 'General admission with access to main stage area',
            capacity: 6000,
            sold: 2100,
            benefits: ['Main stage access', 'Food court access', 'Parking']
          },
          {
            id: 'vip',
            name: 'VIP',
            price: 15000,
            description: 'Premium experience with exclusive perks',
            capacity: 2000,
            sold: 800,
            benefits: ['VIP lounge access', 'Complimentary drinks', 'Meet & greet', 'Premium parking', 'Gift bag']
          },
          {
            id: 'vvip',
            name: 'VVIP',
            price: 35000,
            description: 'Ultimate luxury experience',
            capacity: 500,
            sold: 150,
            benefits: ['Backstage access', 'Artist meet & greet', 'Premium meals', 'Dedicated concierge', 'Exclusive merchandise']
          }
        ],
        images: [
          'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800',
          'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800'
        ]
      };

      // Simulate wedding event for spray money demo
      if (eventId === 'wedding-1') {
        mockEvent.title = 'Adebayo & Kemi Wedding';
        mockEvent.eventType = 'wedding';
        mockEvent.description = 'Join us in celebrating the union of Adebayo and Kemi. A beautiful traditional Nigerian wedding with modern touches.';
        mockEvent.venue = 'Grand Ballroom, Eko Hotel';
        mockEvent.isOnline = true;
        mockEvent.streamUrl = 'https://stream.example.com/wedding-123';
      }

      setEvent(mockEvent);
    } catch (error) {
      console.error('Error fetching event:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupBuys = async () => {
    try {
      // Mock group buy data
      const mockGroupBuys = [
        {
          id: 'gb1',
          eventId: eventId,
          initiatorName: 'John Doe',
          totalParticipants: 5,
          currentParticipants: 3,
          pricePerPerson: 4000,
          tierId: 'regular',
          tierName: 'Regular',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          participants: [
            { name: 'John Doe', joined: true },
            { name: 'Jane Smith', joined: true },
            { name: 'Mike Johnson', joined: true },
            { name: 'Waiting...', joined: false },
            { name: 'Waiting...', joined: false }
          ]
        }
      ];
      setGroupBuys(mockGroupBuys);
    } catch (error) {
      console.error('Error fetching group buys:', error);
    }
  };

  const handleTicketPurchase = (tierIds: string[], quantities: number[], paymentMethod: string) => {
    // Navigate to checkout
    const purchaseData = {
      eventId: event?.id,
      items: tierIds.map((tierId, index) => ({
        tierId,
        quantity: quantities[index],
        price: event?.tiers.find(t => t.id === tierId)?.price || 0
      })),
      paymentMethod
    };
    
    navigate('/checkout', { state: { purchaseData } });
  };

  const handleGroupBuyJoin = async (groupBuyId: string) => {
    try {
      // Mock API call
      console.log('Joining group buy:', groupBuyId);
      // Refresh group buys
      await fetchGroupBuys();
    } catch (error) {
      console.error('Error joining group buy:', error);
    }
  };

  const handleSprayMoney = async (amount: number, message: string) => {
    try {
      // Mock API call for spray money
      console.log('Spraying money:', { amount, message, eventId });
      alert(`Successfully sprayed ₦${amount.toLocaleString()}! 🎉`);
    } catch (error) {
      console.error('Error spraying money:', error);
    }
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner}></div>
        <p>Loading event details...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div style={styles.error}>
        <h2>Event not found</h2>
        <button onClick={() => navigate('/events')} style={styles.backButton}>
          Back to Events
        </button>
      </div>
    );
  }

  const availableTickets = event.capacity - event.ticketsSold;
  const isWedding = event.eventType === 'wedding';

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button onClick={() => navigate('/events')} style={styles.backButton}>
          ← Back to Events
        </button>
        <div style={styles.eventInfo}>
          <h1 style={styles.title}>{event.title}</h1>
          <div style={styles.meta}>
            <span style={styles.metaItem}>📅 {new Date(event.startDate).toLocaleDateString()}</span>
            <span style={styles.metaItem}>📍 {event.venue}</span>
            <span style={styles.metaItem}>🎫 {availableTickets} tickets left</span>
            {event.isOnline && <span style={styles.onlineBadge}>🔴 LIVE STREAM</span>}
          </div>
        </div>
      </div>

      {/* Event Images */}
      {event.images && event.images.length > 0 && (
        <div style={styles.imageGallery}>
          <img src={event.images[0]} alt={event.title} style={styles.mainImage} />
        </div>
      )}

      {/* Navigation Tabs */}
      <div style={styles.tabs}>
        <button
          onClick={() => setActiveTab('details')}
          style={{
            ...styles.tab,
            ...(activeTab === 'details' ? styles.activeTab : {})
          }}
        >
          📋 Details
        </button>
        <button
          onClick={() => setActiveTab('tickets')}
          style={{
            ...styles.tab,
            ...(activeTab === 'tickets' ? styles.activeTab : {})
          }}
        >
          🎫 Buy Tickets
        </button>
        <button
          onClick={() => setActiveTab('groupbuy')}
          style={{
            ...styles.tab,
            ...(activeTab === 'groupbuy' ? styles.activeTab : {})
          }}
        >
          👥 Group Buy
        </button>
        {isWedding && (
          <button
            onClick={() => setActiveTab('spray')}
            style={{
              ...styles.tab,
              ...(activeTab === 'spray' ? styles.activeTab : {})
            }}
          >
            💰 Spray Money
          </button>
        )}
      </div>

      {/* Tab Content */}
      <div style={styles.tabContent}>
        {activeTab === 'details' && (
          <div style={styles.detailsTab}>
            <div style={styles.section}>
              <h3>About This Event</h3>
              <p style={styles.description}>{event.description}</p>
            </div>

            <div style={styles.section}>
              <h3>Event Details</h3>
              <div style={styles.detailsGrid}>
                <div style={styles.detailItem}>
                  <strong>Date & Time:</strong>
                  <span>{new Date(event.startDate).toLocaleString()} - {new Date(event.endDate).toLocaleString()}</span>
                </div>
                <div style={styles.detailItem}>
                  <strong>Venue:</strong>
                  <span>{event.venue}</span>
                </div>
                <div style={styles.detailItem}>
                  <strong>Location:</strong>
                  <span>{event.lga}, {event.state}</span>
                </div>
                <div style={styles.detailItem}>
                  <strong>Capacity:</strong>
                  <span>{event.capacity.toLocaleString()} attendees</span>
                </div>
                <div style={styles.detailItem}>
                  <strong>Organizer:</strong>
                  <span>{event.organizer.organizationName || event.organizer.name}</span>
                </div>
                {event.isOnline && (
                  <div style={styles.detailItem}>
                    <strong>Live Stream:</strong>
                    <span>Available for all ticket holders</span>
                  </div>
                )}
              </div>
            </div>

            <div style={styles.section}>
              <h3>Ticket Tiers</h3>
              <div style={styles.tiersGrid}>
                {event.tiers.map(tier => (
                  <div key={tier.id} style={styles.tierCard}>
                    <h4>{tier.name}</h4>
                    <div style={styles.tierPrice}>₦{tier.price.toLocaleString()}</div>
                    <p>{tier.description}</p>
                    <div style={styles.tierAvailability}>
                      {tier.capacity - tier.sold} of {tier.capacity} available
                    </div>
                    <ul style={styles.benefitsList}>
                      {tier.benefits.map((benefit, index) => (
                        <li key={index}>✓ {benefit}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tickets' && (
          <div style={styles.ticketsTab}>
            {isWedding ? (
              <WeddingTicketPurchase
                event={event}
                onPurchase={handleTicketPurchase}
                onSprayMoney={handleSprayMoney}
              />
            ) : (
              <TicketSelector
                event={event}
                onPurchase={handleTicketPurchase}
              />
            )}
          </div>
        )}

        {activeTab === 'groupbuy' && (
          <div style={styles.groupBuyTab}>
            <div style={styles.section}>
              <h3>Join a Group Buy</h3>
              <p>Save money by joining or creating a group purchase!</p>
              
              {groupBuys.length > 0 ? (
                <div style={styles.groupBuyList}>
                  {groupBuys.map(groupBuy => (
                    <GroupBuyStatus
                      key={groupBuy.id}
                      groupBuy={groupBuy}
                      onJoin={() => handleGroupBuyJoin(groupBuy.id)}
                      currentUserId={user?.id}
                    />
                  ))}
                </div>
              ) : (
                <div style={styles.noGroupBuys}>
                  <p>No active group buys for this event.</p>
                </div>
              )}
            </div>

            <div style={styles.section}>
              <h3>Create a Group Buy</h3>
              <GroupBuyCreator
                event={event}
                onGroupBuyCreated={fetchGroupBuys}
              />
            </div>
          </div>
        )}

        {activeTab === 'spray' && isWedding && (
          <div style={styles.sprayTab}>
            <SprayMoneyLeaderboard
              eventId={event.id}
              onSprayMoney={handleSprayMoney}
              isOnline={event.isOnline}
            />
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  loading: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    height: '50vh',
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
  error: {
    textAlign: 'center' as const,
    padding: '40px',
  },
  header: {
    marginBottom: '24px',
  },
  backButton: {
    background: 'none',
    border: '1px solid #ddd',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    marginBottom: '16px',
    fontSize: '14px',
  },
  eventInfo: {
    marginBottom: '16px',
  },
  title: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '8px',
    margin: '0 0 8px 0',
  },
  meta: {
    display: 'flex',
    gap: '24px',
    flexWrap: 'wrap' as const,
    fontSize: '14px',
    color: '#6b7280',
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  onlineBadge: {
    backgroundColor: '#ef4444',
    color: 'white',
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
  },
  imageGallery: {
    marginBottom: '24px',
  },
  mainImage: {
    width: '100%',
    height: '300px',
    objectFit: 'cover' as const,
    borderRadius: '12px',
  },
  tabs: {
    display: 'flex',
    borderBottom: '1px solid #e5e7eb',
    marginBottom: '24px',
  },
  tab: {
    background: 'none',
    border: 'none',
    padding: '12px 24px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    color: '#6b7280',
    borderBottom: '2px solid transparent',
  },
  activeTab: {
    color: '#667eea',
    borderBottomColor: '#667eea',
  },
  tabContent: {
    minHeight: '400px',
  },
  detailsTab: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '32px',
  },
  section: {
    marginBottom: '32px',
  },
  description: {
    fontSize: '16px',
    lineHeight: '1.6',
    color: '#4b5563',
  },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '16px',
  },
  detailItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  tiersGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
  },
  tierCard: {
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '20px',
    backgroundColor: '#f9fafb',
  },
  tierPrice: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#059669',
    margin: '8px 0',
  },
  tierAvailability: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '8px 0',
  },
  benefitsList: {
    listStyle: 'none',
    padding: '0',
    margin: '12px 0 0 0',
  },
  ticketsTab: {
    // Styles handled by TicketSelector component
  },
  groupBuyTab: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '32px',
  },
  groupBuyList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  noGroupBuys: {
    textAlign: 'center' as const,
    padding: '40px',
    color: '#6b7280',
  },
  sprayTab: {
    // Styles handled by SprayMoneyLeaderboard component
  },
};