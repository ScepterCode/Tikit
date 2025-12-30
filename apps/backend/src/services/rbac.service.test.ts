import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  addEventOrganizer,
  updateEventOrganizer,
  removeEventOrganizer,
  getEventOrganizers,
} from './rbac.service.js';
import { Permission } from '../middleware/rbac.js';
import prisma from '../lib/prisma.js';

// Mock Prisma
vi.mock('../lib/prisma.js', () => ({
  default: {
    event: {
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    eventOrganizer: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

describe('RBAC Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('addEventOrganizer', () => {
    it('should add organizer when requester is event owner', async () => {
      const requesterId = 'owner-123';
      const eventId = 'event-456';
      const userId = 'user-789';

      vi.mocked(prisma.event.findUnique).mockResolvedValue({
        id: eventId,
        organizerId: requesterId,
      } as any);

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: userId,
        firstName: 'John',
        lastName: 'Doe',
      } as any);

      vi.mocked(prisma.eventOrganizer.findUnique).mockResolvedValue(null);

      vi.mocked(prisma.eventOrganizer.create).mockResolvedValue({
        id: 'org-001',
        eventId,
        userId,
        role: 'editor',
        permissions: { custom: [] },
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: userId,
          firstName: 'John',
          lastName: 'Doe',
          phoneNumber: '+2341234567890',
          email: 'john@example.com',
        },
      } as any);

      const result = await addEventOrganizer(requesterId, {
        eventId,
        userId,
        role: 'editor',
      });

      expect(result.success).toBe(true);
      expect(result.organizer?.role).toBe('editor');
      expect(prisma.eventOrganizer.create).toHaveBeenCalled();
    });

    it('should fail when requester is not event owner', async () => {
      const requesterId = 'user-123';
      const eventId = 'event-456';
      const userId = 'user-789';

      vi.mocked(prisma.event.findUnique).mockResolvedValue({
        id: eventId,
        organizerId: 'other-owner',
      } as any);

      const result = await addEventOrganizer(requesterId, {
        eventId,
        userId,
        role: 'editor',
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Only the event owner');
    });

    it('should fail when event does not exist', async () => {
      const requesterId = 'owner-123';
      const eventId = 'event-456';
      const userId = 'user-789';

      vi.mocked(prisma.event.findUnique).mockResolvedValue(null);

      const result = await addEventOrganizer(requesterId, {
        eventId,
        userId,
        role: 'editor',
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Event not found');
    });

    it('should fail when user does not exist', async () => {
      const requesterId = 'owner-123';
      const eventId = 'event-456';
      const userId = 'user-789';

      vi.mocked(prisma.event.findUnique).mockResolvedValue({
        id: eventId,
        organizerId: requesterId,
      } as any);

      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const result = await addEventOrganizer(requesterId, {
        eventId,
        userId,
        role: 'editor',
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('User not found');
    });

    it('should fail when user is already an organizer', async () => {
      const requesterId = 'owner-123';
      const eventId = 'event-456';
      const userId = 'user-789';

      vi.mocked(prisma.event.findUnique).mockResolvedValue({
        id: eventId,
        organizerId: requesterId,
      } as any);

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: userId,
      } as any);

      vi.mocked(prisma.eventOrganizer.findUnique).mockResolvedValue({
        id: 'org-001',
        eventId,
        userId,
        role: 'editor',
      } as any);

      const result = await addEventOrganizer(requesterId, {
        eventId,
        userId,
        role: 'editor',
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('already an organizer');
    });

    it('should support custom permissions', async () => {
      const requesterId = 'owner-123';
      const eventId = 'event-456';
      const userId = 'user-789';
      const customPermissions = [Permission.BROADCAST_MESSAGES];

      vi.mocked(prisma.event.findUnique).mockResolvedValue({
        id: eventId,
        organizerId: requesterId,
      } as any);

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: userId,
      } as any);

      vi.mocked(prisma.eventOrganizer.findUnique).mockResolvedValue(null);

      vi.mocked(prisma.eventOrganizer.create).mockResolvedValue({
        id: 'org-001',
        eventId,
        userId,
        role: 'viewer',
        permissions: { custom: customPermissions },
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: userId,
          firstName: 'John',
          lastName: 'Doe',
          phoneNumber: '+2341234567890',
          email: 'john@example.com',
        },
      } as any);

      const result = await addEventOrganizer(requesterId, {
        eventId,
        userId,
        role: 'viewer',
        customPermissions,
      });

      expect(result.success).toBe(true);
      expect(result.organizer?.customPermissions).toEqual(customPermissions);
    });
  });

  describe('updateEventOrganizer', () => {
    it('should update organizer role when requester is owner', async () => {
      const requesterId = 'owner-123';
      const eventId = 'event-456';
      const userId = 'user-789';

      vi.mocked(prisma.event.findUnique).mockResolvedValue({
        id: eventId,
        organizerId: requesterId,
      } as any);

      vi.mocked(prisma.eventOrganizer.findUnique).mockResolvedValue({
        id: 'org-001',
        eventId,
        userId,
        role: 'viewer',
      } as any);

      vi.mocked(prisma.eventOrganizer.update).mockResolvedValue({
        id: 'org-001',
        eventId,
        userId,
        role: 'editor',
        permissions: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: userId,
          firstName: 'John',
          lastName: 'Doe',
          phoneNumber: '+2341234567890',
          email: 'john@example.com',
        },
      } as any);

      const result = await updateEventOrganizer(requesterId, eventId, userId, {
        role: 'editor',
      });

      expect(result.success).toBe(true);
      expect(result.organizer?.role).toBe('editor');
    });

    it('should fail when requester is not event owner', async () => {
      const requesterId = 'user-123';
      const eventId = 'event-456';
      const userId = 'user-789';

      vi.mocked(prisma.event.findUnique).mockResolvedValue({
        id: eventId,
        organizerId: 'other-owner',
      } as any);

      const result = await updateEventOrganizer(requesterId, eventId, userId, {
        role: 'editor',
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Only the event owner');
    });

    it('should fail when organizer does not exist', async () => {
      const requesterId = 'owner-123';
      const eventId = 'event-456';
      const userId = 'user-789';

      vi.mocked(prisma.event.findUnique).mockResolvedValue({
        id: eventId,
        organizerId: requesterId,
      } as any);

      vi.mocked(prisma.eventOrganizer.findUnique).mockResolvedValue(null);

      const result = await updateEventOrganizer(requesterId, eventId, userId, {
        role: 'editor',
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Organizer not found');
    });
  });

  describe('removeEventOrganizer', () => {
    it('should remove organizer when requester is owner', async () => {
      const requesterId = 'owner-123';
      const eventId = 'event-456';
      const userId = 'user-789';

      vi.mocked(prisma.event.findUnique).mockResolvedValue({
        id: eventId,
        organizerId: requesterId,
      } as any);

      vi.mocked(prisma.eventOrganizer.findUnique).mockResolvedValue({
        id: 'org-001',
        eventId,
        userId,
        role: 'editor',
      } as any);

      vi.mocked(prisma.eventOrganizer.delete).mockResolvedValue({} as any);

      const result = await removeEventOrganizer(requesterId, eventId, userId);

      expect(result.success).toBe(true);
      expect(prisma.eventOrganizer.delete).toHaveBeenCalled();
    });

    it('should fail when requester is not event owner', async () => {
      const requesterId = 'user-123';
      const eventId = 'event-456';
      const userId = 'user-789';

      vi.mocked(prisma.event.findUnique).mockResolvedValue({
        id: eventId,
        organizerId: 'other-owner',
      } as any);

      const result = await removeEventOrganizer(requesterId, eventId, userId);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Only the event owner');
    });
  });

  describe('getEventOrganizers', () => {
    it('should return all organizers including owner', async () => {
      const requesterId = 'owner-123';
      const eventId = 'event-456';

      vi.mocked(prisma.event.findUnique).mockResolvedValue({
        id: eventId,
        organizerId: requesterId,
        createdAt: new Date(),
      } as any);

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: requesterId,
        firstName: 'Owner',
        lastName: 'User',
        phoneNumber: '+2341234567890',
        email: 'owner@example.com',
      } as any);

      vi.mocked(prisma.eventOrganizer.findMany).mockResolvedValue([
        {
          id: 'org-001',
          eventId,
          userId: 'user-789',
          role: 'editor',
          permissions: {},
          createdAt: new Date(),
          updatedAt: new Date(),
          user: {
            id: 'user-789',
            firstName: 'Editor',
            lastName: 'User',
            phoneNumber: '+2341234567891',
            email: 'editor@example.com',
          },
        },
      ] as any);

      const result = await getEventOrganizers(requesterId, eventId);

      expect(result.success).toBe(true);
      expect(result.organizers).toHaveLength(2);
      expect(result.organizers?.[0].role).toBe('owner');
      expect(result.organizers?.[1].role).toBe('editor');
    });

    it('should allow organizers to view other organizers', async () => {
      const requesterId = 'user-789';
      const eventId = 'event-456';

      vi.mocked(prisma.event.findUnique).mockResolvedValue({
        id: eventId,
        organizerId: 'owner-123',
        createdAt: new Date(),
      } as any);

      vi.mocked(prisma.eventOrganizer.findUnique).mockResolvedValue({
        id: 'org-001',
        eventId,
        userId: requesterId,
        role: 'editor',
      } as any);

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'owner-123',
        firstName: 'Owner',
        lastName: 'User',
      } as any);

      vi.mocked(prisma.eventOrganizer.findMany).mockResolvedValue([]);

      const result = await getEventOrganizers(requesterId, eventId);

      expect(result.success).toBe(true);
    });

    it('should fail when user has no access to event', async () => {
      const requesterId = 'user-123';
      const eventId = 'event-456';

      vi.mocked(prisma.event.findUnique).mockResolvedValue({
        id: eventId,
        organizerId: 'owner-789',
      } as any);

      vi.mocked(prisma.eventOrganizer.findUnique).mockResolvedValue(null);

      const result = await getEventOrganizers(requesterId, eventId);

      expect(result.success).toBe(false);
      expect(result.message).toContain('do not have access');
    });
  });
});
