import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma.js';

/**
 * Permission types for event organizers
 */
export enum Permission {
  VIEW_ANALYTICS = 'view_analytics',
  VIEW_ATTENDEES = 'view_attendees',
  EXPORT_DATA = 'export_data',
  EDIT_EVENT = 'edit_event',
  DELETE_EVENT = 'delete_event',
  VIEW_FINANCIAL = 'view_financial',
  MANAGE_PAYMENTS = 'manage_payments',
  BROADCAST_MESSAGES = 'broadcast_messages',
  MANAGE_ORGANIZERS = 'manage_organizers',
}

/**
 * Role definitions with their permissions
 */
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  owner: [
    Permission.VIEW_ANALYTICS,
    Permission.VIEW_ATTENDEES,
    Permission.EXPORT_DATA,
    Permission.EDIT_EVENT,
    Permission.DELETE_EVENT,
    Permission.VIEW_FINANCIAL,
    Permission.MANAGE_PAYMENTS,
    Permission.BROADCAST_MESSAGES,
    Permission.MANAGE_ORGANIZERS,
  ],
  editor: [
    Permission.VIEW_ANALYTICS,
    Permission.VIEW_ATTENDEES,
    Permission.EXPORT_DATA,
    Permission.EDIT_EVENT,
    Permission.BROADCAST_MESSAGES,
  ],
  viewer: [
    Permission.VIEW_ANALYTICS,
    Permission.VIEW_ATTENDEES,
  ],
  financial: [
    Permission.VIEW_ANALYTICS,
    Permission.VIEW_ATTENDEES,
    Permission.VIEW_FINANCIAL,
    Permission.MANAGE_PAYMENTS,
    Permission.EXPORT_DATA,
  ],
};

/**
 * Get user's role and permissions for an event
 */
export async function getUserEventRole(userId: string, eventId: string): Promise<{
  role: string | null;
  permissions: Permission[];
}> {
  try {
    // Check if user is the event owner
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { organizerId: true },
    });

    if (event?.organizerId === userId) {
      return {
        role: 'owner',
        permissions: ROLE_PERMISSIONS.owner,
      };
    }

    // Check if user has an organizer role
    const eventOrganizer = await prisma.eventOrganizer.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
      },
    });

    if (eventOrganizer) {
      const rolePermissions = ROLE_PERMISSIONS[eventOrganizer.role] || [];
      // Merge role permissions with custom permissions if any
      const customPermissions = (eventOrganizer.permissions as any)?.custom || [];
      const allPermissions = [...new Set([...rolePermissions, ...customPermissions])];
      
      return {
        role: eventOrganizer.role,
        permissions: allPermissions,
      };
    }

    return {
      role: null,
      permissions: [],
    };
  } catch (error) {
    console.error('Get user event role error:', error);
    return {
      role: null,
      permissions: [],
    };
  }
}

/**
 * Check if user has specific permission for an event
 */
export async function hasPermission(
  userId: string,
  eventId: string,
  requiredPermission: Permission
): Promise<boolean> {
  const { permissions } = await getUserEventRole(userId, eventId);
  return permissions.includes(requiredPermission);
}

/**
 * Middleware to check if user has required permission for an event
 * Event ID should be in req.params.eventId
 */
export const requirePermission = (...requiredPermissions: Permission[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      const eventId = req.params.eventId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'AUTHENTICATION_ERROR',
            message: 'User not authenticated',
            timestamp: new Date().toISOString(),
          },
        });
      }

      if (!eventId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Event ID is required',
            timestamp: new Date().toISOString(),
          },
        });
      }

      const { permissions } = await getUserEventRole(userId, eventId);

      // Check if user has at least one of the required permissions
      const hasRequiredPermission = requiredPermissions.some((permission) =>
        permissions.includes(permission)
      );

      if (!hasRequiredPermission) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'AUTHORIZATION_ERROR',
            message: 'Insufficient permissions for this action',
            timestamp: new Date().toISOString(),
            details: {
              required: requiredPermissions,
              userPermissions: permissions,
            },
          },
        });
      }

      // Attach permissions to request for later use
      req.user = {
        ...req.user,
        permissions,
      };

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to verify permissions',
          timestamp: new Date().toISOString(),
        },
      });
    }
  };
};

/**
 * Extend Express Request type to include permissions
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: string;
        state: string;
        permissions?: Permission[];
      };
    }
  }
}
