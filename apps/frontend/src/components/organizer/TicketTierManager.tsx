import { useState } from 'react';
import { authenticatedFetch } from '../../utils/auth';

interface TicketTier {
  name: string;
  price: number;
  quantity: number;
  sold: number;
}

interface TicketTierManagerProps {
  event: {
    id: string;
    title: string;
    ticketTiers?: TicketTier[];
  };
  onUpdate?: () => void;
}

export function TicketTierManager({ event, onUpdate }: TicketTierManagerProps) {
  const [tiers, setTiers] = useState<TicketTier[]>(event.ticketTiers || []);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const addTier = () => {
    if (tiers.length >= 5) {
      alert('Maximum 5 ticket tiers allowed');
      return;
    }
    setTiers([...tiers, { name: '', price: 0, quantity: 0, sold: 0 }]);
  };

  const removeTier = (index: number) => {
    if (tiers.length === 1) {
      alert('At least one ticket tier is required');
      return;
    }
    setTiers(tiers.filter((_, i) => i !== index));
  };

  const updateTier = (index: number, field: keyof TicketTier, value: string | number) => {
    setTiers(tiers.map((tier, i) => 
      i === index ? { ...tier, [field]: value } : tier
    ));
  };

  const saveTiers = async () => {
    const validTiers = tiers.filter(tier => tier.name && tier.price > 0 && tier.quantity > 0);
    
    if (validTiers.length === 0) {
      alert('Please add at least one valid ticket tier');
      return;
    }

    setLoading(true);
    try {
      const response = await authenticatedFetch(`http://localhost:8000/api/events/${event.id}`, {
        method: 'PUT',
        body: JSON.stringify({ ticketTiers: validTiers })
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Ticket tiers updated successfully!');
        setEditing(false);
        if (onUpdate) onUpdate();
      } else {
        alert(`Failed to update tiers: ${data.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating tiers:', error);
      alert('Failed to update ticket tiers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>🎫 Ticket Tiers</h3>
        {!editing ? (
          <button style={styles.editButton} onClick={() => setEditing(true)}>
            Edit Tiers
          </button>
        ) : (
          <div style={styles.editActions}>
            <button style={styles.cancelButton} onClick={() => setEditing(false)}>
              Cancel
            </button>
            <button 
              style={styles.saveButton} 
              onClick={saveTiers}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        )}
      </div>

      <div style={styles.tiersList}>
        {tiers.map((tier, index) => (
          <div key={index} style={styles.tierCard}>
            {editing ? (
              <div style={styles.editTier}>
                <input
                  type="text"
                  placeholder="Tier name"
                  value={tier.name}
                  onChange={(e) => updateTier(index, 'name', e.target.value)}
                  style={styles.input}
                />
                <input
                  type="number"
                  placeholder="Price"
                  value={tier.price || ''}
                  onChange={(e) => updateTier(index, 'price', parseFloat(e.target.value) || 0)}
                  style={styles.input}
                />
                <input
                  type="number"
                  placeholder="Quantity"
                  value={tier.quantity || ''}
                  onChange={(e) => updateTier(index, 'quantity', parseInt(e.target.value) || 0)}
                  style={styles.input}
                />
                {tiers.length > 1 && (
                  <button 
                    style={styles.removeButton}
                    onClick={() => removeTier(index)}
                  >
                    ✕
                  </button>
                )}
              </div>
            ) : (
              <div style={styles.viewTier}>
                <div style={styles.tierInfo}>
                  <h4 style={styles.tierName}>{tier.name}</h4>
                  <div style={styles.tierDetails}>
                    <span style={styles.tierPrice}>₦{tier.price.toLocaleString()}</span>
                    <span style={styles.tierAvailability}>
                      {tier.quantity - tier.sold} / {tier.quantity} available
                    </span>
                  </div>
                </div>
                <div style={styles.tierStats}>
                  <div style={styles.stat}>
                    <span style={styles.statValue}>{tier.sold}</span>
                    <span style={styles.statLabel}>Sold</span>
                  </div>
                  <div style={styles.stat}>
                    <span style={styles.statValue}>₦{(tier.sold * tier.price).toLocaleString()}</span>
                    <span style={styles.statLabel}>Revenue</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {editing && (
        <button style={styles.addButton} onClick={addTier}>
          + Add Tier
        </button>
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
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  title: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0,
  },
  editButton: {
    padding: '8px 16px',
    fontSize: '14px',
    backgroundColor: '#667eea',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  editActions: {
    display: 'flex',
    gap: '8px',
  },
  cancelButton: {
    padding: '8px 16px',
    fontSize: '14px',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  saveButton: {
    padding: '8px 16px',
    fontSize: '14px',
    backgroundColor: '#059669',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  tiersList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  tierCard: {
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '16px',
  },
  editTier: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
  },
  removeButton: {
    padding: '8px 12px',
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  viewTier: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tierInfo: {
    flex: 1,
  },
  tierName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
    margin: '0 0 8px 0',
  },
  tierDetails: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
  },
  tierPrice: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#059669',
  },
  tierAvailability: {
    fontSize: '14px',
    color: '#6b7280',
  },
  tierStats: {
    display: 'flex',
    gap: '24px',
  },
  stat: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '4px',
  },
  statValue: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: '12px',
    color: '#6b7280',
  },
  addButton: {
    width: '100%',
    padding: '12px',
    fontSize: '14px',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: '2px dashed #d1d5db',
    borderRadius: '8px',
    cursor: 'pointer',
    marginTop: '12px',
  },
};