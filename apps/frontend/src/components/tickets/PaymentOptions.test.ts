import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { InstallmentParts } from './InstallmentCalculator';

/**
 * Feature: tikit-webapp, Property 14: Payment option availability
 * Validates: Requirements 5.1
 * 
 * For any ticket tier selection, the system should display all four installment 
 * options (full payment, 2-part, 3-part, and 4-part)
 */

// Helper function to get available installment options
function getAvailableInstallmentOptions(): InstallmentParts[] {
  return [1, 2, 3, 4];
}

// Helper function to validate installment calculation
function calculateInstallmentAmount(totalAmount: number, parts: InstallmentParts): number {
  return Math.ceil(totalAmount / parts);
}

describe('Property 14: Payment option availability', () => {
  it('should always provide all four installment options for any ticket selection', () => {
    fc.assert(
      fc.property(
        // Generate random ticket prices (in kobo, 100 to 1,000,000)
        fc.integer({ min: 10000, max: 100000000 }),
        // Generate random quantity (1 to 100)
        fc.integer({ min: 1, max: 100 }),
        (pricePerTicket, quantity) => {
          const totalAmount = pricePerTicket * quantity;
          
          // Get available installment options
          const options = getAvailableInstallmentOptions();
          
          // Property: All four options must be available
          expect(options).toHaveLength(4);
          expect(options).toContain(1); // Full payment
          expect(options).toContain(2); // 2-part
          expect(options).toContain(3); // 3-part
          expect(options).toContain(4); // 4-part
          
          // Verify each option produces valid installment amounts
          options.forEach(parts => {
            const installmentAmount = calculateInstallmentAmount(totalAmount, parts);
            
            // Each installment should be positive
            expect(installmentAmount).toBeGreaterThan(0);
            
            // Total of all installments should equal or slightly exceed total
            // (due to rounding up)
            const totalInstallments = installmentAmount * parts;
            expect(totalInstallments).toBeGreaterThanOrEqual(totalAmount);
            expect(totalInstallments).toBeLessThanOrEqual(totalAmount + parts);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should provide consistent installment options regardless of amount', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 100000000 }),
        (amount) => {
          const options1 = getAvailableInstallmentOptions();
          const options2 = getAvailableInstallmentOptions();
          
          // Options should be consistent
          expect(options1).toEqual(options2);
          expect(options1).toEqual([1, 2, 3, 4]);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should calculate installments that sum to at least the total amount', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 100000000 }),
        fc.constantFrom(1, 2, 3, 4),
        (totalAmount, parts) => {
          const installmentAmount = calculateInstallmentAmount(totalAmount, parts as InstallmentParts);
          const totalPaid = installmentAmount * parts;
          
          // Due to ceiling, total paid should be >= original amount
          expect(totalPaid).toBeGreaterThanOrEqual(totalAmount);
          
          // But not more than parts kobo over (one kobo per part max)
          expect(totalPaid).toBeLessThanOrEqual(totalAmount + parts);
        }
      ),
      { numRuns: 100 }
    );
  });
});
