import { useState } from 'react';
import { EventCapacityDisplay } from '../components/realtime/EventCapacityDisplay';
import { useAuth } from '../contexts/ProductionAuthContext';

export function RealtimeDemo() {
  const { user } = useAuth();
  const [eventId, setEventId] = useState('demo-event-1');
  const [ticketsSold, setTicketsSold] = useState(25);
  const [capacity, setCapacity] = useState(100);
  const [loading, setLoading] = useState(false);

  const updateCapacity = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:4000/api/realtime/event-capacity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId,
          ticketsSold,
          capacity
        })
      });

      const result = await response.json();
      
      if (result.success) {
        alert('✅ Event capacity updated! Check the real-time display above.');
      } else {
        alert('❌ Failed to update: ' + result.error);
      }
    } catch (error) {
      alert('❌ Error: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const simulateTicketSale = () => {
    if (ticketsSold < capacity) {
      setTicketsSold(prev => prev + 1);
    }
  };

  const simulateMultipleSales = () => {
    const newSales = Math.min(5, capacity - ticketsSold);
    setTicketsSold(prev => prev + newSales);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>🔴 Real-time Features Demo</h1>
        <p style={styles.subtitle}>
          Hybrid SQLite + Supabase approach demonstration
        </p>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Live Event Capacity</h2>
        <p style={styles.description}>
          This component shows real-time event capacity updates using Supabase real-time subscriptions.
          The main app data is stored in SQLite, but real-time features use Supabase.
        </p>
        
        <div style={styles.demoCard}>
          <h3 style={styles.eventTitle}>🎵 Lagos Music Festival</h3>
          <EventCapacityDisplay 
            eventId={eventId}
            fallbackCapacity={capacity}
            fallbackSold={ticketsSold}
          />
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Test Controls</h2>
        <p style={styles.description}>
          Use these controls to simulate real-time updates. Changes will be reflected immediately in the display above.
        </p>

        <div style={styles.controls}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Event ID:</label>
            <input
              type="text"
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Tickets Sold:</label>
            <input
              type="number"
              value={ticketsSold}
              onChange={(e) => setTicketsSold(parseInt(e.target.value) || 0)}
              min="0"
              max={capacity}
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Total Capacity:</label>
            <input
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(parseInt(e.target.value) || 100)}
              min="1"
              style={styles.input}
            />
          </div>
        </div>

        <div style={styles.buttonGroup}>
          <button
            onClick={simulateTicketSale}
            disabled={ticketsSold >= capacity}
            style={{
              ...styles.button,
              ...styles.primaryButton,
              ...(ticketsSold >= capacity ? styles.disabledButton : {})
            }}
          >
            🎫 Sell 1 Ticket
          </button>

          <button
            onClick={simulateMultipleSales}
            disabled={ticketsSold >= capacity}
            style={{
              ...styles.button,
              ...styles.secondaryButton,
              ...(ticketsSold >= capacity ? styles.disabledButton : {})
            }}
          >
            🎫 Sell 5 Tickets
          </button>

          <button
            onClick={updateCapacity}
            disabled={loading}
            style={{
              ...styles.button,
              ...styles.successButton,
              ...(loading ? styles.disabledButton : {})
            }}
          >
            {loading ? '⏳ Updating...' : '🚀 Update Real-time'}
          </button>
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>How It Works</h2>
        <div style={styles.infoCard}>
          <h3 style={styles.infoTitle}>🏗️ Hybrid Architecture</h3>
          <ul style={styles.list}>
            <li><strong>SQLite:</strong> Stores main application data (users, events, tickets)</li>
            <li><strong>Supabase:</strong> Handles real-time features (capacity updates, notifications)</li>
            <li><strong>Best of Both:</strong> Simple local development + powerful real-time features</li>
          </ul>
        </div>

        <div style={styles.infoCard}>
          <h3 style={styles.infoTitle}>⚡ Real-time Features</h3>
          <ul style={styles.list}>
            <li>Live event capacity updates</li>
            <li>Group buy status tracking</li>
            <li>Wedding spray money leaderboards</li>
            <li>Push notifications</li>
          </ul>
        </div>

        <div style={styles.infoCard}>
          <h3 style={styles.infoTitle}>🔧 Technical Details</h3>
          <ul style={styles.list}>
            <li>Frontend: React hooks with Supabase client</li>
            <li>Backend: Express.js with Supabase service layer</li>
            <li>Real-time: WebSocket subscriptions via Supabase</li>
            <li>Fallback: Works without Supabase connection</li>
          </ul>
        </div>
      </div>

      {user && (
        <div style={styles.userInfo}>
          <p>👤 Logged in as: <strong>{user.firstName} {user.lastName}</strong></p>
          <p>📱 Phone: {user.phoneNumber}</p>
          <p>🎭 Role: {user.role}</p>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '40px',
  },
  title: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '18px',
    color: '#6b7280',
    margin: '0',
  },
  section: {
    marginBottom: '40px',
  },
  sectionTitle: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '12px',
  },
  description: {
    fontSize: '16px',
    color: '#4b5563',
    marginBottom: '20px',
    lineHeight: '1.6',
  },
  demoCard: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '24px',
    borderRadius: '12px',
    marginBottom: '20px',
  },
  eventTitle: {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '16px',
    margin: '0 0 16px 0',
  },
  controls: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '20px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
  },
  input: {
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap' as const,
  },
  button: {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
    color: 'white',
  },
  secondaryButton: {
    backgroundColor: '#6b7280',
    color: 'white',
  },
  successButton: {
    backgroundColor: '#10b981',
    color: 'white',
  },
  disabledButton: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  infoCard: {
    backgroundColor: '#f9fafb',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '16px',
  },
  infoTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '12px',
    margin: '0 0 12px 0',
  },
  list: {
    margin: '0',
    paddingLeft: '20px',
  },
  userInfo: {
    backgroundColor: '#eff6ff',
    padding: '16px',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#1e40af',
  },
};