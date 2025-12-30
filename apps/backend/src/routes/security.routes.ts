import { Router, Request, Response } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  isAccountLocked,
  unlockAccount,
  getSecurityEvents,
  checkSuspiciousActivity,
} from '../services/security.service.js';

const router = Router();

/**
 * Check if account is locked
 * GET /api/security/lock-status
 */
router.get('/lock-status', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    
    const lockStatus = await isAccountLocked(userId);
    
    return res.json({
      success: true,
      data: lockStatus,
    });
  } catch (error) {
    console.error('Error checking lock status:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to check lock status',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * Unlock account (admin only)
 * POST /api/security/unlock/:userId
 */
router.post('/unlock/:userId', authenticate, authorize('admin'), async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const result = await unlockAccount(userId);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'UNLOCK_FAILED',
          message: result.message,
          timestamp: new Date().toISOString(),
        },
      });
    }
    
    return res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error('Error unlocking account:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to unlock account',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * Get security events for current user
 * GET /api/security/events
 */
router.get('/events', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const limit = parseInt(req.query.limit as string) || 50;
    
    const events = await getSecurityEvents(userId, limit);
    
    return res.json({
      success: true,
      data: events,
    });
  } catch (error) {
    console.error('Error getting security events:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get security events',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * Check for suspicious activity
 * GET /api/security/suspicious-activity
 */
router.get('/suspicious-activity', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    
    const result = await checkSuspiciousActivity(userId);
    
    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error checking suspicious activity:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to check suspicious activity',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

export default router;
