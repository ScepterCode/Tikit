import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/FastAPIAuthContext';
import { useNavigate } from 'react-router-dom';
import { DashboardNavbar } from '../components/layout/DashboardNavbar';
import { DashboardSidebar, SIDEBAR_WIDTH, SIDEBAR_BREAK } from '../components/layout/DashboardSidebar';

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
    organizer: 'TechLagos',
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
    organizer: 'Music Events NG',
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
    organizer: 'Naija Food Co',
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
    organizer: 'StartupNG',
  },
];

const CATEGORIES = ['All', 'Technology', 'Music', 'Food & Drink', 'Business', 'Sports', 'Arts'];

export function Events() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isMobile, setIsMobile] = useState(window.innerWidth < SIDEBAR_BREAK);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < SIDEBAR_BREAK);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleLogout = async () => { await signOut(); navigate('/'); };

  const filteredEvents = mockEvents.filter((event) => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || event.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const mainPadding = isMobile
    ? '96px 16px 60px'
    : `96px 40px 60px ${SIDEBAR_WIDTH + 40}px`;

  return (
    <div style={s.root}>
      <DashboardNavbar user={user!} onLogout={handleLogout} />
      <DashboardSidebar />

      <main style={{ ...s.main, padding: mainPadding }}>

        {/* Page header */}
        <div style={s.pageHeader}>
          <div>
            <h1 style={s.pageTitle}>Browse Events</h1>
            <p style={s.pageSub}>{filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} available</p>
          </div>
          <div style={s.searchWrapper}>
            <span style={s.searchIcon}>🔍</span>
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={s.searchInput}
            />
          </div>
        </div>

        {/* Category filters */}
        <div style={s.filterBar}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              style={{ ...s.filterChip, ...(selectedCategory === cat ? s.filterChipActive : {}) }}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Events grid */}
        {filteredEvents.length > 0 ? (
          <div style={{ ...s.grid, gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))' }}>
            {filteredEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div style={s.emptyCard}>
            <div style={s.emptyIconWrap}><span style={s.emptyIcon}>🔍</span></div>
            <h3 style={s.emptyTitle}>No events found</h3>
            <p style={s.emptyText}>Try adjusting your search or filter criteria.</p>
          </div>
        )}

      </main>
    </div>
  );
}

