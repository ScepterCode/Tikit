import React, { useState } from 'react';

interface AsoEbiTier {
  name: string;
  price: number;
  color: string;
}

interface FoodOption {
  name: string;
  dietaryInfo: string;
}

interface Event {
  id: string;
  title: string;
  tiers: EventTier[];
  culturalFeatures?: {
    asoEbiTiers?: AsoEbiTier[];
    foodOptions?: FoodOption[];
    sprayMoneyEnabled?: boolean;
  };
}

interface EventTier {
  id: string;
  name: string;
  price: number;
  capacity: number;
  sold: number;
  benefits: string[];
}

interface WeddingTicketPurchaseProps {
  event: Event;
  onPurchase: (tierIds: string[], quantities: number[], paymentMethod: string) => void;
  onSprayMoney: (amount: number, message: string) => void;
}

export function WeddingTicketPurchase({ event, onPurchase, onSprayMoney }: WeddingTicketPurchaseProps) {
  const [selectedTier, setSelectedTier] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [foodChoice, setFoodChoice] = useState('');
  const [asoEbiTier, setAsoEbiTier] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('wallet');
  const [showSprayMoney, setShowSprayMoney] = useState(false);
  const [sprayAmount, setSprayAmount] = useState('');
  const [sprayMessage, setSprayMessage] = useState('');

  const culturalFeatures = event.culturalFeatures || {};
  const selectedTierData = event.tiers.find(t => t.id === selectedTier);

  const handlePurchase = () => {
    if (!selectedTier) {
      alert('Please select a ticket tier');
      return;
    }

    if (culturalFeatures.foodOptions && culturalFeatures.foodOptions.length > 0 && !foodChoice) {
      alert('Please select a food option');
      return;
    }

    if (culturalFeatures.asoEbiTiers && culturalFeatures.asoEbiTiers.length > 0 && !asoEbiTier) {
      alert('Please select an aso-ebi tier');
      return;
    }

    onPurchase([selectedTier], [quantity], paymentMethod);
  };

  const handleSprayMoney = () => {
    const amount = parseInt(sprayAmount);
    if (!amount || amount < 100) {
      alert('Minimum spray amount is ₦100');
      return;
    }

    onSprayMoney(amount, sprayMessage);
    setSprayAmount('');
    setSprayMessage('');
    setShowSprayMoney(false);
  };

  const calculateTotal = () => {
    let total = selectedTierData ? selectedTierData.price * quantity : 0;
    
    if (asoEbiTier && culturalFeatures.asoEbiTiers) {
      const asoEbiData = culturalFeatures.asoEbiTiers.find(t => t.name === asoEbiTier);
      if (asoEbiData) {
        total += asoEbiData.price * quantity;
      }
    }
    
    return total;
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Wedding RSVP & Ticket Purchase</h2>
        <p style={styles.subtitle}>
          Join us in celebrating this special day! Please complete your RSVP below.
        </p>
      </div>

      {/* Ticket Selection */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>🎫 Select Your Ticket</h3>
        <div style={styles.tiersList}>
          {event.tiers.map(tier => {
            const available = tier.capacity - tier.sold;
            const isAvailable = available > 0;

            return (
              <label
                key={tier.id}
                style={{
                  ...styles.tierOption,
                  ...(selectedTier === tier.id ? styles.selectedTier : {}),
                  ...(isAvailable ? {} : styles.unavailableTier)
                }}
              >
                <input
                  type="radio"
                  name="tier"
                  value={tier.id}
                  checked={selectedTier === tier.id}
                  onChange={(e) => setSelectedTier(e.target.value)}
                  disabled={!isAvailable}
                  style={styles.radioInput}
                />
                <div style={styles.tierContent}>
                  <div style={styles.tierHeader}>
                    <h4 style={styles.tierName}>{tier.name}</h4>
                    <div style={styles.tierPrice}>₦{tier.price.toLocaleString()}</div>
                  </div>
                  <div style={styles.tierAvailability}>
                    {isAvailable ? `${available} available` : 'Sold out'}
                  </div>
                  {tier.benefits && tier.benefits.length > 0 && (
                    <ul style={styles.benefitsList}>
                      {tier.benefits.map((benefit, idx) => (
                        <li key={idx} style={styles.benefitItem}>✓ {benefit}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </label>
            );
          })}
        </div>

        {selectedTier && (
          <div style={styles.quantitySection}>
            <label style={styles.quantityLabel}>
              Number of guests:
            </label>
            <div style={styles.quantityControls}>
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                style={styles.quantityButton}
              >
                -
              </button>
              <span style={styles.quantityDisplay}>{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                style={styles.quantityButton}
              >
                +
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Food Selection */}
      {culturalFeatures.foodOptions && culturalFeatures.foodOptions.length > 0 && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>🍽️ Food Selection</h3>
          <p style={styles.sectionDescription}>
            Please select your preferred meal option for each guest.
          </p>
          <div style={styles.optionsList}>
            {culturalFeatures.foodOptions.map((option, index) => (
              <label
                key={index}
                style={{
                  ...styles.option,
                  ...(foodChoice === option.name ? styles.selectedOption : {})
                }}
              >
                <input
                  type="radio"
                  name="food"
                  value={option.name}
                  checked={foodChoice === option.name}
                  onChange={(e) => setFoodChoice(e.target.value)}
                  style={styles.radioInput}
                />
                <div style={styles.optionContent}>
                  <div style={styles.optionName}>{option.name}</div>
                  {option.dietaryInfo && (
                    <div style={styles.optionInfo}>{option.dietaryInfo}</div>
                  )}
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Aso-ebi Selection */}
      {culturalFeatures.asoEbiTiers && culturalFeatures.asoEbiTiers.length > 0 && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>👗 Aso-ebi Selection</h3>
          <p style={styles.sectionDescription}>
            Choose your preferred aso-ebi tier to match the wedding theme.
          </p>
          <div style={styles.optionsList}>
            {culturalFeatures.asoEbiTiers.map((tier, index) => (
              <label
                key={index}
                style={{
                  ...styles.option,
                  ...(asoEbiTier === tier.name ? styles.selectedOption : {})
                }}
              >
                <input
                  type="radio"
                  name="asoEbi"
                  value={tier.name}
                  checked={asoEbiTier === tier.name}
                  onChange={(e) => setAsoEbiTier(e.target.value)}
                  style={styles.radioInput}
                />
                <div style={styles.optionContent}>
                  <div
                    style={{
                      ...styles.colorSwatch,
                      backgroundColor: tier.color
                    }}
                  />
                  <div>
                    <div style={styles.optionName}>{tier.name}</div>
                    <div style={styles.optionPrice}>+₦{tier.price.toLocaleString()}</div>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Payment Method */}
      {selectedTier && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>💳 Payment Method</h3>
          <div style={styles.paymentMethods}>
            <label style={styles.paymentOption}>
              <input
                type="radio"
                name="payment"
                value="wallet"
                checked={paymentMethod === 'wallet'}
                onChange={(e) => setPaymentMethod(e.target.value)}
                style={styles.radioInput}
              />
              <span>Wallet</span>
            </label>
            <label style={styles.paymentOption}>
              <input
                type="radio"
                name="payment"
                value="card"
                checked={paymentMethod === 'card'}
                onChange={(e) => setPaymentMethod(e.target.value)}
                style={styles.radioInput}
              />
              <span>Card</span>
            </label>
            <label style={styles.paymentOption}>
              <input
                type="radio"
                name="payment"
                value="bank_transfer"
                checked={paymentMethod === 'bank_transfer'}
                onChange={(e) => setPaymentMethod(e.target.value)}
                style={styles.radioInput}
              />
              <span>Bank Transfer</span>
            </label>
          </div>
        </div>
      )}

      {/* Total and Purchase */}
      {selectedTier && (
        <div style={styles.summary}>
          <div style={styles.summaryRow}>
            <span>Ticket ({quantity}x {selectedTierData?.name}):</span>
            <span>₦{((selectedTierData?.price || 0) * quantity).toLocaleString()}</span>
          </div>
          {asoEbiTier && culturalFeatures.asoEbiTiers && (
            <div style={styles.summaryRow}>
              <span>Aso-ebi ({quantity}x {asoEbiTier}):</span>
              <span>
                ₦{((culturalFeatures.asoEbiTiers.find(t => t.name === asoEbiTier)?.price || 0) * quantity).toLocaleString()}
              </span>
            </div>
          )}
          <div style={styles.totalRow}>
            <span>Total:</span>
            <span>₦{calculateTotal().toLocaleString()}</span>
          </div>
          
          <button
            onClick={handlePurchase}
            style={styles.purchaseButton}
          >
            Complete RSVP & Purchase
          </button>
        </div>
      )}

      {/* Spray Money Section */}
      {culturalFeatures.sprayMoneyEnabled && (
        <div style={styles.spraySection}>
          <h3 style={styles.sectionTitle}>💰 Spray Money</h3>
          <p style={styles.sectionDescription}>
            Show your love and support for the couple with a monetary gift!
          </p>
          
          {!showSprayMoney ? (
            <button
              onClick={() => setShowSprayMoney(true)}
              style={styles.sprayButton}
            >
              💸 Spray Money
            </button>
          ) : (
            <div style={styles.sprayForm}>
              <div style={styles.formField}>
                <label style={styles.label}>Amount (₦):</label>
                <input
                  type="number"
                  min="100"
                  value={sprayAmount}
                  onChange={(e) => setSprayAmount(e.target.value)}
                  placeholder="Enter amount"
                  style={styles.input}
                />
              </div>
              
              <div style={styles.formField}>
                <label style={styles.label}>Message (optional):</label>
                <textarea
                  value={sprayMessage}
                  onChange={(e) => setSprayMessage(e.target.value)}
                  placeholder="Congratulations! Wishing you both happiness..."
                  maxLength={200}
                  style={styles.textarea}
                />
              </div>
              
              <div style={styles.sprayActions}>
                <button
                  onClick={() => setShowSprayMoney(false)}
                  style={styles.cancelButton}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSprayMoney}
                  disabled={!sprayAmount}
                  style={{
                    ...styles.spraySubmitButton,
                    ...(sprayAmount ? {} : styles.disabledButton)
                  }}
                >
                  Spray ₦{parseInt(sprayAmount || '0').toLocaleString()}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '600px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '32px',
  },
  title: {
    margin: '0 0 8px 0',
    fontSize: '24px',
    fontWeight: '700',
    color: '#1f2937',
  },
  subtitle: {
    margin: '0',
    color: '#6b7280',
    fontSize: '16px',
  },
  section: {
    marginBottom: '32px',
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
  },
  sectionTitle: {
    margin: '0 0 8px 0',
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
  },
  sectionDescription: {
    margin: '0 0 16px 0',
    color: '#6b7280',
    fontSize: '14px',
  },
  tiersList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  tierOption: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '16px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  selectedTier: {
    borderColor: '#667eea',
    backgroundColor: '#f0f4ff',
  },
  unavailableTier: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  radioInput: {
    marginTop: '2px',
  },
  tierContent: {
    flex: 1,
  },
  tierHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px',
  },
  tierName: {
    margin: '0',
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
  },
  tierPrice: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#059669',
  },
  tierAvailability: {
    fontSize: '12px',
    color: '#6b7280',
    marginBottom: '8px',
  },
  benefitsList: {
    listStyle: 'none',
    padding: '0',
    margin: '0',
  },
  benefitItem: {
    fontSize: '14px',
    color: '#059669',
    marginBottom: '2px',
  },
  quantitySection: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginTop: '16px',
    padding: '16px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
  },
  quantityLabel: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
  },
  quantityControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  quantityButton: {
    width: '32px',
    height: '32px',
    border: '1px solid #d1d5db',
    backgroundColor: 'white',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600',
  },
  quantityDisplay: {
    fontSize: '16px',
    fontWeight: '600',
    minWidth: '24px',
    textAlign: 'center' as const,
  },
  optionsList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  option: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  selectedOption: {
    borderColor: '#667eea',
    backgroundColor: '#f0f4ff',
  },
  optionContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flex: 1,
  },
  optionName: {
    fontWeight: '500',
    color: '#1f2937',
  },
  optionInfo: {
    fontSize: '14px',
    color: '#6b7280',
  },
  optionPrice: {
    fontSize: '14px',
    color: '#059669',
    fontWeight: '600',
  },
  colorSwatch: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    border: '2px solid #e5e7eb',
  },
  paymentMethods: {
    display: 'flex',
    gap: '16px',
  },
  paymentOption: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
  },
  summary: {
    backgroundColor: '#f9fafb',
    padding: '20px',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
    fontSize: '14px',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid #e5e7eb',
    fontSize: '18px',
    fontWeight: '700',
    color: '#1f2937',
  },
  purchaseButton: {
    width: '100%',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    padding: '16px',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '16px',
  },
  spraySection: {
    backgroundColor: '#fef3c7',
    padding: '20px',
    borderRadius: '12px',
    border: '1px solid #f59e0b',
  },
  sprayButton: {
    backgroundColor: '#f59e0b',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  sprayForm: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  formField: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
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
  textarea: {
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    minHeight: '60px',
    resize: 'vertical' as const,
  },
  sprayActions: {
    display: 'flex',
    gap: '12px',
  },
  cancelButton: {
    flex: 1,
    padding: '8px 16px',
    border: '1px solid #d1d5db',
    backgroundColor: 'white',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  spraySubmitButton: {
    flex: 2,
    padding: '8px 16px',
    backgroundColor: '#059669',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  disabledButton: {
    backgroundColor: '#d1d5db',
    cursor: 'not-allowed',
  },
};
