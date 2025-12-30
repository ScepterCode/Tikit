import React from 'react';
import { useEventCapacity } from '../../hooks/useSupabaseRealtime';

interface EventCapacityDisplayProps {
  eventId: string;
  fallbackCapacity?: number;
  fallbackSold?: number;
}

export function EventCapacityDisplay({ 
  eventId, 
  fallbackCapacity = 100, 
  fallbackSold = 0 
}: EventCapacityDisplayProps) {
  const { capacity, loading, error } = useEventCapacity(eventId);

  // Use real-time data if available, otherwise fall back to props
  const ticketsSold = capacity?.tickets_sold ?? fallbackSold;
  const totalCapacity = capacity?.capacity ?? fallbackCapacity;
  const available = capacity?.available ?? (totalCapacity - ticketsSold);
  const isRealtime = !!capacity;

  const percentageSold = totalCapacity > 0 ? (ticketsSold / totalCapacity) * 100 : 0;
  const isAlmostFull = percentageSold >= 80;
  const isFull = available <= 0;

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingBar}></div>
        <span style={styles.text}>Loading capacity...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={{...styles.progressBar, backgroundColor: '#f3f4f6'}}>
          <div 
            style={{
              ...styles.progress,
              width: `${percentageSold}%`,
              backgroundColor: '#6b7280'
            }}
          />
        </div>
        <span style={styles.text}>
          {ticketsSold}/{totalCapacity} tickets
        </span>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.progressBar}>
        <div 
          style={{
            ...styles.progress,
            width: `${percentageSold}%`,
            backgroundColor: isFull ? '#ef4444' : isAlmostFull ? '#f59e0b' : '#10b981'
          }}
        />
      </div>
      <div style={styles.info}>
        <span style={styles.text}>
          {ticketsSold}/{totalCapacity} tickets
          {isFull && <span style={styles.soldOut}> • SOLD OUT</span>}
          {isAlmostFull && !isFull && <span style={styles.almostFull}> • Almost Full!</span>}
        </span>
        {isRealtime && (
          <span style={styles.realtimeIndicator} title="Real-time updates enabled">
            🔴 LIVE
          </span>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    minWidth: '200px',
  },
  progressBar: {
    width: '100%',
    height: '8px',
    backgroundColor: '#f3f4f6',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  progress: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.3s ease, background-color 0.3s ease',
  },
  loadingBar: {
    width: '100%',
    height: '8px',
    backgroundColor: '#f3f4f6',
    borderRadius: '4px',
    position: 'relative' as const,
    overflow: 'hidden',
    '&::after': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: '-100%',
      width: '100%',
      height: '100%',
      background: 'linear-gradient(90deg, transparent, #667eea, transparent)',
      animation: 'loading 1.5s infinite',
    },
  },
  info: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  text: {
    fontSize: '14px',
    color: '#374151',
    fontWeight: '500',
  },
  soldOut: {
    color: '#ef4444',
    fontWeight: '600',
  },
  almostFull: {
    color: '#f59e0b',
    fontWeight: '600',
  },
  realtimeIndicator: {
    fontSize: '12px',
    color: '#ef4444',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
};