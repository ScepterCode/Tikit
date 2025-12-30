import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  sendEventNotification,
  sendEventBroadcast,
  sendWhatsAppBroadcast,
  sendTrendingEventNotifications,
} from '../services/notification.service.js';

const router = Router();

/**
 * GET /api/notifications/preferences
 * Get user's notification preferences
 */
router.get('/preferences', authenticate, async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const result = await getNotificationPreferences(userId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (error) {
    console.error('Get notification preferences error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

/**
 * PUT /api/notifications/preferences
 * Update user's notification preferences
 */
router.put('/preferences', authenticate, async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const preferences = req.body;

    const result = await updateNotificationPreferences(userId, preferences);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (error) {
    console.error('Update notification preferences error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

/**
 * POST /api/notifications/event/:eventId
 * Send notification for a specific event
 */
router.post('/event/:eventId', authenticate, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { eventId } = req.params;
    const { type, message } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    if (!type || !['reminder', 'update', 'trending'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification type',
      });
    }

    const result = await sendEventNotification(userId, eventId, type, message);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (error) {
    console.error('Send event notification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

/**
 * POST /api/notifications/broadcast
 * Send broadcast notification to all ticket holders of an event
 * (Organizer only)
 */
router.post('/broadcast', authenticate, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { eventId, title, message } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    if (!eventId || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: eventId, title, message',
      });
    }

    // Verify user is the organizer of the event
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

    if (event.organizerId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the event organizer can send broadcasts',
      });
    }

    const result = await sendEventBroadcast(eventId, title, message);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (error) {
    console.error('Send broadcast error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

/**
 * POST /api/notifications/trending/send
 * Manually trigger trending event notifications
 * (Admin only - in production this would be a scheduled job)
 */
router.post('/trending/send', authenticate, async (req, res) => {
  try {
    const userRole = req.user?.role;

    // Only admins can manually trigger this
    if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can trigger trending notifications',
      });
    }

    const result = await sendTrendingEventNotifications();

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (error) {
    console.error('Send trending notifications error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

/**
 * POST /api/notifications/whatsapp/broadcast
 * Send WhatsApp broadcast to all ticket holders of an event
 * (Organizer only)
 */
router.post('/whatsapp/broadcast', authenticate, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { eventId, message } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    if (!eventId || !message) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: eventId, message',
      });
    }

    // Verify user is the organizer of the event
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

    if (event.organizerId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the event organizer can send WhatsApp broadcasts',
      });
    }

    const result = await sendWhatsAppBroadcast(eventId, message);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (error) {
    console.error('Send WhatsApp broadcast error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

export default router;
