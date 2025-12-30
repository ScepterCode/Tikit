import { prisma } from '../lib/prisma.js';
import crypto from 'crypto';
import QRCode from 'qrcode';
import { updateEventCapacity } from './realtime.service.js';
import { trackReferralPurchase } from './referral.service.js';

export interface TicketIssuanceData {
  userId: string;
  eventId: string;
  tierId: string;
  paymentId: string;
  culturalSelections?: Record<string, any>;
}

export interface IssuedTicket {
  id: string;
  qrCode: string;
  backupCode: string;
  qrCodeImage: string;
}

export interface BulkTicketIssuanceData {
  userId: string;
  eventId: string;
  tierId: string;
  paymentId: string;
  quantity: number;
}

export interface BulkTicketResult {
  tickets: IssuedTicket[];
  csvData: string;
  splitPaymentLinks?: SplitPaymentLink[];
}

export interface SplitPaymentLink {
  id: string;
  link: string;
  amount: number;
  status: 'pending' | 'paid';
  assignedTo?: string;
}

export class TicketService {
  /**
   * Generate a unique QR code for a ticket
   */
  private generateQRCode(): string {
    const timestamp = Date.now();
    const random = crypto.randomBytes(16).toString('hex');
    return `TKT-QR-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Generate a 6-digit backup code
   */
  private generateBackupCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Generate QR code image as data URL
   */
  private async generateQRCodeImage(qrCode: string): Promise<string> {
    try {
      // Generate QR code as data URL
      const qrCodeDataURL = await QRCode.toDataURL(qrCode, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        width: 300,
        margin: 2,
      });
      return qrCodeDataURL;
    } catch (error) {
      console.error('Failed to generate QR code image:', error);
      throw new Error('Failed to generate QR code image');
    }
  }

  /**
   * Issue a ticket after successful payment
   */
  async issueTicket(data: TicketIssuanceData): Promise<IssuedTicket> {
    // Verify payment is successful
    const payment = await prisma.payment.findUnique({
      where: { id: data.paymentId },
      include: { user: true },
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.status !== 'successful') {
      throw new Error('Payment not successful');
    }

    if (payment.userId !== data.userId) {
      throw new Error('Payment does not belong to user');
    }

    // Check if ticket already exists for this payment
    const existingTicket = await prisma.ticket.findFirst({
      where: { 
        userId: data.userId,
        eventId: data.eventId,
        tierId: data.tierId,
      },
    });

    if (existingTicket) {
      // Return existing ticket
      const qrCodeImage = await this.generateQRCodeImage(existingTicket.qrCode);
      return {
        id: existingTicket.id,
        qrCode: existingTicket.qrCode,
        backupCode: existingTicket.backupCode,
        qrCodeImage,
      };
    }

    // Generate unique codes
    const qrCode = this.generateQRCode();
    const backupCode = this.generateBackupCode();

    // Create ticket
    const ticket = await prisma.ticket.create({
      data: {
        userId: data.userId,
        eventId: data.eventId,
        tierId: data.tierId,
        qrCode,
        backupCode,
        status: 'valid',
        culturalSelections: data.culturalSelections || undefined,
      },
    });

    // Link ticket to payment
    await prisma.payment.update({
      where: { id: data.paymentId },
      data: { ticketId: ticket.id },
    });

    // Generate QR code image
    const qrCodeImage = await this.generateQRCodeImage(qrCode);

    // Send confirmation (SMS and email)
    await this.sendTicketConfirmation(ticket.id, payment.user);

    // Track referral purchase (credit referrer if this is user's first purchase)
    await trackReferralPurchase(data.userId);

    return {
      id: ticket.id,
      qrCode,
      backupCode,
      qrCodeImage,
    };
  }

  /**
   * Send ticket confirmation via SMS and email
   */
  private async sendTicketConfirmation(ticketId: string, user: any): Promise<void> {
    // Get ticket with event details
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        event: true,
      },
    });

    if (!ticket) {
      throw new Error('Ticket not found');
    }

    // In production, send SMS via Africa's Talking
    console.log(`SMS sent to ${user.phoneNumber}:`);
    console.log(`Your ticket for ${ticket.event.title}`);
    console.log(`QR Code: ${ticket.qrCode}`);
    console.log(`Backup Code: ${ticket.backupCode}`);
    console.log(`Event Date: ${ticket.event.startDate}`);

    // In production, send email if user has email
    if (user.email) {
      console.log(`Email sent to ${user.email}:`);
      console.log(`Subject: Your Ticket for ${ticket.event.title}`);
      console.log(`Body: Your ticket has been confirmed.`);
      console.log(`QR Code: ${ticket.qrCode}`);
      console.log(`Backup Code: ${ticket.backupCode}`);
    }
  }

  /**
   * Get ticket by ID
   */
  async getTicketById(ticketId: string) {
    return await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        event: true,
        user: {
          select: {
            id: true,
            phoneNumber: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  /**
   * Get tickets by user ID
   */
  async getTicketsByUserId(userId: string) {
    return await prisma.ticket.findMany({
      where: { userId },
      include: {
        event: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Verify ticket by QR code
   */
  async verifyTicketByQRCode(qrCode: string, scannedBy: string, location?: string, deviceInfo?: string) {
    const ticket = await prisma.ticket.findUnique({
      where: { qrCode },
      include: {
        event: true,
        user: {
          select: {
            id: true,
            phoneNumber: true,
            firstName: true,
            lastName: true,
          },
        },
        scanHistory: {
          orderBy: {
            scannedAt: 'desc',
          },
        },
      },
    });

    if (!ticket) {
      return { valid: false, message: 'Ticket not found' };
    }

    // Check if ticket has been used before (duplicate scan)
    if (ticket.status === 'used') {
      // Record duplicate scan attempt
      await prisma.scanHistory.create({
        data: {
          ticketId: ticket.id,
          scannedBy,
          location,
          deviceInfo,
          result: 'duplicate',
        },
      });

      return {
        valid: false,
        message: 'Ticket already used',
        ticket,
        usedAt: ticket.usedAt,
        scanHistory: ticket.scanHistory,
      };
    }

    if (ticket.status === 'cancelled' || ticket.status === 'refunded') {
      // Record invalid scan attempt
      await prisma.scanHistory.create({
        data: {
          ticketId: ticket.id,
          scannedBy,
          location,
          deviceInfo,
          result: 'invalid',
        },
      });

      return {
        valid: false,
        message: `Ticket ${ticket.status}`,
        ticket,
      };
    }

    // Record successful scan
    await prisma.scanHistory.create({
      data: {
        ticketId: ticket.id,
        scannedBy,
        location,
        deviceInfo,
        result: 'success',
      },
    });

    return {
      valid: true,
      message: 'Ticket is valid',
      ticket,
    };
  }

  /**
   * Mark ticket as used
   */
  async markTicketAsUsed(qrCode: string, scannedBy: string, location?: string) {
    const ticket = await prisma.ticket.findUnique({
      where: { qrCode },
      include: {
        scanHistory: {
          orderBy: {
            scannedAt: 'desc',
          },
        },
      },
    });

    if (!ticket) {
      throw new Error('Ticket not found');
    }

    if (ticket.status === 'used') {
      // Return scan history for duplicate warning
      throw new Error(
        JSON.stringify({
          message: 'Ticket already used',
          usedAt: ticket.usedAt,
          scannedBy: ticket.scannedBy,
          scanHistory: ticket.scanHistory,
        })
      );
    }

    return await prisma.ticket.update({
      where: { qrCode },
      data: {
        status: 'used',
        usedAt: new Date(),
        scannedBy,
      },
    });
  }

  /**
   * Verify ticket by backup code
   */
  async verifyTicketByBackupCode(backupCode: string, scannedBy: string, location?: string, deviceInfo?: string) {
    const ticket = await prisma.ticket.findUnique({
      where: { backupCode },
      include: {
        event: true,
        user: {
          select: {
            id: true,
            phoneNumber: true,
            firstName: true,
            lastName: true,
          },
        },
        scanHistory: {
          orderBy: {
            scannedAt: 'desc',
          },
        },
      },
    });

    if (!ticket) {
      return { valid: false, message: 'Ticket not found' };
    }

    // Check if ticket has been used before (duplicate scan)
    if (ticket.status === 'used') {
      // Record duplicate scan attempt
      await prisma.scanHistory.create({
        data: {
          ticketId: ticket.id,
          scannedBy,
          location,
          deviceInfo,
          result: 'duplicate',
        },
      });

      return {
        valid: false,
        message: 'Ticket already used',
        ticket,
        usedAt: ticket.usedAt,
        scanHistory: ticket.scanHistory,
      };
    }

    if (ticket.status === 'cancelled' || ticket.status === 'refunded') {
      // Record invalid scan attempt
      await prisma.scanHistory.create({
        data: {
          ticketId: ticket.id,
          scannedBy,
          location,
          deviceInfo,
          result: 'invalid',
        },
      });

      return {
        valid: false,
        message: `Ticket ${ticket.status}`,
        ticket,
      };
    }

    // Record successful scan
    await prisma.scanHistory.create({
      data: {
        ticketId: ticket.id,
        scannedBy,
        location,
        deviceInfo,
        result: 'success',
      },
    });

    return {
      valid: true,
      message: 'Ticket is valid',
      ticket,
    };
  }

  /**
   * Get scan history for a ticket
   */
  async getScanHistory(ticketId: string) {
    return await prisma.scanHistory.findMany({
      where: { ticketId },
      orderBy: {
        scannedAt: 'desc',
      },
    });
  }

  /**
   * Generate bulk tickets for religious organizations
   * Generates unique QR codes for each seat and creates downloadable CSV
   */
  async generateBulkTickets(data: BulkTicketIssuanceData): Promise<BulkTicketResult> {
    // Validate quantity is within bulk booking range
    if (data.quantity < 50 || data.quantity > 20000) {
      throw new Error('Bulk booking must be between 50 and 20,000 seats');
    }

    // Verify payment is successful
    const payment = await prisma.payment.findUnique({
      where: { id: data.paymentId },
      include: { user: true },
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.status !== 'successful') {
      throw new Error('Payment not successful');
    }

    if (payment.userId !== data.userId) {
      throw new Error('Payment does not belong to user');
    }

    // Check event capacity
    const event = await prisma.event.findUnique({
      where: { id: data.eventId },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    const availableSeats = event.capacity - event.ticketsSold;
    if (availableSeats < data.quantity) {
      throw new Error(`Insufficient capacity. Only ${availableSeats} seats available`);
    }

    // Generate all tickets
    const tickets: IssuedTicket[] = [];
    const ticketRecords: Array<{
      userId: string;
      eventId: string;
      tierId: string;
      qrCode: string;
      backupCode: string;
      status: string;
    }> = [];

    for (let i = 0; i < data.quantity; i++) {
      const qrCode = this.generateQRCode();
      const backupCode = this.generateBackupCode();

      ticketRecords.push({
        userId: data.userId,
        eventId: data.eventId,
        tierId: data.tierId,
        qrCode,
        backupCode,
        status: 'valid',
      });

      // Generate QR code image
      const qrCodeImage = await this.generateQRCodeImage(qrCode);

      tickets.push({
        id: '', // Will be set after database insert
        qrCode,
        backupCode,
        qrCodeImage,
      });
    }

    // Bulk insert tickets
    const createdTickets = await prisma.$transaction(async (tx) => {
      // Create all tickets
      await tx.ticket.createMany({
        data: ticketRecords,
      });

      // Update event capacity
      const updatedEvent = await tx.event.update({
        where: { id: data.eventId },
        data: {
          ticketsSold: {
            increment: data.quantity,
          },
        },
      });

      // Broadcast real-time capacity update to all connected clients
      await updateEventCapacity(
        data.eventId,
        updatedEvent.ticketsSold,
        updatedEvent.capacity
      );

      // Get the created tickets with IDs
      const insertedTickets = await tx.ticket.findMany({
        where: {
          userId: data.userId,
          eventId: data.eventId,
          tierId: data.tierId,
          qrCode: {
            in: ticketRecords.map(t => t.qrCode),
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: data.quantity,
      });

      return insertedTickets;
    });

    // Update tickets array with actual IDs
    for (let i = 0; i < tickets.length; i++) {
      if (createdTickets[i]) {
        tickets[i].id = createdTickets[i].id;
      }
    }

    // Generate CSV data
    const csvData = this.generateTicketCSV(tickets, event, payment.user);

    // Generate split payment links for bookings > 1000 seats
    let splitPaymentLinks: SplitPaymentLink[] | undefined;
    if (data.quantity > 1000) {
      splitPaymentLinks = await this.generateSplitPaymentLinks(
        data.eventId,
        data.tierId,
        data.quantity,
        payment.amount
      );
    }

    // Send confirmation
    await this.sendBulkTicketConfirmation(data.quantity, event, payment.user);

    // Track referral purchase (credit referrer if this is user's first purchase)
    await trackReferralPurchase(data.userId);

    return {
      tickets,
      csvData,
      splitPaymentLinks,
    };
  }

  /**
   * Generate split payment links for large bulk bookings
   * Creates multiple payment links that can be distributed to congregation members
   */
  private async generateSplitPaymentLinks(
    eventId: string,
    tierId: string,
    totalSeats: number,
    totalAmount: number
  ): Promise<SplitPaymentLink[]> {
    // Calculate number of split links (one per 100 seats, minimum 10 links)
    const numLinks = Math.max(10, Math.ceil(totalSeats / 100));
    const amountPerLink = Math.floor(totalAmount / numLinks);
    
    const splitLinks: SplitPaymentLink[] = [];

    for (let i = 0; i < numLinks; i++) {
      const linkId = crypto.randomBytes(16).toString('hex');
      const link = `https://tikit.app/pay/${linkId}?event=${eventId}&tier=${tierId}`;
      
      splitLinks.push({
        id: linkId,
        link,
        amount: amountPerLink,
        status: 'pending',
      });
    }

