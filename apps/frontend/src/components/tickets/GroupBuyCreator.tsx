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
    if (!selectedTier) {
      setError('Please select a ticket tier');
      return;
    }

    if (totalParticipants < 2 || totalParticipants > 100) {
      setError('Group size must be between 2 and 100 participants');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Note: This component is for demonstration purposes
      // In production, group buy functionality would be implemented via Supabase
      console.log('Group buy creation:', {
        eventId: event.id,
        tierId: selectedTier,
        totalParticipants,
        expirationHours,
      });
      
      // Simulate successful creation for demo
      const data = { 
        success: true, 
        error: null as { message?: string } | null 
      };

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to create group buy');
      }

      alert('Group buy created successfully! Share the link with your friends.');
      onGroupBuyCreated();
      
      // Reset form
      setSelectedTier('');
      setTotalParticipants(5);
      setExpirationHours(24);
    } catch (err: any) {
      setError(err.message || 'Failed to create group buy');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedTierData = event.tiers.find(t => t.id === selectedTier);
  const pricePerPerson = selectedTierData ? selectedTierData.price : 0;
  const totalCost = pricePerPerson * totalParticipants;
  const savings = selectedTierData ? (selectedTierData.price * totalParticipants) - totalCost : 0;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3>Create a Group Buy</h3>
        <p style={styles.subtitle}>
          Organize a group purchase and save money together!
        </p>
      </div>

      <div style={styles.form}>
        {/* Tier Selection */}
        <div style={styles.field}>
          <label style={styles.label}>Select Ticket Tier:</label>
          <select
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value)}
            style={styles.select}
          >
            <option value="">Choose a tier...</option>
            {event.tiers.map(tier => {
              const available = tier.capacity - tier.sold;
              return (
                <option 
                  key={tier.id} 
                  value={tier.id}
                  disabled={available < totalParticipants}
                >
                  {tier.name} - ₦{tier.price.toLocaleString()} 
                  ({available} available)
                </option>
              );
            })}
          </select>
        </div>

        {/* Group Size */}
        <div style={styles.field}>
          <label style={styles.label}>
            Number of Participants: {totalParticipants}
          </label>
          <input
            type="range"
            min="2"
            max="100"
            value={totalParticipants}
            onChange={(e) => setTotalParticipants(parseInt(e.target.value))}
            style={styles.slider}
          />
          <div style={styles.sliderLabels}>
            <span>2</span>
            <span>100</span>
          </div>
        </div>

        {/* Expiration */}
        <div style={styles.field}>
          <label style={styles.label}>Expires in:</label>
          <select
            value={expirationHours}
            onChange={(e) => setExpirationHours(parseInt(e.target.value))}
            style={styles.select}
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
          <div style={styles.summary}>
            <h4>Group Buy Summary</h4>
            <div style={styles.summaryRow}>
              <span>Ticket Tier:</span>
              <span>{selectedTierData.name}</span>
            </div>
            <div style={styles.summaryRow}>
              <span>Price per person:</span>
              <span>₦{pricePerPerson.toLocaleString()}</span>
            </div>
            <div style={styles.summaryRow}>
              <span>Total participants:</span>
              <span>{totalParticipants}</span>
            </div>
            <div style={styles.summaryRow}>
              <span>Total cost:</span>
              <span style={styles.totalCost}>₦{totalCost.toLocaleString()}</span>
            </div>
            {savings > 0 && (
              <div style={styles.savings}>
                <span>Group savings:</span>
                <span>₦{savings.toLocaleString()}</span>
              </div>
            )}
          </div>
        )}

        {error && (
          <div style={styles.error}>
            {error}
          </div>
        )}

        <button
          onClick={handleCreateGroupBuy}
          disabled={isLoading || !selectedTier}
          style={{
            ...styles.createButton,
            ...(isLoading || !selectedTier ? styles.disabledButton : {})
          }}
        >
          {isLoading ? 'Creating...' : 'Create Group Buy'}
        </button>
      </div>

      <div style={styles.info}>
        <h4>How Group Buys Work:</h4>
        <ul style={styles.infoList}>
          <li>You create a group buy and share the link with friends</li>
          <li>Each person pays their portion individually</li>
          <li>Once everyone pays, tickets are issued to all participants</li>
          <li>If not enough people join, everyone gets refunded</li>
          <li>Group organizer gets a small discount for organizing</li>
        </ul>
      </div>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    border: '1px solid #e5e7eb',
  },
  header: {
    marginBottom: '24px',
  },
  subtitle: {
    color: '#6b7280',
    margin: '8px 0 0 0',
  },
  form: {
    marginBottom: '24px',
  },
  field: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '600',
    color: '#374151',
  },
  select: {
    width: '100%',
    padding: '12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '16px',
    backgroundColor: 'white',
  },
  slider: {
    width: '100%',
    marginBottom: '8px',
  },
  sliderLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '14px',
    color: '#6b7280',
  },
  summary: {
    backgroundColor: '#f9fafb',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '16px',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
    fontSize: '14px',
  },
  totalCost: {
    fontWeight: '700',
    color: '#059669',
  },
  savings: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid #e5e7eb',
    fontWeight: '600',
    color: '#059669',
  },
  error: {
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '14px',
  },
  createButton: {
    width: '100%',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    padding: '16px',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  disabledButton: {
    backgroundColor: '#d1d5db',
    cursor: 'not-allowed',
  },
  info: {
    backgroundColor: '#f0f9ff',
    padding: '16px',
    borderRadius: '8px',
  },
  infoList: {
    margin: '8px 0 0 0',
    paddingLeft: '20px',
  },
};
