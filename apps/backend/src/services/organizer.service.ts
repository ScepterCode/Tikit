import prisma from '../lib/prisma.js';
import supabase from '../lib/supabase.js';
import { getUserEventRole } from '../middleware/rbac.js';

export interface EventAnalytics {
  salesCounters: {
    totalTicketsSold: number;
    ticketsByTier: Record<string, number>;
    pendingPayments: number;
    completedPayments: number;
  };
  revenue: {
    totalRevenue: number;
    revenueByTier: Record<string, number>;
    revenueByPaymentMethod: Record<string, number>;
    pendingRevenue: number;
  };
  demographics: {
    attendeesByState: Record<string, number>;
    attendeesByLGA: Record<string, number>;
    newVsReturning: {
      new: number;
      returning: number;
    };
  };
  capacity: {
    total: number;
    sold: number;
    remaining: number;
    percentageSold: number;
  };
}

/**
 * Get real-time analytics for an event
 */
export async function getEventAnalytics(
  eventId: string,
  organizerId: string
): Promise<{
  success: boolean;
  analytics?: EventAnalytics;
  message?: string;
}> {
  try {
    // Verify user has access to the event (handled by RBAC middleware)
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        tickets: {
          include: {
            user: {
              select: {
                state: true,
                lga: true,
                createdAt: true,
              },
            },
            payment: true,
          },
        },
      },
    });

    if (!event) {
      return {
        success: false,
        message: 'Event not found',
      };
    }

    // Parse tiers
    const tiers = event.tiers as any[];
    const tierMap = new Map(tiers.map((tier) => [tier.id, tier]));

    // Initialize counters
    const salesCounters = {
      totalTicketsSold: event.tickets.length,
      ticketsByTier: {} as Record<string, number>,
      pendingPayments: 0,
      completedPayments: 0,
    };

    const revenue = {
      totalRevenue: 0,
      revenueByTier: {} as Record<string, number>,
      revenueByPaymentMethod: {} as Record<string, number>,
      pendingRevenue: 0,
    };

    const demographics = {
      attendeesByState: {} as Record<string, number>,
      attendeesByLGA: {} as Record<string, number>,
      newVsReturning: {
        new: 0,
        returning: 0,
      },
    };

    // Process tickets
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    event.tickets.forEach((ticket) => {
      const tier = tierMap.get(ticket.tierId);
      const tierName = tier?.name || 'Unknown';

      // Count tickets by tier
      salesCounters.ticketsByTier[tierName] = (salesCounters.ticketsByTier[tierName] || 0) + 1;

      // Process payment
      if (ticket.payment) {
        if (ticket.payment.status === 'successful') {
          salesCounters.completedPayments++;
          revenue.totalRevenue += ticket.payment.amount;

          // Revenue by tier
          revenue.revenueByTier[tierName] =
            (revenue.revenueByTier[tierName] || 0) + ticket.payment.amount;

          // Revenue by payment method
          const method = ticket.payment.method;
          revenue.revenueByPaymentMethod[method] =
            (revenue.revenueByPaymentMethod[method] || 0) + ticket.payment.amount;
        } else if (ticket.payment.status === 'pending') {
          salesCounters.pendingPayments++;
          revenue.pendingRevenue += ticket.payment.amount;
        }
      }

      // Demographics
      if (ticket.user.state) {
        demographics.attendeesByState[ticket.user.state] =
          (demographics.attendeesByState[ticket.user.state] || 0) + 1;
      }

      if (ticket.user.lga) {
        demographics.attendeesByLGA[ticket.user.lga] =
          (demographics.attendeesByLGA[ticket.user.lga] || 0) + 1;
      }

      // New vs returning (users created within 30 days of ticket purchase)
      const userAge = ticket.purchaseDate.getTime() - ticket.user.createdAt.getTime();
      const daysSinceCreation = userAge / (1000 * 60 * 60 * 24);

      if (daysSinceCreation <= 30) {
        demographics.newVsReturning.new++;
      } else {
        demographics.newVsReturning.returning++;
      }
    });

    // Capacity metrics
    const capacity = {
      total: event.capacity,
      sold: event.ticketsSold,
      remaining: event.capacity - event.ticketsSold,
      percentageSold: (event.ticketsSold / event.capacity) * 100,
    };

    const analytics: EventAnalytics = {
      salesCounters,
      revenue,
      demographics,
      capacity,
    };

    return {
      success: true,
      analytics,
    };
  } catch (error) {
    console.error('Get event analytics error:', error);
    return {
      success: false,
      message: 'Failed to fetch event analytics',
    };
  }
}

/**
 * Subscribe to real-time analytics updates
 * This sets up a Supabase real-time subscription for analytics updates
 */
