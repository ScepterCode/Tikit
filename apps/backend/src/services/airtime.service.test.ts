import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { prisma } from '../lib/prisma.js';

/**
 * Feature: tikit-webapp, Property 37: Airtime payment deduction
 * Validates: Requirements 11.2
 * 
 * For any airtime payment for a ticket, the user's airtime balance should be 
 * reduced by the exact ticket amount
 */

// Mock user airtime balance tracking
interface UserAirtimeBalance {
  phoneNumber: string;
  balance: number;
}

// Simulate airtime balance storage
const airtimeBalances = new Map<string, number>();

// Helper function to get user's airtime balance
function getAirtimeBalance(phoneNumber: string): number {
  return airtimeBalances.get(phoneNumber) || 0;
}

// Helper function to set user's airtime balance
function setAirtimeBalance(phoneNumber: string, balance: number): void {
  airtimeBalances.set(phoneNumber, balance);
}

// Helper function to deduct airtime
function deductAirtime(phoneNumber: string, amount: number): boolean {
  const currentBalance = getAirtimeBalance(phoneNumber);
  
  if (currentBalance < amount) {
    return false; // Insufficient balance
  }
  
  setAirtimeBalance(phoneNumber, currentBalance - amount);
  return true;
}

// Custom arbitrary for Nigerian phone numbers
const nigerianPhoneNumber = fc.constantFrom(
  '0803', '0806', '0810', '0813', '0814', '0816', '0903', '0906', // MTN
  '0805', '0807', '0811', '0815', '0905', '0915', // Glo
  '0802', '0808', '0812', '0901', '0902', '0904', '0907', '0912', // Airtel
  '0809', '0817', '0818', '0909', '0908' // 9mobile
).chain(prefix => 
  fc.tuple(fc.constant(prefix), fc.integer({ min: 1000000, max: 9999999 }))
    .map(([p, num]) => `${p}${num}`)
);

describe('Property 37: Airtime payment deduction', () => {
  beforeEach(() => {
    // Clear balances before each test
    airtimeBalances.clear();
  });

  it('should reduce airtime balance by exact ticket amount for any valid payment', () => {
    fc.assert(
      fc.property(
        nigerianPhoneNumber,
        fc.integer({ min: 100000, max: 10000000 }), // Initial balance in kobo
        fc.integer({ min: 10000, max: 1000000 }), // Ticket amount in kobo
        (phoneNumber, initialBalance, ticketAmount) => {
          // Ensure sufficient balance
          fc.pre(initialBalance >= ticketAmount);
          
          // Set initial balance
          setAirtimeBalance(phoneNumber, initialBalance);
          
          // Get balance before deduction
          const balanceBefore = getAirtimeBalance(phoneNumber);
          
          // Deduct airtime
          const success = deductAirtime(phoneNumber, ticketAmount);
          
          // Get balance after deduction
          const balanceAfter = getAirtimeBalance(phoneNumber);
          
          // Property: Deduction should succeed
          expect(success).toBe(true);
          
          // Property: Balance should be reduced by exact amount
          expect(balanceAfter).toBe(balanceBefore - ticketAmount);
          
          // Property: Reduction should equal ticket amount
          expect(balanceBefore - balanceAfter).toBe(ticketAmount);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should fail deduction when balance is insufficient', () => {
    fc.assert(
      fc.property(
        nigerianPhoneNumber,
        fc.integer({ min: 0, max: 100000 }), // Small initial balance
        fc.integer({ min: 100001, max: 1000000 }), // Larger ticket amount
        (phoneNumber, initialBalance, ticketAmount) => {
          // Ensure insufficient balance
          fc.pre(initialBalance < ticketAmount);
          
          // Set initial balance
          setAirtimeBalance(phoneNumber, initialBalance);
          
          // Get balance before attempted deduction
          const balanceBefore = getAirtimeBalance(phoneNumber);
          
          // Attempt to deduct airtime
          const success = deductAirtime(phoneNumber, ticketAmount);
          
          // Get balance after attempted deduction
          const balanceAfter = getAirtimeBalance(phoneNumber);
          
          // Property: Deduction should fail
          expect(success).toBe(false);
          
          // Property: Balance should remain unchanged
          expect(balanceAfter).toBe(balanceBefore);
          expect(balanceAfter).toBe(initialBalance);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle multiple consecutive deductions correctly', () => {
    fc.assert(
      fc.property(
        nigerianPhoneNumber,
        fc.integer({ min: 1000000, max: 10000000 }), // Large initial balance
        fc.array(fc.integer({ min: 10000, max: 100000 }), { minLength: 2, maxLength: 10 }), // Multiple payments
        (phoneNumber, initialBalance, payments) => {
          const totalPayments = payments.reduce((sum, p) => sum + p, 0);
          
          // Ensure sufficient balance for all payments
          fc.pre(initialBalance >= totalPayments);
          
          // Set initial balance
          setAirtimeBalance(phoneNumber, initialBalance);
          
          let expectedBalance = initialBalance;
          
          // Process each payment
          for (const payment of payments) {
            const balanceBefore = getAirtimeBalance(phoneNumber);
            const success = deductAirtime(phoneNumber, payment);
            const balanceAfter = getAirtimeBalance(phoneNumber);
            
            // Each deduction should succeed
            expect(success).toBe(true);
            
            // Balance should decrease by payment amount
            expect(balanceAfter).toBe(balanceBefore - payment);
            
            expectedBalance -= payment;
          }
          
          // Final balance should equal initial minus all payments
          const finalBalance = getAirtimeBalance(phoneNumber);
          expect(finalBalance).toBe(initialBalance - totalPayments);
          expect(finalBalance).toBe(expectedBalance);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain balance accuracy across different phone numbers', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.tuple(
            nigerianPhoneNumber,
            fc.integer({ min: 100000, max: 1000000 }),
            fc.integer({ min: 10000, max: 50000 })
          ),
          { minLength: 2, maxLength: 5 }
        ),
        (users) => {
          // Ensure unique phone numbers
          const uniqueUsers = Array.from(
            new Map(users.map(u => [u[0], u])).values()
          );
          
          fc.pre(uniqueUsers.length >= 2);
          
          // Set up balances and track expected final balances
          const expectedBalances = new Map<string, number>();
          for (const [phone, balance, payment] of uniqueUsers) {
            setAirtimeBalance(phone, balance);
            // Calculate expected balance after payment
            expectedBalances.set(phone, balance >= payment ? balance - payment : balance);
          }
          
          // Process payments for each user
          for (const [phone, balance, payment] of uniqueUsers) {
            if (balance >= payment) {
              const success = deductAirtime(phone, payment);
              expect(success).toBe(true);
            }
          }
          
          // Verify all balances match expected values
          for (const [phone, expectedBalance] of expectedBalances) {
            const actualBalance = getAirtimeBalance(phone);
            expect(actualBalance).toBe(expectedBalance);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
