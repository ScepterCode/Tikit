import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/roleCheck.js';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate, requireAdmin);

/**
 * GET /api/admin/dashboard
 * Get admin dashboard statistics
 */
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    // Get platform statistics
    const [
      totalUsers,
      totalEvents,
      totalTickets,
      totalRevenue,
      newUsersToday,
      newEventsToday,
      newTicketsToday,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.event.count(),
      prisma.ticket.count(),
      prisma.payment.aggregate({
        where: { status: 'completed' },
        _sum: { amount: true },
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      prisma.event.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      prisma.ticket.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalEvents,
        totalTickets,
        totalRevenue: totalRevenue._sum.amount || 0,
        newUsersToday,
        newEventsToday,
        newTicketsToday,
      },
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch dashboard data',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/admin/users
 * Get all users with pagination and filters
 */
router.get('/users', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const role = req.query.role as string;
    const search = req.query.search as string;

    const where: any = {};

    if (role) {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { phoneNumber: { contains: search } },
        { email: { contains: search } },
        { firstName: { contains: search } },
        { lastName: { contains: search } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          phoneNumber: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          state: true,
          isVerified: true,
          createdAt: true,
          walletBalance: true,
          organizationName: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch users',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/admin/users/:id
 * Get user details by ID
 */
router.get('/users/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        tickets: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        payments: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        events: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
          timestamp: new Date().toISOString(),
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch user',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * PATCH /api/admin/users/:id
 * Update user (change role, suspend, etc.)
 */
router.patch('/users/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role, isVerified } = req.body;

    const updateData: any = {};

    if (role) {
      if (!['attendee', 'organizer', 'admin'].includes(role)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid role',
            timestamp: new Date().toISOString(),
          },
        });
      }
      updateData.role = role;
    }

    if (typeof isVerified === 'boolean') {
      updateData.isVerified = isVerified;
      if (isVerified) {
        updateData.verifiedAt = new Date();
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    return res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user,
    });
  } catch (error) {
    console.error('Update user error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update user',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/admin/events
 * Get all events with pagination and filters
 */
router.get('/events', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const search = req.query.search as string;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          organizer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phoneNumber: true,
              organizationName: true,
            },
          },
        },
      }),
      prisma.event.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        events,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get events error:', error);
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
 * PATCH /api/admin/events/:id
 * Update event status (approve, suspend, etc.)
 */
router.patch('/events/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['draft', 'active', 'suspended', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid status',
          timestamp: new Date().toISOString(),
        },
      });
    }

    const event = await prisma.event.update({
      where: { id },
      data: { status },
    });

    return res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      data: event,
    });
  } catch (error) {
    console.error('Update event error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update event',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/admin/analytics
 * Get platform analytics
 */
router.get('/analytics', async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get user growth
    const userGrowth = await prisma.user.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: { gte: startDate },
      },
      _count: true,
    });

    // Get revenue by day
    const revenueByDay = await prisma.payment.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: { gte: startDate },
        status: 'completed',
      },
      _sum: { amount: true },
    });

    // Get events by type
    const eventsByType = await prisma.event.groupBy({
      by: ['eventType'],
      _count: true,
    });

    // Get users by state
    const usersByState = await prisma.user.groupBy({
      by: ['state'],
      _count: true,
      orderBy: { _count: { state: 'desc' } },
      take: 10,
    });

    return res.status(200).json({
      success: true,
      data: {
        userGrowth,
        revenueByDay,
        eventsByType,
        usersByState,
      },
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch analytics',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

export default router;
