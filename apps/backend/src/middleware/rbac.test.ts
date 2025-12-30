import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Request, Response } from 'express';
import {
  Permission,
  ROLE_PERMISSIONS,
  getUserEventRole,
  hasPermission,
  requirePermission,
} from './rbac.js';
import prisma from '../lib/prisma.js';

// Mock Prisma
vi.mock('../lib/prisma.js', () => ({
  default: {
    event: {
      findUnique: vi.fn(),
    },
    eventOrganizer: {
      findUnique: vi.fn(),
    },
  },
}));

describe('RBAC Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ROLE_PERMISSIONS', () => {
    it('should define permissions for owner role', () => {
      expect(ROLE_PERMISSIONS.owner).toContain(Permission.VIEW_ANALYTICS);
      expect(ROLE_PERMISSIONS.owner).toContain(Permission.EDIT_EVENT);
      expect(ROLE_PERMISSIONS.owner).toContain(Permission.DELETE_EVENT);
      expect(ROLE_PERMISSIONS.owner).toContain(Permission.MANAGE_ORGANIZERS);
      expect(ROLE_PERMISSIONS.owner).toContain(Permission.VIEW_FINANCIAL);
    });

    it('should define permissions for editor role', () => {
      expect(ROLE_PERMISSIONS.editor).toContain(Permission.VIEW_ANALYTICS);
      expect(ROLE_PERMISSIONS.editor).toContain(Permission.EDIT_EVENT);
      expect(ROLE_PERMISSIONS.editor).not.toContain(Permission.DELETE_EVENT);
      expect(ROLE_PERMISSIONS.editor).not.toContain(Permission.VIEW_FINANCIAL);
    });

    it('should define permissions for viewer role', () => {
      expect(ROLE_PERMISSIONS.viewer).toContain(Permission.VIEW_ANALYTICS);
      expect(ROLE_PERMISSIONS.viewer).toContain(Permission.VIEW_ATTENDEES);
      expect(ROLE_PERMISSIONS.viewer).not.toContain(Permission.EDIT_EVENT);
      expect(ROLE_PERMISSIONS.viewer).not.toContain(Permission.VIEW_FINANCIAL);
    });

    it('should define permissions for financial role', () => {
      expect(ROLE_PERMISSIONS.financial).toContain(Permission.VIEW_ANALYTICS);
      expect(ROLE_PERMISSIONS.financial).toContain(Permission.VIEW_FINANCIAL);
      expect(ROLE_PERMISSIONS.financial).toContain(Permission.MANAGE_PAYMENTS);
      expect(ROLE_PERMISSIONS.financial).not.toContain(Permission.EDIT_EVENT);
    });
  });

  describe('getUserEventRole', () => {
    it('should return owner role for event owner', async () => {
      const userId = 'user-123';
      const eventId = 'event-456';

      vi.mocked(prisma.event.findUnique).mockResolvedValue({
        id: eventId,
        organizerId: userId,
      } as any);

      const result = await getUserEventRole(userId, eventId);

      expect(result.role).toBe('owner');
      expect(result.permissions).toEqual(ROLE_PERMISSIONS.owner);
    });

    it('should return organizer role for event organizer', async () => {
      const userId = 'user-123';
      const eventId = 'event-456';

      vi.mocked(prisma.event.findUnique).mockResolvedValue({
        id: eventId,
        organizerId: 'other-user',
      } as any);

      vi.mocked(prisma.eventOrganizer.findUnique).mockResolvedValue({
        id: 'org-789',
        eventId,
        userId,
        role: 'editor',
        permissions: {},
      } as any);

      const result = await getUserEventRole(userId, eventId);

      expect(result.role).toBe('editor');
      expect(result.permissions).toEqual(ROLE_PERMISSIONS.editor);
    });

    it('should return null role for unauthorized user', async () => {
      const userId = 'user-123';
      const eventId = 'event-456';

      vi.mocked(prisma.event.findUnique).mockResolvedValue({
        id: eventId,
        organizerId: 'other-user',
      } as any);

      vi.mocked(prisma.eventOrganizer.findUnique).mockResolvedValue(null);

      const result = await getUserEventRole(userId, eventId);

      expect(result.role).toBeNull();
      expect(result.permissions).toEqual([]);
    });

    it('should merge custom permissions with role permissions', async () => {
      const userId = 'user-123';
      const eventId = 'event-456';

      vi.mocked(prisma.event.findUnique).mockResolvedValue({
        id: eventId,
        organizerId: 'other-user',
      } as any);

      vi.mocked(prisma.eventOrganizer.findUnique).mockResolvedValue({
        id: 'org-789',
        eventId,
        userId,
        role: 'viewer',
        permissions: {
          custom: [Permission.EXPORT_DATA],
        },
      } as any);

      const result = await getUserEventRole(userId, eventId);

      expect(result.role).toBe('viewer');
      expect(result.permissions).toContain(Permission.VIEW_ANALYTICS);
      expect(result.permissions).toContain(Permission.EXPORT_DATA);
    });
  });

  describe('hasPermission', () => {
    it('should return true when user has required permission', async () => {
      const userId = 'user-123';
      const eventId = 'event-456';

      vi.mocked(prisma.event.findUnique).mockResolvedValue({
        id: eventId,
        organizerId: userId,
      } as any);

      const result = await hasPermission(userId, eventId, Permission.VIEW_ANALYTICS);

      expect(result).toBe(true);
    });

    it('should return false when user lacks required permission', async () => {
      const userId = 'user-123';
      const eventId = 'event-456';

      vi.mocked(prisma.event.findUnique).mockResolvedValue({
        id: eventId,
        organizerId: 'other-user',
      } as any);

      vi.mocked(prisma.eventOrganizer.findUnique).mockResolvedValue({
        id: 'org-789',
        eventId,
        userId,
        role: 'viewer',
        permissions: {},
      } as any);

      const result = await hasPermission(userId, eventId, Permission.DELETE_EVENT);

      expect(result).toBe(false);
    });
  });

  describe('requirePermission middleware', () => {
    it('should allow access when user has required permission', async () => {
      const userId = 'user-123';
      const eventId = 'event-456';

      vi.mocked(prisma.event.findUnique).mockResolvedValue({
        id: eventId,
        organizerId: userId,
      } as any);

      const req = {
        user: { userId, role: 'organizer', state: 'Lagos' },
        params: { eventId },
      } as unknown as Request;

      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;

      const next = vi.fn();

      const middleware = requirePermission(Permission.VIEW_ANALYTICS);
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should deny access when user lacks required permission', async () => {
      const userId = 'user-123';
      const eventId = 'event-456';

      vi.mocked(prisma.event.findUnique).mockResolvedValue({
        id: eventId,
        organizerId: 'other-user',
      } as any);

      vi.mocked(prisma.eventOrganizer.findUnique).mockResolvedValue({
        id: 'org-789',
        eventId,
        userId,
        role: 'viewer',
        permissions: {},
      } as any);

      const req = {
        user: { userId, role: 'organizer', state: 'Lagos' },
        params: { eventId },
      } as unknown as Request;

      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;

      const next = vi.fn();

      const middleware = requirePermission(Permission.DELETE_EVENT);
      await middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'AUTHORIZATION_ERROR',
          }),
        })
      );
    });

    it('should return 401 when user is not authenticated', async () => {
      const req = {
        params: { eventId: 'event-456' },
      } as unknown as Request;

      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;

      const next = vi.fn();

      const middleware = requirePermission(Permission.VIEW_ANALYTICS);
      await middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should return 400 when eventId is missing', async () => {
      const req = {
        user: { userId: 'user-123', role: 'organizer', state: 'Lagos' },
        params: {},
      } as unknown as Request;

      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;

      const next = vi.fn();

      const middleware = requirePermission(Permission.VIEW_ANALYTICS);
      await middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
