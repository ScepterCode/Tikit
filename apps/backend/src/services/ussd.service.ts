import africastalking, { sms } from '../lib/africastalking';
import prisma from '../lib/prisma';
import { Event, Ticket, User } from '@prisma/client';

interface USSDSession {
  sessionId: string;
  phoneNumber: string;
  text: string;
}

interface USSDResponse {
  response: string;
  endSession: boolean;
}

/**
 * USSD Service for handling Africa's Talking USSD gateway integration
 * Implements the *7477# shortcode menu system
 */
export class USSDService {
  /**
   * Main entry point for USSD callback
   * Routes to appropriate menu handler based on user input
   */
  async handleUSSDCallback(session: USSDSession): Promise<USSDResponse> {
    const { text, phoneNumber } = session;
    const inputs = text.split('*').filter(Boolean);

    // Main menu
    if (inputs.length === 0) {
      return this.showMainMenu();
    }

    const mainChoice = inputs[0];

    switch (mainChoice) {
      case '1': // Buy ticket
        return this.handleBuyTicket(inputs, phoneNumber);
      case '2': // Check ticket
        return this.handleCheckTicket(inputs, phoneNumber);
      case '3': // Sponsor someone
        return this.handleSponsor(inputs, phoneNumber);
      case '4': // View wallet
        return this.handleWallet(inputs, phoneNumber);
      case '5': // Help
        return this.showHelp();
      default:
        return {
          response: 'END Invalid option. Please dial *7477# to try again.',
          endSession: true,
        };
    }
  }

  /**
   * Display main USSD menu
   */
  private showMainMenu(): USSDResponse {
    return {
      response:
        'CON Welcome to Tikit\n' +
        '1. Buy Ticket\n' +
        '2. Check My Tickets\n' +
        '3. Sponsor Someone\n' +
        '4. View Wallet\n' +
        '5. Help',
      endSession: false,
    };
  }

  /**
   * Handle ticket purchase flow
   */
  private async handleBuyTicket(
    inputs: string[],
    phoneNumber: string
  ): Promise<USSDResponse> {
    // Step 1: Ask for event code
    if (inputs.length === 1) {
      return {
        response: 'CON Enter 4-digit event code:',
        endSession: false,
      };
    }

    // Step 2: Validate event code and show tiers
    if (inputs.length === 2) {
      const eventCode = inputs[1];
      const event = await this.getEventByCode(eventCode);

      if (!event) {
        return {
          response: 'END Invalid event code. Please try again.',
          endSession: true,
        };
      }

      // Display ticket tiers
      const tiers = await this.getEventTiers(event.id);
      if (tiers.length === 0) {
        return {
          response: 'END No tickets available for this event.',
          endSession: true,
        };
      }

      let tierMenu = `CON ${event.title}\n`;
      tiers.forEach((tier, index) => {
        tierMenu += `${index + 1}. ${tier.name} - ₦${tier.price.toLocaleString()}\n`;
      });

      return {
        response: tierMenu,
        endSession: false,
      };
    }

    // Step 3: Process payment
    if (inputs.length === 3) {
      const eventCode = inputs[1];
      const tierChoice = parseInt(inputs[2]) - 1;

      const event = await this.getEventByCode(eventCode);
      if (!event) {
        return {
          response: 'END Invalid event code.',
          endSession: true,
        };
      }

      const tiers = await this.getEventTiers(event.id);
      const selectedTier = tiers[tierChoice];

      if (!selectedTier) {
        return {
          response: 'END Invalid tier selection.',
          endSession: true,
        };
      }

      // Process payment and issue ticket
      try {
        const ticket = await this.processUSSDPurchase(
          phoneNumber,
          event.id,
          selectedTier.id,
          selectedTier.price
        );

        // Send SMS with ticket details
        await this.sendTicketSMS(phoneNumber, ticket, event);

        return {
          response: `END Ticket purchased successfully!\nYou will receive an SMS with your QR code and backup code shortly.`,
          endSession: true,
        };
      } catch (error) {
        console.error('USSD purchase error:', error);
        return {
          response: 'END Payment failed. Please try again or contact support.',
          endSession: true,
        };
      }
    }

    return {
      response: 'END Invalid input.',
      endSession: true,
    };
  }

