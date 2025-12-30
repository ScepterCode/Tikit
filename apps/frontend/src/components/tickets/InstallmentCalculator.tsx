import { useState } from 'react';

export type InstallmentParts = 1 | 2 | 3 | 4;

interface InstallmentSchedule {
  partNumber: number;
  dueDate: Date;
  amount: number;
}

interface InstallmentCalculatorProps {
  totalAmount: number;
  onInstallmentChange: (parts: InstallmentParts) => void;
  selectedParts?: InstallmentParts;
}

export function InstallmentCalculator({ 
  totalAmount, 
  onInstallmentChange,
  selectedParts = 1 
}: InstallmentCalculatorProps) {
  const [parts, setParts] = useState<InstallmentParts>(selectedParts);

  const formatPrice = (price: number) => {
    return `₦${(price / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
  };

  const calculateSchedule = (numParts: InstallmentParts): InstallmentSchedule[] => {
    if (numParts === 1) {
      return [{
        partNumber: 1,
        dueDate: new Date(),
        amount: totalAmount
      }];
    }

    const amountPerPart = Math.ceil(totalAmount / numParts);
    const schedule: InstallmentSchedule[] = [];
    
    for (let i = 0; i < numParts; i++) {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + (i * 7)); // Weekly installments
      
      // Last part gets any remainder
      const amount = i === numParts - 1 
        ? totalAmount - (amountPerPart * (numParts - 1))
        : amountPerPart;
      
      schedule.push({
        partNumber: i + 1,
        dueDate,
        amount
      });
    }
    
    return schedule;
  };

  const handlePartsChange = (newParts: InstallmentParts) => {
    setParts(newParts);
    onInstallmentChange(newParts);
  };

  const installmentOptions: InstallmentParts[] = [1, 2, 3, 4];
  const schedule = calculateSchedule(parts);

  return (
    <div className="installment-calculator">
      <h3>Payment Plan</h3>
      
      <div className="installment-options">
        {installmentOptions.map(option => (
          <label
            key={option}
            className={`installment-option ${parts === option ? 'selected' : ''}`}
          >
            <input
              type="radio"
              name="installment-parts"
              value={option}
              checked={parts === option}
              onChange={() => handlePartsChange(option)}
            />
            <div className="option-content">
              <span className="option-label">
                {option === 1 ? 'Full Payment' : `${option} Parts`}
              </span>
              {option > 1 && (
                <span className="option-amount">
                  {formatPrice(Math.ceil(totalAmount / option))} per part
                </span>
              )}
            </div>
          </label>
        ))}
      </div>

      {parts > 1 && (
        <div className="payment-schedule">
          <h4>Payment Schedule</h4>
          <div className="schedule-list">
            {schedule.map(payment => (
              <div key={payment.partNumber} className="schedule-item">
                <span className="part-number">Part {payment.partNumber}</span>
                <span className="due-date">
                  Due: {payment.dueDate.toLocaleDateString('en-NG', { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
                <span className="amount">{formatPrice(payment.amount)}</span>
              </div>
            ))}
          </div>
          <div className="schedule-note">
            <p>Weekly installments. First payment due today.</p>
          </div>
        </div>
      )}

      <div className="total-display">
        <span>Total Amount:</span>
        <span className="total-amount">{formatPrice(totalAmount)}</span>
      </div>
    </div>
  );
}
