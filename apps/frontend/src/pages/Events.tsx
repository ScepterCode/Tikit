import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { useNavigate } from 'react-router-dom';
import { AccessCodeModal } from '../components/modals/AccessCodeModal';
import { SecretInviteModal } from '../components/modals/SecretInviteModal';
import { authenticatedFetch } from '../utils/auth';
import { useMembership } from '../hooks/useMembership';
// import { useEventCapacity } from '../hooks/useSupabaseRealtime';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  price: number;
  image: string;
  category: string;
  organizer: string;
}

// Mock events removed - using API data

export function Events() {
  const { user, signOut } = useAuth();
  const { isPremium } = useMembership();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showAccessCodeModal, setShowAccessCodeModal] = useState(false);
  const [showSecretInviteModal, setShowSecretInviteModal] = useState(false);
  const [recommendedEvents, setRecommendedEvents] = useState<Event[]>([]);
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [hasPreferences, setHasPreferences] = useState(false);
  const [loading, setLoading] = useState(true);

  const categories = ['All', 'Technology', 'Music', 'Food & Drink', 'Business', 'Sports', 'Arts'];

  useEffect(() => {
    fetchEvents();
    fetchRecommendedEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch('http://localhost:8000/api/events');
      const data = await response.json();
      
      if (data.success && data.data.events) {
        // Convert backend event format to frontend format
        const formattedEvents = data.data.events.map((event: any) => ({
          id: event.id,
          title: event.title,
          description: event.description,
          date: event.event_date || event.date,
          time: new Date(event.event_date || event.date).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
          }),
          location: event.full_address || event.venue_name || event.location,
          price: event.ticket_price || 0,
          image: event.banner_image_url || '🎉', // Default emoji if no image
          category: event.category || 'General',
          organizer: event.organizer_name || 'Event Organizer'
        }));
        setAllEvents(formattedEvents);
      } else {
        // No events available
        setAllEvents([]);
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
      // Set empty array on error
      setAllEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendedEvents = async () => {
    try {
      const response = await authenticatedFetch('http://localhost:8000/api/events/recommended');
      const data = await response.json();
      
      if (data.success) {
        setRecommendedEvents(data.data.events || []);
        setHasPreferences(data.data.based_on_preferences || false);
      }
    } catch (error) {
      console.error('Error fetching recommended events:', error);
    }
  };

  const filteredEvents = allEvents.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || event.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAccessCodeSuccess = (event: any) => {
    // Navigate to the unlocked event
    navigate(`/events/${event.id}`);
  };

  return (
    <div style={styles.container}>
      {/* Top Bar */}
      <header style={styles.header}>
        <h1 style={styles.logo}>Grooovy</h1>
        <div style={styles.userMenu}>
          <span style={styles.userName}>
            {user?.firstName} {user?.lastName}
          </span>
          <button onClick={() => signOut()} style={styles.logoutButton}>
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
            <NavItem icon="💰" label="Wallet" onClick={() => navigate('/attendee/wallet')} />
            <NavItem icon="🎉" label="Browse Events" active />
            <NavItem icon="🎁" label="Referrals" onClick={() => navigate('/attendee/referrals')} />
            <NavItem icon="👤" label="Profile" onClick={() => navigate('/attendee/profile')} />
          </nav>
        </aside>

        {/* Main Content */}
        <main style={styles.main}>
          <div style={styles.pageHeader}>
            <h2 style={styles.pageTitle}>Browse Events</h2>
            <div style={styles.headerActions}>
              <button
                style={styles.accessCodeButton}
                onClick={() => setShowAccessCodeModal(true)}
              >
                🔐 Have an access code?
              </button>
              {isPremium && (
                <button
                  style={styles.secretInviteButton}
                  onClick={() => setShowSecretInviteModal(true)}
                >
                  ✨ Secret Invite
                </button>
              )}
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.searchInput}
              />
            </div>
          </div>

          {/* Filters */}
          <div style={styles.filters}>
            <div style={styles.categoryFilters}>
              {categories.map((category) => (
                <button
                  key={category}
                  style={{
                    ...styles.categoryButton,
                    ...(selectedCategory === category ? styles.categoryButtonActive : {}),
                  }}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Recommended Events Section */}
          {hasPreferences && recommendedEvents.length > 0 && (
            <div style={styles.recommendedSection}>
              <h3 style={styles.sectionTitle}>✨ Recommended For You</h3>
              <p style={styles.sectionSubtitle}>Based on your interests</p>
              <div style={styles.eventsGrid}>
                {recommendedEvents.slice(0, 4).map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </div>
          )}

          {/* All Events Section */}
          <div style={styles.allEventsSection}>
            <h3 style={styles.sectionTitle}>
              {hasPreferences ? '🎉 All Events' : '🎉 Browse Events'}
            </h3>
            
            {loading ? (
              <div style={styles.loadingState}>
                <div style={styles.spinner}></div>
                <p>Loading events...</p>
              </div>
            ) : (
              <div style={styles.eventsGrid}>
                {filteredEvents.length > 0 ? (
                  filteredEvents.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))
                ) : (
                  <div style={styles.emptyState}>
                    <div style={styles.emptyIcon}>🔍</div>
                    <h3 style={styles.emptyTitle}>No events found</h3>
                    <p style={styles.emptyText}>
                      Try adjusting your search or filter criteria.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Access Code Modal */}
      {showAccessCodeModal && (
        <AccessCodeModal
          onClose={() => setShowAccessCodeModal(false)}
          onSuccess={handleAccessCodeSuccess}
        />
      )}

      {/* Secret Invite Modal */}
      {showSecretInviteModal && (
        <SecretInviteModal
          onClose={() => setShowSecretInviteModal(false)}
          onSuccess={(event) => {
            console.log('Secret event accessed:', event);
            navigate(`/events/${event.id}`);
          }}
        />
      )}
    </div>
  );
}

function EventCard({ event }: { event: Event }) {
  const navigate = useNavigate();

  const handleViewEvent = () => {
    navigate(`/events/${event.id}`);
  };

  const handleBookTicket = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation when clicking book button
    navigate(`/events/${event.id}`);
  };

  return (
    <div style={styles.eventCard} onClick={handleViewEvent}>
      <div style={styles.eventImage}>{event.image}</div>
      <div style={styles.eventContent}>
        <div style={styles.eventCategory}>{event.category}</div>
        <h3 style={styles.eventTitle}>{event.title}</h3>
        <p style={styles.eventDescription}>{event.description}</p>
        
        <div style={styles.eventDetails}>
          <div style={styles.eventDetail}>
            <span style={styles.detailIcon}>📅</span>
            <span>{new Date(event.date).toLocaleDateString()} at {event.time}</span>
          </div>
          <div style={styles.eventDetail}>
            <span style={styles.detailIcon}>📍</span>
            <span>{event.location}</span>
          </div>
          <div style={styles.eventDetail}>
            <span style={styles.detailIcon}>👤</span>
            <span>{event.organizer}</span>
          </div>
        </div>

        <div style={styles.eventFooter}>
          <div style={styles.eventPrice}>₦{event.price.toLocaleString()}</div>
          <button style={styles.bookButton} onClick={handleBookTicket}>
            View Details
          </button>
        </div>
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
    marginBottom: '24px',
  },
  pageTitle: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#1f2937',
    margin: 0,
  },
  headerActions: {
    display: 'flex',
    gap: '12px',
  },
  accessCodeButton: {
    padding: '12px 20px',
    fontSize: '14px',
    fontWeight: '500',
    backgroundColor: '#667eea',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
  },
  secretInviteButton: {
    padding: '12px 20px',
    fontSize: '14px',
    fontWeight: '500',
    backgroundColor: '#8b5cf6',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
  },
  searchInput: {
    padding: '12px 16px',
    fontSize: '14px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    width: '300px',
    outline: 'none',
  },
  filters: {
    marginBottom: '32px',
  },
  recommendedSection: {
    marginBottom: '48px',
  },
  allEventsSection: {
    marginTop: '32px',
  },
  sectionTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '8px',
  },
  sectionSubtitle: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '24px',
  },
  categoryFilters: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap' as const,
  },
  categoryButton: {
    padding: '8px 16px',
    fontSize: '14px',
    backgroundColor: '#ffffff',
    color: '#6b7280',
    border: '1px solid #e5e7eb',
    borderRadius: '20px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  categoryButtonActive: {
    backgroundColor: '#667eea',
    color: '#ffffff',
    borderColor: '#667eea',
  },
  eventsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '24px',
  },
  eventCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.2s',
    cursor: 'pointer',
  },
  eventImage: {
    height: '120px',
    backgroundColor: '#f3f4f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '48px',
  },
  eventContent: {
    padding: '20px',
  },
  eventCategory: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#667eea',
    textTransform: 'uppercase' as const,
    marginBottom: '8px',
  },
  eventTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '8px',
  },
  eventDescription: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '16px',
    lineHeight: '1.5',
  },
  eventDetails: {
    marginBottom: '16px',
  },
  eventDetail: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: '#6b7280',
    marginBottom: '4px',
  },
  detailIcon: {
    fontSize: '14px',
  },
  eventFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventPrice: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#1f2937',
  },
  bookButton: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '600',
    backgroundColor: '#667eea',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  emptyState: {
    gridColumn: '1 / -1',
    backgroundColor: '#ffffff',
    padding: '64px 32px',
    borderRadius: '12px',
    textAlign: 'center' as const,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  emptyIcon: {
    fontSize: '64px',
    marginBottom: '16px',
  },
  emptyTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '8px',
  },
  emptyText: {
    fontSize: '14px',
    color: '#6b7280',
  },
  loadingState: {
    gridColumn: '1 / -1',
    backgroundColor: '#ffffff',
    padding: '64px 32px',
    borderRadius: '12px',
    textAlign: 'center' as const,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '16px',
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid #f3f4f6',
    borderTop: '3px solid #667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
};