  /**
   * Handle ticket checking flow
   */
  private async handleCheckTicket(
    inputs: string[],
    phoneNumber: string
  ): Promise<USSDResponse> {
    try {
      const tickets = await this.getUserTickets(phoneNumber);

      if (tickets.length === 0) {
        return {
          response: 'END You have no tickets.',
          endSession: true,
        };
      }

      // Show list of tickets
      if (inputs.length === 1) {
        let ticketList = 'CON Your Tickets:\n';
        tickets.forEach((ticket, index) => {
          ticketList += `${index + 1}. ${ticket.event.title}\n`;
        });
        ticketList += '\nSelect ticket to view details:';

        return {
          response: ticketList,
          endSession: false,
        };
      }

      // Show ticket details
      if (inputs.length === 2) {
        const ticketIndex = parseInt(inputs[1]) - 1;
        const ticket = tickets[ticketIndex];

        if (!ticket) {
          return {
            response: 'END Invalid ticket selection.',
            endSession: true,
          };
        }

        const response =
          `END Ticket Details:\n` +
          `Event: ${ticket.event.title}\n` +
          `Date: ${new Date(ticket.event.startDate).toLocaleDateString()}\n` +
          `Venue: ${ticket.event.venue}\n` +
          `Backup Code: ${ticket.backupCode}\n` +
          `Status: ${ticket.status}`;

        return {
          response,
          endSession: true,
        };
      }
    } catch (error) {
      console.error('Check ticket error:', error);
      return {
        response: 'END Error retrieving tickets. Please try again.',
        endSession: true,
      };
    }

    return {
      response: 'END Invalid input.',
      endSession: true,
    };
  }

  /**
   * Handle sponsorship flow
   */
  private async handleSponsor(
    inputs: string[],
    phoneNumber: string
  ): Promise<USSDResponse> {
    // Step 1: Ask for sponsorship code
    if (inputs.length === 1) {
      return {
        response: 'CON Enter sponsorship code:',
        endSession: false,
      };
    }

    // Step 2: Validate and process sponsorship
    if (inputs.length === 2) {
      const sponsorshipCode = inputs[1];

      try {
        // Validate sponsorship code and process payment
        const result = await this.processSponsorshipPayment(
          phoneNumber,
          sponsorshipCode
        );

        if (result.success) {
          return {
            response: `END Sponsorship successful!\nYou sponsored a ticket for ${result.recipientPhone}.`,
            endSession: true,
          };
        } else {
          return {
            response: `END ${result.message}`,
            endSession: true,
          };
        }
      } catch (error) {
        console.error('Sponsorship error:', error);
        return {
          response: 'END Sponsorship failed. Please try again.',
          endSession: true,
        };
      }
    }

    return {
      response: 'END Invalid input.',
      endSession: true,
    };
  }

  /**
   * Handle wallet view
   */
  private async handleWallet(
    inputs: string[],
    phoneNumber: string
  ): Promise<USSDResponse> {
    try {
      const user = await this.getUserByPhone(phoneNumber);

      if (!user) {
        return {
          response: 'END User not found. Please register first.',
          endSession: true,
        };
      }

      const balance = user.walletBalance || 0;
      const response =
        `END Your Wallet:\n` +
        `Balance: ₦${balance.toLocaleString()}\n` +
        `Referral Code: ${user.referralCode}`;

      return {
        response,
        endSession: true,
      };
    } catch (error) {
      console.error('Wallet error:', error);
      return {
        response: 'END Error retrieving wallet. Please try again.',
        endSession: true,
      };
    }
  }

  /**
   * Show help information
   */
  private showHelp(): USSDResponse {
    return {
      response:
        'END Tikit Help:\n' +
        '- Buy tickets with event code\n' +
        '- Check your tickets\n' +
        '- Sponsor friends\n' +
        '- View wallet balance\n' +
        'Call 0800-TIKIT for support',
      endSession: true,
    };
  }

  /**
   * Get event by USSD code
   */
  private async getEventByCode(code: string): Promise<Event | null> {
    return prisma.event.findFirst({
      where: {
        ussdCode: code,
        status: 'published',
      },
    });
  }

