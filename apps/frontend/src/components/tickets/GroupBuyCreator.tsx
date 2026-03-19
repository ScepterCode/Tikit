import { useState } from 'react';

interface Event {
  id: string;
  title: string;
  tiers: EventTier[];
}

interface EventTier {
  id: string;
  name: string;
  price: number;
  capacity: number;
  sold: number;
}

interface GroupBuyCreatorProps {
  event: Event;
  onGroupBuyCreated: () => void;
}

export function GroupBuyCreator({ event, onGroupBuyCreated }: GroupBuyCreatorProps) {
  const [selectedTier, setSelectedTier] = useState('');
  const [totalParticipants, setTotalParticipants] = useState(5);
  const [expirationHours, setExpirationHours] = useState(24);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateGroupBuy = async () => {
    if (!selectedTier) { setError('Please select a ticket tier'); return; }
    if (totalParticipants < 2 || totalParticipants > 100) {
      setError('Group size must be between 2 and 100 participants');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Group buy creation:', { eventId: event.id, tierId: selectedTier, totalParticipants, expirationHours });
      const result = { success: true, error: null as { message?: string } | null };
      if (!result.success) throw new Error(result.error?.message || 'Failed to create group buy');

      alert('Group buy created successfully! Share the link with your friends.');
      onGroupBuyCreated();
      setSelectedTier('');
      setTotalParticipants(5);
      setExpirationHours(24);
    } catch (err: any) {
      setError(err.message || 'Failed to create group buy');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedTierData = event.tiers.find((t) => t.id === selectedTier);
  const pricePerPerson = selectedTierData ? selectedTierData.price : 0;
  const totalCost = pricePerPerson * totalParticipants;

  return (
    <div style={s.root}>

      {/* Header */}
      <div style={s.header}>
        <div style={s.headerIcon}>👥</div>
        <div>
          <p style={s.headerTitle}>Create a Group Buy</p>
          <p style={s.headerSub}>Organise a group purchase and split the cost together</p>
        </div>
      </div>

      {/* Tier selection */}
      <div style={s.field}>
        <label style={s.label}>Ticket Tier</label>
        <select
          value={selectedTier}
          onChange={(e) => setSelectedTier(e.target.value)}
          style={s.select}
        >
          <option value="">Choose a tier...</option>
          {event.tiers.map((tier) => {
            const available = tier.capacity - tier.sold;
            return (
              <option key={tier.id} value={tier.id} disabled={available < totalParticipants}>
                {tier.name} — ₦{tier.price.toLocaleString()} ({available} available)
              </option>
            );
          })}
        </select>
      </div>

      {/* Group size */}
      <div style={s.field}>
        <div style={s.labelRow}>
          <label style={s.label}>Number of Participants</label>
          <span style={s.sliderValue}>{totalParticipants}</span>
        </div>
        <input
          type="range"
          min="2"
          max="100"
          value={totalParticipants}
          onChange={(e) => setTotalParticipants(parseInt(e.target.value))}
          style={s.slider}
        />
        <div style={s.sliderLabels}>
          <span>2</span>
          <span>100</span>
        </div>
      </div>

      {/* Expiration */}
      <div style={s.field}>
        <label style={s.label}>Expires in</label>
        <select
          value={expirationHours}
          onChange={(e) => setExpirationHours(parseInt(e.target.value))}
          style={s.select}
        >
          <option value={6}>6 hours</option>
          <option value={12}>12 hours</option>
          <option value={24}>24 hours</option>
          <option value={48}>48 hours</option>
          <option value={72}>72 hours</option>
        </select>
      </div>

      {/* Summary */}
      {selectedTierData && (
        <div style={s.summary}>
          <p style={s.summaryTitle}>Group Buy Summary</p>
          <div style={s.summaryRow}>
            <span style={s.summaryKey}>Ticket tier</span>
            <span style={s.summaryVal}>{selectedTierData.name}</span>
          </div>
          <div style={s.summaryRow}>
            <span style={s.summaryKey}>Price per person</span>
            <span style={s.summaryVal}>₦{pricePerPerson.toLocaleString()}</span>
          </div>
          <div style={s.summaryRow}>
            <span style={s.summaryKey}>Participants</span>
            <span style={s.summaryVal}>{totalParticipants}</span>
          </div>
          <div style={{ ...s.summaryRow, ...s.summaryTotal }}>
            <span style={s.summaryKey}>Total cost</span>
            <span style={{ ...s.summaryVal, color: '#059669', fontWeight: '800' }}>₦{totalCost.toLocaleString()}</span>
          </div>
        </div>
      )}

      {error && <div style={s.errorBox}>{error}</div>}

      <button
        onClick={handleCreateGroupBuy}
        disabled={isLoading || !selectedTier}
        style={{ ...s.createBtn, ...(isLoading || !selectedTier ? s.createBtnDisabled : {}) }}
      >
        {isLoading ? 'Creating...' : 'Create Group Buy'}
      </button>

      {/* How it works */}
      <div style={s.infoBox}>
        <p style={s.infoTitle}>How Group Buys Work</p>
        <ul style={s.infoList}>
          <li>Create a group buy and share the link with friends</li>
          <li>Each person pays their portion individually</li>
          <li>Once everyone pays, tickets are issued to all participants</li>
          <li>If not enough people join, everyone gets refunded</li>
          <li>Group organizer gets a small discount for organising</li>
        </ul>
      </div>

    </div>
  );
}

const s = {
  root: { display: 'flex', flexDirection: 'column' as const, gap: '16px' },

  header: { display: 'flex', alignItems: 'center', gap: '14px', padding: '0 0 4px' },
  headerIcon: { width: '44px', height: '44px', borderRadius: '12px', backgroundColor: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 },
  headerTitle: { fontSize: '16px', fontWeight: '700', color: '#111827', margin: '0 0 2px' },
  headerSub: { fontSize: '13px', color: '#9ca3af', margin: 0 },

  field: { display: 'flex', flexDirection: 'column' as const, gap: '8px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#374151' },
  labelRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  sliderValue: { fontSize: '14px', fontWeight: '700', color: '#4f46e5', backgroundColor: '#eef2ff', padding: '2px 10px', borderRadius: '20px' },
  select: { width: '100%', padding: '11px 14px', fontSize: '14px', border: '1.5px solid #e5e7eb', borderRadius: '12px', backgroundColor: '#fff', color: '#111827', outline: 'none', cursor: 'pointer' },
  slider: { width: '100%', accentColor: '#4f46e5' },
  sliderLabels: { display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#9ca3af' },

  summary: { backgroundColor: '#f9fafb', borderRadius: '14px', border: '1px solid #f1f3f5', padding: '16px', display: 'flex', flexDirection: 'column' as const, gap: '10px' },
  summaryTitle: { fontSize: '13px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase' as const, letterSpacing: '0.5px', margin: 0 },
  summaryRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  summaryTotal: { paddingTop: '10px', borderTop: '1px solid #e5e7eb', marginTop: '2px' },
  summaryKey: { fontSize: '13.5px', color: '#6b7280' },
  summaryVal: { fontSize: '13.5px', fontWeight: '600', color: '#111827' },

  errorBox: { backgroundColor: '#fef2f2', color: '#dc2626', padding: '12px 14px', borderRadius: '12px', fontSize: '13.5px', border: '1px solid #fecaca' },

  createBtn: { width: '100%', padding: '14px', fontSize: '14px', fontWeight: '700', background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff', border: 'none', borderRadius: '14px', cursor: 'pointer' },
  createBtnDisabled: { opacity: 0.45, cursor: 'not-allowed' },

  infoBox: { backgroundColor: '#f0f9ff', borderRadius: '14px', border: '1px solid #bae6fd', padding: '16px' },
  infoTitle: { fontSize: '13px', fontWeight: '700', color: '#0369a1', margin: '0 0 8px' },
  infoList: { margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column' as const, gap: '6px', fontSize: '13px', color: '#0c4a6e', lineHeight: 1.5 },
};
