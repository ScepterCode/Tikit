import { Request, Response, NextFunction } from 'express';
import redisClient from '../lib/redis.js';

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message?: string;
}

/**
 * Rate limiting middleware using Redis
 */
export const createRateLimiter = (options: RateLimitOptions) => {
  const { windowMs, maxRequests, message = 'Too many requests, please try again later.' } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Use authenticated user ID if available, otherwise fall back to IP address
      // @ts-ignore - req.user is added by auth middleware
      const userId = req.user?.userId;
      const identifier = userId || req.ip || req.socket.remoteAddress || 'unknown';
      const key = `ratelimit:${identifier}`;

      // Get current count
      const current = await redisClient.get(key);
      const count = current ? parseInt(current, 10) : 0;

      if (count >= maxRequests) {
        return res.status(429).json({
          success: false,
          error: {
            code: 'RATE_LIMIT_ERROR',
            message,
            timestamp: new Date().toISOString(),
          },
        });
      }

      // Increment counter
      const newCount = await redisClient.incr(key);

      // Set expiration on first request
      if (newCount === 1) {
        await redisClient.expire(key, Math.ceil(windowMs / 1000));
      }

      // Add rate limit headers
      res.setHeader('X-RateLimit-Limit', maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', (maxRequests - newCount).toString());

      next();
    } catch (error) {
      console.error('Rate limit error:', error);
      // On error, allow the request to proceed
      next();
    }
  };
};

/**
 * Standard rate limiter for API endpoints (100 requests per minute)
 */
export const apiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100,
});

/**
 * Strict rate limiter for authentication endpoints (5 requests per minute)
 */
export const authRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 5,
  message: 'Too many authentication attempts, please try again later.',
});

/**
 * Payment rate limiter (10 requests per minute)
 */
export const paymentRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10,
  message: 'Too many payment requests, please try again later.',
});
