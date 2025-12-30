import prisma from '../lib/prisma.js';
import { ROLE_PERMISSIONS, Permission } from '../middleware/rbac.js';

export interface AddOrganizerInput {
  eventId: string;
  userId: string;
  role: 'editor' | 'viewer' | 'financial';
  customPermissions?: Permission[];
}

export interface UpdateOrganizerInput {
  role?: 'editor' | 'viewer' | 'financial';
  customPermissions?: Permission[];
}

/**
 * Add an organizer to an event
 * Only the event owner can add organizers
 */
export async function addEventOrganizer(
  requesterId: string,
  input: AddOrganizerInput
) {
  try {
    const { eventId, userId, role, customPermissions = [] } = input;

    // Verify requester is the event owner
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return {
        success: false,
        message: 'Event not found',
      };
    }

    if (event.organizerId !== requesterId) {
      return {
        success: false,
        message: 'Unauthorized: Only the event owner can add organizers',
      };
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return {
        success: false,
        message: 'User not found',
      };
    }

    // Check if user is already an organizer
    const existingOrganizer = await prisma.eventOrganizer.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
      },
    });

    if (existingOrganizer) {
      return {
        success: false,
        message: 'User is already an organizer for this event',
      };
    }

    // Create event organizer
    const eventOrganizer = await prisma.eventOrganizer.create({
      data: {
        eventId,
        userId,
        role,
        permissions: {
          custom: customPermissions,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            email: true,
          },
        },
      },
    });

    return {
      success: true,
      organizer: {
        id: eventOrganizer.id,
        userId: eventOrganizer.userId,
        role: eventOrganizer.role,
        permissions: ROLE_PERMISSIONS[eventOrganizer.role],
        customPermissions,
        user: eventOrganizer.user,
        createdAt: eventOrganizer.createdAt,
      },
    };
  } catch (error) {
    console.error('Add event organizer error:', error);
    return {
      success: false,
      message: 'Failed to add event organizer',
    };
  }
}

/**
 * Update an organizer's role or permissions
 * Only the event owner can update organizers
 */
export async function updateEventOrganizer(
  requesterId: string,
  eventId: string,
  userId: string,
  updates: UpdateOrganizerInput
) {
  try {
    // Verify requester is the event owner
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return {
        success: false,
        message: 'Event not found',
      };
    }

    if (event.organizerId !== requesterId) {
      return {
        success: false,
        message: 'Unauthorized: Only the event owner can update organizers',
      };
    }

    // Check if organizer exists
    const existingOrganizer = await prisma.eventOrganizer.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
      },
    });

    if (!existingOrganizer) {
      return {
        success: false,
        message: 'Organizer not found',
      };
    }

    // Update organizer
    const updateData: any = {};
    if (updates.role) {
      updateData.role = updates.role;
    }
    if (updates.customPermissions !== undefined) {
      updateData.permissions = {
        custom: updates.customPermissions,
      };
    }

    const updatedOrganizer = await prisma.eventOrganizer.update({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
      },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            email: true,
          },
        },
      },
    });

    return {
      success: true,
      organizer: {
        id: updatedOrganizer.id,
        userId: updatedOrganizer.userId,
        role: updatedOrganizer.role,
        permissions: ROLE_PERMISSIONS[updatedOrganizer.role],
        customPermissions: (updatedOrganizer.permissions as any)?.custom || [],
        user: updatedOrganizer.user,
        updatedAt: updatedOrganizer.updatedAt,
      },
    };
  } catch (error) {
    console.error('Update event organizer error:', error);
    return {
      success: false,
      message: 'Failed to update event organizer',
    };
  }
}

/**
 * Remove an organizer from an event
 * Only the event owner can remove organizers
 */
export async function removeEventOrganizer(
  requesterId: string,
  eventId: string,
  userId: string
) {
  try {
    // Verify requester is the event owner
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return {
        success: false,
        message: 'Event not found',
      };
    }

    if (event.organizerId !== requesterId) {
      return {
        success: false,
        message: 'Unauthorized: Only the event owner can remove organizers',
      };
    }

    // Check if organizer exists
    const existingOrganizer = await prisma.eventOrganizer.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
      },
    });

    if (!existingOrganizer) {
      return {
        success: false,
        message: 'Organizer not found',
      };
    }

    // Remove organizer
    await prisma.eventOrganizer.delete({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
      },
    });

    return {
      success: true,
      message: 'Organizer removed successfully',
    };
  } catch (error) {
    console.error('Remove event organizer error:', error);
    return {
      success: false,
      message: 'Failed to remove event organizer',
    };
  }
}

/**
 * Get all organizers for an event
 */
export async function getEventOrganizers(requesterId: string, eventId: string) {
  try {
    // Verify requester has access to the event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return {
        success: false,
        message: 'Event not found',
      };
    }

    // Check if requester is owner or has permission
    const isOwner = event.organizerId === requesterId;
    const hasAccess = isOwner || await prisma.eventOrganizer.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId: requesterId,
        },
      },
    });

    if (!hasAccess) {
      return {
        success: false,
        message: 'Unauthorized: You do not have access to this event',
      };
    }

    // Get all organizers
    const organizers = await prisma.eventOrganizer.findMany({
      where: { eventId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Add owner to the list
    const owner = await prisma.user.findUnique({
      where: { id: event.organizerId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        email: true,
      },
    });

    const allOrganizers = [
      {
        id: 'owner',
        userId: event.organizerId,
        role: 'owner',
        permissions: ROLE_PERMISSIONS.owner,
        customPermissions: [],
        user: owner,
        createdAt: event.createdAt,
      },
      ...organizers.map((org) => ({
        id: org.id,
        userId: org.userId,
        role: org.role,
        permissions: ROLE_PERMISSIONS[org.role],
        customPermissions: (org.permissions as any)?.custom || [],
        user: org.user,
        createdAt: org.createdAt,
      })),
    ];

    return {
      success: true,
      organizers: allOrganizers,
    };
  } catch (error) {
    console.error('Get event organizers error:', error);
    return {
      success: false,
      message: 'Failed to fetch event organizers',
    };
  }
}
