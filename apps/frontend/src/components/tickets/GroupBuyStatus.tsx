import { useState, useEffect } from 'react';

interface GroupBuy {
  id: string;
  eventId: string;
  initiatorName: string;
  totalParticipants: number;
  currentParticipants: number;
  pricePerPerson: number;
  tierId: string;
  tierName: string;
  expiresAt: string;
  status: 'active' | 'completed' | 'expired' | 'cancelled';
  participants: Array<{
    name: string;
    joined: boolean;
    paidAt?: string;
  }>;
}

interface GroupBuyStatusProps {
  groupBuy: GroupBuy;
  onJoin: () => void;
  currentUserId?: string;
}

export function GroupBuyStatus({ groupBuy, onJoin, currentUserId }: GroupBuyStatusProps) {
  const [timeRemaining, setTimeRemaining] = useState('');
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const updateTimeRemaining = () => {
      const now = new Date().getTime();
      const expiry = new Date(groupBuy.expiresAt).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeRemaining('Expired');
        setIsExpired(true);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m`);
      } else {
        setTimeRemaining(`${minutes}m`);
      }
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [groupBuy.expiresAt]);

  const progress = (groupBuy.currentParticipants / groupBuy.totalParticipants) * 100;
  const spotsLeft = groupBuy.totalParticipants - groupBuy.currentParticipants;
  const totalCost = groupBuy.pricePerPerson * groupBuy.totalParticipants;

  const canJoin = !isExpired && 
                  groupBuy.status === 'active' && 
                  spotsLeft > 0 &&
                  !groupBuy.participants.some(p => p.name === currentUserId);

  const getStatusColor = () => {
    switch (groupBuy.status) {
      case 'completed': return '#059669';
      case 'expired': return '#dc2626';
      case 'cancelled': return '#6b7280';
      default: return '#667eea';
    }
  };

  const getStatusText = () => {
    switch (groupBuy.status) {
      case 'completed': return '✅ Completed';
      case 'expired': return '⏰ Expired';
      case 'cancelled': return '❌ Cancelled';
      default: return '🔄 Active';
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.titleRow}>
          <h3 style={styles.title}>{groupBuy.tierName} Group Buy</h3>
          <span style={{
            ...styles.statusBadge,
            backgroundColor: getStatusColor()
          }}>
            {getStatusText()}
          </span>
        </div>
        <p style={styles.organizer}>Organized by {groupBuy.initiatorName}</p>
      </div>

      <div style={styles.progressSection}>
        <div style={styles.progressHeader}>
          <span style={styles.progressText}>
            {groupBuy.currentParticipants} of {groupBuy.totalParticipants} joined
          </span>
          <span style={styles.progressPercent}>{Math.round(progress)}%</span>
        </div>
        <div style={styles.progressBar}>
          <div 
            style={{
              ...styles.progressFill,
              width: `${progress}%`
            }}
          />
        </div>
      </div>

      <div style={styles.details}>
        <div style={styles.detailRow}>
          <span style={styles.detailLabel}>Price per person:</span>
          <span style={styles.detailValue}>₦{groupBuy.pricePerPerson.toLocaleString()}</span>
        </div>
        <div style={styles.detailRow}>
          <span style={styles.detailLabel}>Total group cost:</span>
          <span style={styles.detailValue}>₦{totalCost.toLocaleString()}</span>
        </div>
        <div style={styles.detailRow}>
          <span style={styles.detailLabel}>Time remaining:</span>
          <span style={{
            ...styles.detailValue,
            color: isExpired ? '#dc2626' : '#374151'
          }}>
            {timeRemaining}
          </span>
        </div>
        <div style={styles.detailRow}>
          <span style={styles.detailLabel}>Spots left:</span>
          <span style={styles.detailValue}>{spotsLeft}</span>
        </div>
      </div>

      {groupBuy.participants && groupBuy.participants.length > 0 && (
        <div style={styles.participantsSection}>
          <h4 style={styles.participantsTitle}>Participants:</h4>
          <div style={styles.participantsList}>
            {groupBuy.participants.map((participant, index) => (
              <div key={index} style={styles.participant}>
                <span style={styles.participantName}>
                  {participant.joined ? '✅' : '⏳'} {participant.name}
                </span>
                {participant.paidAt && (
                  <span style={styles.paidAt}>
                    Paid {new Date(participant.paidAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={styles.actions}>
        {canJoin ? (
          <button
            onClick={onJoin}
            style={styles.joinButton}
          >
            Join Group Buy - ₦{groupBuy.pricePerPerson.toLocaleString()}
          </button>
        ) : (
          <div style={styles.statusMessage}>
            {isExpired && 'This group buy has expired'}
            {groupBuy.status === 'completed' && 'This group buy is complete'}
            {groupBuy.status === 'cancelled' && 'This group buy was cancelled'}
            {spotsLeft === 0 && groupBuy.status === 'active' && 'This group buy is full'}
          </div>
        )}
      </div>

      {groupBuy.status === 'completed' && (
        <div style={styles.completedMessage}>
          🎉 Group buy successful! Tickets have been issued to all participants.
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #e5e7eb',
    marginBottom: '16px',
  },
  header: {
    marginBottom: '16px',
  },
  titleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px',
  },
  title: {
    margin: '0',
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
  },
  statusBadge: {
    color: 'white',
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
  },
  organizer: {
    margin: '0',
    fontSize: '14px',
    color: '#6b7280',
  },
  progressSection: {
    marginBottom: '16px',
  },
  progressHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  progressText: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
  },
  progressPercent: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
  },
  progressBar: {
    width: '100%',
    height: '8px',
    backgroundColor: '#e5e7eb',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#059669',
    borderRadius: '4px',
    transition: 'width 0.3s ease',
  },
  details: {
    marginBottom: '16px',
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
  },
  detailLabel: {
    fontSize: '14px',
    color: '#6b7280',
  },
  detailValue: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
  },
  participantsSection: {
    marginBottom: '16px',
  },
  participantsTitle: {
    margin: '0 0 8px 0',
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
  },
  participantsList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  participant: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '4px 0',
  },
  participantName: {
    fontSize: '13px',
    color: '#374151',
  },
  paidAt: {
    fontSize: '12px',
    color: '#6b7280',
  },
  actions: {
    marginBottom: '12px',
  },
  joinButton: {
    width: '100%',
    backgroundColor: '#059669',
    color: 'white',
    border: 'none',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  statusMessage: {
    textAlign: 'center' as const,
    padding: '12px',
    backgroundColor: '#f3f4f6',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#6b7280',
  },
  completedMessage: {
    backgroundColor: '#d1fae5',
    color: '#065f46',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    textAlign: 'center' as const,
  },
};
