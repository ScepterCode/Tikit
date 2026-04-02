import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import { useNavigate } from 'react-router-dom';
import { EditEventModal } from '../../components/modals/EditEventModal';
import { LivestreamControls } from '../../components/organizer/LivestreamControls';
import { TicketTierManager } from '../../components/organizer/TicketTierManager';
import { authenticatedFetch } from '../../utils/auth';
import { DashboardLayout } from '../../components/layout/DashboardLayout';

interface Event {
  id: string;
  title: string;
  description: string;
  venue: string;
  start_date: string;
  ticket_price: number;
  total_tickets: number;
  tickets_sold: number;
  category: string;
  status: string;
  organizer_id: string;
}

export function OrganizerEvents() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await authenticatedFetch('http://localhost:8000/api/events');
      const data = await response.json();
      
      if (data.success) {
        // Filter events by current organizer
        const myEvents = data.data.events.filter((event: Event) => 
          event.organizer_id === user?.id
        );
        setEvents(myEvents);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEvent = async (eventId: string, updates: any) => {
    try {
      const response = await authenticatedFetch(`http://localhost:8000/api/events/${eventId}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Event updated successfully!');
        fetchEvents(); // Refresh events list
      } else {
        alert(`Failed to update event: ${data.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  };

  const handleDeleteEvent = async (eventId: string, eventTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${eventTitle}"?`)) {
      return;
    }

    try {
      const response = await authenticatedFetch(`http://localhost:8000/api/events/${eventId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Event deleted successfully!');
        fetchEvents(); // Refresh events list
      } else {
        alert(`Failed to delete event: ${data.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event. Please try again.');
    }
  };

  return (
    <DashboardLayout>
      <div style={styles.container}>
          <div style={styles.titleRow}>
            <div>
              <h2 style={styles.pageTitle}>My Events</h2>
              <p style={styles.pageSubtitle}>
                Manage all your events in one place
              </p>
            </div>
            <button
              style={styles.createButton}
              onClick={() => navigate('/organizer/create-event')}
            >
              ➕ Create Event
            </button>
          </div>

          {/* Events List */}
          <div style={styles.eventsContainer}>
            {loading ? (
              <div style={styles.emptyState}>
                <p>Loading events...</p>
              </div>
            ) : events.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>🎉</div>
                <h3 style={styles.emptyTitle}>No events yet</h3>
                <p style={styles.emptyText}>
                  Create your first event to start selling tickets and managing attendees.
                </p>
                <button
                  style={styles.primaryButton}
                  onClick={() => navigate('/organizer/create-event')}
                >
                  Create Your First Event
                </button>
              </div>
            ) : (
              <div style={styles.eventsGrid}>
                {events.map((event) => (
                  <div key={event.id} style={styles.eventCard}>
                    <div style={styles.eventHeader}>
                      <h3 style={styles.eventTitle}>{event.title}</h3>
                      <span style={styles.eventStatus}>{event.status}</span>
                    </div>
                    
                    {/* Ticket Tier Management */}
                    <TicketTierManager 
                      event={event} 
                      onUpdate={fetchEvents}
                    />
                    
                    {/* Livestream Controls */}
                    {event.enableLivestream && (
                      <LivestreamControls 
                        event={event} 
                        onStatusChange={fetchEvents}
                      />
                    )}
                    
                    <p style={styles.eventDescription}>{event.description}</p>
                    <div style={styles.eventDetails}>
                      <div style={styles.eventDetail}>
                        <span style={styles.eventDetailLabel}>📍 Venue:</span>
                        <span>{event.venue}</span>
                      </div>
                      <div style={styles.eventDetail}>
                        <span style={styles.eventDetailLabel}>📅 Date:</span>
                        <span>{new Date(event.start_date).toLocaleDateString()}</span>
                      </div>
                      <div style={styles.eventDetail}>
                        <span style={styles.eventDetailLabel}>🎫 Tickets:</span>
                        <span>{event.tickets_sold} / {event.total_tickets}</span>
                      </div>
                      <div style={styles.eventDetail}>
                        <span style={styles.eventDetailLabel}>💰 Price:</span>
                        <span>₦{event.ticket_price.toLocaleString()}</span>
                      </div>
                    </div>
                    <div style={styles.eventActions}>
                      <button 
                        style={styles.viewButton}
                        onClick={() => navigate(`/events/${event.id}`)}
                      >
                        View Details
                      </button>
                      <button 
                        style={styles.editButton}
                        onClick={() => setEditingEvent(event)}
                      >
                        Edit
                      </button>
                      <button 
                        style={styles.deleteButton}
                        onClick={() => handleDeleteEvent(event.id, event.title)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
      </div>

      {/* Edit Event Modal */}
      {editingEvent && (
        <EditEventModal
          event={editingEvent}
          onClose={() => setEditingEvent(null)}
          onSave={handleUpdateEvent}
        />
      )}
    </DashboardLayout>
  );
}

const styles = {
  container: {
    width: '100%',
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
  eventsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '32px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '48px 24px',
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
    marginBottom: '24px',
    maxWidth: '400px',
    margin: '0 auto 24px',
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
  eventsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '24px',
  },
  eventCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '24px',
    transition: 'all 0.2s',
    cursor: 'pointer',
  },
  eventHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px',
  },
  eventTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0,
  },
  eventStatus: {
    padding: '4px 12px',
    fontSize: '12px',
    fontWeight: '500',
    backgroundColor: '#d1fae5',
    color: '#065f46',
    borderRadius: '12px',
    textTransform: 'capitalize' as const,
  },
  eventDescription: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '16px',
    lineHeight: '1.5',
  },
  eventDetails: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    marginBottom: '16px',
  },
  eventDetail: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#374151',
  },
  eventDetailLabel: {
    fontWeight: '500',
    minWidth: '80px',
  },
  eventActions: {
    display: 'flex',
    gap: '8px',
    paddingTop: '16px',
    borderTop: '1px solid #e5e7eb',
  },
  viewButton: {
    flex: 1,
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: '500',
    backgroundColor: '#667eea',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  editButton: {
    flex: 1,
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: '500',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  deleteButton: {
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: '500',
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    border: '1px solid #fecaca',
    borderRadius: '6px',
    cursor: 'pointer',
  },
};
