import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Event {
  id: string;
  title: string;
  description: string;
  organizer: string;
  category: string;
  date: string;
  location: string;
  ticketsSold: number;
  totalTickets: number;
  revenue: number;
  status: 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled';
  createdAt: string;
}

export function AdminEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const navigate = useNavigate();

  // Mock data for now - replace with API call
  useEffect(() => {
    const mockEvents: Event[] = [
      {
        id: '1',
        title: 'Lagos Tech Conference 2025',
        description: 'Annual technology conference bringing together innovators',
        organizer: 'Jane Smith',
        category: 'Technology',
        date: '2025-02-15T10:00:00.000Z',
        location: 'Lagos, Nigeria',
        ticketsSold: 450,
        totalTickets: 500,
        revenue: 2250000,
        status: 'published',
        createdAt: '2025-12-20T09:00:00.000Z'
      },
      {
        id: '2',
        title: 'Afrobeats Music Festival',
        description: 'Celebrating the best of African music',
        organizer: 'Mike Johnson',
        category: 'Music',
        date: '2025-03-20T18:00:00.000Z',
        location: 'Abuja, Nigeria',
        ticketsSold: 1200,
        totalTickets: 2000,
        revenue: 6000000,
        status: 'ongoing',
        createdAt: '2025-12-15T14:30:00.000Z'
      },
      {
        id: '3',
        title: 'Business Summit Nigeria',
        description: 'Networking event for entrepreneurs and business leaders',
        organizer: 'Sarah Williams',
        category: 'Business',
        date: '2025-01-25T09:00:00.000Z',
        location: 'Port Harcourt, Nigeria',
        ticketsSold: 300,
        totalTickets: 400,
        revenue: 1500000,
        status: 'completed',
        createdAt: '2025-12-10T11:15:00.000Z'
      },
      {
        id: '4',
        title: 'Art & Culture Exhibition',
        description: 'Showcasing contemporary Nigerian art',
        organizer: 'David Brown',
        category: 'Art',
        date: '2025-04-10T12:00:00.000Z',
        location: 'Kano, Nigeria',
        ticketsSold: 0,
        totalTickets: 300,
        revenue: 0,
        status: 'draft',
        createdAt: '2025-12-28T16:45:00.000Z'
      }
    ];

    setTimeout(() => {
      setEvents(mockEvents);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredEvents = events.filter(event => {
    const matchesSearch = 
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.organizer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || event.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'draft': return '#6b7280';
      case 'published': return '#3b82f6';
      case 'ongoing': return '#16a34a';
      case 'completed': return '#059669';
      case 'cancelled': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const totalRevenue = events.reduce((sum, event) => sum + event.revenue, 0);
  const totalTicketsSold = events.reduce((sum, event) => sum + event.ticketsSold, 0);

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <div style={styles.spinner}></div>
          <p>Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.titleSection}>
          <button onClick={() => navigate('/admin/dashboard')} style={styles.backButton}>
            ← Back
          </button>
          <h1 style={styles.title}>🎉 Event Management</h1>
        </div>
        
        <div style={styles.stats}>
          <div style={styles.statCard}>
            <span style={styles.statNumber}>{events.length}</span>
            <span style={styles.statLabel}>Total Events</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statNumber}>{events.filter(e => e.status === 'published').length}</span>
            <span style={styles.statLabel}>Published</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statNumber}>{totalTicketsSold.toLocaleString()}</span>
            <span style={styles.statLabel}>Tickets Sold</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statNumber}>₦{totalRevenue.toLocaleString()}</span>
            <span style={styles.statLabel}>Total Revenue</span>
          </div>
        </div>
      </div>

      <div style={styles.controls}>
        <input
          type="text"
          placeholder="Search events..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.searchInput}
        />
        
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={styles.filterSelect}
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="ongoing">Ongoing</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeader}>
              <th style={styles.th}>Event</th>
              <th style={styles.th}>Organizer</th>
              <th style={styles.th}>Date & Location</th>
              <th style={styles.th}>Tickets</th>
              <th style={styles.th}>Revenue</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEvents.map((event) => (
              <tr key={event.id} style={styles.tableRow}>
                <td style={styles.td}>
                  <div style={styles.eventInfo}>
                    <div style={styles.eventTitle}>{event.title}</div>
                    <div style={styles.eventCategory}>{event.category}</div>
                    <div style={styles.eventDescription}>{event.description}</div>
                  </div>
                </td>
                <td style={styles.td}>
                  <div style={styles.organizer}>{event.organizer}</div>
                </td>
                <td style={styles.td}>
                  <div>{new Date(event.date).toLocaleDateString()}</div>
                  <div style={styles.location}>{event.location}</div>
                </td>
                <td style={styles.td}>
                  <div style={styles.ticketInfo}>
                    <div>{event.ticketsSold} / {event.totalTickets}</div>
                    <div style={styles.ticketProgress}>
                      <div 
                        style={{
                          ...styles.progressBar,
                          width: `${(event.ticketsSold / event.totalTickets) * 100}%`
                        }}
                      ></div>
                    </div>
                  </div>
                </td>
                <td style={styles.td}>₦{event.revenue.toLocaleString()}</td>
                <td style={styles.td}>
                  <span 
                    style={{
                      ...styles.statusBadge,
                      backgroundColor: getStatusBadgeColor(event.status)
                    }}
                  >
                    {event.status}
                  </span>
                </td>
                <td style={styles.td}>
                  <div style={styles.actions}>
                    <button style={styles.actionButton}>View</button>
                    <button style={styles.actionButton}>Edit</button>
                    <button style={{...styles.actionButton, color: '#dc2626'}}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredEvents.length === 0 && (
        <div style={styles.noResults}>
          <p>No events found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1400px',
    margin: '0 auto',
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
    marginBottom: '30px',
  },
  titleSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '20px',
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
  stats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
  },
  statCard: {
    backgroundColor: '#ffffff',
    padding: '20px',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '8px',
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
  controls: {
    display: 'flex',
    gap: '16px',
    marginBottom: '20px',
    flexWrap: 'wrap' as const,
  },
  searchInput: {
    flex: 1,
    minWidth: '300px',
    padding: '12px 16px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
  },
  filterSelect: {
    padding: '12px 16px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    backgroundColor: 'white',
  },
  tableContainer: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
  },
  tableHeader: {
    backgroundColor: '#f9fafb',
  },
  th: {
    padding: '12px 16px',
    textAlign: 'left' as const,
    fontSize: '12px',
    fontWeight: '600',
    color: '#374151',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  tableRow: {
    borderTop: '1px solid #e5e7eb',
  },
  td: {
    padding: '16px',
    fontSize: '14px',
    color: '#374151',
    verticalAlign: 'top' as const,
  },
  eventInfo: {
    maxWidth: '300px',
  },
  eventTitle: {
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: '4px',
  },
  eventCategory: {
    fontSize: '12px',
    color: '#3b82f6',
    fontWeight: '500',
    marginBottom: '4px',
  },
  eventDescription: {
    fontSize: '12px',
    color: '#6b7280',
    lineHeight: '1.4',
  },
  organizer: {
    fontWeight: '500',
  },
  location: {
    fontSize: '12px',
    color: '#6b7280',
  },
  ticketInfo: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  ticketProgress: {
    width: '80px',
    height: '4px',
    backgroundColor: '#e5e7eb',
    borderRadius: '2px',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#3b82f6',
    transition: 'width 0.3s ease',
  },
  statusBadge: {
    padding: '4px 8px',
    borderRadius: '4px',
    color: 'white',
    fontSize: '12px',
    fontWeight: '500',
    textTransform: 'capitalize' as const,
  },
  actions: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  actionButton: {
    padding: '4px 8px',
    fontSize: '12px',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    backgroundColor: 'white',
    cursor: 'pointer',
    color: '#374151',
  },
  noResults: {
    textAlign: 'center' as const,
    padding: '40px',
    color: '#6b7280',
  },
};