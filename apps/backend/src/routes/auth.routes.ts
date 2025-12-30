import { Router, Request, Response } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma.js';
import {
  sendOTP,
  verifyOTP,
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  isPhoneLocked,
} from '../services/auth.service.js';
import { authenticate } from '../middleware/auth.js';
import { createRateLimiter } from '../middleware/rateLimit.js';

const router = Router();

// Rate limiter for OTP endpoints (3 requests per 10 minutes)
const otpRateLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000, // 10 minutes
  maxRequests: 3,
  message: 'Too many OTP requests. Please try again in 10 minutes.',
});

// Rate limiter for auth endpoints (5 requests per minute)
const authRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 5,
  message: 'Too many authentication attempts. Please try again later.',
});

// Validation schemas
const sendOTPSchema = z.object({
  phoneNumber: z.string().regex(/^\+234\d{10}$/, 'Invalid Nigerian phone number format. Use +234XXXXXXXXXX'),
});

const verifyOTPSchema = z.object({
  phoneNumber: z.string().regex(/^\+234\d{10}$/, 'Invalid Nigerian phone number format'),
  code: z.string().length(6, 'OTP code must be 6 digits'),
});

const registerSchema = z.object({
  phoneNumber: z.string().regex(/^(\+?234|0)[789]\d{9}$/, 'Invalid Nigerian phone number format. Use +234XXXXXXXXXX or 0XXXXXXXXXX'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email().optional(),
  state: z.string().min(1, 'State is required'),
  preferredLanguage: z.enum(['en', 'ha', 'ig', 'yo', 'pcm']).optional(),
  referredBy: z.string().optional(),
  role: z.enum(['attendee', 'organizer']).default('attendee'),
  organizationName: z.string().optional(),
  organizationType: z.enum(['individual', 'company', 'religious', 'educational', 'ngo', 'other']).optional(),
});

const loginSchema = z.object({
  phoneNumber: z.string().regex(/^(\+?234|0)[789]\d{9}$/, 'Invalid Nigerian phone number format. Use +234XXXXXXXXXX or 0XXXXXXXXXX'),
  password: z.string().min(1, 'Password is required'),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

/**
 * POST /api/auth/send-otp
 * Send OTP to phone number
 */
router.post('/send-otp', otpRateLimiter, async (req: Request, res: Response) => {
  try {
    const validation = sendOTPSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: validation.error.issues[0].message,
          details: validation.error.issues,
          timestamp: new Date().toISOString(),
        },
      });
    }

    const { phoneNumber } = validation.data;

    // Check if phone is locked
    const locked = await isPhoneLocked(phoneNumber);
    if (locked) {
      return res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_ERROR',
          message: 'Account locked due to too many failed attempts. Please try again in 30 minutes.',
          timestamp: new Date().toISOString(),
        },
      });
    }

    const result = await sendOTP(phoneNumber);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'OTP_ERROR',
          message: result.message,
          timestamp: new Date().toISOString(),
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to send OTP',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * POST /api/auth/verify-otp
 * Verify OTP code
 */
router.post('/verify-otp', authRateLimiter, async (req: Request, res: Response) => {
  try {
    const validation = verifyOTPSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: validation.error.issues[0].message,
          details: validation.error.issues,
          timestamp: new Date().toISOString(),
        },
      });
    }

    const { phoneNumber, code } = validation.data;

    const result = await verifyOTP(phoneNumber, code);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'OTP_ERROR',
          message: result.message,
          timestamp: new Date().toISOString(),
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to verify OTP',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * POST /api/auth/register
 * Register new user with password (simplified - no OTP)
 */
