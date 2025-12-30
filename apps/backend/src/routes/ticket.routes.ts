import { Router } from 'express';
import { ticketService } from '../services/ticket.service.js';
import { authenticate } from '../middleware/auth.js';
import { z } from 'zod';

const router = Router();

// Validation schemas
const issueTicketSchema = z.object({
  eventId: z.string().min(1),
  tierId: z.string().min(1),
  paymentId: z.string().min(1),
  culturalSelections: z.record(z.any()).optional(),
});

const verifyTicketSchema = z.object({
  qrCode: z.string().min(1).optional(),
  backupCode: z.string().length(6).optional(),
  scannedBy: z.string().min(1),
  location: z.string().optional(),
  deviceInfo: z.string().optional(),
}).refine(data => data.qrCode || data.backupCode, {
  message: 'Either qrCode or backupCode must be provided',
});

const markUsedSchema = z.object({
  qrCode: z.string().min(1),
  scannedBy: z.string().min(1),
  location: z.string().optional(),
});

/**
 * POST /api/tickets/issue
 * Issue a ticket after successful payment
 */
router.post('/issue', authenticate, async (req, res) => {
  try {
    const validatedData = issueTicketSchema.parse(req.body);
    const userId = (req as any).user.userId;

    const ticket = await ticketService.issueTicket({
      userId,
      eventId: validatedData.eventId,
      tierId: validatedData.tierId,
      paymentId: validatedData.paymentId,
      culturalSelections: validatedData.culturalSelections,
    });

    res.json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    console.error('Ticket issuance error:', error);
    res.status(400).json({
      success: false,
      error: {
        code: 'TICKET_ISSUANCE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to issue ticket',
      },
    });
  }
});

/**
 * GET /api/tickets/my-tickets
 * Get user's tickets
 */
router.get('/my-tickets', authenticate, async (req, res) => {
  try {
    const userId = (req as any).user.userId;

    const tickets = await ticketService.getTicketsByUserId(userId);

    res.json({
      success: true,
      data: tickets,
    });
  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve tickets',
      },
    });
  }
});

/**
 * GET /api/tickets/:id
 * Get ticket by ID
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;

    const ticket = await ticketService.getTicketById(id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'TICKET_NOT_FOUND',
          message: 'Ticket not found',
        },
      });
    }

    // Check if user owns this ticket
    if (ticket.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'You do not have permission to view this ticket',
        },
      });
    }

    res.json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve ticket',
      },
    });
  }
});

/**
 * POST /api/tickets/verify
 * Verify ticket by QR code
 */
router.post('/verify', authenticate, async (req, res) => {
  try {
    const validatedData = z.object({
      qrCode: z.string().min(1),
      scannedBy: z.string().min(1),
      location: z.string().optional(),
      deviceInfo: z.string().optional(),
    }).parse(req.body);

    const result = await ticketService.verifyTicketByQRCode(
      validatedData.qrCode,
      validatedData.scannedBy,
      validatedData.location,
      validatedData.deviceInfo
    );

    res.json(result);
  } catch (error) {
    console.error('Ticket verification error:', error);
    res.status(400).json({
      success: false,
      error: {
        code: 'TICKET_VERIFICATION_ERROR',
        message: error instanceof Error ? error.message : 'Failed to verify ticket',
      },
    });
  }
});

/**
 * POST /api/tickets/verify-backup
 * Verify ticket by backup code
 */
router.post('/verify-backup', authenticate, async (req, res) => {
  try {
    const validatedData = z.object({
      backupCode: z.string().length(6),
      scannedBy: z.string().min(1),
      location: z.string().optional(),
      deviceInfo: z.string().optional(),
    }).parse(req.body);

    const result = await ticketService.verifyTicketByBackupCode(
      validatedData.backupCode,
      validatedData.scannedBy,
      validatedData.location,
      validatedData.deviceInfo
    );

    res.json(result);
  } catch (error) {
    console.error('Backup code verification error:', error);
    res.status(400).json({
      success: false,
      error: {
        code: 'BACKUP_CODE_VERIFICATION_ERROR',
        message: error instanceof Error ? error.message : 'Failed to verify backup code',
      },
    });
  }
});

/**
 * POST /api/tickets/mark-used
 * Mark ticket as used
 */
router.post('/mark-used', authenticate, async (req, res) => {
  try {
    const validatedData = markUsedSchema.parse(req.body);

    const ticket = await ticketService.markTicketAsUsed(
      validatedData.qrCode,
      validatedData.scannedBy,
      validatedData.location
    );

    res.json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    console.error('Mark ticket used error:', error);
    
    // Try to parse error message for scan history
    let errorData;
    try {
      errorData = JSON.parse(error instanceof Error ? error.message : '{}');
    } catch {
      errorData = { message: error instanceof Error ? error.message : 'Failed to mark ticket as used' };
    }

    res.status(400).json({
      success: false,
      error: {
        code: 'MARK_USED_ERROR',
        message: errorData.message || 'Failed to mark ticket as used',
        details: errorData,
      },
    });
  }
});

/**
 * GET /api/tickets/:id/scan-history
 * Get scan history for a ticket
 */
router.get('/:id/scan-history', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;

    // Verify user owns this ticket or is an organizer
    const ticket = await ticketService.getTicketById(id);
    
    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'TICKET_NOT_FOUND',
          message: 'Ticket not found',
        },
      });
    }

    // Check if user owns this ticket or is the event organizer
    if (ticket.userId !== userId && ticket.event.organizerId !== userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'You do not have permission to view this scan history',
        },
      });
    }

    const scanHistory = await ticketService.getScanHistory(id);

    res.json({
      success: true,
      data: scanHistory,
    });
  } catch (error) {
    console.error('Get scan history error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve scan history',
      },
    });
  }
});

export default router;
