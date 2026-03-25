import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { SprayMoneyWidget } from '../components/spray-money/SprayMoneyWidget';
import { SprayMoneyFeed } from '../components/spray-money/SprayMoneyFeed';
import { useSprayMoneyLeaderboard } from '../hooks/useSprayMoneyLeaderboard';
import { EventChangeNotification } from '../components/notifications/EventChangeNotification';
import { VideoPlayer } from '../components/livestream/VideoPlayer';
import SecretEventChatModal from '../components/modals/SecretEventChatModal';
import { PurchaseButton } from '../components/tickets/PurchaseButton';

interface TicketTier {
  name: string;
  price: number;
  quantity: number;
  sold: number;
}

interface Event {
  id: string;
  title: string;
  description: string;
  venue: string;
  start_date: string;
  category: string;
  status: string;
  organizer_name: string;
  ticketTiers?: TicketTier[];
  images?: string[];
  enableLivestream?: boolean;
  isLive?: boolean;
  is_secret?: boolean;
  premium_tier_required?: string;
  location_revealed?: boolean;
}

export function EventDetail() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState<number>(0);
  const [quantity, setQuantity] = useState(1);
  const [showChatModal, setShowChatModal] = useState(false);
  const { leaderboard, totalSprayed } = useSprayMoneyLeaderboard(eventId || '');

  useEffect(() => {
    if (eventId) {
      fetchEvent();
    }
  }, [eventId]);

  const fetchEvent = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/events/${eventId}`);
      const data = await response.json();
      
      if (data.success) {
        setEvent(data.data);
      }
    } catch (error) {
      console.error('Error fetching event:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = () => {
    if (!user) {
      alert('Please login to purchase tickets');
      navigate('/login');
      return;
    }

    const tier = event?.ticketTiers?.[selectedTier];
    if (!tier) return;

    // This is now handled by the PurchaseButton component
    // which will open the PaymentModal directly
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading event details...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>Event not found</div>
      </div>
    );
  }

  const selectedTierData = event.ticketTiers?.[selectedTier];
  const totalPrice = (selectedTierData?.price || 0) * quantity;
  const isLivestream = event.enableLivestream && event.isLive;

  return (
    <div style={styles.container}>
      {/* Top Bar */}
      <header style={styles.header}>
        <h1 style={styles.logo} onClick={() => navigate('/')}>Grooovy</h1>
        <div style={styles.userMenu}>
          {user ? (
            <>
              <EventChangeNotification />
              <span style={styles.userName}>
                {user.firstName} {user.lastName}
              </span>
              <button onClick={() => signOut()} style={styles.logoutButton}>
                Logout
              </button>
            </>
          ) : (
            <button onClick={() => navigate('/login')} style={styles.loginButton}>
              Login
            </button>
          )}
        </div>
      </header>

      <main style={styles.main}>
        <button style={styles.backButton} onClick={() => navigate(-1)}>
          ← Back
        </button>

        <div style={styles.content}>
          {/* Left Column - Event Details */}
          <div style={styles.leftColumn}>
            {/* Event Images */}
            {event.images && event.images.length > 0 && (
              <div style={styles.imageGallery}>
                <img 
                  src={event.images[0]} 
                  alt={event.title} 
                  style={styles.mainImage}
                />
                {event.images.length > 1 && (
                  <div style={styles.thumbnails}>
                    {event.images.slice(1).map((img, index) => (
                      <img 
                        key={index}
                        src={img} 
                        alt={`${event.title} ${index + 2}`} 
                        style={styles.thumbnail}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Event Info */}
            <div style={styles.eventInfo}>
              <div style={styles.eventHeader}>
                <div>
                  <span style={styles.category}>{event.category}</span>
                  {event.status !== 'active' && (
                    <span style={{
                      ...styles.statusBadge,
                      backgroundColor: event.status === 'postponed' ? '#fef3c7' : '#fee2e2',
                      color: event.status === 'postponed' ? '#92400e' : '#991b1b'
                    }}>
                      {event.status.toUpperCase()}
                    </span>
                  )}
                </div>
                <h1 style={styles.eventTitle}>{event.title}</h1>
                <p style={styles.organizer}>by {event.organizer_name}</p>
              </div>

              <div style={styles.eventDetails}>
                <div style={styles.detailRow}>
                  <span style={styles.detailIcon}>📅</span>
                  <div>
                    <div style={styles.detailLabel}>Date & Time</div>
                    <div style={styles.detailValue}>
                      {new Date(event.start_date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                      {' at '}
                      {new Date(event.start_date).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>

                <div style={styles.detailRow}>
                  <span style={styles.detailIcon}>📍</span>
                  <div>
                    <div style={styles.detailLabel}>Venue</div>
                    <div style={styles.detailValue}>{event.venue}</div>
                  </div>
                </div>

                {isLivestream && (
                  <div style={styles.livestreamBadge}>
                    <span style={styles.liveIndicator}>🔴 LIVE</span>
                    <span>Livestream Active - Spray Money Available!</span>
                  </div>
                )}
              </div>

              <div style={styles.description}>
                <h3 style={styles.sectionTitle}>About This Event</h3>
                <p style={styles.descriptionText}>{event.description}</p>
              </div>
            </div>
          </div>

          {/* Right Column - Ticket Purchase / Livestream */}
          <div style={styles.rightColumn}>
            {isLivestream ? (
              /* Livestream & Spray Money Section */
              <div style={styles.livestreamSection}>
                <div style={styles.livestreamHeader}>
                  <h3 style={styles.livestreamTitle}>
                    🎥 Live Event
                  </h3>
                  <span style={styles.viewerCount}>
                    👥 {Math.floor(Math.random() * 500) + 100} watching
                  </span>
                </div>

                {/* Livestream Video Placeholder */}
                <VideoPlayer 
                  eventId={eventId || ''}
                  isLive={isLivestream}
                  streamUrl={`https://stream.grooovy.com/live/${eventId}`}
                />

                {/* Spray Money Widget */}
                <div style={styles.spraySection}>
                  <h4 style={styles.spraySectionTitle}>
                    💸 Spray Money
                  </h4>
                  <div style={styles.totalSprayed}>
                    <span style={styles.totalLabel}>Total Sprayed:</span>
                    <span style={styles.totalAmount}>₦{totalSprayed.toLocaleString()}</span>
                  </div>
                  <SprayMoneyWidget 
                    eventId={eventId || ''} 
                    onSuccess={() => {
                      // Refresh leaderboard
                    }}
                  />
                </div>

                {/* Leaderboard */}
                {leaderboard.length > 0 && (
                  <div style={styles.leaderboard}>
                    <h4 style={styles.leaderboardTitle}>🏆 Top Sprayers</h4>
                    <div style={styles.leaderboardList}>
                      {leaderboard.slice(0, 5).map((entry, index) => (
                        <div key={index} style={styles.leaderboardItem}>
                          <span style={styles.rank}>#{entry.rank}</span>
                          <span style={styles.sprayerName}>
                            {entry.is_anonymous ? '🎭 Anonymous' : entry.sprayer_name}
                          </span>
                          <span style={styles.sprayAmount}>
                            ₦{entry.total_amount.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Spray Money Feed */}
                <SprayMoneyFeed eventId={eventId || ''} />
              </div>
            ) : (
              /* Ticket Purchase Section */
              <div style={styles.ticketSection}>
                <h3 style={styles.ticketTitle}>Get Your Tickets</h3>

                {/* Ticket Tiers */}
                {event.ticketTiers && event.ticketTiers.length > 0 ? (
                  <div style={styles.tiersList}>
                    {event.ticketTiers.map((tier, index) => {
                      const available = tier.quantity - tier.sold;
                      const isSelected = selectedTier === index;
                      
                      return (
                        <div
                          key={index}
                          style={{
                            ...styles.tierCard,
                            ...(isSelected ? styles.tierCardSelected : {})
                          }}
                          onClick={() => setSelectedTier(index)}
                        >
                          <div style={styles.tierHeader}>
                            <h4 style={styles.tierName}>{tier.name}</h4>
                            <div style={styles.tierPrice}>₦{tier.price.toLocaleString()}</div>
                          </div>
                          <div style={styles.tierAvailability}>
                            {available > 0 ? (
                              <span style={styles.available}>
                                {available} tickets available
                              </span>
                            ) : (
                              <span style={styles.soldOut}>SOLD OUT</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={styles.noTickets}>
                    No tickets available for this event
                  </div>
                )}

                {/* Quantity Selector */}
                {selectedTierData && (selectedTierData.quantity - selectedTierData.sold) > 0 && (
                  <>
                    <div style={styles.quantitySection}>
                      <label style={styles.quantityLabel}>Quantity:</label>
                      <div style={styles.quantityControls}>
                        <button
                          style={styles.quantityButton}
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        >
                          −
                        </button>
                        <span style={styles.quantityValue}>{quantity}</span>
                        <button
                          style={styles.quantityButton}
                          onClick={() => setQuantity(Math.min(
                            selectedTierData.quantity - selectedTierData.sold,
                            quantity + 1
                          ))}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div style={styles.totalSection}>
                      <span style={styles.totalLabel}>Total:</span>
                      <span style={styles.totalPrice}>₦{totalPrice.toLocaleString()}</span>
                    </div>

                    <PurchaseButton
                      eventId={eventId || ''}
                      eventTitle={event.title}
                      tierName={selectedTierData.name}
                      unitPrice={selectedTierData.price}
                      quantity={quantity}
                      totalAmount={totalPrice}
                      style={styles.purchaseButton}
                    />

                    {/* Secret Event Chat Button */}
                    {event.is_secret && user && (
                      <button
                        style={{
                          ...styles.purchaseButton,
                          backgroundColor: '#8B5CF6',
                          marginTop: '10px'
                        }}
                        onClick={() => setShowChatModal(true)}
                      >
                        🔐 Secret Event Chat
                      </button>
                    )}
                  </>
                )}

                {event.enableLivestream && !event.isLive && (
                  <div style={styles.livestreamInfo}>
                    <span style={styles.infoIcon}>📺</span>
                    <p style={styles.infoText}>
                      This event will be livestreamed. Spray money feature will be available during the live event!
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Secret Event Chat Modal */}
      {event && showChatModal && (
        <SecretEventChatModal
          isOpen={showChatModal}
          onClose={() => setShowChatModal(false)}
          eventId={event.id}
          eventTitle={event.title}
          userRole={user?.user_metadata?.role || 'attendee'}
        />
      )}
    </div>
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
    cursor: 'pointer',
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
  loginButton: {
    padding: '8px 16px',
    fontSize: '14px',
    backgroundColor: '#667eea',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  main: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '32px 24px',
  },
  backButton: {
    padding: '8px 16px',
    fontSize: '14px',
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    cursor: 'pointer',
    marginBottom: '24px',
  },
  content: {
    display: 'grid',
    gridTemplateColumns: '1fr 400px',
    gap: '32px',
  },
  leftColumn: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px',
  },
  rightColumn: {
    position: 'sticky' as const,
    top: '24px',
    height: 'fit-content',
  },
  imageGallery: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  mainImage: {
    width: '100%',
    height: '400px',
    objectFit: 'cover' as const,
  },
  thumbnails: {
    display: 'flex',
    gap: '8px',
    padding: '12px',
  },
  thumbnail: {
    width: '80px',
    height: '80px',
    objectFit: 'cover' as const,
    borderRadius: '6px',
    cursor: 'pointer',
  },
  eventInfo: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '32px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  eventHeader: {
    marginBottom: '24px',
  },
  category: {
    display: 'inline-block',
    padding: '4px 12px',
    fontSize: '12px',
    fontWeight: '600',
    backgroundColor: '#f3f4f6',
    color: '#667eea',
    borderRadius: '12px',
    textTransform: 'uppercase' as const,
    marginRight: '8px',
  },
  statusBadge: {
    display: 'inline-block',
    padding: '4px 12px',
    fontSize: '12px',
    fontWeight: '600',
    borderRadius: '12px',
    textTransform: 'uppercase' as const,
  },
  eventTitle: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: '12px',
    marginBottom: '8px',
  },
  organizer: {
    fontSize: '16px',
    color: '#6b7280',
  },
  eventDetails: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
    marginBottom: '32px',
  },
  detailRow: {
    display: 'flex',
    gap: '16px',
    alignItems: 'flex-start',
  },
  detailIcon: {
    fontSize: '24px',
  },
  detailLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase' as const,
    marginBottom: '4px',
  },
  detailValue: {
    fontSize: '16px',
    color: '#1f2937',
  },
  livestreamBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    backgroundColor: '#fee2e2',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#991b1b',
  },
  liveIndicator: {
    fontSize: '16px',
  },
  description: {
    borderTop: '1px solid #e5e7eb',
    paddingTop: '24px',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '12px',
  },
  descriptionText: {
    fontSize: '16px',
    color: '#374151',
    lineHeight: '1.6',
  },
  ticketSection: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  ticketTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '16px',
  },
  tiersList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
    marginBottom: '24px',
  },
  tierCard: {
    padding: '16px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  tierCardSelected: {
    borderColor: '#667eea',
    backgroundColor: '#f5f7ff',
  },
  tierHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  tierName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0,
  },
  tierPrice: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#667eea',
  },
  tierAvailability: {
    fontSize: '13px',
  },
  available: {
    color: '#059669',
  },
  soldOut: {
    color: '#dc2626',
    fontWeight: '600',
  },
  noTickets: {
    padding: '32px',
    textAlign: 'center' as const,
    color: '#6b7280',
  },
  quantitySection: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  quantityLabel: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
  },
  quantityControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  quantityButton: {
    width: '32px',
    height: '32px',
    fontSize: '18px',
    backgroundColor: '#f3f4f6',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  quantityValue: {
    fontSize: '16px',
    fontWeight: '600',
    minWidth: '32px',
    textAlign: 'center' as const,
  },
  totalSection: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 0',
    borderTop: '1px solid #e5e7eb',
    marginBottom: '16px',
  },
  totalLabel: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#374151',
  },
  totalPrice: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1f2937',
  },
  purchaseButton: {
    width: '100%',
    padding: '14px',
    fontSize: '16px',
    fontWeight: '600',
    backgroundColor: '#667eea',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  livestreamInfo: {
    display: 'flex',
    gap: '12px',
    padding: '16px',
    backgroundColor: '#f3f4f6',
    borderRadius: '8px',
    marginTop: '16px',
  },
  infoIcon: {
    fontSize: '20px',
  },
  infoText: {
    fontSize: '13px',
    color: '#374151',
    margin: 0,
  },
  livestreamSection: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  livestreamHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  livestreamTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0,
  },
  viewerCount: {
    fontSize: '14px',
    color: '#6b7280',
  },
  videoPlaceholder: {
    position: 'relative' as const,
    width: '100%',
    height: '200px',
    backgroundColor: '#1f2937',
    borderRadius: '8px',
    marginBottom: '24px',
    overflow: 'hidden',
  },
  videoOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
  },
  liveTag: {
    padding: '6px 12px',
    backgroundColor: '#dc2626',
    color: '#ffffff',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
  },
  videoText: {
    color: '#ffffff',
    fontSize: '14px',
  },
  spraySection: {
    marginBottom: '24px',
  },
  spraySectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '12px',
  },
  totalSprayed: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: '#fef3c7',
    borderRadius: '8px',
    marginBottom: '16px',
  },
  totalAmount: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#92400e',
  },
  leaderboard: {
    marginTop: '24px',
    paddingTop: '24px',
    borderTop: '1px solid #e5e7eb',
  },
  leaderboardTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '12px',
  },
  leaderboardList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  leaderboardItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 12px',
    backgroundColor: '#f9fafb',
    borderRadius: '6px',
  },
  rank: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#667eea',
    minWidth: '32px',
  },
  sprayerName: {
    flex: 1,
    fontSize: '14px',
    color: '#374151',
  },
  sprayAmount: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#059669',
  },
  loading: {
    padding: '64px',
    textAlign: 'center' as const,
    fontSize: '18px',
    color: '#6b7280',
  },
  error: {
    padding: '64px',
    textAlign: 'center' as const,
    fontSize: '18px',
    color: '#dc2626',
  },
};
