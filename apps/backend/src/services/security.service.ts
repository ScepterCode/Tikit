import prisma from '../lib/prisma.js';
import redisClient from '../lib/redis.js';
import { sms } from '../lib/africastalking.js';

const FAILED_LOGIN_THRESHOLD = 5; // Lock after 5 failed attempts
const FAILED_LOGIN_WINDOW = 900; // 15 minutes in seconds
const ACCOUNT_LOCK_DURATION = 1800; // 30 minutes in seconds
const SUSPICIOUS_PAYMENT_THRESHOLD = 5; // 5 failed payments in short time
const SUSPICIOUS_PAYMENT_WINDOW = 3600; // 1 hour in seconds

interface SecurityEvent {
  userId?: string;
  phoneNumber?: string;
  eventType: 'failed_login' | 'failed_payment' | 'suspicious_activity' | 'account_locked';
  ipAddress?: string;
  userAgent?: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

/**
 * Log security event
 */
export const logSecurityEvent = async (event: SecurityEvent): Promise<void> => {
  try {
    const key = `security:events:${event.userId || event.phoneNumber}`;
    await redisClient.lPush(key, JSON.stringify(event));
    await redisClient.expire(key, 86400); // Keep for 24 hours
    
    console.log('Security event logged:', event);
  } catch (error) {
    console.error('Error logging security event:', error);
  }
};

/**
 * Track failed login attempt
 */
export const trackFailedLogin = async (
  phoneNumber: string,
  ipAddress?: string,
  userAgent?: string
): Promise<{ shouldLock: boolean; attemptsRemaining: number }> => {
  try {
    const key = `security:failed_login:${phoneNumber}`;
    
    // Increment failed login counter
    const failedAttempts = await redisClient.incr(key);
    
    // Set expiry on first attempt
    if (failedAttempts === 1) {
      await redisClient.expire(key, FAILED_LOGIN_WINDOW);
    }
    
    // Log security event
    await logSecurityEvent({
      phoneNumber,
      eventType: 'failed_login',
      ipAddress,
      userAgent,
      timestamp: Date.now(),
      metadata: { attemptNumber: failedAttempts },
    });
    
    // Check if threshold exceeded
    if (failedAttempts >= FAILED_LOGIN_THRESHOLD) {
      return {
        shouldLock: true,
        attemptsRemaining: 0,
      };
    }
    
    return {
      shouldLock: false,
      attemptsRemaining: FAILED_LOGIN_THRESHOLD - failedAttempts,
    };
  } catch (error) {
    console.error('Error tracking failed login:', error);
    return {
      shouldLock: false,
      attemptsRemaining: FAILED_LOGIN_THRESHOLD,
    };
  }
};

/**
 * Clear failed login attempts (on successful login)
 */
export const clearFailedLoginAttempts = async (phoneNumber: string): Promise<void> => {
  try {
    const key = `security:failed_login:${phoneNumber}`;
    await redisClient.del(key);
  } catch (error) {
    console.error('Error clearing failed login attempts:', error);
  }
};

/**
 * Lock user account
 */
export const lockAccount = async (
  userId: string,
  reason: string,
  duration: number = ACCOUNT_LOCK_DURATION
): Promise<{ success: boolean; message: string }> => {
  try {
    // Set lock in Redis
    const lockKey = `security:account_lock:${userId}`;
    await redisClient.setEx(lockKey, duration, JSON.stringify({
      reason,
      lockedAt: Date.now(),
      expiresAt: Date.now() + (duration * 1000),
    }));
    
    // Update user record in database
    await prisma.user.update({
      where: { id: userId },
      data: { updatedAt: new Date() },
    });
    
    // Log security event
    await logSecurityEvent({
      userId,
      eventType: 'account_locked',
      timestamp: Date.now(),
      metadata: { reason, duration },
    });
    
    // Get user details for SMS notification
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { phoneNumber: true, firstName: true },
    });
    
    if (user) {
      // Send SMS notification
      await sendSecurityAlert(user.phoneNumber, reason);
    }
    
    return {
      success: true,
      message: 'Account locked successfully',
    };
  } catch (error) {
    console.error('Error locking account:', error);
    return {
      success: false,
      message: 'Failed to lock account',
    };
  }
};

/**
 * Check if account is locked
 */
export const isAccountLocked = async (userId: string): Promise<{
  locked: boolean;
  reason?: string;
  expiresAt?: number;
}> => {
  try {
    const lockKey = `security:account_lock:${userId}`;
    const lockData = await redisClient.get(lockKey);
    
    if (!lockData) {
      return { locked: false };
    }
    
    const lock = JSON.parse(lockData);
    return {
      locked: true,
      reason: lock.reason,
      expiresAt: lock.expiresAt,
    };
  } catch (error) {
    console.error('Error checking account lock:', error);
    return { locked: false };
  }
};

/**
 * Unlock user account
 */
export const unlockAccount = async (userId: string): Promise<{ success: boolean; message: string }> => {
  try {
    const lockKey = `security:account_lock:${userId}`;
    await redisClient.del(lockKey);
    
    return {
      success: true,
      message: 'Account unlocked successfully',
    };
  } catch (error) {
    console.error('Error unlocking account:', error);
    return {
      success: false,
      message: 'Failed to unlock account',
    };
  }
};