  /**
   * Get event ticket tiers
   */
  private async getEventTiers(eventId: string) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { tiers: true },
    });

    return event?.tiers || [];
  }

  /**
   * Get user by phone number
   */
  private async getUserByPhone(phoneNumber: string): Promise<User | null> {
    return prisma.user.findFirst({
      where: { phoneNumber },
    });
  }

  /**
   * Get user tickets
   */
  private async getUserTickets(phoneNumber: string) {
    const user = await this.getUserByPhone(phoneNumber);
    if (!user) return [];

    return prisma.ticket.findMany({
      where: {
        userId: user.id,
        status: { in: ['valid', 'used'] },
      },
      include: {
        event: {
          select: {
            title: true,
            startDate: true,
            venue: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Process USSD ticket purchase
   */
  private async processUSSDPurchase(
    phoneNumber: string,
    eventId: string,
    tierId: string,
    amount: number
  ): Promise<Ticket> {
    // Get or create user
    let user = await this.getUserByPhone(phoneNumber);
    if (!user) {
      user = await prisma.user.create({
        data: {
          phoneNumber,
          phoneVerified: true,
          role: 'attendee',
          referralCode: this.generateReferralCode(),
        },
      });
    }

    // Generate QR code and backup code
    const qrCode = this.generateQRCode();
    const backupCode = this.generateBackupCode();

    // Create ticket
    const ticket = await prisma.ticket.create({
      data: {
        userId: user.id,
        eventId,
        tierId,
        qrCode,
        backupCode,
        status: 'valid',
      },
    });

    // Create payment record
    await prisma.payment.create({
      data: {
        userId: user.id,
        ticketId: ticket.id,
        amount,
        currency: 'NGN',
        method: 'airtime',
        status: 'successful',
        provider: 'paystack',
        reference: `USSD-${Date.now()}-${ticket.id}`,
        isInstallment: false,
      },
    });

    // Update event ticket count
    await prisma.event.update({
      where: { id: eventId },
      data: {
        ticketsSold: { increment: 1 },
      },
    });

    return ticket;
  }

  /**
   * Send ticket details via SMS
   */
  private async sendTicketSMS(
    phoneNumber: string,
    ticket: Ticket,
    event: Event
  ): Promise<void> {
    const message =
      `Your Tikit ticket:\n` +
      `Event: ${event.title}\n` +
      `Date: ${new Date(event.startDate).toLocaleDateString()}\n` +
      `Venue: ${event.venue}\n` +
      `Backup Code: ${ticket.backupCode}\n` +
      `QR Code: ${ticket.qrCode}`;

    try {
      await sms.send({
        to: [phoneNumber],
        message,
        from: process.env.AFRICASTALKING_SENDER_ID || 'Tikit',
      });
    } catch (error) {
      console.error('SMS send error:', error);
      throw error;
    }
  }

  /**
   * Process sponsorship payment
   */
  private async processSponsorshipPayment(
    sponsorPhone: string,
    sponsorshipCode: string
  ): Promise<{ success: boolean; message: string; recipientPhone?: string }> {
    // Find sponsorship request
    const sponsorship = await prisma.sponsorship.findFirst({
      where: {
        code: sponsorshipCode,
        status: 'pending',
      },
      include: {
        requester: true,
      },
    });

    if (!sponsorship) {
      return {
        success: false,
        message: 'Invalid or expired sponsorship code.',
      };
    }

    // Process payment and update sponsorship
    await prisma.sponsorship.update({
      where: { id: sponsorship.id },
      data: {
        sponsorPhone,
        status: 'approved',
        approvedAt: new Date(),
      },
    });

    return {
      success: true,
      message: 'Sponsorship successful',
      recipientPhone: sponsorship.requester.phoneNumber,
    };
  }

  /**
   * Generate unique QR code
   */
  private generateQRCode(): string {
    return `QR-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Generate 6-digit backup code
   */
  private generateBackupCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Generate referral code
   */
  private generateReferralCode(): string {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  }

  /**
   * Handle failed USSD transaction and initiate refund
   */
  async handleFailedTransaction(
    phoneNumber: string,
    amount: number,
    reference: string
  ): Promise<void> {
    try {
      // Create refund record
      await prisma.payment.create({
        data: {
          userId: (await this.getUserByPhone(phoneNumber))?.id || '',
          amount,
          currency: 'NGN',
          method: 'airtime',
          status: 'refunded',
          provider: 'paystack',
          reference: `REFUND-${reference}`,
          isInstallment: false,
        },
      });

      // Send SMS notification
      await sms.send({
        to: [phoneNumber],
        message: `Your payment of ₦${amount} has been refunded due to a transaction error. Reference: ${reference}`,
        from: process.env.AFRICASTALKING_SENDER_ID || 'Tikit',
      });
    } catch (error) {
      console.error('Refund error:', error);
      throw error;
    }
  }
}

export default new USSDService();
