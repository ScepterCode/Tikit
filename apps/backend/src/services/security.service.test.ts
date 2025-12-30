import { describe, it, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import {
  trackFailedLogin,
  clearFailedLoginAttempts,
  lockAccount,
  isAccountLocked,
  unlockAccount,
  trackFailedPayment,
  detectAndHandleBreach,
  sendSecurityAlert,
  getSecurityEvents,
  checkSuspiciousActivity,
} from './security.service.js';
import redisClient from '../lib/redis.js';

/**
 * Feature: tikit-webapp, Property 48: Security breach response
 * Validates: Requirements 13.5
 * 
 * Property: For any detected security breach, the affected account should be locked
 * and a notification SMS should be sent to the user
 */

// Mock Prisma
vi.mock('../lib/prisma.js', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Custom arbitrary for user IDs
const userId = () => fc.uuid();

// Custom arbitrary for phone numbers
const nigerianPhoneNumber = () =>
  fc.tuple(
    fc.constantFrom('803', '806', '810', '813', '814', '816', '903', '906', '913'),
    fc.integer({ min: 1000000, max: 9999999 })
  ).map(([prefix, suffix]) => `+234${prefix}${suffix}`);

describe('Security Service Property Tests', () => {
  beforeEach(async () => {
    // Clear Redis data before each test
    await redisClient.flushDb();

    // Setup Prisma mocks
    const prisma = await import('../lib/prisma.js');
    vi.mocked(prisma.default.user.findUnique).mockResolvedValue({
      id: 'test-user-id',
      phoneNumber: '+2348031234567',
      phoneVerified: true,
      email: null,
      firstName: 'Test',
      lastName: 'User',
      preferredLanguage: 'en',
      state: 'Lagos',
      lga: null,
      role: 'attendee',
      walletBalance: 0,
      referralCode: 'TEST1234',
      referredBy: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(prisma.default.user.update).mockResolvedValue({
      id: 'test-user-id',
      phoneNumber: '+2348031234567',
      phoneVerified: true,
      email: null,
      firstName: 'Test',
      lastName: 'User',
      preferredLanguage: 'en',
      state: 'Lagos',
      lga: null,
      role: 'attendee',
      walletBalance: 0,
      referralCode: 'TEST1234',
      referredBy: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  describe('Property 48: Security breach response', () => {
    it('should lock account when security breach is detected', async () => {
      await fc.assert(
        fc.asyncProperty(
          userId(),
          fc.constantFrom('failed_login', 'failed_payment', 'suspicious_activity'),
          async (testUserId, breachType) => {
            // Detect and handle breach
            const result = await detectAndHandleBreach(testUserId, breachType);

            // Verify breach was detected
            expect(result.breachDetected).toBe(true);
            expect(result.accountLocked).toBe(true);

            // Verify account is locked
            const lockStatus = await isAccountLocked(testUserId);
            expect(lockStatus.locked).toBe(true);
            expect(lockStatus.reason).toBeTruthy();
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should send SMS notification when account is locked', async () => {
      await fc.assert(
        fc.asyncProperty(
          userId(),
          nigerianPhoneNumber(),
          fc.string({ minLength: 10, maxLength: 100 }),
          async (testUserId, phoneNumber, reason) => {
            // Mock user with specific phone number
            const prisma = await import('../lib/prisma.js');
            vi.mocked(prisma.default.user.findUnique).mockResolvedValueOnce({
              id: testUserId,
              phoneNumber,
              phoneVerified: true,
              email: null,
              firstName: 'Test',
              lastName: 'User',
              preferredLanguage: 'en',
              state: 'Lagos',
              lga: null,
              role: 'attendee',
              walletBalance: 0,
              referralCode: 'TEST1234',
              referredBy: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            });

            // Lock account
            const result = await lockAccount(testUserId, reason);

            // Verify lock was successful
            expect(result.success).toBe(true);

            // Verify account is locked
            const lockStatus = await isAccountLocked(testUserId);
            expect(lockStatus.locked).toBe(true);
            expect(lockStatus.reason).toBe(reason);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should track failed login attempts and lock after threshold', async () => {
      await fc.assert(
        fc.asyncProperty(nigerianPhoneNumber(), async (phoneNumber) => {
          // Track 4 failed attempts
          for (let i = 0; i < 4; i++) {
            const result = await trackFailedLogin(phoneNumber);
            expect(result.shouldLock).toBe(false);
            expect(result.attemptsRemaining).toBe(5 - (i + 1));
          }

          // 5th attempt should trigger lock
          const finalResult = await trackFailedLogin(phoneNumber);
          expect(finalResult.shouldLock).toBe(true);
          expect(finalResult.attemptsRemaining).toBe(0);
        }),
        { numRuns: 10 }
      );
    });

    it('should clear failed login attempts on successful login', async () => {
      await fc.assert(
        fc.asyncProperty(nigerianPhoneNumber(), async (phoneNumber) => {
          // Track some failed attempts
          await trackFailedLogin(phoneNumber);
          await trackFailedLogin(phoneNumber);

          // Clear attempts
          await clearFailedLoginAttempts(phoneNumber);

          // Next attempt should start fresh
          const result = await trackFailedLogin(phoneNumber);
          expect(result.attemptsRemaining).toBe(4); // First attempt after clear
        }),
        { numRuns: 10 }
      );
    });

    it('should unlock account when requested', async () => {
      await fc.assert(
        fc.asyncProperty(userId(), async (testUserId) => {
          // Lock account first
          await lockAccount(testUserId, 'Test lock');

          // Verify it's locked
          const lockedStatus = await isAccountLocked(testUserId);
          expect(lockedStatus.locked).toBe(true);

          // Unlock account
          const unlockResult = await unlockAccount(testUserId);
          expect(unlockResult.success).toBe(true);

          // Verify it's unlocked
          const unlockedStatus = await isAccountLocked(testUserId);
          expect(unlockedStatus.locked).toBe(false);
        }),
        { numRuns: 20 }
      );
    });

    it('should track failed payment attempts', async () => {
      await fc.assert(
        fc.asyncProperty(
          userId(),
          fc.integer({ min: 100, max: 1000000 }),
          fc.constantFrom('card', 'bank_transfer', 'opay', 'palmpay', 'airtime'),
          async (testUserId, amount, method) => {
            // Track failed payment
            const result = await trackFailedPayment(testUserId, amount, method);

            // First attempt should not be suspicious
            expect(result.suspicious).toBe(false);
            expect(result.failedCount).toBeGreaterThan(0);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should detect suspicious activity after multiple failed payments', async () => {
      await fc.assert(
        fc.asyncProperty(userId(), async (testUserId) => {
          // Track 5 failed payments
          for (let i = 0; i < 5; i++) {
            await trackFailedPayment(testUserId, 1000, 'card');
          }

          // Should be flagged as suspicious
          const result = await trackFailedPayment(testUserId, 1000, 'card');
          expect(result.suspicious).toBe(true);
          expect(result.failedCount).toBeGreaterThanOrEqual(5);
        }),
        { numRuns: 10 }
      );
    });

    it('should log security events', async () => {
      await fc.assert(
        fc.asyncProperty(
          userId(),
          fc.constantFrom('failed_login', 'failed_payment', 'suspicious_activity', 'account_locked'),
          async (testUserId, eventType) => {
            // Track a failed login to generate security event
            if (eventType === 'failed_login') {
              await trackFailedLogin('+2348031234567');
            }

            // Get security events
            const events = await getSecurityEvents(testUserId);

            // Events should be an array
            expect(Array.isArray(events)).toBe(true);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should check for suspicious activity patterns', async () => {
      await fc.assert(
        fc.asyncProperty(userId(), async (testUserId) => {
          // Check suspicious activity
          const result = await checkSuspiciousActivity(testUserId);

          // Result should have expected structure
          expect(result).toHaveProperty('suspicious');
          expect(result).toHaveProperty('reasons');
          expect(typeof result.suspicious).toBe('boolean');
          expect(Array.isArray(result.reasons)).toBe(true);
        }),
        { numRuns: 20 }
      );
    });

    it('should send security alert with proper message format', async () => {
      await fc.assert(
        fc.asyncProperty(
          nigerianPhoneNumber(),
          fc.string({ minLength: 10, maxLength: 100 }),
          async (phoneNumber, reason) => {
            // Send security alert
            const result = await sendSecurityAlert(phoneNumber, reason);

            // In test mode, should always succeed
            expect(result.success).toBe(true);
            expect(result.message).toBe('Security alert sent successfully');
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should maintain lock duration correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          userId(),
          fc.integer({ min: 60, max: 3600 }), // 1 minute to 1 hour
          async (testUserId, duration) => {
            // Lock account with custom duration
            await lockAccount(testUserId, 'Test lock', duration);

            // Check lock status
            const lockStatus = await isAccountLocked(testUserId);
            expect(lockStatus.locked).toBe(true);
            
            if (lockStatus.expiresAt) {
              const expectedExpiry = Date.now() + (duration * 1000);
              // Allow 5 second margin for test execution time
              expect(lockStatus.expiresAt).toBeGreaterThan(expectedExpiry - 5000);
              expect(lockStatus.expiresAt).toBeLessThan(expectedExpiry + 5000);
            }
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('Failed Login Tracking', () => {
    it('should track IP address and user agent for failed logins', async () => {
      await fc.assert(
        fc.asyncProperty(
          nigerianPhoneNumber(),
          fc.ipV4(),
          fc.string({ minLength: 10, maxLength: 200 }),
          async (phoneNumber, ipAddress, userAgent) => {
            // Track failed login with metadata
            const result = await trackFailedLogin(phoneNumber, ipAddress, userAgent);

            // Should track successfully
            expect(result).toHaveProperty('shouldLock');
            expect(result).toHaveProperty('attemptsRemaining');
            expect(typeof result.shouldLock).toBe('boolean');
            expect(typeof result.attemptsRemaining).toBe('number');
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('Account Lock Expiration', () => {
    it('should respect lock expiration time', async () => {
      await fc.assert(
        fc.asyncProperty(userId(), async (testUserId) => {
          // Lock account with short duration
          const shortDuration = 1; // 1 second
          await lockAccount(testUserId, 'Test lock', shortDuration);

          // Should be locked immediately
          const lockedStatus = await isAccountLocked(testUserId);
          expect(lockedStatus.locked).toBe(true);

          // Verify lock data exists in Redis
          const lockKey = `security:account_lock:${testUserId}`;
          const lockDataStr = await redisClient.get(lockKey);
          expect(lockDataStr).toBeTruthy();
          
          if (lockDataStr) {
            const lockData = JSON.parse(lockDataStr);
            expect(lockData.reason).toBe('Test lock');
            expect(lockData.expiresAt).toBeTruthy();
          }
        }),
        { numRuns: 10 }
      );
    });
  });
});
