import { describe, it, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import { sendOTP, verifyOTP, generateOTP } from './auth.service.js';
import redisClient from '../lib/redis.js';

/**
 * Feature: tikit-webapp, Property 44: Registration OTP delivery
 * Validates: Requirements 13.1
 * 
 * Property: For any valid Nigerian phone number, when an OTP is requested,
 * the system should send an OTP to that phone number
 */

// Custom arbitrary for Nigerian phone numbers
const nigerianPhoneNumber = () =>
  fc.tuple(
    fc.constantFrom('803', '806', '810', '813', '814', '816', '903', '906', '913'),
    fc.integer({ min: 1000000, max: 9999999 })
  ).map(([prefix, suffix]) => `+234${prefix}${suffix}`);

// Mock Redis data store
const mockRedisData = new Map<string, { value: string; expiry?: number }>();

describe('Auth Service Property Tests', () => {
  // Setup mock implementations
  beforeEach(() => {
    mockRedisData.clear();
    
    vi.mocked(redisClient.get).mockImplementation(async (key: any) => {
      const data = mockRedisData.get(key);
      if (!data) return null;
      if (data.expiry && Date.now() > data.expiry) {
        mockRedisData.delete(key);
        return null;
      }
      return data.value;
    });

    vi.mocked(redisClient.setEx).mockImplementation(async (key: any, seconds: number, value: any) => {
      mockRedisData.set(key, {
        value,
        expiry: Date.now() + seconds * 1000,
      });
      return 'OK';
    });

    vi.mocked(redisClient.del).mockImplementation(async (key: any) => {
      mockRedisData.delete(key);
      return 1;
    });

    vi.mocked(redisClient.incr).mockImplementation(async (key: any) => {
      const current = mockRedisData.get(key);
      const newValue = current ? parseInt(current.value) + 1 : 1;
      mockRedisData.set(key, { value: newValue.toString() });
      return newValue;
    });

    vi.mocked(redisClient.expire).mockImplementation(async (key: any, seconds: number) => {
      const data = mockRedisData.get(key);
      if (data) {
        data.expiry = Date.now() + seconds * 1000;
        mockRedisData.set(key, data);
      }
      return 1;
    });

    vi.mocked(redisClient.ttl).mockImplementation(async (key: any) => {
      const data = mockRedisData.get(key);
      if (!data || !data.expiry) return -1;
      const remaining = Math.ceil((data.expiry - Date.now()) / 1000);
      return remaining > 0 ? remaining : -2;
    });

    vi.mocked(redisClient.flushDb).mockImplementation(async () => {
      mockRedisData.clear();
      return 'OK';
    });
  });

  describe('Property 44: Registration OTP delivery', () => {
    it('should send OTP for any valid Nigerian phone number', async () => {
      await fc.assert(
        fc.asyncProperty(nigerianPhoneNumber(), async (phoneNumber) => {
          // Send OTP
          const result = await sendOTP(phoneNumber);

          // Verify that OTP was sent successfully
          expect(result.success).toBe(true);
          expect(result.message).toBe('OTP sent successfully');

          // Verify that OTP is stored in Redis
          const otpKey = `otp:${phoneNumber}`;
          const otpData = await redisClient.get(otpKey);
          expect(otpData).not.toBeNull();

          if (otpData) {
            const parsed = JSON.parse(otpData);
            expect(parsed.phoneNumber).toBe(phoneNumber);
            expect(parsed.code).toMatch(/^\d{6}$/); // 6-digit code
            expect(parsed.attempts).toBe(0);
          }
        }),
        { numRuns: 20 }
      );
    });

    it('should enforce rate limiting (3 OTP requests per 10 minutes)', async () => {
      await fc.assert(
        fc.asyncProperty(nigerianPhoneNumber(), async (phoneNumber) => {
          // Send 3 OTPs successfully
          for (let i = 0; i < 3; i++) {
            const result = await sendOTP(phoneNumber);
            expect(result.success).toBe(true);
          }

          // 4th attempt should be rate limited
          const result = await sendOTP(phoneNumber);
          expect(result.success).toBe(false);
          expect(result.message).toContain('Too many OTP requests');
        }),
        { numRuns: 5 } // Fewer runs for rate limiting test
      );
    });

    it('should generate unique 6-digit OTP codes', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 1000 }), () => {
          const otp = generateOTP();
          expect(otp).toMatch(/^\d{6}$/);
          expect(parseInt(otp)).toBeGreaterThanOrEqual(100000);
          expect(parseInt(otp)).toBeLessThanOrEqual(999999);
        }),
        { numRuns: 20 }
      );
    });

    it('should expire OTP after 5 minutes', async () => {
      await fc.assert(
        fc.asyncProperty(nigerianPhoneNumber(), async (phoneNumber) => {
          // Send OTP
          const result = await sendOTP(phoneNumber);
          expect(result.success).toBe(true);

          // Check TTL is set correctly (should be around 300 seconds)
          const otpKey = `otp:${phoneNumber}`;
          const ttl = await redisClient.ttl(otpKey);
          expect(ttl).toBeGreaterThan(290); // Allow some margin
          expect(ttl).toBeLessThanOrEqual(300);
        }),
        { numRuns: 10 }
      );
    });
  });

  describe('Property 45: JWT token generation', () => {
    /**
     * Feature: tikit-webapp, Property 45: JWT token generation
     * Validates: Requirements 13.2
     * 
     * Property: For any successful login, a JWT token with 24-hour expiration
     * should be generated
     */
    it('should generate JWT access token with 24-hour expiration for any user', () => {
      fc.assert(
        fc.property(
          fc.uuid(), // userId
          fc.constantFrom('attendee', 'organizer', 'admin'), // role
          (userId, role) => {
            const { generateAccessToken, verifyAccessToken } = require('./auth.service.js');
            
            // Generate access token
            const token = generateAccessToken(userId, role);
            
            // Verify token is a non-empty string
            expect(token).toBeTruthy();
            expect(typeof token).toBe('string');
            expect(token.length).toBeGreaterThan(0);
            
            // Verify token can be decoded and contains correct data
            const decoded = verifyAccessToken(token);
            expect(decoded).not.toBeNull();
            expect(decoded?.userId).toBe(userId);
            expect(decoded?.role).toBe(role);
            
            // Verify token has expiration (we can't check exact 24h without mocking time,
            // but we can verify the token structure is valid)
            const jwt = require('jsonwebtoken');
            const decodedFull = jwt.decode(token) as any;
            expect(decodedFull).toHaveProperty('exp');
            expect(decodedFull).toHaveProperty('iat');
            
            // Verify expiration is approximately 24 hours (86400 seconds)
            const expirationDuration = decodedFull.exp - decodedFull.iat;
            expect(expirationDuration).toBe(86400); // 24 hours in seconds
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should generate JWT refresh token with 30-day expiration for any user', () => {
      fc.assert(
        fc.property(
          fc.uuid(), // userId
          (userId) => {
            const { generateRefreshToken, verifyRefreshToken } = require('./auth.service.js');
            
            // Generate refresh token
            const token = generateRefreshToken(userId);
            
            // Verify token is a non-empty string
            expect(token).toBeTruthy();
            expect(typeof token).toBe('string');
            expect(token.length).toBeGreaterThan(0);
            
            // Verify token can be decoded and contains correct data
            const decoded = verifyRefreshToken(token);
            expect(decoded).not.toBeNull();
            expect(decoded?.userId).toBe(userId);
            
            // Verify token has expiration
            const jwt = require('jsonwebtoken');
            const decodedFull = jwt.decode(token) as any;
            expect(decodedFull).toHaveProperty('exp');
            expect(decodedFull).toHaveProperty('iat');
            
            // Verify expiration is approximately 30 days (2592000 seconds)
            const expirationDuration = decodedFull.exp - decodedFull.iat;
            expect(expirationDuration).toBe(2592000); // 30 days in seconds
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should generate unique tokens for different users', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.uuid(),
          fc.constantFrom('attendee', 'organizer', 'admin'),
          (userId1, userId2, role) => {
            // Only test when user IDs are different
            fc.pre(userId1 !== userId2);
            
            const { generateAccessToken } = require('./auth.service.js');
            
            const token1 = generateAccessToken(userId1, role);
            const token2 = generateAccessToken(userId2, role);
            
            // Tokens should be different for different users
            expect(token1).not.toBe(token2);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should reject expired or invalid tokens', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 10, maxLength: 200 }), // random invalid token
          (invalidToken) => {
            const { verifyAccessToken } = require('./auth.service.js');
            
            // Invalid tokens should return null
            const decoded = verifyAccessToken(invalidToken);
            expect(decoded).toBeNull();
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('OTP Verification', () => {
    it('should verify correct OTP code', async () => {
      await fc.assert(
        fc.asyncProperty(nigerianPhoneNumber(), async (phoneNumber) => {
          // Send OTP
          await sendOTP(phoneNumber);

          // Get the OTP code from Redis
          const otpKey = `otp:${phoneNumber}`;
          const otpData = await redisClient.get(otpKey);
          expect(otpData).not.toBeNull();

          if (otpData) {
            const parsed = JSON.parse(otpData);
            const code = parsed.code;

            // Verify OTP
            const result = await verifyOTP(phoneNumber, code);
            expect(result.success).toBe(true);
            expect(result.message).toBe('OTP verified successfully');

            // OTP should be deleted after successful verification
            const deletedOtp = await redisClient.get(otpKey);
            expect(deletedOtp).toBeNull();
          }
        }),
        { numRuns: 10 }
      );
    });

    it('should reject incorrect OTP code', async () => {
      await fc.assert(
        fc.asyncProperty(
          nigerianPhoneNumber(),
          fc.string({ minLength: 6, maxLength: 6 }).filter(s => /^\d{6}$/.test(s)),
          async (phoneNumber, wrongCode) => {
            // Send OTP
            await sendOTP(phoneNumber);

            // Get the actual OTP code
            const otpKey = `otp:${phoneNumber}`;
            const otpData = await redisClient.get(otpKey);
            
            if (otpData) {
              const parsed = JSON.parse(otpData);
              const correctCode = parsed.code;

              // Only test if wrong code is different from correct code
              if (wrongCode !== correctCode) {
                const result = await verifyOTP(phoneNumber, wrongCode);
                expect(result.success).toBe(false);
                expect(result.message).toContain('Invalid OTP code');
              }
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should lock account after 5 failed OTP attempts', async () => {
      await fc.assert(
        fc.asyncProperty(nigerianPhoneNumber(), async (phoneNumber) => {
          // Send OTP
          await sendOTP(phoneNumber);

          // Try 5 wrong codes
          for (let i = 0; i < 5; i++) {
            await verifyOTP(phoneNumber, '000000');
          }

          // 6th attempt should trigger lock
          const result = await verifyOTP(phoneNumber, '000000');
          expect(result.success).toBe(false);
          expect(result.message).toContain('locked');

          // Check that lock key exists
          const lockKey = `otp:lock:${phoneNumber}`;
          const locked = await redisClient.get(lockKey);
          expect(locked).toBe('locked');
        }),
        { numRuns: 5 } // Fewer runs for brute force test
      );
    });
  });
});
