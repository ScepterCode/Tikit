import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to check if user has required role
 * @param allowedRoles - Array of roles that can access the route
 */
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role;

    if (!userRole) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          timestamp: new Date().toISOString()
        }
      });
    }

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
          timestamp: new Date().toISOString()
        }
      });
    }

    next();
  };
};

/**
 * Shorthand middleware for attendee-only routes
 */
export const requireAttendee = requireRole(['attendee', 'organizer', 'admin']);

/**
 * Shorthand middleware for organizer routes
 */
export const requireOrganizer = requireRole(['organizer', 'admin']);

/**
 * Shorthand middleware for admin-only routes
 */
export const requireAdmin = requireRole(['admin']);
