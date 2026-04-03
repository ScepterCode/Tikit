import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import { useNavigate } from 'react-router-dom';
import { authenticatedFetch } from '../../utils/auth';
import { TicketCard } from '../../components/tickets/TicketCard';
import { DashboardLayout } from '../../components/layout/DashboardLayout';

interface Ticket {
  id: string;
  ticket_code: string;
  qr_code?: string;
  ticket_type: string;
  price: number;
  status: string;
  purchased_at: string;
  event?: {
    title: string;
    event_date: string;
    venue_name: string;
    banner_image_url?: string;
  };
}

export function MyTickets() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'used'>('all');

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch(
        `${import.meta.env.VITE_API_URL}/api/tickets/my-tickets`
      );
      
      const data = await response.json();
      
      if (data.success) {
        setTickets(data.tickets || []);
      } else {
        console.error('Failed to fetch tickets:', data.error);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTicket = (ticket: Ticket) => {
    // Create a printable version
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Ticket - ${ticket.ticket_code}</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                padding: 40px;
                max-width: 600px;
                margin: 0 auto;
              }
              .ticket {
                border: 2px solid #667eea;
                border-radius: 12px;
                padding: 30px;
              }
              .ticket-code {
                font-size: 32px;
                font-weight: bold;
                color: #667eea;
                text-align: center;
                margin: 20px 0;
                letter-spacing: 4px;
                font-family: monospace;
              }
              .qr-code {
                text-align: center;
                margin: 30px 0;
              }
              .qr-code img {
                width: 250px;
                height: 250px;
              }
              .details {
                margin: 20px 0;
              }
              .detail-row {
                display: flex;
                justify-content: space-between;
                padding: 10px 0;
                border-bottom: 1px solid #e5e7eb;
              }
              h1 {
                color: #1f2937;
                text-align: center;
              }
              @media print {
                body {
                  padding: 0;
                }
              }
            </style>
          </head>
          <body>
            <div class="ticket">
              <h1>${ticket.event?.title || 'Event Ticket'}</h1>
              <div class="ticket-code">${ticket.ticket_code}</div>
              <div class="qr-code">
                ${ticket.qr_code ? `<img src="data:image/png;base64,${ticket.qr_code}" alt="QR Code" />` : ''}
              </div>
              <div class="details">
                <div class="detail-row">
                  <span>Ticket Type:</span>
                  <span>${ticket.ticket_type}</span>
                </div>
                <div class="detail-row">
                  <span>Event Date:</span>
                  <span>${ticket.event?.event_date ? new Date(ticket.event.event_date).toLocaleDateString() : 'TBD'}</span>
                </div>
                <div class="detail-row">
                  <span>Venue:</span>
                  <span>${ticket.event?.venue_name || 'TBD'}</span>
                </div>
                <div class="detail-row">
                  <span>Price:</span>
                  <span>₦${ticket.price.toLocaleString()}</span>
                </div>
              </div>
              <p style="text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px;">
                Show this ticket at the event entrance
              </p>
            </div>
            <script>
              window.onload = function() {
                window.print();
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    if (filter === 'all') return true;
    return ticket.status === filter;
  });

  const stats = {
    total: tickets.length,
    active: tickets.filter(t => t.status === 'active').length,
    used: tickets.filter(t => t.status === 'used').length,
  };

  return (
    <DashboardLayout userRole="attendee">
      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>My Tickets</h1>
            <p style={styles.subtitle}>
              View and manage your event tickets
            </p>
          </div>
        </div>

        {/* Stats */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={{...styles.statIcon, color: '#667eea'}}>🎫</div>
            <div style={styles.statContent}>
              <h4 style={styles.statTitle}>Total Tickets</h4>
              <p style={styles.statValue}>{stats.total}</p>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={{...styles.statIcon, color: '#10b981'}}>✅</div>
            <div style={styles.statContent}>
              <h4 style={styles.statTitle}>Active Tickets</h4>
              <p style={styles.statValue}>{stats.active}</p>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={{...styles.statIcon, color: '#6b7280'}}>📋</div>
            <div style={styles.statContent}>
              <h4 style={styles.statTitle}>Used Tickets</h4>
              <p style={styles.statValue}>{stats.used}</p>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div style={styles.filterSection}>
          <button
            onClick={() => setFilter('all')}
            style={{
              ...styles.filterButton,
              ...(filter === 'all' ? styles.filterButtonActive : {})
            }}
          >
            All ({stats.total})
          </button>
          <button
            onClick={() => setFilter('active')}
            style={{
              ...styles.filterButton,
              ...(filter === 'active' ? styles.filterButtonActive : {})
            }}
          >
            Active ({stats.active})
          </button>
          <button
            onClick={() => setFilter('used')}
            style={{
              ...styles.filterButton,
              ...(filter === 'used' ? styles.filterButtonActive : {})
            }}
          >
            Used ({stats.used})
          </button>
        </div>

        {/* Tickets List */}
        {loading ? (
          <div style={styles.loading}>
            <div style={styles.spinner}>⏳</div>
            <p>Loading your tickets...</p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>🎫</div>
            <h3 style={styles.emptyTitle}>No tickets found</h3>
            <p style={styles.emptyText}>
              {filter === 'all' 
                ? "You haven't purchased any tickets yet."
                : `You don't have any ${filter} tickets.`}
            </p>
            <button
              onClick={() => navigate('/events')}
              style={styles.browseButton}
            >
              Browse Events
            </button>
          </div>
        ) : (
          <div style={styles.ticketsList}>
            {filteredTickets.map(ticket => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                onDownload={() => handleDownloadTicket(ticket)}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

const styles = {
  container: {
    padding: '32px',
    maxWidth: '1200px',
    margin: '0 auto',
  } as React.CSSProperties,
  header: {
    marginBottom: '32px',
  } as React.CSSProperties,
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '8px',
  } as React.CSSProperties,
  subtitle: {
    fontSize: '16px',
    color: '#6b7280',
    margin: 0,
  } as React.CSSProperties,
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '32px',
  } as React.CSSProperties,
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  } as React.CSSProperties,
  statIcon: {
    fontSize: '32px',
  } as React.CSSProperties,
  statContent: {
    flex: 1,
  } as React.CSSProperties,
  statTitle: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '4px',
    margin: 0,
  } as React.CSSProperties,
  statValue: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#1f2937',
    margin: 0,
  } as React.CSSProperties,
  filterSection: {
    display: 'flex',
    gap: '12px',
    marginBottom: '24px',
  } as React.CSSProperties,
  filterButton: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '500',
    backgroundColor: '#ffffff',
    color: '#6b7280',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  } as React.CSSProperties,
  filterButtonActive: {
    backgroundColor: '#667eea',
    color: '#ffffff',
    borderColor: '#667eea',
  } as React.CSSProperties,
  loading: {
    textAlign: 'center' as const,
    padding: '60px 20px',
  } as React.CSSProperties,
  spinner: {
    fontSize: '48px',
    marginBottom: '16px',
  } as React.CSSProperties,
  empty: {
    textAlign: 'center' as const,
    padding: '60px 20px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  } as React.CSSProperties,
  emptyIcon: {
    fontSize: '64px',
    marginBottom: '16px',
  } as React.CSSProperties,
  emptyTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '8px',
  } as React.CSSProperties,
  emptyText: {
    fontSize: '16px',
    color: '#6b7280',
    marginBottom: '24px',
  } as React.CSSProperties,
  browseButton: {
    padding: '12px 32px',
    fontSize: '16px',
    fontWeight: '600',
    backgroundColor: '#667eea',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  } as React.CSSProperties,
  ticketsList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
  } as React.CSSProperties,
};