/**
 * Track failed payment attempt
 */
export const trackFailedPayment = async (
  userId: string,
  amount: number,
  method: string
): Promise<{ suspicious: boolean; failedCount: number }> => {
  try {
    const key = `security:failed_payment:${userId}`;
    
    // Add failed payment to list
    const failedPayment = JSON.stringify({
      amount,
      method,
      timestamp: Date.now(),
    });
    
    await redisClient.lPush(key, failedPayment);
    await redisClient.expire(key, SUSPICIOUS_PAYMENT_WINDOW);
    
    // Get count of failed payments in window
    const failedCount = await redisClient.lLen(key);
    
    // Log security event
    await logSecurityEvent({
      userId,
      eventType: 'failed_payment',
      timestamp: Date.now(),
      metadata: { amount, method, failedCount },
    });
    
    // Check if threshold exceeded
    if (failedCount >= SUSPICIOUS_PAYMENT_THRESHOLD) {
      await logSecurityEvent({
        userId,
        eventType: 'suspicious_activity',
        timestamp: Date.now(),
        metadata: { 
          reason: 'Multiple failed payments',
          failedCount,
        },
      });
      
      return {
        suspicious: true,
        failedCount,
      };
    }
    
    return {
      suspicious: false,
      failedCount,
    };
  } catch (error) {
    console.error('Error tracking failed payment:', error);
    return {
      suspicious: false,
      failedCount: 0,
    };
  }
};

/**
 * Detect security breach and take action
 */
export const detectAndHandleBreach = async (
  userId: string,
  breachType: 'failed_login' | 'failed_payment' | 'suspicious_activity',
  metadata?: Record<string, any>
): Promise<{ breachDetected: boolean; accountLocked: boolean; message: string }> => {
  try {
    let shouldLock = false;
    let reason = '';
    
    switch (breachType) {
      case 'failed_login':
        shouldLock = true;
        reason = 'Multiple failed login attempts detected';
        break;
        
      case 'failed_payment':
        shouldLock = true;
        reason = 'Multiple failed payment attempts detected';
        break;
        
      case 'suspicious_activity':
        shouldLock = true;
        reason = metadata?.reason || 'Suspicious activity detected';
        break;
    }
    
    if (shouldLock) {
      const lockResult = await lockAccount(userId, reason);
      
      return {
        breachDetected: true,
        accountLocked: lockResult.success,
        message: reason,
      };
    }
    
    return {
      breachDetected: false,
      accountLocked: false,
      message: 'No breach detected',
    };
  } catch (error) {
    console.error('Error detecting and handling breach:', error);
    return {
      breachDetected: false,
      accountLocked: false,
      message: 'Error processing security check',
    };
  }
};

/**
 * Send security alert SMS
 */
export const sendSecurityAlert = async (
  phoneNumber: string,
  reason: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const message = `SECURITY ALERT: Your Tikit account has been locked due to ${reason}. If this wasn't you, please contact support immediately. Your account will be automatically unlocked in 30 minutes.`;
    
    // Only send SMS if not in test mode
    if (process.env.NODE_ENV !== 'test') {
      await sms.send({
        to: [phoneNumber],
        message,
        from: process.env.AFRICASTALKING_SENDER_ID || 'Tikit',
      });
    }
    
    console.log(`Security alert sent to ${phoneNumber}: ${reason}`);
    
    return {
      success: true,
      message: 'Security alert sent successfully',
    };
  } catch (error) {
    console.error('Error sending security alert:', error);
    return {
      success: false,
      message: 'Failed to send security alert',
    };
  }
};

/**
 * Get security events for a user
 */
export const getSecurityEvents = async (
  userId: string,
  limit: number = 50
): Promise<SecurityEvent[]> => {
  try {
    const key = `security:events:${userId}`;
    const events = await redisClient.lRange(key, 0, limit - 1);
    
    return events.map(event => JSON.parse(event));
  } catch (error) {
    console.error('Error getting security events:', error);
    return [];
  }
};

/**
 * Check for suspicious activity patterns
 */
export const checkSuspiciousActivity = async (
  userId: string
): Promise<{ suspicious: boolean; reasons: string[] }> => {
  try {
    const reasons: string[] = [];
    
    // Check failed payments
    const failedPaymentKey = `security:failed_payment:${userId}`;
    const failedPaymentCount = await redisClient.lLen(failedPaymentKey);
    
    if (failedPaymentCount >= SUSPICIOUS_PAYMENT_THRESHOLD) {
      reasons.push(`${failedPaymentCount} failed payment attempts in the last hour`);
    }
    
    // Check recent security events
    const events = await getSecurityEvents(userId, 20);
    const recentSuspiciousEvents = events.filter(
      e => e.eventType === 'suspicious_activity' && 
      Date.now() - e.timestamp < 3600000 // Last hour
    );
    
    if (recentSuspiciousEvents.length > 0) {
      reasons.push('Recent suspicious activity detected');
    }
    
    return {
      suspicious: reasons.length > 0,
      reasons,
    };
  } catch (error) {
    console.error('Error checking suspicious activity:', error);
    return {
      suspicious: false,
      reasons: [],
    };
  }
};
