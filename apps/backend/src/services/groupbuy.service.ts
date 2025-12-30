import { prisma } from '../lib/prisma.js';
import crypto from 'crypto';

export interface GroupBuyInitiationData {
  eventId: string;
  initiatorId: string;
  totalParticipants: number;
  tierId: string;
}

export interface GroupBuyParticipant {
  userId: string;
  paymentStatus: 'pending' | 'paid';
  paymentLink: string;
}

export interface InitiatedGroupBuy {
  id: string;
  eventId: string;
  totalParticipants: number;
  pricePerPerson: number;
  expiresAt: Date;
  participants: GroupBuyParticipant[];
  shareableLinks: string[];
}

export class GroupBuyService {
  /**
   * Generate a unique payment link for a participant
   */
  private generatePaymentLink(groupBuyId: string): string {
    const token = crypto.randomBytes(16).toString('hex');
    return `${process.env.FRONTEND_URL || 'http://localhost:5173'}/group-buy/${groupBuyId}/pay/${token}`;
  }

  /**
   * Initiate a group buy
   */
  async initiateGroupBuy(data: GroupBuyInitiationData): Promise<InitiatedGroupBuy> {
    // Validate participant count
    if (data.totalParticipants < 2 || data.totalParticipants > 5000) {
      throw new Error('Total participants must be between 2 and 5000');
    }

    // Get event and tier information
    const event = await prisma.event.findUnique({
      where: { id: data.eventId },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    if (event.status !== 'published') {
      throw new Error('Event is not available for purchase');
    }

    // Find the tier
    const tiers = event.tiers as any[];
    const tier = tiers.find((t: any) => t.id === data.tierId);

    if (!tier) {
      throw new Error('Ticket tier not found');
    }

    // Check if enough tickets are available
    if (tier.quantity - tier.sold < data.totalParticipants) {
      throw new Error('Not enough tickets available for this group buy');
    }

    // Calculate price per person
    const pricePerPerson = tier.price;

    // Set expiration (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Create group buy
    const groupBuy = await prisma.groupBuy.create({
      data: {
        eventId: data.eventId,
        initiatorId: data.initiatorId,
        totalParticipants: data.totalParticipants,
        currentParticipants: 0,
        pricePerPerson,
        expiresAt,
        status: 'active',
        participants: [],
      },
    });

    // Generate unique payment links for each participant
    const participants: GroupBuyParticipant[] = [];
    const shareableLinks: string[] = [];

    for (let i = 0; i < data.totalParticipants; i++) {
      const paymentLink = this.generatePaymentLink(groupBuy.id);
      participants.push({
        userId: '', // Will be filled when participant joins
        paymentStatus: 'pending',
        paymentLink,
      });
      shareableLinks.push(paymentLink);
    }

    // Update group buy with participants
    await prisma.groupBuy.update({
      where: { id: groupBuy.id },
      data: {
        participants: participants as any,
      },
    });

    return {
      id: groupBuy.id,
      eventId: data.eventId,
      totalParticipants: data.totalParticipants,
      pricePerPerson,
      expiresAt,
      participants,
      shareableLinks,
    };
  }

  /**
   * Get group buy by ID
   */
  async getGroupBuyById(groupBuyId: string) {
    return await prisma.groupBuy.findUnique({
      where: { id: groupBuyId },
      include: {
        event: true,
        initiator: {
          select: {
            id: true,
            phoneNumber: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  /**
   * Get group buy status
   */
  async getGroupBuyStatus(groupBuyId: string) {
    const groupBuy = await this.getGroupBuyById(groupBuyId);

    if (!groupBuy) {
      throw new Error('Group buy not found');
    }

    const participants = groupBuy.participants as unknown as GroupBuyParticipant[];
    const paidCount = participants.filter(p => p.paymentStatus === 'paid').length;

    return {
      id: groupBuy.id,
      status: groupBuy.status,
      totalParticipants: groupBuy.totalParticipants,
      currentParticipants: groupBuy.currentParticipants,
      paidCount,
      pricePerPerson: groupBuy.pricePerPerson,
      expiresAt: groupBuy.expiresAt,
      isExpired: new Date() > groupBuy.expiresAt,
      isComplete: paidCount === groupBuy.totalParticipants,
    };
  }

  /**
   * Join a group buy
   */
  async joinGroupBuy(groupBuyId: string, userId: string, paymentLink: string) {
    const groupBuy = await this.getGroupBuyById(groupBuyId);

    if (!groupBuy) {
      throw new Error('Group buy not found');
    }

    if (groupBuy.status !== 'active') {
      throw new Error('Group buy is not active');
    }

    if (new Date() > groupBuy.expiresAt) {
      throw new Error('Group buy has expired');
    }

    const participants = groupBuy.participants as unknown as GroupBuyParticipant[];
    const participantIndex = participants.findIndex(p => p.paymentLink === paymentLink);

    if (participantIndex === -1) {
      throw new Error('Invalid payment link');
    }

    if (participants[participantIndex].userId && participants[participantIndex].userId !== userId) {
      throw new Error('This payment link has already been claimed');
    }

    // Update participant with user ID
    participants[participantIndex].userId = userId;

    await prisma.groupBuy.update({
      where: { id: groupBuyId },
      data: {
        participants: participants as any,
        currentParticipants: participants.filter(p => p.userId).length,
      },
    });

    return {
      groupBuyId,
      pricePerPerson: groupBuy.pricePerPerson,
      eventId: groupBuy.eventId,
    };
  }

  /**
   * Update participant payment status
   */
  async updateParticipantPaymentStatus(
    groupBuyId: string,
    userId: string,
    paymentStatus: 'pending' | 'paid'
  ) {
    const groupBuy = await this.getGroupBuyById(groupBuyId);

    if (!groupBuy) {
      throw new Error('Group buy not found');
    }

    const participants = groupBuy.participants as unknown as GroupBuyParticipant[];
    const participantIndex = participants.findIndex(p => p.userId === userId);

    if (participantIndex === -1) {
      throw new Error('Participant not found in group buy');
    }

    // Update payment status
    participants[participantIndex].paymentStatus = paymentStatus;

    const paidCount = participants.filter(p => p.paymentStatus === 'paid').length;

    // Update group buy
    await prisma.groupBuy.update({
      where: { id: groupBuyId },
      data: {
        participants: participants as any,
        currentParticipants: paidCount,
      },
    });

    // Update real-time status
    await this.updateRealtimeStatus(groupBuyId, participants, paidCount, groupBuy.totalParticipants);

    // Check if all participants have paid
    const isComplete = paidCount === groupBuy.totalParticipants;
    if (isComplete && paymentStatus === 'paid') {
      // Trigger completion asynchronously
      this.completeGroupBuy(groupBuyId).catch(error => {
        console.error('Failed to complete group buy:', error);
      });
    }

    return {
      groupBuyId,
      paidCount,
      totalParticipants: groupBuy.totalParticipants,
      isComplete,
    };
  }

  /**
   * Update real-time status in Supabase
   */
  private async updateRealtimeStatus(
    groupBuyId: string,
    participants: GroupBuyParticipant[],
    currentParticipants: number,
    totalParticipants: number
  ) {
    try {
      // Import dynamically to avoid circular dependencies
      const { updateGroupBuyStatus } = await import('./realtime.service.js');
      
      await updateGroupBuyStatus(
        groupBuyId,
        currentParticipants,
        totalParticipants,
        participants.map(p => ({
          userId: p.userId,
          paymentStatus: p.paymentStatus,
        }))
      );
    } catch (error) {
      console.error('Failed to update real-time status:', error);
      // Don't throw - real-time updates are not critical
    }
  }

  /**
   * Get payment tracking info for a participant
   */
  async getParticipantPaymentInfo(groupBuyId: string, userId: string) {
    const groupBuy = await this.getGroupBuyById(groupBuyId);

    if (!groupBuy) {
      throw new Error('Group buy not found');
    }

    const participants = groupBuy.participants as unknown as GroupBuyParticipant[];
    const participant = participants.find(p => p.userId === userId);

    if (!participant) {
      throw new Error('Participant not found in group buy');
    }

    const paidCount = participants.filter(p => p.paymentStatus === 'paid').length;

    return {
      groupBuyId,
      eventId: groupBuy.eventId,
      pricePerPerson: groupBuy.pricePerPerson,
      paymentStatus: participant.paymentStatus,
      paymentLink: participant.paymentLink,
      currentParticipants: paidCount,
      totalParticipants: groupBuy.totalParticipants,
      expiresAt: groupBuy.expiresAt,
      isExpired: new Date() > groupBuy.expiresAt,
      isComplete: paidCount === groupBuy.totalParticipants,
    };
  }

  /**
   * Complete group buy and issue tickets to all participants
   */
  async completeGroupBuy(groupBuyId: string) {
    const groupBuy = await this.getGroupBuyById(groupBuyId);

    if (!groupBuy) {
      throw new Error('Group buy not found');
    }

    if (groupBuy.status !== 'active') {
      throw new Error('Group buy is not active');
    }

    const participants = groupBuy.participants as unknown as GroupBuyParticipant[];
    const paidCount = participants.filter(p => p.paymentStatus === 'paid').length;

    if (paidCount !== groupBuy.totalParticipants) {
      throw new Error('Not all participants have paid');
    }

    // Get event and tier information
    const event = await prisma.event.findUnique({
      where: { id: groupBuy.eventId },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    const tiers = event.tiers as any[];
    const tier = tiers.find((t: any) => t.price === groupBuy.pricePerPerson);

    if (!tier) {
      throw new Error('Ticket tier not found');
    }

    // Import ticket service dynamically to avoid circular dependencies
    const { ticketService } = await import('./ticket.service.js');

    // Issue tickets to all participants
    const issuedTickets = [];
    for (const participant of participants) {
      if (!participant.userId) {
        continue;
      }

      // Create a payment record for the participant
      const payment = await prisma.payment.create({
        data: {
          userId: participant.userId,
          amount: groupBuy.pricePerPerson,
          currency: 'NGN',
          method: 'group_buy',
          status: 'successful',
          provider: 'group_buy',
          reference: `GB-${groupBuyId}-${participant.userId}`,
          metadata: {
            groupBuyId,
            participantUserId: participant.userId,
          },
        },
      });

      // Issue ticket
      try {
        const ticket = await ticketService.issueTicket({
          userId: participant.userId,
          eventId: groupBuy.eventId,
          tierId: tier.id,
          paymentId: payment.id,
        });

        // Link ticket to group buy
        await prisma.ticket.update({
          where: { id: ticket.id },
          data: { groupBuyId },
        });

        issuedTickets.push(ticket);
      } catch (error) {
        console.error(`Failed to issue ticket for participant ${participant.userId}:`, error);
        // Continue with other participants
      }
    }

    // Update group buy status to completed
    await prisma.groupBuy.update({
      where: { id: groupBuyId },
      data: { status: 'completed' },
    });

    // Update event tickets sold
    await prisma.event.update({
      where: { id: groupBuy.eventId },
      data: {
        ticketsSold: {
          increment: issuedTickets.length,
        },
      },
    });

    // Send notifications to all participants
    await this.sendCompletionNotifications(groupBuyId, participants);

    return {
      groupBuyId,
      status: 'completed',
      ticketsIssued: issuedTickets.length,
      totalParticipants: groupBuy.totalParticipants,
    };
  }

  /**
   * Send completion notifications to all participants
   */
  private async sendCompletionNotifications(
    groupBuyId: string,
    participants: GroupBuyParticipant[]
  ) {
    for (const participant of participants) {
      if (!participant.userId) {
        continue;
      }

      try {
        // Get user details
        const user = await prisma.user.findUnique({
          where: { id: participant.userId },
        });

        if (!user) {
          continue;
        }

        // In production, send SMS and email notifications
        console.log(`Notification sent to ${user.phoneNumber}:`);
        console.log(`Your group buy is complete! Your ticket has been issued.`);
        console.log(`Group Buy ID: ${groupBuyId}`);

        // TODO: Integrate with Africa's Talking SMS
        // TODO: Send email if user has email
      } catch (error) {
        console.error(`Failed to send notification to participant ${participant.userId}:`, error);
        // Continue with other participants
      }
    }
  }

  /**
   * Check and process expired group buys
   */
  async processExpiredGroupBuys() {
    // Find all active group buys that have expired
    const expiredGroupBuys = await prisma.groupBuy.findMany({
      where: {
        status: 'active',
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    const results = [];
    for (const groupBuy of expiredGroupBuys) {
      try {
        const result = await this.expireGroupBuy(groupBuy.id);
        results.push(result);
      } catch (error) {
        console.error(`Failed to expire group buy ${groupBuy.id}:`, error);
      }
    }

    return results;
  }

  /**
   * Expire a group buy and refund partial payments
   */
  async expireGroupBuy(groupBuyId: string) {
    const groupBuy = await this.getGroupBuyById(groupBuyId);

    if (!groupBuy) {
      throw new Error('Group buy not found');
    }

    if (groupBuy.status !== 'active') {
      throw new Error('Group buy is not active');
    }

    const participants = groupBuy.participants as unknown as GroupBuyParticipant[];
    const paidParticipants = participants.filter(p => p.paymentStatus === 'paid');

    // Update group buy status to expired
    await prisma.groupBuy.update({
      where: { id: groupBuyId },
      data: { status: 'expired' },
    });

    // Refund all participants who paid
    const refundResults = [];
    for (const participant of paidParticipants) {
      if (!participant.userId) {
        continue;
      }

      try {
        // Find the payment record
        const payment = await prisma.payment.findFirst({
          where: {
            userId: participant.userId,
            reference: `GB-${groupBuyId}-${participant.userId}`,
          },
        });

        if (payment && payment.status === 'successful') {
          // Update payment status to refunded
          await prisma.payment.update({
            where: { id: payment.id },
            data: { status: 'refunded' },
          });

          // In production, initiate actual refund via payment gateway
          console.log(`Refund initiated for user ${participant.userId}: ₦${groupBuy.pricePerPerson}`);

          refundResults.push({
            userId: participant.userId,
            amount: groupBuy.pricePerPerson,
            status: 'refunded',
          });
        }
      } catch (error) {
        console.error(`Failed to refund participant ${participant.userId}:`, error);
        refundResults.push({
          userId: participant.userId,
          amount: groupBuy.pricePerPerson,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Send expiration notifications
    await this.sendExpirationNotifications(groupBuyId, participants);

    return {
      groupBuyId,
      status: 'expired',
      refundsProcessed: refundResults.length,
      refundResults,
    };
  }

  /**
   * Send expiration notifications to all participants
   */
  private async sendExpirationNotifications(
    groupBuyId: string,
    participants: GroupBuyParticipant[]
  ) {
    for (const participant of participants) {
      if (!participant.userId) {
        continue;
      }

      try {
        // Get user details
        const user = await prisma.user.findUnique({
          where: { id: participant.userId },
        });

        if (!user) {
          continue;
        }

        // In production, send SMS and email notifications
        console.log(`Notification sent to ${user.phoneNumber}:`);
        console.log(`Your group buy has expired. Refunds will be processed within 24 hours.`);
        console.log(`Group Buy ID: ${groupBuyId}`);

        // TODO: Integrate with Africa's Talking SMS
        // TODO: Send email if user has email
      } catch (error) {
        console.error(`Failed to send notification to participant ${participant.userId}:`, error);
        // Continue with other participants
      }
    }
  }
}

export const groupBuyService = new GroupBuyService();
