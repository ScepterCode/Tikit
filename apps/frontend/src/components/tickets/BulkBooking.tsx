import { useState, useEffect } from 'react';

export interface BulkBookingProps {
  pricePerSeat: number;
  availableSeats: number;
  onBookingChange: (seats: number, totalCost: number) => void;
}

export function BulkBooking({
  pricePerSeat,
  availableSeats,
  onBookingChange,
}: BulkBookingProps) {
  const MIN_SEATS = 50;
  const MAX_SEATS = 20000;

  // Calculate the actual max based on availability
  const effectiveMax = Math.min(MAX_SEATS, availableSeats);
  
  const [seats, setSeats] = useState<number>(MIN_SEATS);
  const [totalCost, setTotalCost] = useState<number>(MIN_SEATS * pricePerSeat);

  useEffect(() => {
    const cost = seats * pricePerSeat;
    setTotalCost(cost);
    onBookingChange(seats, cost);
  }, [seats, pricePerSeat, onBookingChange]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSeats = parseInt(e.target.value);
    setSeats(newSeats);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || MIN_SEATS;
    const validSeats = Math.max(MIN_SEATS, Math.min(value, effectiveMax));
    setSeats(validSeats);
  };

  const formatPrice = (price: number) => {
    return `₦${(price / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString('en-NG');
  };

  const isBookingAvailable = availableSeats >= MIN_SEATS;

  if (!isBookingAvailable) {
    return (
      <div className="bulk-booking-unavailable">
        <h2>Bulk Booking</h2>
        <p className="error-message">
          Bulk booking requires at least {MIN_SEATS} available seats.
          Currently available: {formatNumber(availableSeats)}
        </p>
      </div>
    );
  }

  return (
    <div className="bulk-booking">
      <h2>Bulk Booking for Religious Organizations</h2>
      <p className="bulk-booking-description">
        Book between {formatNumber(MIN_SEATS)} and {formatNumber(effectiveMax)} seats for your congregation
      </p>

      <div className="seat-selection">
        <div className="slider-container">
          <label htmlFor="seat-slider">
            Number of Seats: <strong>{formatNumber(seats)}</strong>
          </label>
          <input
            id="seat-slider"
            type="range"
            min={MIN_SEATS}
            max={effectiveMax}
            value={seats}
            onChange={handleSliderChange}
            className="seat-slider"
            aria-label="Select number of seats"
          />
          <div className="slider-labels">
            <span>{formatNumber(MIN_SEATS)}</span>
            <span>{formatNumber(effectiveMax)}</span>
          </div>
        </div>

        <div className="manual-input">
          <label htmlFor="seat-input">Or enter manually:</label>
          <input
            id="seat-input"
            type="number"
            min={MIN_SEATS}
            max={effectiveMax}
            value={seats}
            onChange={handleInputChange}
            className="seat-input"
            aria-label="Enter number of seats manually"
          />
        </div>
      </div>

      <div className="booking-summary">
        <div className="summary-row">
          <span className="summary-label">Price per seat:</span>
          <span className="summary-value">{formatPrice(pricePerSeat)}</span>
        </div>
        <div className="summary-row">
          <span className="summary-label">Number of seats:</span>
          <span className="summary-value">{formatNumber(seats)}</span>
        </div>
        <div className="summary-row total">
          <span className="summary-label">Total Cost:</span>
          <span className="summary-value total-amount">{formatPrice(totalCost)}</span>
        </div>
      </div>

      <div className="availability-counter">
        <div className="availability-bar">
          <div 
            className="availability-fill"
            style={{ width: `${(seats / availableSeats) * 100}%` }}
          />
        </div>
        <p className="availability-text">
          {formatNumber(availableSeats - seats)} seats remaining after this booking
        </p>
      </div>

      {seats > 1000 && (
        <div className="split-payment-notice">
          <p>
            ℹ️ For bookings over 1,000 seats, split payment links will be available
            to distribute among congregation members.
          </p>
        </div>
      )}
    </div>
  );
}
