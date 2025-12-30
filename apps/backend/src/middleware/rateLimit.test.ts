import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import fc from 'fast-check';
import { createRateLimiter } from './rateLimit.js';
import redisClient from '../lib/redis.js';

describe('Rate Limiting Middleware', () => {
  beforeEach(async () => {
    // Clear Redis mock data before each test
    await redisClient.flushDb();
    vi.clearAllMocks();
  });

  it('allows requests under the limit', async () => {
    const rateLimiter = createRateLimiter({
      windowMs: 60 * 1000,
      maxRequests: 5,
    });

    const userId = 'test-user';

    for (let i = 0; i < 5; i++) {
      const mockReq = {
        user: { userId },
        ip: '127.0.0.1',
        socket: { remoteAddress: '127.0.0.1' },
      } as unknown as Request;

      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
        setHeader: vi.fn(),
      } as unknown as Response;

      const mockNext = vi.fn() as NextFunction;

      await rateLimiter(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    }
  });

  it('blocks requests over the limit', async () => {
    const rateLimiter = createRateLimiter({
      windowMs: 60 * 1000,
      maxRequests: 5,
    });

    const userId = 'test-user';

    // Make 5 requests (should all succeed)
    for (let i = 0; i < 5; i++) {
      const mockReq = {
        user: { userId },
        ip: '127.0.0.1',
        socket: { remoteAddress: '127.0.0.1' },
      } as unknown as Request;

      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
        setHeader: vi.fn(),
      } as unknown as Response;

      const mockNext = vi.fn() as NextFunction;

      await rateLimiter(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
    }

    // 6th request should be blocked
    const mockReq = {
      user: { userId },
      ip: '127.0.0.1',
      socket: { remoteAddress: '127.0.0.1' },
    } as unknown as Request;

    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      setHeader: vi.fn(),
    } as unknown as Response;

    const mockNext = vi.fn() as NextFunction;

    await rateLimiter(mockReq, mockRes, mockNext);
    expect(mockRes.status).toHaveBeenCalledWith(429);
    expect(mockNext).not.toHaveBeenCalled();
  });


  /**
   * Feature: tikit-webapp, Property 47: Rate limiting enforcement
   * Validates: Requirements 13.4
   * 
   * For any user making API requests, after 100 requests in a 60-second window,
   * subsequent requests should be blocked until the window resets
   */
  it('Property 47: Rate limiting enforcement', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate number of requests (we want to test both under and over the limit)
        fc.integer({ min: 1, max: 150 }),
        // Generate a user identifier (avoid whitespace-only strings)
        fc.string({ minLength: 5, maxLength: 20 }).filter(s => s.trim().length > 0),
        async (numRequests, userId) => {
          // Clear Redis before each property test iteration
          await redisClient.flushDb();
          vi.clearAllMocks();

          const maxRequests = 100;
          const windowMs = 60 * 1000; // 60 seconds

          // Create rate limiter with standard API limits
          const rateLimiter = createRateLimiter({
            windowMs,
            maxRequests,
          });

          let blockedCount = 0;
          let allowedCount = 0;

          // Simulate multiple requests from the same user
          for (let i = 0; i < numRequests; i++) {
            const mockReq = {
              user: { userId },
              ip: '127.0.0.1',
              socket: { remoteAddress: '127.0.0.1' },
            } as unknown as Request;

            const mockRes = {
              status: vi.fn().mockReturnThis(),
              json: vi.fn().mockReturnThis(),
              setHeader: vi.fn(),
            } as unknown as Response;

            const mockNext = vi.fn() as NextFunction;

            await rateLimiter(mockReq, mockRes, mockNext);

            // A request is blocked if status(429) was called
            // A request is allowed if next() was called AND status was not called with 429
            const statusCalls = mockRes.status.mock.calls;
            const wasBlocked = statusCalls.length > 0 && statusCalls[0][0] === 429;
            const wasAllowed = mockNext.mock.calls.length > 0 && !wasBlocked;

            if (wasBlocked) {
              blockedCount++;
              
              // Verify error response structure
              expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                  success: false,
                  error: expect.objectContaining({
                    code: 'RATE_LIMIT_ERROR',
                    message: expect.any(String),
                    timestamp: expect.any(String),
                  }),
                })
              );
            } else if (wasAllowed) {
              allowedCount++;
            }
          }

          // Property: After maxRequests, all subsequent requests should be blocked
          if (numRequests <= maxRequests) {
            // All requests should be allowed
            expect(allowedCount).toBe(numRequests);
            expect(blockedCount).toBe(0);
          } else {
            // First maxRequests should be allowed, rest should be blocked
            expect(allowedCount).toBe(maxRequests);
            expect(blockedCount).toBe(numRequests - maxRequests);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 47 (edge case): Rate limiting blocks after limit reached', async () => {
    const maxRequests = 5;
    const windowMs = 60 * 1000;

    const rateLimiter = createRateLimiter({
      windowMs,
      maxRequests,
    });

    const userId = 'test-user-123';

    // Make maxRequests requests - all should succeed
    for (let i = 0; i < maxRequests; i++) {
      const mockReq = {
        user: { userId },
        ip: '127.0.0.1',
        socket: { remoteAddress: '127.0.0.1' },
      } as unknown as Request;

      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
        setHeader: vi.fn(),
      } as unknown as Response;

      const mockNext = vi.fn() as NextFunction;

      await rateLimiter(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
    }

    // Next request should be blocked
    const mockReqBlocked = {
      user: { userId },
      ip: '127.0.0.1',
      socket: { remoteAddress: '127.0.0.1' },
    } as unknown as Request;

    const mockResBlocked = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      setHeader: vi.fn(),
    } as unknown as Response;

    const mockNextBlocked = vi.fn() as NextFunction;

    await rateLimiter(mockReqBlocked, mockResBlocked, mockNextBlocked);
    expect(mockResBlocked.status).toHaveBeenCalledWith(429);
    expect(mockNextBlocked).not.toHaveBeenCalled();
  });

  it('Property 47 (edge case): Different users have independent rate limits', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate multiple unique user identifiers
        fc.uniqueArray(fc.string({ minLength: 5, maxLength: 20 }).filter(s => s.trim().length > 0), { 
          minLength: 2, 
          maxLength: 10 
        }),
        // Number of requests per user
        fc.integer({ min: 1, max: 50 }),
        async (userIds, requestsPerUser) => {
          // Clear Redis before each iteration
          await redisClient.flushDb();

          const maxRequests = 100;
          const windowMs = 60 * 1000;

          const rateLimiter = createRateLimiter({
            windowMs,
            maxRequests,
          });

          // Each user should be able to make up to maxRequests independently
          for (const userId of userIds) {
            let allowedCount = 0;

            for (let i = 0; i < requestsPerUser; i++) {
              const mockReq = {
                user: { userId },
                ip: '127.0.0.1',
                socket: { remoteAddress: '127.0.0.1' },
              } as unknown as Request;

              const mockRes = {
                status: vi.fn().mockReturnThis(),
                json: vi.fn().mockReturnThis(),
                setHeader: vi.fn(),
              } as unknown as Response;

              const mockNext = vi.fn() as NextFunction;

              await rateLimiter(mockReq, mockRes, mockNext);

              if (mockNext.mock.calls.length > 0) {
                allowedCount++;
              }
            }

            // Each user should have their own limit
            if (requestsPerUser <= maxRequests) {
              expect(allowedCount).toBe(requestsPerUser);
            } else {
              expect(allowedCount).toBe(maxRequests);
            }
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('Property 47 (edge case): Rate limit headers are set correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 100 }),
        fc.string({ minLength: 5, maxLength: 20 }).filter(s => s.trim().length > 0),
        async (numRequests, userId) => {
          // Clear Redis before each iteration
          await redisClient.flushDb();

          const maxRequests = 100;
          const windowMs = 60 * 1000;

          const rateLimiter = createRateLimiter({
            windowMs,
            maxRequests,
          });

          for (let i = 0; i < numRequests; i++) {
            const mockReq = {
              user: { userId },
              ip: '127.0.0.1',
              socket: { remoteAddress: '127.0.0.1' },
            } as unknown as Request;

            const mockRes = {
              status: vi.fn().mockReturnThis(),
              json: vi.fn().mockReturnThis(),
              setHeader: vi.fn(),
            } as unknown as Response;

            const mockNext = vi.fn() as NextFunction;

            await rateLimiter(mockReq, mockRes, mockNext);

            // If request was allowed, check headers
            if (mockNext.mock.calls.length > 0) {
              // Check that X-RateLimit-Limit header was set
              const limitCalls = mockRes.setHeader.mock.calls.filter(
                call => call[0] === 'X-RateLimit-Limit'
              );
              expect(limitCalls.length).toBeGreaterThan(0);
              expect(limitCalls[0][1]).toBe(maxRequests.toString());

              // Check that X-RateLimit-Remaining header was set
              const remainingCalls = mockRes.setHeader.mock.calls.filter(
                call => call[0] === 'X-RateLimit-Remaining'
              );
              expect(remainingCalls.length).toBeGreaterThan(0);
              expect(remainingCalls[0][1]).toBe((maxRequests - (i + 1)).toString());
            }
          }
        }
      ),
      { numRuns: 50 }
    );
  });
});