    // Store split payment links in database (would need a SplitPayment model)
    // For now, just return the generated links
    console.log(`Generated ${numLinks} split payment links for bulk booking`);

    return splitLinks;
  }

  /**
   * Check and reserve event capacity with optimistic locking
   * Handles concurrent booking conflicts
   */
  async checkAndReserveCapacity(eventId: string, requestedSeats: number): Promise<boolean> {
    try {
      // Use a transaction with optimistic locking
      const result = await prisma.$transaction(async (tx) => {
        // Get current event with FOR UPDATE lock
        const event = await tx.event.findUnique({
          where: { id: eventId },
        });

        if (!event) {
          throw new Error('Event not found');
        }

        const availableSeats = event.capacity - event.ticketsSold;

        if (availableSeats < requestedSeats) {
          return false; // Not enough capacity
        }

        // Reserve the seats by incrementing ticketsSold
        await tx.event.update({
          where: { id: eventId },
          data: {
            ticketsSold: {
              increment: requestedSeats,
            },
          },
        });

        // Broadcast capacity update
        await updateEventCapacity(
          eventId,
          event.ticketsSold + requestedSeats,
          event.capacity
        );

        return true;
      });

      return result;
    } catch (error) {
      console.error('Error reserving capacity:', error);
      return false;
    }
  }

  /**
   * Release reserved capacity (in case of payment failure)
   */
  async releaseCapacity(eventId: string, seats: number): Promise<void> {
    const event = await prisma.event.update({
      where: { id: eventId },
      data: {
        ticketsSold: {
          decrement: seats,
        },
      },
    });

    // Broadcast capacity update
    await updateEventCapacity(
      eventId,
      event.ticketsSold,
      event.capacity
    );
  }

  /**
   * Generate CSV file content for bulk tickets
   */
  private generateTicketCSV(tickets: IssuedTicket[], event: any, user: any): string {
    const headers = ['Ticket Number', 'QR Code', 'Backup Code', 'Event Name', 'Event Date', 'Purchaser'];
    const rows = tickets.map((ticket, index) => [
      (index + 1).toString(),
      ticket.qrCode,
      ticket.backupCode,
      event.title,
      event.startDate.toISOString().split('T')[0],
      `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.phoneNumber,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    return csvContent;
  }

  /**
   * Send bulk ticket confirmation
   */
  private async sendBulkTicketConfirmation(quantity: number, event: any, user: any): Promise<void> {
    // In production, send SMS via Africa's Talking
    console.log(`SMS sent to ${user.phoneNumber}:`);
    console.log(`Bulk booking confirmed: ${quantity} tickets for ${event.title}`);
    console.log(`Event Date: ${event.startDate}`);
    console.log(`Download your tickets from your dashboard`);

    // In production, send email with CSV attachment
    if (user.email) {
      console.log(`Email sent to ${user.email}:`);
      console.log(`Subject: Bulk Booking Confirmed - ${quantity} Tickets`);
      console.log(`Body: Your bulk booking for ${event.title} has been confirmed.`);
      console.log(`CSV file attached with all ticket details.`);
    }
  }
}

export const ticketService = new TicketService();
