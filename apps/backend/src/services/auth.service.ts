import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';
import redisClient from '../lib/redis.js';
import { sms } from '../lib/africastalking.js';
import { 
  trackFailedLogin, 
  clearFailedLoginAttempts, 
  isAccountLocked,
  detectAndHandleBreach 
} from './security.service.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
const JWT_EXPIRES_IN = '24h';
const REFRESH_TOKEN_EXPIRES_IN = '30d';
const OTP_EXPIRY_SECONDS = 300; // 5 minutes

interface OTPData {
  code: string;
  phoneNumber: string;
  attempts: number;
  createdAt: number;
}

/**
 * Generate a 6-digit OTP code
 */
export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Generate a unique referral code
 */
export const generateReferralCode = async (): Promise<string> => {
  let code: string;
  let exists = true;

  while (exists) {
    // Generate 8-character alphanumeric code
    code = Math.random().toString(36).substring(2, 10).toUpperCase();
    const user = await prisma.user.findUnique({
      where: { referralCode: code },
    });
    exists = !!user;
  }

  return code!;
};

/**
 * Send OTP via SMS using Africa's Talking
 */
export const sendOTP = async (phoneNumber: string): Promise<{ success: boolean; message: string }> => {
  try {
    // Check rate limiting: 3 OTP requests per 10 minutes
    const rateLimitKey = `otp:ratelimit:${phoneNumber}`;
    const requestCount = await redisClient.get(rateLimitKey);
    
    if (requestCount && parseInt(requestCount) >= 3) {
      return {
        success: false,
        message: 'Too many OTP requests. Please try again in 10 minutes.',
      };
    }

    // Generate OTP
    const code = generateOTP();
    
    // Store OTP in Redis with 5-minute expiry
    const otpKey = `otp:${phoneNumber}`;
    const otpData: OTPData = {
      code,
      phoneNumber,
      attempts: 0,
      createdAt: Date.now(),
    };
    
    await redisClient.setEx(otpKey, OTP_EXPIRY_SECONDS, JSON.stringify(otpData));
    
    // Increment rate limit counter
    const currentCount = await redisClient.incr(rateLimitKey);
    if (currentCount === 1) {
      await redisClient.expire(rateLimitKey, 600); // 10 minutes
    }

    // Send SMS
    const message = `Your Tikit verification code is: ${code}. Valid for 5 minutes.`;
    
    // Only send SMS if not in test mode
    if (process.env.NODE_ENV !== 'test') {
      await sms.send({
        to: [phoneNumber],
        message,
        from: process.env.AFRICASTALKING_SENDER_ID || 'Tikit',
      });
    }

    return {
      success: true,
      message: 'OTP sent successfully',
    };
  } catch (error) {
    console.error('Error sending OTP:', error);
    return {
      success: false,
      message: 'Failed to send OTP. Please try again.',
    };
  }
};

/**
 * Verify OTP code
 */
export const verifyOTP = async (
  phoneNumber: string,
  code: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const otpKey = `otp:${phoneNumber}`;
    const otpDataStr = await redisClient.get(otpKey);

    if (!otpDataStr) {
      return {
        success: false,
        message: 'OTP expired or not found. Please request a new one.',
      };
    }

    const otpData: OTPData = JSON.parse(otpDataStr);

    // Check for brute force: 5 failed attempts locks for 30 minutes
    if (otpData.attempts >= 5) {
      const lockKey = `otp:lock:${phoneNumber}`;
      await redisClient.setEx(lockKey, 1800, 'locked'); // 30 minutes
      await redisClient.del(otpKey);
      
      // Find user and lock their account if they exist
      const user = await prisma.user.findUnique({
        where: { phoneNumber },
      });
      
      if (user) {
        await detectAndHandleBreach(
          user.id,
          'failed_login',
          { reason: 'Too many failed OTP attempts' }
        );
      }
      
      return {
        success: false,
        message: 'Too many failed attempts. Account locked for 30 minutes.',
      };
    }

    // Verify code
    if (otpData.code !== code) {
      otpData.attempts += 1;
      await redisClient.setEx(otpKey, OTP_EXPIRY_SECONDS, JSON.stringify(otpData));
      
      return {
        success: false,
        message: `Invalid OTP code. ${5 - otpData.attempts} attempts remaining.`,
      };
    }

    // OTP verified successfully - delete it
    await redisClient.del(otpKey);

    return {
      success: true,
      message: 'OTP verified successfully',
    };
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return {
      success: false,
      message: 'Failed to verify OTP. Please try again.',
    };
  }
};

/**
 * Check if phone number is locked due to failed attempts
 */
export const isPhoneLocked = async (phoneNumber: string): Promise<boolean> => {
  const lockKey = `otp:lock:${phoneNumber}`;
  const locked = await redisClient.get(lockKey);
  return !!locked;
};

/**
 * Register a new user
 */