export async function subscribeToAnalyticsUpdates(eventId: string) {
  try {
    // Subscribe to ticket and payment changes for this event
    const channel = supabase
      .channel(`event-analytics-${eventId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'Ticket',
          filter: `eventId=eq.${eventId}`,
        },
        async () => {
          // Fetch updated analytics when tickets change
          // Note: This would need the organizerId, which should be passed in
          // For now, we'll just trigger the callback
          // In production, you'd fetch the full analytics here
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'Payment',
        },
        async () => {
          // Fetch updated analytics when payments change
        }
      )
      .subscribe();

    return {
      success: true,
      channel,
    };
  } catch (error) {
    console.error('Subscribe to analytics updates error:', error);
    return {
      success: false,
      message: 'Failed to subscribe to analytics updates',
    };
  }
}

/**
 * Get list of attendees for an event
 */
export async function getEventAttendees(eventId: string, organizerId: string) {
  try {
    // Verify user has access to the event (handled by RBAC middleware)
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return {
        success: false,
        message: 'Event not found',
      };
    }

    // Fetch attendees
    const tickets = await prisma.ticket.findMany({
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
        payment: {
          select: {
            status: true,
            method: true,
            amount: true,
          },
        },
      },
      orderBy: {
        purchaseDate: 'desc',
      },
    });

    // Parse tiers
    const tiers = event.tiers as any[];
    const tierMap = new Map(tiers.map((tier) => [tier.id, tier]));

    // Format attendee data
    const attendees = tickets.map((ticket) => {
      const tier = tierMap.get(ticket.tierId);

      return {
        ticketId: ticket.id,
        name: `${ticket.user.firstName || ''} ${ticket.user.lastName || ''}`.trim() || 'N/A',
        phoneNumber: ticket.user.phoneNumber,
        email: ticket.user.email || 'N/A',
        tierName: tier?.name || 'Unknown',
        tierPrice: tier?.price || 0,
        paymentStatus: ticket.payment?.status || 'pending',
        paymentMethod: ticket.payment?.method || 'N/A',
        purchaseDate: ticket.purchaseDate,
        status: ticket.status,
      };
    });

    return {
      success: true,
      attendees,
      total: attendees.length,
    };
  } catch (error) {
    console.error('Get event attendees error:', error);
    return {
      success: false,
      message: 'Failed to fetch event attendees',
    };
  }
}

/**
 * Get organizer's events
 */
export async function getOrganizerEvents(organizerId: string) {
  try {
    const events = await prisma.event.findMany({
      where: { organizerId },
      include: {
        _count: {
          select: {
            tickets: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      success: true,
      events: events.map((event) => ({
        ...event,
        ticketsSold: event._count.tickets,
      })),
    };
  } catch (error) {
    console.error('Get organizer events error:', error);
    return {
      success: false,
      message: 'Failed to fetch organizer events',
    };
  }
}

/**
 * Update event details
 */
export async function updateEvent(
  eventId: string,
  organizerId: string,
  updates: {
    title?: string;
    description?: string;
    startDate?: Date;
    endDate?: Date;
    venue?: string;
    capacity?: number;
    tiers?: any[];
    culturalFeatures?: any;
    images?: string[];
    status?: string;
  }
) {
  try {
    // Verify user has access to the event (handled by RBAC middleware)
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return {
        success: false,
        message: 'Event not found',
      };
    }

    // Update event
    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: updates,
    });

    return {
      success: true,
      event: updatedEvent,
    };
  } catch (error) {
    console.error('Update event error:', error);
    return {
      success: false,
      message: 'Failed to update event',
    };
  }
}

/**
 * Export attendee data to CSV
 */
export async function exportAttendeeData(eventId: string, organizerId: string) {
  try {
    // Get attendees
    const result = await getEventAttendees(eventId, organizerId);

    if (!result.success || !result.attendees) {
      return result;
    }

    // Generate CSV content
    const headers = [
      'Name',
      'Phone Number',
      'Email',
      'Ticket Tier',
      'Tier Price (₦)',
      'Payment Status',
      'Payment Method',
      'Purchase Date',
      'Ticket Status',
    ];

    const rows = result.attendees.map((attendee) => [
      attendee.name,
      attendee.phoneNumber,
      attendee.email,
      attendee.tierName,
      (attendee.tierPrice / 100).toFixed(2), // Convert from kobo to naira
      attendee.paymentStatus,
      attendee.paymentMethod,
      attendee.purchaseDate.toISOString(),
      attendee.status,
    ]);

    // Build CSV string
    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => {
          // Escape cells that contain commas, quotes, or newlines
          const cellStr = String(cell);
          if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
            return `"${cellStr.replace(/"/g, '""')}"`;
          }
          return cellStr;
        }).join(',')
      ),
    ].join('\n');

    return {
      success: true,
      csvContent,
      filename: `attendees-${eventId}-${new Date().toISOString().split('T')[0]}.csv`,
    };
  } catch (error) {
    console.error('Export attendee data error:', error);
    return {
      success: false,
      message: 'Failed to export attendee data',
    };
  }
}


/**
 * Delete event
 */
export async function deleteEvent(eventId: string, organizerId: string) {
  try {
    // Verify user has access to the event (handled by RBAC middleware)
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        tickets: true,
      },
    });

    if (!event) {
      return {
        success: false,
        message: 'Event not found',
      };
    }

    // Check if event has sold tickets
    if (event.tickets.length > 0) {
      return {
        success: false,
        message: 'Cannot delete event with sold tickets. Please cancel the event instead.',
      };
    }

    // Delete event
    await prisma.event.delete({
      where: { id: eventId },
    });

    return {
      success: true,
      message: 'Event deleted successfully',
    };
  } catch (error) {
    console.error('Delete event error:', error);
    return {
      success: false,
      message: 'Failed to delete event',
    };
  }
}
