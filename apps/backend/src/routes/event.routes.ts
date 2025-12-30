import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { 
  getEventsFeed, 
  getEventById, 
  createHiddenEvent, 
  validateAccessCode,
  trackInvitationSource,
  generateShareableLink,
  getInvitationAnalytics,
  createWeddingEvent,
  createBurialEvent,
  addSprayMoneyTransaction,
  getSprayMoneyLeaderboard,
  getWeddingAnalytics
} from '../services/event.service.js';
import { authenticate } from '../middleware/auth.js';
import { requireOrganizer } from '../middleware/roleCheck.js';
import { createRateLimiter } from '../middleware/rateLimit.js';

const router = Router();

// Rate limiter for event endpoints (100 requests per minute)
const eventRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100,
  message: 'Too many requests. Please try again later.',
});

// Validation schemas
const eventFeedSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  eventType: z.enum(['wedding', 'crusade', 'burial', 'festival', 'general']).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  priceMin: z.coerce.number().int().min(0).optional(),
  priceMax: z.coerce.number().int().min(0).optional(),
  lga: z.string().optional(),
  distance: z.coerce.number().int().min(1).max(500).optional(),
  language: z.enum(['en', 'ha', 'ig', 'yo', 'pcm']).optional(),
  capacityStatus: z.enum(['available', 'almost_full', 'sold_out']).optional(),
  organizerType: z.string().optional(),
  paymentMethods: z.string().transform((val) => val.split(',')).optional(),
  accessibilityFeatures: z.string().transform((val) => val.split(',')).optional(),
});

const createHiddenEventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  eventType: z.enum(['wedding', 'crusade', 'burial', 'festival', 'general']),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  venue: z.string().min(1),
  state: z.string().min(1),
  lga: z.string().min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  capacity: z.number().int().min(1),
  tiers: z.array(z.object({
    id: z.string(),
    name: z.string(),
    price: z.number().int().min(0),
    quantity: z.number().int().min(1),
    description: z.string().optional(),
    benefits: z.array(z.string()).optional(),
  })),
  culturalFeatures: z.any().optional(),
  images: z.array(z.string()).optional(),
});

const validateAccessCodeSchema = z.object({
  accessCode: z.string().length(4).regex(/^\d{4}$/),
});

const trackInvitationSchema = z.object({
  eventId: z.string(),
  source: z.string().min(1),
});

const generateShareableLinkSchema = z.object({
  eventId: z.string(),
  source: z.enum(['whatsapp', 'sms', 'email', 'other']),
});

const createWeddingEventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  venue: z.string().min(1),
  state: z.string().min(1),
  lga: z.string().min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  capacity: z.number().int().min(1),
  tiers: z.array(z.object({
    id: z.string(),
    name: z.string(),
    price: z.number().int().min(0),
    quantity: z.number().int().min(1),
    description: z.string().optional(),
    benefits: z.array(z.string()).optional(),
  })),
  images: z.array(z.string()).optional(),
  isHidden: z.boolean().optional(),
  asoEbiTiers: z.array(z.object({
    name: z.string(),
    price: z.number().int().min(0),
    color: z.string(),
  })).optional(),
  foodOptions: z.array(z.object({
    name: z.string(),
    dietaryInfo: z.string(),
  })).optional(),
  sprayMoneyEnabled: z.boolean().optional(),
});

const addSprayMoneySchema = z.object({
  eventId: z.string(),
  amount: z.number().int().min(1),
});

/**
 * GET /api/events
 * Get events feed with pagination and filters
 */