function EventCard({ event }: { event: Event }) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={{ ...s.card, ...(hovered ? s.cardHover : {}) }}
      onClick={() => navigate(`/events/${event.id}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={s.cardBanner}>
        <span style={s.cardEmoji}>{event.image}</span>
        <span style={s.categoryPill}>{event.category}</span>
      </div>

      <div style={s.cardBody}>
        <h3 style={s.cardTitle}>{event.title}</h3>
        <p style={s.cardDesc}>{event.description}</p>

        <div style={s.metaList}>
          <div style={s.metaRow}>
            <span style={s.metaIcon}>📅</span>
            <span style={s.metaText}>
              {new Date(event.date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })} · {event.time}
            </span>
          </div>
          <div style={s.metaRow}>
            <span style={s.metaIcon}>📍</span>
            <span style={s.metaText}>{event.location}</span>
          </div>
          <div style={s.metaRow}>
            <span style={s.metaIcon}>🎙️</span>
            <span style={s.metaText}>{event.organizer}</span>
          </div>
        </div>

        <div style={s.cardFooter}>
          <div>
            <p style={s.priceLabel}>From</p>
            <p style={s.priceAmount}>₦{event.price.toLocaleString()}</p>
          </div>
          <button
            style={s.viewBtn}
            onClick={(e) => { e.stopPropagation(); navigate(`/events/${event.id}`); }}
          >
            View Details →
          </button>
        </div>
      </div>
    </div>
  );
}

const s = {
  root: { minHeight: '100vh', backgroundColor: '#f5f6fa', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' },
  main: { maxWidth: '1100px' },

  pageHeader: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' as const },
  pageTitle: { fontSize: '24px', fontWeight: '800', color: '#111827', margin: '0 0 4px' },
  pageSub: { fontSize: '13px', color: '#9ca3af', margin: 0 },

  searchWrapper: { position: 'relative' as const, display: 'flex', alignItems: 'center', flexShrink: 0 },
  searchIcon: { position: 'absolute' as const, left: '12px', fontSize: '14px', pointerEvents: 'none' as const, zIndex: 1 },
  searchInput: { padding: '10px 16px 10px 36px', fontSize: '13.5px', border: '1.5px solid #e5e7eb', borderRadius: '12px', width: '260px', outline: 'none', backgroundColor: '#fff', color: '#111827', boxSizing: 'border-box' as const },

  filterBar: { display: 'flex', gap: '8px', flexWrap: 'wrap' as const, marginBottom: '28px' },
  filterChip: { padding: '7px 16px', fontSize: '13px', fontWeight: '500', backgroundColor: '#fff', color: '#6b7280', border: '1.5px solid #e5e7eb', borderRadius: '20px', cursor: 'pointer', whiteSpace: 'nowrap' as const },
  filterChipActive: { backgroundColor: '#4f46e5', color: '#fff', borderColor: '#4f46e5', fontWeight: '600' },

  grid: { display: 'grid', gap: '20px' },

  // Card
  card: { backgroundColor: '#fff', borderRadius: '20px', overflow: 'hidden', border: '1px solid #f1f3f5', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', cursor: 'pointer', transition: 'all 0.2s ease' },
  cardHover: { transform: 'translateY(-3px)', boxShadow: '0 8px 28px rgba(102,126,234,0.14)', borderColor: '#c7d2fe' },
  cardBanner: { height: '130px', background: 'linear-gradient(135deg,#667eea 0%,#764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' as const, flexShrink: 0 },
  cardEmoji: { fontSize: '48px' },
  categoryPill: { position: 'absolute' as const, top: '10px', right: '10px', fontSize: '10px', fontWeight: '700', color: '#fff', backgroundColor: 'rgba(0,0,0,0.25)', padding: '3px 10px', borderRadius: '20px', letterSpacing: '0.4px', textTransform: 'uppercase' as const },
  cardBody: { padding: '18px', display: 'flex', flexDirection: 'column' as const },
  cardTitle: { fontSize: '16px', fontWeight: '700', color: '#111827', margin: '0 0 5px', lineHeight: '1.35' },
  cardDesc: { fontSize: '13px', color: '#6b7280', margin: '0 0 12px', lineHeight: '1.55', overflow: 'hidden', display: '-webkit-box' as unknown as 'block', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const },

  metaList: { display: 'flex', flexDirection: 'column' as const, gap: '5px', marginBottom: '14px' },
  metaRow: { display: 'flex', alignItems: 'center', gap: '7px' },
  metaIcon: { fontSize: '13px', flexShrink: 0, width: '16px', textAlign: 'center' as const },
  metaText: { fontSize: '12px', color: '#6b7280' },

  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid #f3f4f6', marginTop: 'auto' },
  priceLabel: { fontSize: '11px', color: '#9ca3af', fontWeight: '500', margin: '0 0 1px' },
  priceAmount: { fontSize: '18px', fontWeight: '800', color: '#111827', margin: 0 },
  viewBtn: { padding: '8px 16px', fontSize: '13px', fontWeight: '600', background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', whiteSpace: 'nowrap' as const },

  emptyCard: { backgroundColor: '#fff', borderRadius: '20px', border: '1px solid #f1f3f5', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', padding: '64px 32px', textAlign: 'center' as const, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '12px' },
  emptyIconWrap: { width: '80px', height: '80px', borderRadius: '22px', backgroundColor: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px' },
  emptyIcon: { fontSize: '36px', lineHeight: 1 },
  emptyTitle: { fontSize: '18px', fontWeight: '700', color: '#111827', margin: 0 },
  emptyText: { fontSize: '13px', color: '#9ca3af', margin: 0 },
};
