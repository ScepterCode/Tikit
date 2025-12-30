import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { requirePermission, Permission } from '../middleware/rbac.js';
import * as organizerService from '../services/organizer.service.js';
import * as rbacService from '../services/rbac.service.js';

const router = express.Router();

/**
 * Get event analytics
 * GET /api/organizer/events/:eventId/analytics
 * Required permission: VIEW_ANALYTICS
 */
router.get(
  '/events/:eventId/analytics',
  authenticate,
  requirePermission(Permission.VIEW_ANALYTICS),
  async (req, res) => {
    try {
      const { eventId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const result = await organizerService.getEventAnalytics(eventId, userId);

      if (!result.success) {
        return res.status(result.message?.includes('Unauthorized') ? 403 : 404).json(result);
      }

      return res.json(result);
    } catch (error) {
      console.error('Get event analytics error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
);

/**
 * Get event attendees
 * GET /api/organizer/events/:eventId/attendees
 * Required permission: VIEW_ATTENDEES
 */
router.get(
  '/events/:eventId/attendees',
  authenticate,
  requirePermission(Permission.VIEW_ATTENDEES),
  async (req, res) => {
    try {
      const { eventId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const result = await organizerService.getEventAttendees(eventId, userId);

      if (!result.success) {
        return res.status(result.message?.includes('Unauthorized') ? 403 : 404).json(result);
      }

      return res.json(result);
    } catch (error) {
      console.error('Get event attendees error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
);

/**
 * Get organizer's events
 * GET /api/organizer/events
 */
router.get('/events', authenticate, async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const result = await organizerService.getOrganizerEvents(userId);

    return res.json(result);
  } catch (error) {
    console.error('Get organizer events error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

/**
 * Update event
 * PUT /api/organizer/events/:eventId
 * Required permission: EDIT_EVENT
 */
router.put(
  '/events/:eventId',
  authenticate,
  requirePermission(Permission.EDIT_EVENT),
  async (req, res) => {
    try {
      const { eventId } = req.params;
      const userId = req.user?.userId;
      const updates = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const result = await organizerService.updateEvent(eventId, userId, updates);

      if (!result.success) {
        return res.status(result.message?.includes('Unauthorized') ? 403 : 404).json(result);
      }

      return res.json(result);
    } catch (error) {
      console.error('Update event error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
);

/**
 * Export attendee data
 * GET /api/organizer/events/:eventId/attendees/export
 * Required permission: EXPORT_DATA
 */
router.get(
  '/events/:eventId/attendees/export',
  authenticate,
  requirePermission(Permission.EXPORT_DATA),
  async (req, res) => {
    try {
      const { eventId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const result = await organizerService.exportAttendeeData(eventId, userId);

      if (!result.success) {
        return res
          .status('message' in result && result.message?.includes('Unauthorized') ? 403 : 404)
          .json(result);
      }

      // Set headers for CSV download
      if ('csvContent' in result && 'filename' in result) {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);

        return res.send(result.csvContent);
      }

      return res.status(500).json({
        success: false,
        message: 'Failed to generate export',
      });
    } catch (error) {
      console.error('Export attendee data error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
);

/**
 * Delete event
 * DELETE /api/organizer/events/:eventId
 * Required permission: DELETE_EVENT
 */
router.delete(
  '/events/:eventId',
  authenticate,
  requirePermission(Permission.DELETE_EVENT),
  async (req, res) => {
    try {
      const { eventId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const result = await organizerService.deleteEvent(eventId, userId);

      if (!result.success) {
        return res.status(result.message?.includes('Unauthorized') ? 403 : 404).json(result);
      }

      return res.json(result);
    } catch (error) {
      console.error('Delete event error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
);

/**
 * Add organizer to event
 * POST /api/organizer/events/:eventId/organizers
 * Required permission: MANAGE_ORGANIZERS (owner only)
 */
router.post('/events/:eventId/organizers', authenticate, async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user?.userId;
    const { userId: newOrganizerId, role, customPermissions } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const result = await rbacService.addEventOrganizer(userId, {
      eventId,
      userId: newOrganizerId,
      role,
      customPermissions,
    });

    if (!result.success) {
      return res.status(result.message?.includes('Unauthorized') ? 403 : 400).json(result);
    }

    return res.status(201).json(result);
  } catch (error) {
    console.error('Add event organizer error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

/**
 * Update organizer role/permissions
 * PUT /api/organizer/events/:eventId/organizers/:userId
 * Required permission: MANAGE_ORGANIZERS (owner only)
 */
router.put('/events/:eventId/organizers/:userId', authenticate, async (req, res) => {
  try {
    const { eventId, userId: targetUserId } = req.params;
    const requesterId = req.user?.userId;
    const { role, customPermissions } = req.body;

    if (!requesterId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const result = await rbacService.updateEventOrganizer(requesterId, eventId, targetUserId, {
      role,
      customPermissions,
    });

    if (!result.success) {
      return res.status(result.message?.includes('Unauthorized') ? 403 : 404).json(result);
    }

    return res.json(result);
  } catch (error) {
    console.error('Update event organizer error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

/**
 * Remove organizer from event
 * DELETE /api/organizer/events/:eventId/organizers/:userId
 * Required permission: MANAGE_ORGANIZERS (owner only)
 */
router.delete('/events/:eventId/organizers/:userId', authenticate, async (req, res) => {
  try {
    const { eventId, userId: targetUserId } = req.params;
    const requesterId = req.user?.userId;

    if (!requesterId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const result = await rbacService.removeEventOrganizer(requesterId, eventId, targetUserId);

    if (!result.success) {
      return res.status(result.message?.includes('Unauthorized') ? 403 : 404).json(result);
    }

    return res.json(result);
  } catch (error) {
    console.error('Remove event organizer error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

/**
 * Get all organizers for an event
 * GET /api/organizer/events/:eventId/organizers
 * Required permission: VIEW_ANALYTICS (any organizer can view)
 */
router.get(
  '/events/:eventId/organizers',
  authenticate,
  requirePermission(Permission.VIEW_ANALYTICS),
  async (req, res) => {
    try {
      const { eventId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const result = await rbacService.getEventOrganizers(userId, eventId);

      if (!result.success) {
        return res.status(result.message?.includes('Unauthorized') ? 403 : 404).json(result);
      }

      return res.json(result);
    } catch (error) {
      console.error('Get event organizers error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
);

export default router;