router.get('/', authenticate, eventRateLimiter, async (req: Request, res: Response) => {
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

    const validation = eventFeedSchema.safeParse(req.query);

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

    const { page, limit, ...filters } = validation.data;

    // Get user's state from the authenticated user
    const userState = req.user.state;

    const result = await getEventsFeed(
      userState,
      filters,
      { page, limit }
    );

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: result.message,
          timestamp: new Date().toISOString(),
        },
      });
    }

    return res.status(200).json({
      success: true,
      events: result.events,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('Get events feed error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch events',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/events/:id
 * Get event details by ID
 */
router.get('/:id', authenticate, eventRateLimiter, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await getEventById(id);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND_ERROR',
          message: result.message,
          timestamp: new Date().toISOString(),
        },
      });
    }

    return res.status(200).json({
      success: true,
      event: result.event,
    });
  } catch (error) {
    console.error('Get event by ID error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch event',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * POST /api/events/hidden
 * Create a hidden event with access code and deep link
 * Requires organizer role
 */
router.post('/hidden', authenticate, requireOrganizer, eventRateLimiter, async (req: Request, res: Response) => {
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

    const validation = createHiddenEventSchema.safeParse(req.body);

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

    const result = await createHiddenEvent(req.user.userId, validation.data);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: result.message,
          timestamp: new Date().toISOString(),
        },
      });
    }

    return res.status(201).json({
      success: true,
      event: result.event,
      accessCode: result.accessCode,
      deepLink: result.deepLink,
    });
  } catch (error) {
    console.error('Create hidden event error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create hidden event',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * POST /api/events/validate-code
 * Validate access code for hidden event
 */
router.post('/validate-code', authenticate, eventRateLimiter, async (req: Request, res: Response) => {
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

    const validation = validateAccessCodeSchema.safeParse(req.body);

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

    const result = await validateAccessCode(validation.data.accessCode);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND_ERROR',
          message: result.message,
          timestamp: new Date().toISOString(),
        },
      });
    }

    return res.status(200).json({
      success: true,
      event: result.event,
    });
  } catch (error) {
    console.error('Validate access code error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to validate access code',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * POST /api/events/track-invitation
 * Track invitation source for analytics
 */
router.post('/track-invitation', authenticate, eventRateLimiter, async (req: Request, res: Response) => {
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

    const validation = trackInvitationSchema.safeParse(req.body);

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

    const result = await trackInvitationSource(
      validation.data.eventId,
      req.user.userId,
      validation.data.source
    );

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
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
    console.error('Track invitation source error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to track invitation source',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * POST /api/events/generate-shareable-link
 * Generate shareable deep link with source tracking
 */
router.post('/generate-shareable-link', authenticate, eventRateLimiter, async (req: Request, res: Response) => {
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

    const validation = generateShareableLinkSchema.safeParse(req.body);

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

    const result = await generateShareableLink(
      validation.data.eventId,
      validation.data.source
    );

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND_ERROR',
          message: result.message,
          timestamp: new Date().toISOString(),
        },
      });
    }

    return res.status(200).json({
      success: true,
      deepLink: result.deepLink,
    });
  } catch (error) {
    console.error('Generate shareable link error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to generate shareable link',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/events/:id/invitation-analytics
 * Get invitation analytics for an event
 */
router.get('/:id/invitation-analytics', authenticate, eventRateLimiter, async (req: Request, res: Response) => {
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

    const { id } = req.params;

    const result = await getInvitationAnalytics(id);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND_ERROR',
          message: result.message,
          timestamp: new Date().toISOString(),
        },
      });
    }

    return res.status(200).json({
      success: true,
      analytics: result.analytics,
    });
  } catch (error) {
    console.error('Get invitation analytics error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get invitation analytics',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * POST /api/events/wedding
 * Create a wedding event with cultural features
 * Requires organizer role
 */
router.post('/wedding', authenticate, requireOrganizer, eventRateLimiter, async (req: Request, res: Response) => {
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

    const validation = createWeddingEventSchema.safeParse(req.body);

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

    const result = await createWeddingEvent(req.user.userId, validation.data);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: result.message,
          timestamp: new Date().toISOString(),
        },
      });
    }

    return res.status(201).json({
      success: true,
      event: result.event,
      accessCode: result.accessCode,
      deepLink: result.deepLink,
    });
  } catch (error) {
    console.error('Create wedding event error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create wedding event',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * POST /api/events/:id/spray-money
 * Add spray money transaction to wedding leaderboard
 */
router.post('/:id/spray-money', authenticate, eventRateLimiter, async (req: Request, res: Response) => {
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

    const { id } = req.params;
    const validation = addSprayMoneySchema.safeParse({ ...req.body, eventId: id });

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

    const result = await addSprayMoneyTransaction(
      id,
      req.user.userId,
      validation.data.amount
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
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
    console.error('Add spray money transaction error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to add spray money transaction',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/events/:id/spray-money-leaderboard
 * Get spray money leaderboard for a wedding event
 */
router.get('/:id/spray-money-leaderboard', authenticate, eventRateLimiter, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await getSprayMoneyLeaderboard(id);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND_ERROR',
          message: result.message,
          timestamp: new Date().toISOString(),
        },
      });
    }

    return res.status(200).json({
      success: true,
      leaderboard: result.leaderboard,
      totalSprayMoney: result.totalSprayMoney,
    });
  } catch (error) {
    console.error('Get spray money leaderboard error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get spray money leaderboard',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/events/:id/wedding-analytics
 * Get wedding analytics
 */
router.get('/:id/wedding-analytics', authenticate, eventRateLimiter, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await getWeddingAnalytics(id);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND_ERROR',
          message: result.message,
          timestamp: new Date().toISOString(),
        },
      });
    }

    return res.status(200).json({
      success: true,
      analytics: result.analytics,
    });
  } catch (error) {
    console.error('Get wedding analytics error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get wedding analytics',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

export default router;