export const registerUser = async (data: {
  phoneNumber: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  state: string;
  preferredLanguage?: string;
  referredBy?: string;
  role?: string;
  organizationName?: string;
  organizationType?: string;
}): Promise<{ success: boolean; user?: any; message: string }> => {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { phoneNumber: data.phoneNumber },
    });

    if (existingUser) {
      return {
        success: false,
        message: 'User with this phone number already exists',
      };
    }

    // Validate role
    const role = data.role || 'attendee';
    if (!['attendee', 'organizer'].includes(role)) {
      return {
        success: false,
        message: 'Invalid role. Must be attendee or organizer',
      };
    }

    // Generate unique referral code
    const referralCode = await generateReferralCode();

    // Create user
    const user = await prisma.user.create({
      data: {
        phoneNumber: data.phoneNumber,
        phoneVerified: true, // Already verified via OTP
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        state: data.state,
        preferredLanguage: data.preferredLanguage || 'en',
        referralCode,
        referredBy: data.referredBy,
        role,
        organizationName: data.organizationName,
        organizationType: data.organizationType,
      },
    });

    // If referred by someone, create referral record
    if (data.referredBy) {
      const referrer = await prisma.user.findUnique({
        where: { referralCode: data.referredBy },
      });

      if (referrer) {
        await prisma.referral.create({
          data: {
            referrerId: referrer.id,
            referredUserId: user.id,
            status: 'pending',
            rewardAmount: 200, // ₦200 reward
          },
        });
      }
    }

    return {
      success: true,
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        state: user.state,
        preferredLanguage: user.preferredLanguage,
        role: user.role,
        walletBalance: user.walletBalance || 0,
        referralCode: user.referralCode,
        organizationName: user.organizationName,
        organizationType: user.organizationType,
        isVerified: user.isVerified || false,
        createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
      },
      message: 'User registered successfully',
    };
  } catch (error) {
    console.error('Error registering user:', error);
    return {
      success: false,
      message: 'Failed to register user. Please try again.',
    };
  }
};

/**
 * Generate JWT access token
 */
export const generateAccessToken = (userId: string, role: string, state: string): string => {
  return jwt.sign({ userId, role, state }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

/**
 * Generate JWT refresh token
 */
export const generateRefreshToken = (userId: string): string => {
  return jwt.sign({ userId }, JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
  });
};

/**
 * Verify JWT access token
 */
export const verifyAccessToken = (token: string): { userId: string; role: string; state: string } | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string; state: string };
    return decoded;
  } catch (error) {
    return null;
  }
};

/**
 * Verify JWT refresh token
 */
export const verifyRefreshToken = (token: string): { userId: string } | null => {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as { userId: string };
    return decoded;
  } catch (error) {
    return null;
  }
};

/**
 * Login user
 */
export const loginUser = async (
  phoneNumber: string,
  ipAddress?: string,
  userAgent?: string
): Promise<{ success: boolean; user?: any; accessToken?: string; refreshToken?: string; message: string }> => {
  try {
    const user = await prisma.user.findUnique({
      where: { phoneNumber },
    });

    if (!user) {
      // Track failed login attempt
      const { shouldLock, attemptsRemaining } = await trackFailedLogin(
        phoneNumber,
        ipAddress,
        userAgent
      );
      
      if (shouldLock) {
        return {
          success: false,
          message: 'Too many failed login attempts. Please try again in 30 minutes.',
        };
      }
      
      return {
        success: false,
        message: `User not found. ${attemptsRemaining} attempts remaining before account lock.`,
      };
    }

    // Check if account is locked
    const lockStatus = await isAccountLocked(user.id);
    if (lockStatus.locked) {
      const expiresIn = lockStatus.expiresAt 
        ? Math.ceil((lockStatus.expiresAt - Date.now()) / 60000) 
        : 30;
      
      return {
        success: false,
        message: `Account is locked due to ${lockStatus.reason}. Please try again in ${expiresIn} minutes.`,
      };
    }

    // Clear any failed login attempts on successful login
    await clearFailedLoginAttempts(phoneNumber);

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.role, user.state);
    const refreshToken = generateRefreshToken(user.id);

    // Store refresh token in Redis
    const refreshTokenKey = `refresh:${user.id}`;
    await redisClient.setEx(refreshTokenKey, 30 * 24 * 60 * 60, refreshToken); // 30 days

    return {
      success: true,
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        state: user.state,
        preferredLanguage: user.preferredLanguage,
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
      message: 'Login successful',
    };
  } catch (error) {
    console.error('Error logging in user:', error);
    return {
      success: false,
      message: 'Failed to login. Please try again.',
    };
  }
};

/**
 * Refresh access token
 */
export const refreshAccessToken = async (
  refreshToken: string
): Promise<{ success: boolean; accessToken?: string; message: string }> => {
  try {
    const decoded = verifyRefreshToken(refreshToken);
    
    if (!decoded) {
      return {
        success: false,
        message: 'Invalid refresh token',
      };
    }

    // Check if refresh token exists in Redis
    const refreshTokenKey = `refresh:${decoded.userId}`;
    const storedToken = await redisClient.get(refreshTokenKey);

    if (storedToken !== refreshToken) {
      return {
        success: false,
        message: 'Refresh token not found or expired',
      };
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return {
        success: false,
        message: 'User not found',
      };
    }

    // Generate new access token
    const accessToken = generateAccessToken(user.id, user.role, user.state);

    return {
      success: true,
      accessToken,
      message: 'Token refreshed successfully',
    };
  } catch (error) {
    console.error('Error refreshing token:', error);
    return {
      success: false,
      message: 'Failed to refresh token. Please login again.',
    };
  }
};

/**
 * Logout user
 */
export const logoutUser = async (userId: string): Promise<{ success: boolean; message: string }> => {
  try {
    // Delete refresh token from Redis
    const refreshTokenKey = `refresh:${userId}`;
    await redisClient.del(refreshTokenKey);

    return {
      success: true,
      message: 'Logout successful',
    };
  } catch (error) {
    console.error('Error logging out user:', error);
    return {
      success: false,
      message: 'Failed to logout. Please try again.',
    };
  }
};
