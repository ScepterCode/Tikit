import React, { useState } from 'react';
import { PaymentMethodSelector } from './PaymentMethodSelector';

interface Event {
  id: string;
  title: string;
  tiers: EventTier[];
}

interface EventTier {
  id: string;
  name: string;
  price: number;
  description: string;
  capacity: number;
  sold: number;
  benefits: string[];
}

interface TicketSelectorProps {
  event: Event;
  onPurchase: (tierIds: string[], quantities: number[], paymentMethod: string) => void;
}

export function TicketSelector({ event, onPurchase }: TicketSelectorProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>(
    event.tiers.reduce((acc, tier) => ({ ...acc, [tier.id]: 0 }), {})
  );
  const [paymentMethod, setPaymentMethod] = useState('wallet');
  const [showBulkOptions, setShowBulkOptions] = useState(false);
  const [bulkQuantity, setBulkQuantity] = useState(50);

  const handleQuantityChange = (tierId: string, newQuantity: number) => {
    const tier = event.tiers.find(t => t.id === tierId);
    if (!tier) return;

    const available = tier.capacity - tier.sold;
    const validQuantity = Math.max(0, Math.min(newQuantity, available));

    setQuantities(prev => ({ ...prev, [tierId]: validQuantity }));
  };

  const handleBulkBooking = (tierId: string) => {
    const tier = event.tiers.find(t => t.id === tierId);
    if (!tier) return;

    const available = tier.capacity - tier.sold;
    if (bulkQuantity > available) {
      alert(`Only ${available} tickets available for ${tier.name}`);
      return;
    }

    if (bulkQuantity < 50) {
      alert('Bulk booking requires minimum 50 tickets');
      return;
    }

    const confirmed = confirm(
      `Confirm bulk booking of ${bulkQuantity} tickets for ${tier.name}?\n` +
      `Total: ₦${(tier.price * bulkQuantity).toLocaleString()}`
    );

    if (confirmed) {
      onPurchase([tierId], [bulkQuantity], paymentMethod);
    }
  };

  const handleRegularPurchase = () => {
    const selectedTiers = Object.entries(quantities)
      .filter(([_, qty]) => qty > 0)
      .map(([tierId, qty]) => ({ tierId, qty }));

    if (selectedTiers.length === 0) {
      alert('Please select at least one ticket');
      return;
    }

    const tierIds = selectedTiers.map(s => s.tierId);
    const qtys = selectedTiers.map(s => s.qty);

    onPurchase(tierIds, qtys, paymentMethod);
  };

  const calculateTotal = () => {
    return Object.entries(quantities).reduce((total, [tierId, qty]) => {
      const tier = event.tiers.find(t => t.id === tierId);
      return total + (tier ? tier.price * qty : 0);
    }, 0);
  };

  const totalTickets = Object.values(quantities).reduce((sum, qty) => sum + qty, 0);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>Select Tickets</h2>
        <div style={styles.toggleButtons}>
          <button
            onClick={() => setShowBulkOptions(false)}
            style={{
              ...styles.toggleButton,
              ...(showBulkOptions ? {} : styles.activeToggle)
            }}
          >
            Regular Booking
          </button>
          <button
            onClick={() => setShowBulkOptions(true)}
            style={{
              ...styles.toggleButton,
              ...(showBulkOptions ? styles.activeToggle : {})
            }}
          >
            Bulk Booking (50+)
          </button>
        </div>
      </div>

      {!showBulkOptions ? (
        // Regular booking interface
        <div style={styles.regularBooking}>
          <div style={styles.tiersList}>
            {event.tiers.map(tier => {
              const available = tier.capacity - tier.sold;
              const isAvailable = available > 0;

              return (
                <div key={tier.id} style={{
                  ...styles.tierCard,
                  ...(isAvailable ? {} : styles.soldOut)
                }}>
                  <div style={styles.tierHeader}>
                    <h3 style={styles.tierName}>{tier.name}</h3>
                    <div style={styles.tierPrice}>₦{tier.price.toLocaleString()}</div>
                  </div>

                  <p style={styles.tierDescription}>{tier.description}</p>

                  {tier.benefits && tier.benefits.length > 0 && (
                    <ul style={styles.benefitsList}>
                      {tier.benefits.map((benefit, idx) => (
                        <li key={idx} style={styles.benefitItem}>✓ {benefit}</li>
                      ))}
                    </ul>
                  )}

                  <div style={styles.availability}>
                    <span style={styles.availabilityText}>
                      {available} of {tier.capacity} available
                    </span>
                  </div>

                  {isAvailable ? (
                    <div style={styles.quantityControls}>
                      <button
                        onClick={() => handleQuantityChange(tier.id, quantities[tier.id] - 1)}
                        disabled={quantities[tier.id] === 0}
                        style={styles.quantityButton}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="0"
                        max={available}
                        value={quantities[tier.id]}
                        onChange={(e) => handleQuantityChange(tier.id, parseInt(e.target.value) || 0)}
                        style={styles.quantityInput}
                      />
                      <button
                        onClick={() => handleQuantityChange(tier.id, quantities[tier.id] + 1)}
                        disabled={quantities[tier.id] >= available}
                        style={styles.quantityButton}
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <div style={styles.soldOutBadge}>Sold Out</div>
                  )}

                  {quantities[tier.id] > 0 && (
                    <div style={styles.subtotal}>
                      Subtotal: ₦{(tier.price * quantities[tier.id]).toLocaleString()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {totalTickets > 0 && (
            <div style={styles.summary}>
              <div style={styles.summaryContent}>
                <div style={styles.summaryRow}>
                  <span>Total Tickets:</span>
                  <span>{totalTickets}</span>
                </div>
                <div style={styles.summaryRow}>
                  <span>Total Amount:</span>
                  <span style={styles.totalAmount}>₦{calculateTotal().toLocaleString()}</span>
                </div>
              </div>

              <PaymentMethodSelector
                selectedMethod={paymentMethod}
                onMethodChange={setPaymentMethod}
                amount={calculateTotal()}
                userWalletBalance={0} // Will be passed from parent
              />

              <button
                onClick={handleRegularPurchase}
                style={styles.purchaseButton}
              >
                Purchase Tickets
              </button>
            </div>
          )}
        </div>
      ) : (
        // Bulk booking interface
        <div style={styles.bulkBooking}>
          <div style={styles.bulkInfo}>
            <h3>Bulk Booking (Minimum 50 tickets)</h3>
            <p>Perfect for religious organizations, schools, and large groups.</p>
            <ul style={styles.bulkFeatures}>
              <li>✓ Discounted rates for large quantities</li>
              <li>✓ Downloadable CSV with all ticket details</li>
              <li>✓ Split payment options for 1000+ tickets</li>
              <li>✓ Dedicated support</li>
            </ul>
          </div>

          <div style={styles.bulkQuantitySelector}>
            <label style={styles.bulkLabel}>
              Number of Tickets (50-20,000):
            </label>
            <input
              type="range"
              min="50"
              max="20000"
              value={bulkQuantity}
              onChange={(e) => setBulkQuantity(parseInt(e.target.value))}
              style={styles.bulkSlider}
            />
            <div style={styles.bulkQuantityDisplay}>
              <input
                type="number"
                min="50"
                max="20000"
                value={bulkQuantity}
                onChange={(e) => setBulkQuantity(Math.max(50, parseInt(e.target.value) || 50))}
                style={styles.bulkQuantityInput}
              />
              <span>tickets</span>
            </div>
          </div>

          <div style={styles.bulkTiers}>
            {event.tiers.map(tier => {
              const available = tier.capacity - tier.sold;
              const canBook = available >= bulkQuantity;
              const totalCost = tier.price * bulkQuantity;

              return (
                <div key={tier.id} style={{
                  ...styles.bulkTierCard,
                  ...(canBook ? {} : styles.unavailable)
                }}>
                  <div style={styles.bulkTierHeader}>
                    <h4>{tier.name}</h4>
                    <div style={styles.bulkTierPrice}>
                      ₦{tier.price.toLocaleString()} each
                    </div>
                  </div>

                  <div style={styles.bulkTierTotal}>
                    Total: ₦{totalCost.toLocaleString()}
                  </div>

                  <div style={styles.bulkAvailability}>
                    {available >= bulkQuantity ? (
                      <span style={styles.available}>✓ Available ({available} total)</span>
                    ) : (
                      <span style={styles.unavailableText}>
                        ✗ Only {available} available
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleBulkBooking(tier.id)}
                    disabled={!canBook}
                    style={{
                      ...styles.bulkBookButton,
                      ...(canBook ? {} : styles.disabledButton)
                    }}
                  >
                    Book {bulkQuantity} Tickets
                  </button>
                </div>
              );
            })}
          </div>
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
    marginBottom: '24px',
  },
  toggleButtons: {
    display: 'flex',
    gap: '8px',
    marginTop: '16px',
  },
  toggleButton: {
    padding: '8px 16px',
    border: '1px solid #d1d5db',
    backgroundColor: 'white',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  activeToggle: {
    backgroundColor: '#667eea',
    color: 'white',
    borderColor: '#667eea',
  },
  regularBooking: {
    // Regular booking styles
  },
  tiersList: {
    display: 'grid',
    gap: '20px',
    marginBottom: '32px',
  },
  tierCard: {
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '20px',
    backgroundColor: 'white',
  },
  soldOut: {
    opacity: 0.6,
    backgroundColor: '#f9fafb',
  },
  tierHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  tierName: {
    margin: '0',
    fontSize: '20px',
    fontWeight: '600',
  },
  tierPrice: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#059669',
  },
  tierDescription: {
    color: '#6b7280',
    marginBottom: '12px',
  },
  benefitsList: {
    listStyle: 'none',
    padding: '0',
    margin: '0 0 16px 0',
  },
  benefitItem: {
    color: '#059669',
    fontSize: '14px',
    marginBottom: '4px',
  },
  availability: {
    marginBottom: '16px',
  },
  availabilityText: {
    fontSize: '14px',
    color: '#6b7280',
  },
  quantityControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px',
  },
  quantityButton: {
    width: '40px',
    height: '40px',
    border: '1px solid #d1d5db',
    backgroundColor: 'white',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '18px',
    fontWeight: '600',
  },
  quantityInput: {
    width: '80px',
    padding: '8px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    textAlign: 'center' as const,
    fontSize: '16px',
  },
  soldOutBadge: {
    backgroundColor: '#ef4444',
    color: 'white',
    padding: '8px 16px',
    borderRadius: '6px',
    textAlign: 'center' as const,
    fontWeight: '600',
  },
  subtotal: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#059669',
    textAlign: 'right' as const,
  },
  summary: {
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '24px',
    backgroundColor: '#f9fafb',
  },
  summaryContent: {
    marginBottom: '20px',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
    fontSize: '16px',
  },
  totalAmount: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#059669',
  },
  purchaseButton: {
    width: '100%',
    backgroundColor: '#059669',
    color: 'white',
    border: 'none',
    padding: '16px',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '16px',
  },
  bulkBooking: {
    // Bulk booking styles
  },
  bulkInfo: {
    backgroundColor: '#f0f9ff',
    padding: '20px',
    borderRadius: '12px',
    marginBottom: '24px',
  },
  bulkFeatures: {
    listStyle: 'none',
    padding: '0',
    margin: '12px 0 0 0',
  },
  bulkQuantitySelector: {
    marginBottom: '24px',
  },
  bulkLabel: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '600',
  },
  bulkSlider: {
    width: '100%',
    marginBottom: '12px',
  },
  bulkQuantityDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  bulkQuantityInput: {
    width: '100px',
    padding: '8px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '16px',
  },
  bulkTiers: {
    display: 'grid',
    gap: '16px',
  },
  bulkTierCard: {
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '20px',
    backgroundColor: 'white',
  },
  unavailable: {
    opacity: 0.6,
    backgroundColor: '#f9fafb',
  },
  bulkTierHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  bulkTierPrice: {
    fontSize: '16px',
    color: '#6b7280',
  },
  bulkTierTotal: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#059669',
    marginBottom: '8px',
  },
  bulkAvailability: {
    marginBottom: '16px',
  },
  available: {
    color: '#059669',
    fontSize: '14px',
  },
  unavailableText: {
    color: '#ef4444',
    fontSize: '14px',
  },
  bulkBookButton: {
    width: '100%',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  disabledButton: {
    backgroundColor: '#d1d5db',
    cursor: 'not-allowed',
  },
};
