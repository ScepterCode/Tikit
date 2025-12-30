import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getUserReferralCode,
  applyReferralCode,
  getReferralLeaderboard,
  getUserReferralStats,
  withdrawWalletBalance,
  useWalletCredit,
} from '../services/referral.service.js';

const router = Router();

/**
 * GET /api/referrals/code
 * Get user's referral code
 */
router.get('/code', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const result = await getUserReferralCode(userId);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error getting referral code:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

/**
 * POST /api/referrals/apply
 * Apply referral code during registration
 * Body: { referralCode: string, newUserId: string }
 */
router.post('/apply', async (req: Request, res: Response) => {
  try {
    const { referralCode, newUserId } = req.body;

    if (!referralCode || !newUserId) {
      return res.status(400).json({
        success: false,
        message: 'Referral code and user ID are required',
      });
    }

    const result = await applyReferralCode(referralCode, newUserId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error applying referral code:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

/**
 * GET /api/referrals/leaderboard
 * Get referral leaderboard
 * Query params: limit (optional, default 50)
 */
router.get('/leaderboard', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const result = await getReferralLeaderboard(limit);

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error getting referral leaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

/**
 * GET /api/referrals/stats
 * Get user's referral statistics
 */
router.get('/stats', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const result = await getUserReferralStats(userId);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error getting referral stats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

/**
 * POST /api/referrals/withdraw
 * Withdraw wallet balance to mobile money
 * Body: { amount: number, method: 'opay' | 'palmpay', accountDetails: string }
 */
router.post('/withdraw', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { amount, method, accountDetails } = req.body;

    if (!amount || !method || !accountDetails) {
      return res.status(400).json({
        success: false,
        message: 'Amount, method, and account details are required',
      });
    }

    if (method !== 'opay' && method !== 'palmpay') {
      return res.status(400).json({
        success: false,
        message: 'Invalid withdrawal method. Must be opay or palmpay',
      });
    }

    const result = await withdrawWalletBalance(userId, amount, method, accountDetails);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error withdrawing wallet balance:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

/**
 * POST /api/referrals/use-credit
 * Use wallet balance as payment credit
 * Body: { amount: number }
 */
router.post('/use-credit', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { amount } = req.body;

    if (!amount) {
      return res.status(400).json({
        success: false,
        message: 'Amount is required',
      });
    }

    const result = await useWalletCredit(userId, amount);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error using wallet credit:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

export default router;
