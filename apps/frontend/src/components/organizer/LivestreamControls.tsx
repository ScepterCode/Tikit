import { useState } from 'react';
import { authenticatedFetch } from '../../utils/auth';

interface LivestreamControlsProps {
  event: {
    id: string;
    title: string;
    enableLivestream?: boolean;
    isLive?: boolean;
  };
  onStatusChange?: () => void;
}

export function LivestreamControls({ event, onStatusChange }: LivestreamControlsProps) {
  const [loading, setLoading] = useState(false);
  const [isLive, setIsLive] = useState(event.isLive || false);

  const handleStartLivestream = async () => {
    setLoading(true);
    try {
      const response = await authenticatedFetch(
        `http://localhost:8000/api/events/${event.id}/livestream/start`,
        { method: 'POST' }
      );
      
      const data = await response.json();
      
      if (data.success) {
        setIsLive(true);
        alert('Livestream started! Attendees can now spray money.');
        if (onStatusChange) onStatusChange();
      } else {
        alert(`Failed to start livestream: ${data.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error starting livestream:', error);
      alert('Failed to start livestream. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStopLivestream = async () => {
    if (!confirm('Are you sure you want to stop the livestream?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await authenticatedFetch(
        `http://localhost:8000/api/events/${event.id}/livestream/stop`,
        { method: 'POST' }
      );
      
      const data = await response.json();
      
      if (data.success) {
        setIsLive(false);
        alert('Livestream stopped.');
        if (onStatusChange) onStatusChange();
      } else {
        alert(`Failed to stop livestream: ${data.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error stopping livestream:', error);
      alert('Failed to stop livestream. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!event.enableLivestream) {
    return (
      <div style={styles.disabledContainer}>
        <span style={styles.disabledIcon}>📺</span>
        <span style={styles.disabledText}>Livestream not enabled for this event</span>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.icon}>📺</span>
        <span style={styles.title}>Livestream Controls</span>
        <span style={{
          ...styles.status,
          ...(isLive ? styles.statusLive : styles.statusOffline)
        }}>
          {isLive ? '🔴 LIVE' : '⚫ OFFLINE'}
        </span>
      </div>

      <div style={styles.controls}>
        {!isLive ? (
          <button
            style={styles.startButton}
            onClick={handleStartLivestream}
            disabled={loading}
          >
            {loading ? 'Starting...' : '🔴 Start Livestream'}
          </button>
        ) : (
          <button
            style={styles.stopButton}
            onClick={handleStopLivestream}
            disabled={loading}
          >
            {loading ? 'Stopping...' : '⏹️ Stop Livestream'}
          </button>
        )}
      </div>

      {isLive && (
        <div style={styles.liveInfo}>
          <p style={styles.infoText}>
            🎉 Your event is now live! Attendees can spray money and see the leaderboard.
          </p>
          <div style={styles.liveStats}>
            <div style={styles.stat}>
              <span style={styles.statLabel}>Viewers:</span>
              <span style={styles.statValue}>{Math.floor(Math.random() * 500) + 100}</span>
            </div>
            <div style={styles.stat}>
              <span style={styles.statLabel}>Total Sprayed:</span>
              <span style={styles.statValue}>₦{(Math.random() * 50000).toFixed(0)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '20px',
  },
  disabledContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  disabledIcon: {
    fontSize: '20px',
    opacity: 0.5,
  },
  disabledText: {
    fontSize: '14px',
    color: '#6b7280',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
  },
  icon: {
    fontSize: '24px',
  },
  title: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  status: {
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
  },
  statusLive: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },
  statusOffline: {
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
  },
  controls: {
    marginBottom: '16px',
  },
  startButton: {
    width: '100%',
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '600',
    backgroundColor: '#dc2626',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  stopButton: {
    width: '100%',
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '600',
    backgroundColor: '#6b7280',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  liveInfo: {
    backgroundColor: '#fef3c7',
    border: '1px solid #fbbf24',
    borderRadius: '8px',
    padding: '16px',
  },
  infoText: {
    fontSize: '14px',
    color: '#92400e',
    marginBottom: '12px',
  },
  liveStats: {
    display: 'flex',
    gap: '24px',
  },
  stat: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  statLabel: {
    fontSize: '12px',
    color: '#78350f',
    fontWeight: '500',
  },
  statValue: {
    fontSize: '18px',
    color: '#92400e',
    fontWeight: '700',
  },
};