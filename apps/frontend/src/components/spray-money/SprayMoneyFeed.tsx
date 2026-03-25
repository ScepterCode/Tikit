import { useEffect, useState } from 'react';
import { apiService } from '../../services/api';

interface SprayTransaction {
  id: string;
  sprayer_name: string;
  amount: number;
  message: string;
  is_anonymous: boolean;
  created_at: string;
}

interface SprayMoneyFeedProps {
  eventId: string;
  maxItems?: number;
}

export function SprayMoneyFeed({ eventId, maxItems = 10 }: SprayMoneyFeedProps) {
  const [sprays, setSprays] = useState<SprayTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const response = await apiService.request(`/events/${eventId}/spray-money-feed?limit=${maxItems}`, {
          method: 'GET',
          requireAuth: false
        });
        
        if (response.data.success) {
          setSprays(response.data.data.sprays);
          setError(null);
        } else {
          throw new Error('Failed to fetch spray feed');
        }
      } catch (err: any) {
        console.error('Error fetching spray feed:', err);
        setError(err.response?.data?.error?.message || 'Failed to load spray feed');
      } finally {
        setLoading(false);
      }
    };

    fetchFeed();

    // Poll for updates every 3 seconds
    const interval = setInterval(fetchFeed, 3000);

    return () => {
      clearInterval(interval);
    };
  }, [eventId, maxItems]);

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <div style={styles.spinner}></div>
          <p>Loading spray feed...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>
          <p>Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>💸 Recent Sprays</h3>
        <span style={styles.liveIndicator}>
          <span style={styles.liveDot}></span>
          LIVE
        </span>
      </div>

      {sprays.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>💰</div>
          <p style={styles.emptyText}>No sprays yet</p>
          <p style={styles.emptySubtext}>Be the first to spray money!</p>
        </div>
      ) : (
        <div style={styles.feedList}>
          {sprays.map((spray, index) => (
            <div
              key={spray.id}
              style={{
                ...styles.feedItem,
                animation: `slideIn 0.3s ease-out ${index * 0.05}s both`
              }}
            >
              <div style={styles.sprayIcon}>💸</div>
              <div style={styles.sprayContent}>
                <div style={styles.sprayHeader}>
                  <span style={styles.sprayerName}>{spray.sprayer_name}</span>
                  <span style={styles.sprayAmount}>₦{spray.amount.toLocaleString()}</span>
                </div>
                {spray.message && (
                  <div style={styles.sprayMessage}>"{spray.message}"</div>
                )}
                <div style={styles.sprayTime}>
                  {formatTimeAgo(spray.created_at)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const sprayTime = new Date(timestamp);
  const diffMs = now.getTime() - sprayTime.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);

  if (diffSecs < 60) {
    return 'Just now';
  } else if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else {
    return sprayTime.toLocaleDateString();
  }
}

const styles = {
  container: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #e5e7eb',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  loading: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    padding: '40px',
    gap: '16px',
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid #f3f3f3',
    borderTop: '3px solid #667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  error: {
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    padding: '16px',
    borderRadius: '8px',
    textAlign: 'center' as const,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  title: {
    margin: '0',
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
  },
  liveIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#dc2626',
    color: 'white',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
  },
  liveDot: {
    width: '8px',
    height: '8px',
    backgroundColor: 'white',
    borderRadius: '50%',
    animation: 'pulse 2s infinite',
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '40px 20px',
    color: '#6b7280',
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  emptyText: {
    margin: '0 0 8px 0',
    fontSize: '16px',
    fontWeight: '500',
  },
  emptySubtext: {
    margin: '0',
    fontSize: '14px',
  },
  feedList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
    maxHeight: '500px',
    overflowY: 'auto' as const,
  },
  feedItem: {
    display: 'flex',
    gap: '12px',
    padding: '12px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
  },
  sprayIcon: {
    fontSize: '24px',
    flexShrink: 0,
  },
  sprayContent: {
    flex: 1,
    minWidth: 0,
  },
  sprayHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px',
  },
  sprayerName: {
    fontWeight: '600',
    color: '#1f2937',
    fontSize: '14px',
  },
  sprayAmount: {
    fontWeight: '700',
    color: '#059669',
    fontSize: '16px',
  },
  sprayMessage: {
    fontSize: '14px',
    color: '#6b7280',
    fontStyle: 'italic',
    marginBottom: '4px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  sprayTime: {
    fontSize: '12px',
    color: '#9ca3af',
  },
};
