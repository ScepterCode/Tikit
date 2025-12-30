import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getPersonalizedRecommendations,
  getRelatedEvents,
  getTrendingEvents,
  getCapacityStatus,
} from '../services/recommendation.service.js';

const router = Router();

/**
 * GET /api/recommendations/feed
 * Get personalized event recommendations for the authenticated user
 */
router.get('/feed', authenticate, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const limit = parseInt(req.query.limit as string) || 20;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const result = await getPersonalizedRecommendations(userId, limit);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (error) {
    console.error('Get personalized feed error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

/**
 * GET /api/recommendations/related/:eventId
 * Get related events for a specific event
 */
router.get('/related/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const limit = parseInt(req.query.limit as string) || 5;

    const result = await getRelatedEvents(eventId, limit);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (error) {
    console.error('Get related events error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

/**
 * GET /api/recommendations/trending
 * Get trending events based on recent sales
 */
router.get('/trending', async (req, res) => {
  try {
    const eventType = req.query.eventType as string | undefined;
    const state = req.query.state as string | undefined;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await getTrendingEvents(eventType, state, limit);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (error) {
    console.error('Get trending events error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

/**
 * GET /api/recommendations/capacity/:eventId
 * Get capacity status for an event
 */
router.get('/capacity/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;

    // Get event
    const prisma = (await import('../lib/prisma.js')).default;
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    const capacityStatus = getCapacityStatus(event);

    return res.json({
      success: true,
      ...capacityStatus,
    });
  } catch (error) {
    console.error('Get capacity status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

/**
 * POST /api/recommendations/track
 * Track user interaction with recommendations
 */
router.post('/track', authenticate, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { eventId, action, source } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    // Store interaction tracking (could be used for future ML models)
    // For now, just acknowledge the tracking
    console.log('Recommendation interaction tracked:', {
      userId,
      eventId,
      action,
      source,
      timestamp: new Date().toISOString(),
    });

    return res.json({
      success: true,
      message: 'Interaction tracked',
    });
  } catch (error) {
    console.error('Track recommendation interaction error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

export default router;