router.post('/register', authRateLimiter, async (req: Request, res: Response) => {
  try {
    const validation = registerSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: validation.error.issues[0].message,
          details: validation.error.issues,
          timestamp: new Date().toISOString(),
        },
      });
    }

    const { phoneNumber, password, ...userData } = validation.data;

    // Normalize phone number (convert 0801234567 to +2348012345678)
    const normalizePhoneNumber = (phone: string): string => {
      if (phone.startsWith('+234')) {
        return phone;
      } else if (phone.startsWith('234')) {
        return `+${phone}`;
      } else if (phone.startsWith('0')) {
        return `+234${phone.slice(1)}`;
      }
      return phone;
    };

    const normalizedPhone = normalizePhoneNumber(phoneNumber);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { phoneNumber: normalizedPhone },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'USER_EXISTS',
          message: 'Phone number already registered',
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Check if email already exists (if provided)
    if (userData.email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (existingEmail) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'EMAIL_EXISTS',
            message: 'Email address already registered',
            timestamp: new Date().toISOString(),
          },
        });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate referral code
    const { generateReferralCode } = await import('../services/auth.service.js');
    const referralCode = await generateReferralCode();

    // Create user
    const user = await prisma.user.create({
      data: {
        phoneNumber: normalizedPhone,
        password: hashedPassword,
        phoneVerified: true, // Auto-verify for now
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        state: userData.state,
        preferredLanguage: userData.preferredLanguage || 'en',
        role: userData.role,
        organizationName: userData.organizationName,
        organizationType: userData.organizationType,
        referralCode,
        walletBalance: 0,
      },
      select: {
        id: true,
        phoneNumber: true,
        firstName: true,
        lastName: true,
        email: true,
        state: true,
        role: true,
        walletBalance: true,
        referralCode: true,
        organizationName: true,
        organizationType: true,
        isVerified: true,
        createdAt: true,
      },
    });

    // Generate tokens
    
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';

    const accessToken = jwt.sign(
      { userId: user.id, phoneNumber: user.phoneNumber, role: user.role, state: user.state },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      JWT_REFRESH_SECRET,
      { expiresIn: '30d' }
    );

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: {
          ...user,
          walletBalance: user.walletBalance || 0,
          referralCode: user.referralCode || '',
          isVerified: user.isVerified || false,
          createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    
    // Handle Prisma unique constraint errors
    if (error.code === 'P2002') {
      const target = error.meta?.target;
      if (target?.includes('phoneNumber')) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'USER_EXISTS',
            message: 'Phone number already registered',
            timestamp: new Date().toISOString(),
          },
        });
      } else if (target?.includes('email')) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'EMAIL_EXISTS',
            message: 'Email address already registered',
            timestamp: new Date().toISOString(),
          },
        });
      }
    }
    
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to register user',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * POST /api/auth/login
 * Login user with phone number and password
 */
router.post('/login', authRateLimiter, async (req: Request, res: Response) => {
  try {
    const validation = loginSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: validation.error.issues[0].message,
          details: validation.error.issues,
          timestamp: new Date().toISOString(),
        },
      });
    }

    const { phoneNumber, password } = validation.data;

    // Normalize phone number (convert 0801234567 to +2348012345678)
    const normalizePhoneNumber = (phone: string): string => {
      if (phone.startsWith('+234')) {
        return phone;
      } else if (phone.startsWith('234')) {
        return `+${phone}`;
      } else if (phone.startsWith('0')) {
        return `+234${phone.slice(1)}`;
      }
      return phone;
    };

    const normalizedPhone = normalizePhoneNumber(phoneNumber);

    // Find user
    const user = await prisma.user.findUnique({
      where: { phoneNumber: normalizedPhone },
    });

    if (!user || !user.password) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid phone number or password',
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Verify password
    const bcrypt = await import('bcryptjs');
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid phone number or password',
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Generate tokens
    
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';

    const accessToken = jwt.sign(
      { userId: user.id, phoneNumber: user.phoneNumber, role: user.role, state: user.state },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      JWT_REFRESH_SECRET,
      { expiresIn: '30d' }
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          phoneNumber: user.phoneNumber,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          state: user.state,
          role: user.role,
          walletBalance: user.walletBalance || 0,
          referralCode: user.referralCode || '',
          organizationName: user.organizationName,
          organizationType: user.organizationType,
          isVerified: user.isVerified || false,
          createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to login',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const validation = refreshTokenSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: validation.error.issues[0].message,
          details: validation.error.issues,
          timestamp: new Date().toISOString(),
        },
      });
    }

    const { refreshToken } = validation.data;

    const result = await refreshAccessToken(refreshToken);

    if (!result.success) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: result.message,
          timestamp: new Date().toISOString(),
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: result.message,
      accessToken: result.accessToken,
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to refresh token',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout user (requires authentication)
 */
router.post('/logout', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: 'User not authenticated',
          timestamp: new Date().toISOString(),
        },
      });
    }

    const result = await logoutUser(req.user.userId);

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to logout',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
router.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: 'User not authenticated',
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Fetch full user details from database
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        phoneNumber: true,
        phoneVerified: true,
        email: true,
        firstName: true,
        lastName: true,
        preferredLanguage: true,
        state: true,
        lga: true,
        role: true,
        walletBalance: true,
        referralCode: true,
        organizationName: true,
        organizationType: true,
        isVerified: true,
        verifiedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
          timestamp: new Date().toISOString(),
        },
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get user',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

export default router;
