import { Router } from 'express';
import { groupBuyService } from '../services/groupbuy.service.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

/**
 * POST /api/group-buy/create
 * Create a group buy
 */
router.post('/create', authenticate, async (req, res) => {
  try {
    const { eventId, tierId, totalParticipants, expirationHours } = req.body;
    const initiatorId = req.user!.userId;

    if (!eventId || !tierId || !totalParticipants) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required fields: eventId, tierId, totalParticipants',
        },
      });
    }

    const groupBuy = await groupBuyService.initiateGroupBuy({
      eventId,
      initiatorId,
      totalParticipants: parseInt(totalParticipants),
      tierId,
      expirationHours: expirationHours || 24,
    });

    res.status(201).json({
      success: true,
      data: groupBuy,
    });
  } catch (error: any) {
    console.error('Error creating group buy:', error);
    res.status(400).json({
      success: false,
      error: {
        code: 'GROUP_BUY_ERROR',
        message: error.message || 'Failed to create group buy',
      },
    });
  }
});

/**
 * POST /api/group-buy/initiate
 * Initiate a group buy (legacy endpoint)
 */
router.post('/initiate', authenticate, async (req, res) => {
  try {
    const { eventId, totalParticipants, tierId } = req.body;
    const initiatorId = req.user!.userId;

    if (!eventId || !totalParticipants || !tierId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required fields: eventId, totalParticipants, tierId',
        },
      });
    }

    const groupBuy = await groupBuyService.initiateGroupBuy({
      eventId,
      initiatorId,
      totalParticipants: parseInt(totalParticipants),
      tierId,
    });

    res.status(201).json({
      success: true,
      data: groupBuy,
    });
  } catch (error: any) {
    console.error('Error initiating group buy:', error);
    res.status(400).json({
      success: false,
      error: {
        code: 'GROUP_BUY_ERROR',
        message: error.message || 'Failed to initiate group buy',
      },
    });
  }
});

/**
 * GET /api/group-buy/:id/status
 * Get group buy status
 */
router.get('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;

    const status = await groupBuyService.getGroupBuyStatus(id);

    res.json({
      success: true,
      data: status,
    });
  } catch (error: any) {
    console.error('Error getting group buy status:', error);
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND_ERROR',
        message: error.message || 'Group buy not found',
      },
    });
  }
});

/**
 * POST /api/group-buy/:id/join
 * Join a group buy
 */
router.post('/:id/join', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentLink } = req.body;
    const userId = req.user!.userId;

    if (!paymentLink) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required field: paymentLink',
        },
      });
    }

    const result = await groupBuyService.joinGroupBuy(id, userId, paymentLink);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Error joining group buy:', error);
    res.status(400).json({
      success: false,
      error: {
        code: 'GROUP_BUY_ERROR',
        message: error.message || 'Failed to join group buy',
      },
    });
  }
});

/**
 * GET /api/group-buy/:id
 * Get group buy details
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const groupBuy = await groupBuyService.getGroupBuyById(id);

    if (!groupBuy) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND_ERROR',
          message: 'Group buy not found',
        },
      });
    }

    res.json({
      success: true,
      data: groupBuy,
    });
  } catch (error: any) {
    console.error('Error getting group buy:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get group buy',
      },
    });
  }
});

/**
 * POST /api/group-buy/:id/payment-status
 * Update participant payment status
 */
router.post('/:id/payment-status', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus } = req.body;
    const userId = req.user!.userId;

    if (!paymentStatus || !['pending', 'paid'].includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid payment status. Must be "pending" or "paid"',
        },
      });
    }

    const result = await groupBuyService.updateParticipantPaymentStatus(
      id,
      userId,
      paymentStatus
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Error updating payment status:', error);
    res.status(400).json({
      success: false,
      error: {
        code: 'GROUP_BUY_ERROR',
        message: error.message || 'Failed to update payment status',
      },
    });
  }
});

/**
 * GET /api/group-buy/:id/my-payment
 * Get participant's payment info
 */
router.get('/:id/my-payment', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const paymentInfo = await groupBuyService.getParticipantPaymentInfo(id, userId);

    res.json({
      success: true,
      data: paymentInfo,
    });
  } catch (error: any) {
    console.error('Error getting payment info:', error);
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND_ERROR',
        message: error.message || 'Payment info not found',
      },
    });
  }
});

export default router;
