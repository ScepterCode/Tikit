import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
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

const mockEvents: Event[] = [
  {
    id: '1',
    title: 'Lagos Tech Conference 2024',
    description: 'Join the biggest tech conference in West Africa featuring industry leaders and innovators.',
    date: '2024-03-15',
    time: '09:00 AM',
    location: 'Eko Convention Centre, Lagos',
    price: 15000,
    image: '🏢',
    category: 'Technology',
    organizer: 'TechLagos'
  },
  {
    id: '2',
    title: 'Afrobeats Live Concert',
    description: 'Experience the best of Afrobeats with top artists performing live.',
    date: '2024-03-20',
    time: '07:00 PM',
    location: 'National Theatre, Lagos',
    price: 8000,
    image: '🎵',
    category: 'Music',
    organizer: 'Music Events NG'
  },
  {
    id: '3',
    title: 'Nigerian Food Festival',
    description: 'Celebrate Nigerian cuisine with food tastings, cooking demos, and cultural performances.',
    date: '2024-03-25',
    time: '12:00 PM',
    location: 'Tafawa Balewa Square, Lagos',
    price: 3000,
    image: '🍲',
    category: 'Food & Drink',
    organizer: 'Naija Food Co'
  },
  {
    id: '4',
    title: 'Startup Pitch Competition',
    description: 'Watch innovative startups pitch their ideas to top investors.',
    date: '2024-04-01',
    time: '02:00 PM',
    location: 'Co-Creation Hub, Yaba',
    price: 5000,
    image: '💡',
    category: 'Business',
    organizer: 'StartupNG'
  }
];

export function Events() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Technology', 'Music', 'Food & Drink', 'Business', 'Sports', 'Arts'];

  const filteredEvents = mockEvents.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || event.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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

          {/* Events Grid */}
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
        </main>
      </div>
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
};