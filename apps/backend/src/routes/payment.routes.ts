import { Router } from 'express';
import { paymentService } from '../services/payment.service.js';
import { airtimeService } from '../services/airtime.service.js';
import { sponsorshipService } from '../services/sponsorship.service.js';
import { authenticate } from '../middleware/auth.js';
import { z } from 'zod';

const router = Router();

// Validation schemas
const initializePaymentSchema = z.object({
  amount: z.number().int().positive(),
  email: z.string().email(),
  metadata: z.record(z.any()).optional(),
});

const verifyPaymentSchema = z.object({
  reference: z.string().min(1),
});

const airtimePaymentSchema = z.object({
  phoneNumber: z.string().regex(/^\+?234[0-9]{10}$/),
  amount: z.number().int().positive(),
  metadata: z.record(z.any()).optional(),
});

const sponsorshipRequestSchema = z.object({
  requesterPhone: z.string().regex(/^\+?234[0-9]{10}$/),
  sponsorPhone: z.string().regex(/^\+?234[0-9]{10}$/),
  amount: z.number().int().positive(),
  eventId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

const sponsorshipApprovalSchema = z.object({
  code: z.string().min(1),
  otp: z.string().length(6),
});

/**
 * POST /api/payments/initialize
 * Initialize a payment
 */
router.post('/initialize', authenticate, async (req, res) => {
  try {
    const validatedData = initializePaymentSchema.parse(req.body);
    const userId = (req as any).user.userId;

    const result = await paymentService.initializePayment({
      userId,
      amount: validatedData.amount,
      email: validatedData.email,
      metadata: validatedData.metadata,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Payment initialization error:', error);
    res.status(400).json({
      success: false,
      error: {
        code: 'PAYMENT_INITIALIZATION_ERROR',
        message: error instanceof Error ? error.message : 'Failed to initialize payment',
      },
    });
  }
});

/**
 * POST /api/payments/verify
 * Verify a payment
 */
router.post('/verify', authenticate, async (req, res) => {
  try {
    const validatedData = verifyPaymentSchema.parse(req.body);

    const result = await paymentService.verifyPayment(validatedData.reference);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(400).json({
      success: false,
      error: {
        code: 'PAYMENT_VERIFICATION_ERROR',
        message: error instanceof Error ? error.message : 'Failed to verify payment',
      },
    });
  }
});

/**
 * POST /api/payments/webhook
 * Handle Paystack webhook callbacks
 */
router.post('/webhook', async (req, res) => {
  try {
    const signature = req.headers['x-paystack-signature'] as string;

    if (!signature) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_SIGNATURE',
          message: 'Webhook signature is required',
        },
      });
    }

    await paymentService.handleWebhook(req.body, signature);

    res.json({ success: true });
  } catch (error) {
    console.error('Webhook handling error:', error);
    res.status(400).json({
      success: false,
      error: {
        code: 'WEBHOOK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to process webhook',
      },
    });
  }
});

/**
 * GET /api/payments/:reference
 * Get payment by reference
 */
router.get('/:reference', authenticate, async (req, res) => {
  try {
    const { reference } = req.params;

    const payment = await paymentService.getPaymentByReference(reference);

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PAYMENT_NOT_FOUND',
          message: 'Payment not found',
        },
      });
    }

    // Check if user owns this payment
    const userId = (req as any).user.userId;
    if (payment.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'You do not have permission to view this payment',
        },
      });
    }

    res.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve payment',
      },
    });
  }
});

/**
 * POST /api/payments/airtime
 * Process airtime payment
 */
router.post('/airtime', authenticate, async (req, res) => {
  try {
    const validatedData = airtimePaymentSchema.parse(req.body);
    const userId = (req as any).user.userId;

    const result = await airtimeService.processAirtimePayment({
      userId,
      phoneNumber: validatedData.phoneNumber,
      amount: validatedData.amount,
      metadata: validatedData.metadata,
    });

    if (result.success) {
      res.json({
        success: true,
        data: result,
      });
    } else {
      res.status(400).json({
        success: false,
        error: {
          code: 'AIRTIME_PAYMENT_FAILED',
          message: result.message || 'Failed to process airtime payment',
        },
      });
    }
  } catch (error) {
    console.error('Airtime payment error:', error);
    res.status(400).json({
      success: false,
      error: {
        code: 'AIRTIME_PAYMENT_ERROR',
        message: error instanceof Error ? error.message : 'Failed to process airtime payment',
      },
    });
  }
});

/**
 * POST /api/payments/sponsor/request
 * Create a sponsorship request
 */
router.post('/sponsor/request', authenticate, async (req, res) => {
  try {
    const validatedData = sponsorshipRequestSchema.parse(req.body);
    const userId = (req as any).user.userId;

    const code = await sponsorshipService.createSponsorshipRequest({
      requesterId: userId,
      requesterPhone: validatedData.requesterPhone,
      sponsorPhone: validatedData.sponsorPhone,
      amount: validatedData.amount,
      eventId: validatedData.eventId,
      metadata: validatedData.metadata,
    });

    res.json({
      success: true,
      data: {
        code,
        message: 'Sponsorship request created. Code sent to sponsor.',
      },
    });
  } catch (error) {
    console.error('Sponsorship request error:', error);
    res.status(400).json({
      success: false,
      error: {
        code: 'SPONSORSHIP_REQUEST_ERROR',
        message: error instanceof Error ? error.message : 'Failed to create sponsorship request',
      },
    });
  }
});

/**
 * POST /api/payments/sponsor/send-otp
 * Send OTP to sponsor for approval
 */
router.post('/sponsor/send-otp', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_CODE',
          message: 'Sponsorship code is required',
        },
      });
    }

    await sponsorshipService.sendApprovalOTP(code);

    res.json({
      success: true,
      message: 'OTP sent to sponsor',
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(400).json({
      success: false,
      error: {
        code: 'SEND_OTP_ERROR',
        message: error instanceof Error ? error.message : 'Failed to send OTP',
      },
    });
  }
});

/**
 * POST /api/payments/sponsor/approve
 * Approve sponsorship with OTP
 */
router.post('/sponsor/approve', authenticate, async (req, res) => {
  try {
    const validatedData = sponsorshipApprovalSchema.parse(req.body);
    const sponsorId = (req as any).user.userId;

    const success = await sponsorshipService.approveSponsorshipWithOTP({
      code: validatedData.code,
      otp: validatedData.otp,
      sponsorId,
    });

    res.json({
      success: true,
      message: 'Sponsorship approved successfully',
    });
  } catch (error) {
    console.error('Sponsorship approval error:', error);
    res.status(400).json({
      success: false,
      error: {
        code: 'SPONSORSHIP_APPROVAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to approve sponsorship',
      },
    });
  }
});

/**
 * GET /api/payments/sponsor/requests
 * Get user's sponsorship requests
 */
router.get('/sponsor/requests', authenticate, async (req, res) => {
  try {
    const userId = (req as any).user.userId;

    const requests = sponsorshipService.getUserSponsorshipRequests(userId);

    res.json({
      success: true,
      data: requests,
    });
  } catch (error) {
    console.error('Get sponsorship requests error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve sponsorship requests',
      },
    });
  }
});

export default router;
