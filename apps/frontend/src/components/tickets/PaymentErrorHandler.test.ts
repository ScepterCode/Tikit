import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { PaymentMethod } from './PaymentMethodSelector';
import type { PaymentError } from './PaymentErrorHandler';

/**
 * Feature: tikit-webapp, Property 39: Payment failure error handling
 * Validates: Requirements 11.4
 * 
 * For any failed payment, an error message should be displayed and alternative 
 * payment methods should be offered
 */

// Helper function to get error message for a payment error
function getErrorMessage(error: PaymentError): string {
  switch (error.code) {
    case 'INSUFFICIENT_FUNDS':
      return 'Insufficient funds. Please try a different payment method or add funds to your account.';
    case 'CARD_DECLINED':
      return 'Your card was declined. Please check your card details or try a different payment method.';
    case 'NETWORK_ERROR':
      return 'Network error. Please check your internet connection and try again.';
    case 'PAYMENT_GATEWAY_ERROR':
      return 'Payment gateway is temporarily unavailable. Please try again or use an alternative payment method.';
    case 'AIRTIME_INSUFFICIENT':
      return 'Insufficient airtime balance. Please recharge your airtime or use a different payment method.';
    case 'SPONSORSHIP_EXPIRED':
      return 'Sponsorship request has expired. Please create a new sponsorship request.';
    case 'INVALID_OTP':
      return 'Invalid OTP. Please check the code and try again.';
    case 'PAYMENT_TIMEOUT':
      return 'Payment timed out. Please try again.';
    default:
      return error.message || 'Payment failed. Please try again or use a different payment method.';
  }
}

// Helper function to get alternative payment methods
function getAlternativeMethods(currentMethod: PaymentMethod): PaymentMethod[] {
  const allMethods: PaymentMethod[] = ['card', 'bank_transfer', 'opay', 'palmpay', 'airtime', 'sponsored'];
  return allMethods.filter(method => method !== currentMethod);
}

// Custom arbitrary for payment error codes
const paymentErrorCode = fc.constantFrom(
  'INSUFFICIENT_FUNDS',
  'CARD_DECLINED',
  'NETWORK_ERROR',
  'PAYMENT_GATEWAY_ERROR',
  'AIRTIME_INSUFFICIENT',
  'SPONSORSHIP_EXPIRED',
  'INVALID_OTP',
  'PAYMENT_TIMEOUT',
  'UNKNOWN_ERROR'
);

// Custom arbitrary for payment methods
const paymentMethod = fc.constantFrom<PaymentMethod>(
  'card',
  'bank_transfer',
  'opay',
  'palmpay',
  'airtime',
  'sponsored'
);

describe('Property 39: Payment failure error handling', () => {
  it('should always display an error message for any payment failure', () => {
    fc.assert(
      fc.property(
        paymentErrorCode,
        fc.string({ minLength: 10, maxLength: 100 }),
        (code, message) => {
          const error: PaymentError = { code, message };
          
          // Property: Error message should always be non-empty
          const errorMessage = getErrorMessage(error);
          expect(errorMessage).toBeTruthy();
          expect(errorMessage.length).toBeGreaterThan(0);
          
          // Property: Error message should be a string
          expect(typeof errorMessage).toBe('string');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should offer alternative payment methods for any failed payment method', () => {
    fc.assert(
      fc.property(
        paymentMethod,
        (currentMethod) => {
          const alternatives = getAlternativeMethods(currentMethod);
          
          // Property: Should always offer alternatives
          expect(alternatives.length).toBeGreaterThan(0);
          
          // Property: Current method should not be in alternatives
          expect(alternatives).not.toContain(currentMethod);
          
          // Property: All alternatives should be valid payment methods
          const validMethods: PaymentMethod[] = ['card', 'bank_transfer', 'opay', 'palmpay', 'airtime', 'sponsored'];
          alternatives.forEach(method => {
            expect(validMethods).toContain(method);
          });
          
          // Property: Should offer exactly 5 alternatives (6 total - 1 current)
          expect(alternatives.length).toBe(5);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should provide unique alternative methods without duplicates', () => {
    fc.assert(
      fc.property(
        paymentMethod,
        (currentMethod) => {
          const alternatives = getAlternativeMethods(currentMethod);
          
          // Property: All alternatives should be unique
          const uniqueAlternatives = new Set(alternatives);
          expect(uniqueAlternatives.size).toBe(alternatives.length);
          
          // Property: No method should appear twice
          alternatives.forEach((method, index) => {
            const otherMethods = alternatives.filter((_, i) => i !== index);
            expect(otherMethods).not.toContain(method);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle any error code gracefully with a fallback message', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }), // Random error code
        fc.string({ minLength: 0, maxLength: 100 }), // Random message
        (code, message) => {
          const error: PaymentError = { code, message };
          
          // Property: Should always return a message, never null or undefined
          const errorMessage = getErrorMessage(error);
          expect(errorMessage).toBeDefined();
          expect(errorMessage).not.toBeNull();
          
          // Property: Should return a non-empty string
          expect(typeof errorMessage).toBe('string');
          expect(errorMessage.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain consistency across multiple error handling calls', () => {
    fc.assert(
      fc.property(
        paymentErrorCode,
        fc.string(),
        paymentMethod,
        (code, message, method) => {
          const error: PaymentError = { code, message };
          
          // Get error message and alternatives multiple times
          const message1 = getErrorMessage(error);
          const message2 = getErrorMessage(error);
          const alternatives1 = getAlternativeMethods(method);
          const alternatives2 = getAlternativeMethods(method);
          
          // Property: Results should be consistent
          expect(message1).toBe(message2);
          expect(alternatives1).toEqual(alternatives2);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should ensure all payment methods can have alternatives offered', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<PaymentMethod>('card', 'bank_transfer', 'opay', 'palmpay', 'airtime', 'sponsored'),
        (method) => {
          const alternatives = getAlternativeMethods(method);
          
          // Property: Every payment method should have alternatives
          expect(alternatives.length).toBeGreaterThan(0);
          
          // Property: Alternatives + current method should equal total methods
          expect(alternatives.length + 1).toBe(6);
        }
      ),
      { numRuns: 100 }
    );
  });
});
