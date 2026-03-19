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

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  completed: { label: '✅ Completed', bg: '#ecfdf5', color: '#059669' },
  expired:   { label: '⏰ Expired',   bg: '#fef2f2', color: '#dc2626' },
  cancelled: { label: '❌ Cancelled', bg: '#f3f4f6', color: '#6b7280' },
  active:    { label: '🔄 Active',    bg: '#eef2ff', color: '#4f46e5' },
};

export function GroupBuyStatus({ groupBuy, onJoin, currentUserId }: GroupBuyStatusProps) {
  const [timeRemaining, setTimeRemaining] = useState('');
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const update = () => {
      const diff = new Date(groupBuy.expiresAt).getTime() - Date.now();
      if (diff <= 0) { setTimeRemaining('Expired'); setIsExpired(true); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setTimeRemaining(h > 0 ? `${h}h ${m}m` : `${m}m`);
    };
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, [groupBuy.expiresAt]);

  const progress = (groupBuy.currentParticipants / groupBuy.totalParticipants) * 100;
  const spotsLeft = groupBuy.totalParticipants - groupBuy.currentParticipants;
  const totalCost = groupBuy.pricePerPerson * groupBuy.totalParticipants;
  const canJoin = !isExpired && groupBuy.status === 'active' && spotsLeft > 0 &&
    !groupBuy.participants.some((p) => p.name === currentUserId);

  const statusCfg = STATUS_CONFIG[groupBuy.status] || STATUS_CONFIG.active;

  return (
    <div style={s.root}>

      {/* Header */}
      <div style={s.header}>
        <div style={s.headerTop}>
          <p style={s.tierName}>{groupBuy.tierName} Group Buy</p>
          <span style={{ ...s.statusBadge, backgroundColor: statusCfg.bg, color: statusCfg.color }}>
            {statusCfg.label}
          </span>
        </div>
        <p style={s.organizer}>Organised by {groupBuy.initiatorName}</p>
      </div>

      {/* Progress */}
      <div style={s.progressSection}>
        <div style={s.progressLabels}>
          <span style={s.progressText}>{groupBuy.currentParticipants} of {groupBuy.totalParticipants} joined</span>
          <span style={s.progressPct}>{Math.round(progress)}%</span>
        </div>
        <div style={s.progressTrack}>
          <div style={{ ...s.progressFill, width: `${progress}%` }} />
        </div>
      </div>

      {/* Details */}
      <div style={s.details}>
        {[
          { label: 'Price per person', value: `₦${groupBuy.pricePerPerson.toLocaleString()}` },
          { label: 'Total group cost',  value: `₦${totalCost.toLocaleString()}` },
          { label: 'Time remaining',    value: timeRemaining, valueColor: isExpired ? '#dc2626' : '#111827' },
          { label: 'Spots left',        value: String(spotsLeft) },
        ].map((d) => (
          <div key={d.label} style={s.detailRow}>
            <span style={s.detailKey}>{d.label}</span>
            <span style={{ ...s.detailVal, ...(d.valueColor ? { color: d.valueColor } : {}) }}>{d.value}</span>
          </div>
        ))}
      </div>

      {/* Participants */}
      {groupBuy.participants?.length > 0 && (
        <div style={s.participantsSection}>
          <p style={s.participantsTitle}>Participants</p>
          <div style={s.participantsList}>
            {groupBuy.participants.map((p, i) => (
              <div key={i} style={s.participantRow}>
                <span style={s.participantName}>{p.joined ? '✅' : '⏳'} {p.name}</span>
                {p.paidAt && <span style={s.paidAt}>Paid {new Date(p.paidAt).toLocaleDateString()}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action */}
      {canJoin ? (
        <button onClick={onJoin} style={s.joinBtn}>
          Join Group Buy — ₦{groupBuy.pricePerPerson.toLocaleString()}
        </button>
      ) : (
        <div style={s.statusMsg}>
          {isExpired && 'This group buy has expired'}
          {groupBuy.status === 'completed' && 'This group buy is complete'}
          {groupBuy.status === 'cancelled' && 'This group buy was cancelled'}
          {spotsLeft === 0 && groupBuy.status === 'active' && 'This group buy is full'}
        </div>
      )}

      {groupBuy.status === 'completed' && (
        <div style={s.completedBanner}>
          🎉 Group buy successful! Tickets have been issued to all participants.
        </div>
      )}

    </div>
  );
}

const s = {
  root: { display: 'flex', flexDirection: 'column' as const, gap: '16px', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' },

  header: {},
  headerTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', gap: '12px', flexWrap: 'wrap' as const },
  tierName: { fontSize: '16px', fontWeight: '700', color: '#111827', margin: 0 },
  statusBadge: { fontSize: '12px', fontWeight: '600', padding: '4px 10px', borderRadius: '20px', whiteSpace: 'nowrap' as const },
  organizer: { fontSize: '13px', color: '#9ca3af', margin: 0 },

  progressSection: {},
  progressLabels: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px' },
  progressText: { fontSize: '13.5px', fontWeight: '500', color: '#374151' },
  progressPct: { fontSize: '13.5px', fontWeight: '700', color: '#4f46e5' },
  progressTrack: { width: '100%', height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' },
  progressFill: { height: '100%', background: 'linear-gradient(90deg,#4f46e5,#7c3aed)', borderRadius: '4px', transition: 'width 0.4s ease' },

  details: { backgroundColor: '#f9fafb', borderRadius: '14px', border: '1px solid #f1f3f5', padding: '14px', display: 'flex', flexDirection: 'column' as const, gap: '10px' },
  detailRow: { display: 'flex', justifyContent: 'space-between' },
  detailKey: { fontSize: '13px', color: '#6b7280' },
  detailVal: { fontSize: '13px', fontWeight: '700', color: '#111827' },

  participantsSection: {},
  participantsTitle: { fontSize: '13px', fontWeight: '700', color: '#374151', margin: '0 0 10px', textTransform: 'uppercase' as const, letterSpacing: '0.5px' },
  participantsList: { display: 'flex', flexDirection: 'column' as const, gap: '6px' },
  participantRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', backgroundColor: '#f9fafb', borderRadius: '10px' },
  participantName: { fontSize: '13.5px', color: '#374151' },
  paidAt: { fontSize: '11px', color: '#9ca3af' },

  joinBtn: { width: '100%', padding: '14px', fontSize: '14px', fontWeight: '700', background: 'linear-gradient(135deg,#059669,#047857)', color: '#fff', border: 'none', borderRadius: '14px', cursor: 'pointer' },
  statusMsg: { textAlign: 'center' as const, padding: '13px', backgroundColor: '#f3f4f6', borderRadius: '12px', fontSize: '13.5px', color: '#6b7280' },
  completedBanner: { backgroundColor: '#d1fae5', color: '#065f46', padding: '13px', borderRadius: '12px', fontSize: '13.5px', fontWeight: '500', textAlign: 'center' as const, border: '1px solid #a7f3d0' },
};
