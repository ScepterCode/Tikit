import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { TicketService } from './ticket.service.js';
import { prisma } from '../lib/prisma.js';

/**
 * Feature: tikit-webapp, Property 40: Successful payment ticket issuance
 * Validates: Requirements 11.5
 * 
 * For any successful payment, a ticket should be issued immediately and 
 * confirmation should be sent via SMS and email
 */

const ticketService = new TicketService();

describe('Property 40: Successful payment ticket issuance', () => {
  // Test data cleanup
  const testUserIds: string[] = [];
  const testEventIds: string[] = [];
  const testPaymentIds: string[] = [];

  beforeEach(async () => {
    // Mock console.log to suppress ticket confirmation logs during tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(async () => {
    // Clean up test data
    try {
      await prisma.ticket.deleteMany({
        where: {
          userId: { in: testUserIds },
        },
      });
      await prisma.payment.deleteMany({
        where: {
          id: { in: testPaymentIds },
        },
      });
      await prisma.event.deleteMany({
        where: {
          id: { in: testEventIds },
        },
      });
      await prisma.user.deleteMany({
        where: {
          id: { in: testUserIds },
        },
      });
    } catch (error) {
      console.error('Cleanup error:', error);
    }

    testUserIds.length = 0;
    testEventIds.length = 0;
    testPaymentIds.length = 0;

    vi.restoreAllMocks();
  });

  it('should issue a ticket immediately for any successful payment', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 10000, max: 1000000 }), // Amount
        fc.emailAddress(),
        async (amount, email) => {
          // Create test user
          const user = await prisma.user.create({
            data: {
              phoneNumber: `+234${Math.floor(Math.random() * 10000000000)}`,
              phoneVerified: true,
              email,
              preferredLanguage: 'en',
              state: 'Lagos',
              role: 'attendee',
              walletBalance: 0,
              referralCode: `REF${Date.now()}-${Math.random()}`,
            },
          });
          testUserIds.push(user.id);

          // Create ticket tier data
          const tierId = `tier-${Date.now()}-${Math.random()}`;
          const tiers = [
            {
              id: tierId,
              name: 'General',
              price: amount,
              quantity: 100,
              sold: 0,
            },
          ];

          // Create test event
          const event = await prisma.event.create({
            data: {
              organizerId: user.id,
              title: 'Test Event',
              description: 'Test Description',
              eventType: 'general',
              startDate: new Date(Date.now() + 86400000),
              endDate: new Date(Date.now() + 172800000),
              venue: 'Test Venue',
              state: 'Lagos',
              lga: 'Ikeja',
              latitude: 6.5244,
              longitude: 3.3792,
              isHidden: false,
              capacity: 1000,
              ticketsSold: 0,
              tiers: tiers,
              ussdCode: `${Math.floor(1000 + Math.random() * 9000)}`,
              status: 'published',
            },
          });
          testEventIds.push(event.id);

          // Create successful payment
          const payment = await prisma.payment.create({
            data: {
              userId: user.id,
              amount,
              currency: 'NGN',
              method: 'card',
              status: 'successful',
              provider: 'paystack',
              reference: `REF-${Date.now()}-${Math.random()}`,
              isInstallment: false,
            },
          });
          testPaymentIds.push(payment.id);

          // Issue ticket
          const ticket = await ticketService.issueTicket({
            userId: user.id,
            eventId: event.id,
            tierId: tierId,
            paymentId: payment.id,
          });

          // Property: Ticket should be issued
          expect(ticket).toBeDefined();
          expect(ticket.id).toBeTruthy();
          expect(ticket.qrCode).toBeTruthy();
          expect(ticket.backupCode).toBeTruthy();
          expect(ticket.qrCodeImage).toBeTruthy();

          // Property: Backup code should be 6 digits
          expect(ticket.backupCode).toMatch(/^\d{6}$/);

          // Property: QR code should follow format
          expect(ticket.qrCode).toMatch(/^TKT-QR-/);

          // Property: QR code image should be a data URL
          expect(ticket.qrCodeImage).toMatch(/^data:image\/png;base64,/);
        }
      ),
      { numRuns: 10 } // Reduced runs for database operations
    );
  });

  it('should not issue ticket for non-successful payments', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 10000, max: 1000000 }),
        fc.constantFrom('pending', 'failed'),
        async (amount, status) => {
          // Create test user
          const user = await prisma.user.create({
            data: {
              phoneNumber: `+234${Math.floor(Math.random() * 10000000000)}`,
              phoneVerified: true,
              preferredLanguage: 'en',
              state: 'Lagos',
              role: 'attendee',
              walletBalance: 0,
              referralCode: `REF${Date.now()}-${Math.random()}`,
            },
          });
          testUserIds.push(user.id);

          // Create ticket tier data
          const tierId = `tier-${Date.now()}-${Math.random()}`;
          const tiers = [
            {
              id: tierId,
              name: 'General',
              price: amount,
              quantity: 100,
              sold: 0,
            },
          ];

          // Create test event
          const event = await prisma.event.create({
            data: {
              organizerId: user.id,
              title: 'Test Event',
              description: 'Test Description',
              eventType: 'general',
              startDate: new Date(Date.now() + 86400000),
              endDate: new Date(Date.now() + 172800000),
              venue: 'Test Venue',
              state: 'Lagos',
              lga: 'Ikeja',
              latitude: 6.5244,
              longitude: 3.3792,
              isHidden: false,
              capacity: 1000,
              ticketsSold: 0,
              tiers: tiers,
              ussdCode: `${Math.floor(1000 + Math.random() * 9000)}`,
              status: 'published',
            },
          });
          testEventIds.push(event.id);

          // Create non-successful payment
          const payment = await prisma.payment.create({
            data: {
              userId: user.id,
              amount,
              currency: 'NGN',
              method: 'card',
              status: status as any,
              provider: 'paystack',
              reference: `REF-${Date.now()}-${Math.random()}`,
              isInstallment: false,
            },
          });
          testPaymentIds.push(payment.id);

          // Try to issue ticket
          try {
            await ticketService.issueTicket({
              userId: user.id,
              eventId: event.id,
              tierId: tierId,
              paymentId: payment.id,
            });
            // Should not reach here
            expect(true).toBe(false);
          } catch (error: any) {
            // Property: Should throw error for non-successful payment
            expect(error.message).toContain('Payment not successful');
          }
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should generate unique QR codes and backup codes for multiple tickets', async () => {
    const qrCodes = new Set<string>();
    const backupCodes = new Set<string>();

    // Create test user
    const user = await prisma.user.create({
      data: {
        phoneNumber: `+234${Math.floor(Math.random() * 10000000000)}`,
        phoneVerified: true,
        email: 'test@example.com',
        preferredLanguage: 'en',
        state: 'Lagos',
        role: 'attendee',
        walletBalance: 0,
        referralCode: `REF${Date.now()}-${Math.random()}`,
      },
    });
    testUserIds.push(user.id);

    // Create multiple tickets
    for (let i = 0; i < 20; i++) {
      const tierId = `tier-${Date.now()}-${i}-${Math.random()}`;
      const tiers = [
        {
          id: tierId,
          name: `Tier ${i}`,
          price: 10000 + i * 1000,
          quantity: 100,
          sold: 0,
        },
      ];

      const event = await prisma.event.create({
        data: {
          organizerId: user.id,
          title: `Test Event ${i}`,
          description: 'Test Description',
          eventType: 'general',
          startDate: new Date(Date.now() + 86400000),
          endDate: new Date(Date.now() + 172800000),
          venue: 'Test Venue',
          state: 'Lagos',
          lga: 'Ikeja',
          latitude: 6.5244,
          longitude: 3.3792,
          isHidden: false,
          capacity: 1000,
          ticketsSold: 0,
          tiers: tiers,
          ussdCode: `${Math.floor(1000 + Math.random() * 9000)}`,
          status: 'published',
        },
      });
      testEventIds.push(event.id);

      const payment = await prisma.payment.create({
        data: {
          userId: user.id,
          amount: 10000 + i * 1000,
          currency: 'NGN',
          method: 'card',
          status: 'successful',
          provider: 'paystack',
          reference: `REF-${Date.now()}-${i}-${Math.random()}`,
          isInstallment: false,
        },
      });
      testPaymentIds.push(payment.id);

      const ticket = await ticketService.issueTicket({
        userId: user.id,
        eventId: event.id,
        tierId: tierId,
        paymentId: payment.id,
      });

      // Property: QR codes should be unique
      expect(qrCodes.has(ticket.qrCode)).toBe(false);
      qrCodes.add(ticket.qrCode);

      // Property: Backup codes should be unique (or mostly unique)
      backupCodes.add(ticket.backupCode);
    }

    // Property: All QR codes should be unique
    expect(qrCodes.size).toBe(20);

    // Property: Most backup codes should be unique (allowing for rare collisions)
    expect(backupCodes.size).toBeGreaterThan(18);
  });
});

describe('Property 23: Bulk booking QR code generation', () => {
  /**
   * Feature: tikit-webapp, Property 23: Bulk booking QR code generation
   * Validates: Requirements 7.3
   * 
   * For any bulk booking of N seats, exactly N unique QR codes should be generated
   */

  const testUserIds: string[] = [];
  const testEventIds: string[] = [];
  const testPaymentIds: string[] = [];

  beforeEach(async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(async () => {
    try {
      await prisma.ticket.deleteMany({
        where: {
          userId: { in: testUserIds },
        },
      });
      await prisma.payment.deleteMany({
        where: {
          id: { in: testPaymentIds },
        },
      });
      await prisma.event.deleteMany({
        where: {
          id: { in: testEventIds },
        },
      });
      await prisma.user.deleteMany({
        where: {
          id: { in: testUserIds },
        },
      });
    } catch (error) {
      console.error('Cleanup error:', error);
    }

    testUserIds.length = 0;
    testEventIds.length = 0;
    testPaymentIds.length = 0;

    vi.restoreAllMocks();
  });

  it('should generate exactly N unique QR codes for N seats', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 50, max: 200 }), // N seats (reduced max for test performance)
        fc.integer({ min: 10000, max: 100000 }), // Price per seat
        async (quantity, pricePerSeat) => {
          // Create test user
          const user = await prisma.user.create({
            data: {
              phoneNumber: `+234${Math.floor(Math.random() * 10000000000)}`,
              phoneVerified: true,
              email: 'bulk@example.com',
              preferredLanguage: 'en',
              state: 'Lagos',
              role: 'organizer',
              walletBalance: 0,
              referralCode: `REF${Date.now()}-${Math.random()}`,
            },
          });
          testUserIds.push(user.id);

          // Create ticket tier
          const tierId = `tier-${Date.now()}-${Math.random()}`;
          const tiers = [
            {
              id: tierId,
              name: 'Bulk Tier',
              price: pricePerSeat,
              quantity: 25000,
              sold: 0,
            },
          ];

          // Create test event with sufficient capacity
          const event = await prisma.event.create({
            data: {
              organizerId: user.id,
              title: 'Bulk Test Event',
              description: 'Test Description',
              eventType: 'crusade',
              startDate: new Date(Date.now() + 86400000),
              endDate: new Date(Date.now() + 172800000),
              venue: 'Test Venue',
              state: 'Lagos',
              lga: 'Ikeja',
              latitude: 6.5244,
              longitude: 3.3792,
              isHidden: false,
              capacity: 25000,
              ticketsSold: 0,
              tiers: tiers,
              ussdCode: `${Math.floor(1000 + Math.random() * 9000)}`,
              status: 'published',
            },
          });
          testEventIds.push(event.id);

          // Create successful payment for bulk booking
          const totalAmount = quantity * pricePerSeat;
          const payment = await prisma.payment.create({
            data: {
              userId: user.id,
              amount: totalAmount,
              currency: 'NGN',
              method: 'bank_transfer',
              status: 'successful',
              provider: 'paystack',
              reference: `BULK-${Date.now()}-${Math.random()}`,
              isInstallment: false,
            },
          });
          testPaymentIds.push(payment.id);

          // Generate bulk tickets
          const result = await ticketService.generateBulkTickets({
            userId: user.id,
            eventId: event.id,
            tierId: tierId,
            paymentId: payment.id,
            quantity: quantity,
          });

          // Property 1: Should generate exactly N tickets
          expect(result.tickets.length).toBe(quantity);

          // Property 2: All QR codes should be unique
          const qrCodes = new Set(result.tickets.map(t => t.qrCode));
          expect(qrCodes.size).toBe(quantity);

          // Property 3: All backup codes should be present
          const backupCodes = result.tickets.map(t => t.backupCode);
          expect(backupCodes.length).toBe(quantity);
          expect(backupCodes.every(code => /^\d{6}$/.test(code))).toBe(true);

          // Property 4: All QR codes should follow the format
          expect(result.tickets.every(t => t.qrCode.startsWith('TKT-QR-'))).toBe(true);

          // Property 5: CSV data should be generated
          expect(result.csvData).toBeTruthy();
          const csvLines = result.csvData.split('\n');
          expect(csvLines.length).toBe(quantity + 1); // +1 for header

          // Property 6: Event capacity should be updated
          const updatedEvent = await prisma.event.findUnique({
            where: { id: event.id },
          });
          expect(updatedEvent?.ticketsSold).toBe(quantity);
        }
      ),
      { numRuns: 5 } // Reduced runs due to bulk operations
    );
  });

  it('should reject bulk bookings outside valid range', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.integer({ min: 1, max: 49 }), // Below minimum
          fc.integer({ min: 20001, max: 30000 }) // Above maximum
        ),
        async (invalidQuantity) => {
          // Create test user
          const user = await prisma.user.create({
            data: {
              phoneNumber: `+234${Math.floor(Math.random() * 10000000000)}`,
              phoneVerified: true,
              preferredLanguage: 'en',
              state: 'Lagos',
              role: 'organizer',
              walletBalance: 0,
              referralCode: `REF${Date.now()}-${Math.random()}`,
            },
          });
          testUserIds.push(user.id);

          const tierId = `tier-${Date.now()}-${Math.random()}`;
          const tiers = [
            {
              id: tierId,
              name: 'Bulk Tier',
              price: 10000,
              quantity: 50000,
              sold: 0,
            },
          ];

          const event = await prisma.event.create({
            data: {
              organizerId: user.id,
              title: 'Bulk Test Event',
              description: 'Test Description',
              eventType: 'crusade',
              startDate: new Date(Date.now() + 86400000),
              endDate: new Date(Date.now() + 172800000),
              venue: 'Test Venue',
              state: 'Lagos',
              lga: 'Ikeja',
              latitude: 6.5244,
              longitude: 3.3792,
              isHidden: false,
              capacity: 50000,
              ticketsSold: 0,
              tiers: tiers,
              ussdCode: `${Math.floor(1000 + Math.random() * 9000)}`,
              status: 'published',
            },
          });
          testEventIds.push(event.id);

          const payment = await prisma.payment.create({
            data: {
              userId: user.id,
              amount: invalidQuantity * 10000,
              currency: 'NGN',
              method: 'bank_transfer',
              status: 'successful',
              provider: 'paystack',
              reference: `BULK-${Date.now()}-${Math.random()}`,
              isInstallment: false,
            },
          });
          testPaymentIds.push(payment.id);

          // Property: Should reject invalid quantities
          try {
            await ticketService.generateBulkTickets({
              userId: user.id,
              eventId: event.id,
              tierId: tierId,
              paymentId: payment.id,
              quantity: invalidQuantity,
            });
            // Should not reach here
            expect(true).toBe(false);
          } catch (error: any) {
            expect(error.message).toContain('Bulk booking must be between 50 and 20,000 seats');
          }
        }
      ),
      { numRuns: 5 }
    );
  });

  it('should reject bulk bookings exceeding event capacity', async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        phoneNumber: `+234${Math.floor(Math.random() * 10000000000)}`,
        phoneVerified: true,
        preferredLanguage: 'en',
        state: 'Lagos',
        role: 'organizer',
        walletBalance: 0,
        referralCode: `REF${Date.now()}-${Math.random()}`,
      },
    });
    testUserIds.push(user.id);

    const tierId = `tier-${Date.now()}-${Math.random()}`;
    const tiers = [
      {
        id: tierId,
        name: 'Bulk Tier',
        price: 10000,
        quantity: 100,
        sold: 0,
      },
    ];

    // Create event with limited capacity
    const event = await prisma.event.create({
      data: {
        organizerId: user.id,
        title: 'Limited Capacity Event',
        description: 'Test Description',
        eventType: 'crusade',
        startDate: new Date(Date.now() + 86400000),
        endDate: new Date(Date.now() + 172800000),
        venue: 'Test Venue',
        state: 'Lagos',
        lga: 'Ikeja',
        latitude: 6.5244,
        longitude: 3.3792,
        isHidden: false,
        capacity: 100, // Only 100 seats
        ticketsSold: 60, // 60 already sold
        tiers: tiers,
        ussdCode: `${Math.floor(1000 + Math.random() * 9000)}`,
        status: 'published',
      },
    });
    testEventIds.push(event.id);

    const payment = await prisma.payment.create({
      data: {
        userId: user.id,
        amount: 50 * 10000, // Trying to book 50 seats
        currency: 'NGN',
        method: 'bank_transfer',
        status: 'successful',
        provider: 'paystack',
        reference: `BULK-${Date.now()}-${Math.random()}`,
        isInstallment: false,
      },
    });
    testPaymentIds.push(payment.id);

    // Property: Should reject when exceeding capacity
    try {
      await ticketService.generateBulkTickets({
        userId: user.id,
        eventId: event.id,
        tierId: tierId,
        paymentId: payment.id,
        quantity: 50, // Only 40 available
      });
      // Should not reach here
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.message).toContain('Insufficient capacity');
    }
  });
});

describe('Property 24: Bulk booking capacity update', () => {
  /**
   * Feature: tikit-webapp, Property 24: Bulk booking capacity update
   * Validates: Requirements 7.5
   * 
   * For any bulk ticket generation of N tickets, the event's available capacity 
   * should decrease by N across all user sessions
   */

  const testUserIds: string[] = [];
  const testEventIds: string[] = [];
  const testPaymentIds: string[] = [];

  beforeEach(async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(async () => {
    try {
      await prisma.ticket.deleteMany({
        where: {
          userId: { in: testUserIds },
        },
      });
      await prisma.payment.deleteMany({
        where: {
          id: { in: testPaymentIds },
        },
      });
      await prisma.event.deleteMany({
        where: {
          id: { in: testEventIds },
        },
      });
      await prisma.user.deleteMany({
        where: {
          id: { in: testUserIds },
        },
      });
    } catch (error) {
      console.error('Cleanup error:', error);
    }

    testUserIds.length = 0;
    testEventIds.length = 0;
    testPaymentIds.length = 0;

    vi.restoreAllMocks();
  });

  it('should decrease event capacity by exactly N for N bulk tickets', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 50, max: 200 }), // N tickets
        fc.integer({ min: 500, max: 5000 }), // Initial capacity
        async (bulkQuantity, initialCapacity) => {
          // Ensure capacity is sufficient
          const capacity = Math.max(initialCapacity, bulkQuantity + 100);

          // Create test user
          const user = await prisma.user.create({
            data: {
              phoneNumber: `+234${Math.floor(Math.random() * 10000000000)}`,
              phoneVerified: true,
              email: 'capacity@example.com',
              preferredLanguage: 'en',
              state: 'Lagos',
              role: 'organizer',
              walletBalance: 0,
              referralCode: `REF${Date.now()}-${Math.random()}`,
            },
          });
          testUserIds.push(user.id);

          const tierId = `tier-${Date.now()}-${Math.random()}`;
          const tiers = [
            {
              id: tierId,
              name: 'Bulk Tier',
              price: 10000,
              quantity: capacity,
              sold: 0,
            },
          ];

          // Create event with known initial capacity
          const event = await prisma.event.create({
            data: {
              organizerId: user.id,
              title: 'Capacity Test Event',
              description: 'Test Description',
              eventType: 'crusade',
              startDate: new Date(Date.now() + 86400000),
              endDate: new Date(Date.now() + 172800000),
              venue: 'Test Venue',
              state: 'Lagos',
              lga: 'Ikeja',
              latitude: 6.5244,
              longitude: 3.3792,
              isHidden: false,
              capacity: capacity,
              ticketsSold: 0,
              tiers: tiers,
              ussdCode: `${Math.floor(1000 + Math.random() * 9000)}`,
              status: 'published',
            },
          });
          testEventIds.push(event.id);

          // Record initial state
          const initialTicketsSold = event.ticketsSold;
          const initialAvailable = capacity - initialTicketsSold;

          // Create payment
          const payment = await prisma.payment.create({
            data: {
              userId: user.id,
              amount: bulkQuantity * 10000,
              currency: 'NGN',
              method: 'bank_transfer',
              status: 'successful',
              provider: 'paystack',
              reference: `BULK-${Date.now()}-${Math.random()}`,
              isInstallment: false,
            },
          });
          testPaymentIds.push(payment.id);

          // Generate bulk tickets
          await ticketService.generateBulkTickets({
            userId: user.id,
            eventId: event.id,
            tierId: tierId,
            paymentId: payment.id,
            quantity: bulkQuantity,
          });

          // Property 1: Fetch updated event and verify capacity decreased by exactly N
          const updatedEvent = await prisma.event.findUnique({
            where: { id: event.id },
          });

          expect(updatedEvent).toBeDefined();
          expect(updatedEvent!.ticketsSold).toBe(initialTicketsSold + bulkQuantity);

          // Property 2: Available capacity should be initial - N
          const finalAvailable = updatedEvent!.capacity - updatedEvent!.ticketsSold;
          expect(finalAvailable).toBe(initialAvailable - bulkQuantity);

          // Property 3: Capacity should never go negative
          expect(finalAvailable).toBeGreaterThanOrEqual(0);

          // Property 4: Total capacity should remain unchanged
          expect(updatedEvent!.capacity).toBe(capacity);
        }
      ),
      { numRuns: 5 }
    );
  });

  it('should handle concurrent bookings without overselling', async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        phoneNumber: `+234${Math.floor(Math.random() * 10000000000)}`,
        phoneVerified: true,
        email: 'concurrent@example.com',
        preferredLanguage: 'en',
        state: 'Lagos',
        role: 'organizer',
        walletBalance: 0,
        referralCode: `REF${Date.now()}-${Math.random()}`,
      },
    });
    testUserIds.push(user.id);

    const tierId = `tier-${Date.now()}-${Math.random()}`;
    const tiers = [
      {
        id: tierId,
        name: 'Bulk Tier',
        price: 10000,
        quantity: 200,
        sold: 0,
      },
    ];

    // Create event with limited capacity
    const event = await prisma.event.create({
      data: {
        organizerId: user.id,
        title: 'Concurrent Test Event',
        description: 'Test Description',
        eventType: 'crusade',
        startDate: new Date(Date.now() + 86400000),
        endDate: new Date(Date.now() + 172800000),
        venue: 'Test Venue',
        state: 'Lagos',
        lga: 'Ikeja',
        latitude: 6.5244,
        longitude: 3.3792,
        isHidden: false,
        capacity: 200,
        ticketsSold: 0,
        tiers: tiers,
        ussdCode: `${Math.floor(1000 + Math.random() * 9000)}`,
        status: 'published',
      },
    });
    testEventIds.push(event.id);

    // Try to reserve capacity
    const reserved1 = await ticketService.checkAndReserveCapacity(event.id, 100);
    const reserved2 = await ticketService.checkAndReserveCapacity(event.id, 100);
    const reserved3 = await ticketService.checkAndReserveCapacity(event.id, 50); // Should fail

    // Property: First two reservations should succeed
    expect(reserved1).toBe(true);
    expect(reserved2).toBe(true);

    // Property: Third reservation should fail (overselling prevention)
    expect(reserved3).toBe(false);

    // Property: Final capacity should be exactly sold out
    const finalEvent = await prisma.event.findUnique({
      where: { id: event.id },
    });
    expect(finalEvent!.ticketsSold).toBe(200);
    expect(finalEvent!.capacity - finalEvent!.ticketsSold).toBe(0);
  });

  it('should correctly release capacity on payment failure', async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        phoneNumber: `+234${Math.floor(Math.random() * 10000000000)}`,
        phoneVerified: true,
        email: 'release@example.com',
        preferredLanguage: 'en',
        state: 'Lagos',
        role: 'organizer',
        walletBalance: 0,
        referralCode: `REF${Date.now()}-${Math.random()}`,
      },
    });
    testUserIds.push(user.id);

    const tierId = `tier-${Date.now()}-${Math.random()}`;
    const tiers = [
      {
        id: tierId,
        name: 'Bulk Tier',
        price: 10000,
        quantity: 500,
        sold: 0,
      },
    ];

    const event = await prisma.event.create({
      data: {
        organizerId: user.id,
        title: 'Release Test Event',
        description: 'Test Description',
        eventType: 'crusade',
        startDate: new Date(Date.now() + 86400000),
        endDate: new Date(Date.now() + 172800000),
        venue: 'Test Venue',
        state: 'Lagos',
        lga: 'Ikeja',
        latitude: 6.5244,
        longitude: 3.3792,
        isHidden: false,
        capacity: 500,
        ticketsSold: 0,
        tiers: tiers,
        ussdCode: `${Math.floor(1000 + Math.random() * 9000)}`,
        status: 'published',
      },
    });
    testEventIds.push(event.id);

    // Reserve capacity
    const reserved = await ticketService.checkAndReserveCapacity(event.id, 100);
    expect(reserved).toBe(true);

    const afterReserve = await prisma.event.findUnique({
      where: { id: event.id },
    });
    expect(afterReserve!.ticketsSold).toBe(100);

    // Simulate payment failure - release capacity
    await ticketService.releaseCapacity(event.id, 100);

    // Property: Capacity should be restored
    const afterRelease = await prisma.event.findUnique({
      where: { id: event.id },
    });
    expect(afterRelease!.ticketsSold).toBe(0);
    expect(afterRelease!.capacity - afterRelease!.ticketsSold).toBe(500);
  });
});


describe('Property 32: Ticket scan idempotence', () => {
  /**
   * Feature: tikit-webapp, Property 32: Ticket scan idempotence
   * Validates: Requirements 9.5
   * 
   * For any ticket, scanning it once should mark it as used, and any subsequent 
   * scan attempts should be rejected with a duplicate warning
   */

  const testUserIds: string[] = [];
  const testEventIds: string[] = [];
  const testPaymentIds: string[] = [];

  beforeEach(async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(async () => {
    try {
      await prisma.scanHistory.deleteMany({
        where: {
          ticket: {
            userId: { in: testUserIds },
          },
        },
      });
      await prisma.ticket.deleteMany({
        where: {
          userId: { in: testUserIds },
        },
      });
      await prisma.payment.deleteMany({
        where: {
          id: { in: testPaymentIds },
        },
      });
      await prisma.event.deleteMany({
        where: {
          id: { in: testEventIds },
        },
      });
      await prisma.user.deleteMany({
        where: {
          id: { in: testUserIds },
        },
      });
    } catch (error) {
      console.error('Cleanup error:', error);
    }

    testUserIds.length = 0;
    testEventIds.length = 0;
    testPaymentIds.length = 0;

    vi.restoreAllMocks();
  });

  it('should mark ticket as used on first scan and reject subsequent scans', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 5, maxLength: 20 }), // Scanner ID
        fc.string({ minLength: 3, maxLength: 50 }), // Location
        async (scannerId, location) => {
          // Create test user
          const user = await prisma.user.create({
            data: {
              phoneNumber: `+234${Math.floor(Math.random() * 10000000000)}`,
              phoneVerified: true,
              email: 'scan@example.com',
              preferredLanguage: 'en',
              state: 'Lagos',
              role: 'attendee',
              walletBalance: 0,
              referralCode: `REF${Date.now()}-${Math.random()}`,
            },
          });
          testUserIds.push(user.id);

          // Create event
          const tierId = `tier-${Date.now()}-${Math.random()}`;
          const tiers = [
            {
              id: tierId,
              name: 'General',
              price: 10000,
              quantity: 100,
              sold: 0,
            },
          ];

          const event = await prisma.event.create({
            data: {
              organizerId: user.id,
              title: 'Scan Test Event',
              description: 'Test Description',
              eventType: 'general',
              startDate: new Date(Date.now() + 86400000),
              endDate: new Date(Date.now() + 172800000),
              venue: 'Test Venue',
              state: 'Lagos',
              lga: 'Ikeja',
              latitude: 6.5244,
              longitude: 3.3792,
              isHidden: false,
              capacity: 1000,
              ticketsSold: 0,
              tiers: tiers,
              ussdCode: `${Math.floor(1000 + Math.random() * 9000)}`,
              status: 'published',
            },
          });
          testEventIds.push(event.id);

          // Create payment and ticket
          const payment = await prisma.payment.create({
            data: {
              userId: user.id,
              amount: 10000,
              currency: 'NGN',
              method: 'card',
              status: 'successful',
              provider: 'paystack',
              reference: `REF-${Date.now()}-${Math.random()}`,
              isInstallment: false,
            },
          });
          testPaymentIds.push(payment.id);

          const ticket = await ticketService.issueTicket({
            userId: user.id,
            eventId: event.id,
            tierId: tierId,
            paymentId: payment.id,
          });

          // Property 1: First scan should be valid
          const firstScan = await ticketService.verifyTicketByQRCode(
            ticket.qrCode,
            scannerId,
            location,
            'Test Device'
          );
          expect(firstScan.valid).toBe(true);
          expect(firstScan.message).toBe('Ticket is valid');

          // Mark ticket as used
          await ticketService.markTicketAsUsed(ticket.qrCode, scannerId, location);

          // Property 2: Second scan should be rejected
          const secondScan = await ticketService.verifyTicketByQRCode(
            ticket.qrCode,
            scannerId,
            location,
            'Test Device'
          );
          expect(secondScan.valid).toBe(false);
          expect(secondScan.message).toBe('Ticket already used');

          // Property 3: Scan history should be recorded
          expect(secondScan.scanHistory).toBeDefined();
          expect(Array.isArray(secondScan.scanHistory)).toBe(true);
          expect(secondScan.scanHistory!.length).toBeGreaterThan(0);

          // Property 4: usedAt timestamp should be set
          expect(secondScan.usedAt).toBeDefined();
          expect(secondScan.usedAt).toBeInstanceOf(Date);

          // Property 5: Third scan should also be rejected
          const thirdScan = await ticketService.verifyTicketByQRCode(
            ticket.qrCode,
            scannerId,
            location,
            'Test Device'
          );
          expect(thirdScan.valid).toBe(false);
          expect(thirdScan.message).toBe('Ticket already used');

          // Property 6: Scan history should grow with each attempt
          const scanHistory = await ticketService.getScanHistory(ticket.id);
          expect(scanHistory.length).toBeGreaterThanOrEqual(3); // At least 3 scans recorded
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should record scan history with correct details', async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        phoneNumber: `+234${Math.floor(Math.random() * 10000000000)}`,
        phoneVerified: true,
        email: 'history@example.com',
        preferredLanguage: 'en',
        state: 'Lagos',
        role: 'attendee',
        walletBalance: 0,
        referralCode: `REF${Date.now()}-${Math.random()}`,
      },
    });
    testUserIds.push(user.id);

    // Create event
    const tierId = `tier-${Date.now()}-${Math.random()}`;
    const tiers = [
      {
        id: tierId,
        name: 'General',
        price: 10000,
        quantity: 100,
        sold: 0,
      },
    ];

    const event = await prisma.event.create({
      data: {
        organizerId: user.id,
        title: 'History Test Event',
        description: 'Test Description',
        eventType: 'general',
        startDate: new Date(Date.now() + 86400000),
        endDate: new Date(Date.now() + 172800000),
        venue: 'Test Venue',
        state: 'Lagos',
        lga: 'Ikeja',
        latitude: 6.5244,
        longitude: 3.3792,
        isHidden: false,
        capacity: 1000,
        ticketsSold: 0,
        tiers: tiers,
        ussdCode: `${Math.floor(1000 + Math.random() * 9000)}`,
        status: 'published',
      },
    });
    testEventIds.push(event.id);

    // Create payment and ticket
    const payment = await prisma.payment.create({
      data: {
        userId: user.id,
        amount: 10000,
        currency: 'NGN',
        method: 'card',
        status: 'successful',
        provider: 'paystack',
        reference: `REF-${Date.now()}-${Math.random()}`,
        isInstallment: false,
      },
    });
    testPaymentIds.push(payment.id);

    const ticket = await ticketService.issueTicket({
      userId: user.id,
      eventId: event.id,
      tierId: tierId,
      paymentId: payment.id,
    });

    // Perform multiple scans
    const scannerId = 'scanner-001';
    const location = 'Main Entrance';
    const deviceInfo = 'iPhone 12';

    // First scan (success)
    await ticketService.verifyTicketByQRCode(ticket.qrCode, scannerId, location, deviceInfo);
    await ticketService.markTicketAsUsed(ticket.qrCode, scannerId, location);

    // Second scan (duplicate)
    await ticketService.verifyTicketByQRCode(ticket.qrCode, scannerId, location, deviceInfo);

    // Third scan (duplicate)
    await ticketService.verifyTicketByQRCode(ticket.qrCode, scannerId, location, deviceInfo);

    // Get scan history
    const scanHistory = await ticketService.getScanHistory(ticket.id);

    // Property 1: Should have recorded all scans
    expect(scanHistory.length).toBeGreaterThanOrEqual(3);

    // Property 2: First scan should be marked as success
    const successScans = scanHistory.filter(s => s.result === 'success');
    expect(successScans.length).toBeGreaterThanOrEqual(1);

    // Property 3: Duplicate scans should be marked as duplicate
    const duplicateScans = scanHistory.filter(s => s.result === 'duplicate');
    expect(duplicateScans.length).toBeGreaterThanOrEqual(2);

    // Property 4: All scans should have required fields
    scanHistory.forEach(scan => {
      expect(scan.ticketId).toBe(ticket.id);
      expect(scan.scannedBy).toBe(scannerId);
      expect(scan.scannedAt).toBeInstanceOf(Date);
      expect(scan.result).toMatch(/^(success|duplicate|invalid)$/);
    });

    // Property 5: Scans should be ordered by time (most recent first)
    for (let i = 0; i < scanHistory.length - 1; i++) {
      expect(scanHistory[i].scannedAt.getTime()).toBeGreaterThanOrEqual(
        scanHistory[i + 1].scannedAt.getTime()
      );
    }
  });

  it('should work with backup codes as well', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 5, maxLength: 20 }), // Scanner ID
        async (scannerId) => {
          // Create test user
          const user = await prisma.user.create({
            data: {
              phoneNumber: `+234${Math.floor(Math.random() * 10000000000)}`,
              phoneVerified: true,
              email: 'backup@example.com',
              preferredLanguage: 'en',
              state: 'Lagos',
              role: 'attendee',
              walletBalance: 0,
              referralCode: `REF${Date.now()}-${Math.random()}`,
            },
          });
          testUserIds.push(user.id);

          // Create event
          const tierId = `tier-${Date.now()}-${Math.random()}`;
          const tiers = [
            {
              id: tierId,
              name: 'General',
              price: 10000,
              quantity: 100,
              sold: 0,
            },
          ];

          const event = await prisma.event.create({
            data: {
              organizerId: user.id,
              title: 'Backup Code Test Event',
              description: 'Test Description',
              eventType: 'general',
              startDate: new Date(Date.now() + 86400000),
              endDate: new Date(Date.now() + 172800000),
              venue: 'Test Venue',
              state: 'Lagos',
              lga: 'Ikeja',
              latitude: 6.5244,
              longitude: 3.3792,
              isHidden: false,
              capacity: 1000,
              ticketsSold: 0,
              tiers: tiers,
              ussdCode: `${Math.floor(1000 + Math.random() * 9000)}`,
              status: 'published',
            },
          });
          testEventIds.push(event.id);

          // Create payment and ticket
          const payment = await prisma.payment.create({
            data: {
              userId: user.id,
              amount: 10000,
              currency: 'NGN',
              method: 'card',
              status: 'successful',
              provider: 'paystack',
              reference: `REF-${Date.now()}-${Math.random()}`,
              isInstallment: false,
            },
          });
          testPaymentIds.push(payment.id);

          const ticket = await ticketService.issueTicket({
            userId: user.id,
            eventId: event.id,
            tierId: tierId,
            paymentId: payment.id,
          });

          // Property 1: First scan with backup code should be valid
          const firstScan = await ticketService.verifyTicketByBackupCode(
            ticket.backupCode,
            scannerId,
            'Main Gate'
          );
          expect(firstScan.valid).toBe(true);

          // Mark as used
          await ticketService.markTicketAsUsed(ticket.qrCode, scannerId);

          // Property 2: Second scan with backup code should be rejected
          const secondScan = await ticketService.verifyTicketByBackupCode(
            ticket.backupCode,
            scannerId,
            'Main Gate'
          );
          expect(secondScan.valid).toBe(false);
          expect(secondScan.message).toBe('Ticket already used');

          // Property 3: Scan history should be available
          expect(secondScan.scanHistory).toBeDefined();
          expect(secondScan.scanHistory!.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should prevent duplicate scans even with mixed QR and backup code attempts', async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        phoneNumber: `+234${Math.floor(Math.random() * 10000000000)}`,
        phoneVerified: true,
        email: 'mixed@example.com',
        preferredLanguage: 'en',
        state: 'Lagos',
        role: 'attendee',
        walletBalance: 0,
        referralCode: `REF${Date.now()}-${Math.random()}`,
      },
    });
    testUserIds.push(user.id);

    // Create event
    const tierId = `tier-${Date.now()}-${Math.random()}`;
    const tiers = [
      {
        id: tierId,
        name: 'General',
        price: 10000,
        quantity: 100,
        sold: 0,
      },
    ];

    const event = await prisma.event.create({
      data: {
        organizerId: user.id,
        title: 'Mixed Scan Test Event',
        description: 'Test Description',
        eventType: 'general',
        startDate: new Date(Date.now() + 86400000),
        endDate: new Date(Date.now() + 172800000),
        venue: 'Test Venue',
        state: 'Lagos',
        lga: 'Ikeja',
        latitude: 6.5244,
        longitude: 3.3792,
        isHidden: false,
        capacity: 1000,
        ticketsSold: 0,
        tiers: tiers,
        ussdCode: `${Math.floor(1000 + Math.random() * 9000)}`,
        status: 'published',
      },
    });
    testEventIds.push(event.id);

    // Create payment and ticket
    const payment = await prisma.payment.create({
      data: {
        userId: user.id,
        amount: 10000,
        currency: 'NGN',
        method: 'card',
        status: 'successful',
        provider: 'paystack',
        reference: `REF-${Date.now()}-${Math.random()}`,
        isInstallment: false,
      },
    });
    testPaymentIds.push(payment.id);

    const ticket = await ticketService.issueTicket({
      userId: user.id,
      eventId: event.id,
      tierId: tierId,
      paymentId: payment.id,
    });

    const scannerId = 'scanner-mixed';

    // Scan with QR code first
    const qrScan = await ticketService.verifyTicketByQRCode(ticket.qrCode, scannerId);
    expect(qrScan.valid).toBe(true);

    // Mark as used
    await ticketService.markTicketAsUsed(ticket.qrCode, scannerId);

    // Try to scan with backup code (should fail)
    const backupScan = await ticketService.verifyTicketByBackupCode(ticket.backupCode, scannerId);
    expect(backupScan.valid).toBe(false);
    expect(backupScan.message).toBe('Ticket already used');

    // Try to scan with QR code again (should also fail)
    const qrScan2 = await ticketService.verifyTicketByQRCode(ticket.qrCode, scannerId);
    expect(qrScan2.valid).toBe(false);
    expect(qrScan2.message).toBe('Ticket already used');

    // Property: All attempts should be in scan history
    const scanHistory = await ticketService.getScanHistory(ticket.id);
    expect(scanHistory.length).toBeGreaterThanOrEqual(3);
  });
});


/**
 * Feature: tikit-webapp, Property 49: Valid QR code detail display
 * Validates: Requirements 14.2
 * 
 * For any valid QR code scanned, the system should display attendee name, 
 * ticket tier, and validity status
 */
describe('Property 49: Valid QR code detail display', () => {
  const testUserIds: string[] = [];
  const testEventIds: string[] = [];
  const testTicketIds: string[] = [];

  afterEach(async () => {
    // Clean up test data
    try {
      await prisma.scanHistory.deleteMany({
        where: {
          ticketId: { in: testTicketIds },
        },
      });
      await prisma.ticket.deleteMany({
        where: {
          id: { in: testTicketIds },
        },
      });
      await prisma.event.deleteMany({
        where: {
          id: { in: testEventIds },
        },
      });
      await prisma.user.deleteMany({
        where: {
          id: { in: testUserIds },
        },
      });
    } catch (error) {
      console.error('Cleanup error:', error);
    }

    testUserIds.length = 0;
    testEventIds.length = 0;
    testTicketIds.length = 0;
  });

  it('should display attendee details, ticket tier, and validity status for any valid QR code', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }), // firstName
        fc.string({ minLength: 1, maxLength: 50 }), // lastName
        fc.constantFrom('valid', 'used', 'cancelled', 'refunded'), // ticket status
        async (firstName, lastName, ticketStatus) => {
          // Create test user
          const user = await prisma.user.create({
            data: {
              phoneNumber: `+234${Math.floor(Math.random() * 10000000000)}`,
              phoneVerified: true,
              firstName,
              lastName,
              preferredLanguage: 'en',
              state: 'Lagos',
              role: 'attendee',
              walletBalance: 0,
              referralCode: `REF${Date.now()}-${Math.random()}`,
            },
          });
          testUserIds.push(user.id);

          // Create ticket tier data
          const tierId = `tier-${Date.now()}-${Math.random()}`;
          const tierName = 'VIP';
          const tiers = [
            {
              id: tierId,
              name: tierName,
              price: 50000,
              quantity: 100,
              sold: 0,
            },
          ];

          // Create test event
          const event = await prisma.event.create({
            data: {
              organizerId: user.id,
              title: 'Test Event',
              description: 'Test Description',
              eventType: 'general',
              startDate: new Date(Date.now() + 86400000),
              endDate: new Date(Date.now() + 172800000),
              venue: 'Test Venue',
              state: 'Lagos',
              lga: 'Ikeja',
              latitude: 6.5244,
              longitude: 3.3792,
              isHidden: false,
              capacity: 1000,
              ticketsSold: 0,
              tiers: tiers,
              ussdCode: `${Math.floor(1000 + Math.random() * 9000)}`,
              status: 'published',
            },
          });
          testEventIds.push(event.id);

          // Create ticket with specific status
          const qrCode = `TKT-QR-${Date.now()}-${Math.random()}`;
          const backupCode = `${Math.floor(100000 + Math.random() * 900000)}`;
          
          const ticket = await prisma.ticket.create({
            data: {
              userId: user.id,
              eventId: event.id,
              tierId: tierId,
              qrCode,
              backupCode,
              status: ticketStatus,
              usedAt: ticketStatus === 'used' ? new Date() : null,
            },
          });
          testTicketIds.push(ticket.id);

          // Verify ticket by QR code
          const result = await ticketService.verifyTicketByQRCode(
            qrCode,
            'scanner-user-id',
            'Event Entrance',
            'Test Device'
          );

          // Property: Result should contain ticket data
          expect(result).toBeDefined();
          expect(result.ticket).toBeDefined();

          // Property: Should display attendee name
          expect(result.ticket.user).toBeDefined();
          expect(result.ticket.user.firstName).toBe(firstName);
          expect(result.ticket.user.lastName).toBe(lastName);

          // Property: Should display ticket tier (via tierId)
          expect(result.ticket.tierId).toBe(tierId);

          // Property: Should display validity status
          expect(result.ticket.status).toBe(ticketStatus);
          expect(result.valid).toBe(ticketStatus === 'valid');
          expect(result.message).toBeDefined();

          // Property: Valid tickets should show as valid
          if (ticketStatus === 'valid') {
            expect(result.valid).toBe(true);
            expect(result.message).toContain('valid');
          } else {
            // Used, cancelled, or refunded tickets should show as invalid
            expect(result.valid).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return not found for non-existent QR codes', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 10, maxLength: 100 }), // Random QR code
        async (randomQrCode) => {
          // Verify non-existent QR code
          const result = await ticketService.verifyTicketByQRCode(
            randomQrCode,
            'scanner-user-id',
            'Event Entrance',
            'Test Device'
          );

          // Property: Should return not found
          expect(result.valid).toBe(false);
          expect(result.message).toContain('not found');
        }
      ),
      { numRuns: 100 }
    );
  });
});


/**
 * Feature: tikit-webapp, Property 50: Duplicate scan detection
 * Validates: Requirements 14.3
 * 
 * For any ticket scanned more than once, the second and subsequent scans 
 * should display a warning with the previous scan time and location
 */
describe('Property 50: Duplicate scan detection', () => {
  const testUserIds: string[] = [];
  const testEventIds: string[] = [];
  const testTicketIds: string[] = [];

  afterEach(async () => {
    // Clean up test data
    try {
      await prisma.scanHistory.deleteMany({
        where: {
          ticketId: { in: testTicketIds },
        },
      });
      await prisma.ticket.deleteMany({
        where: {
          id: { in: testTicketIds },
        },
      });
      await prisma.event.deleteMany({
        where: {
          id: { in: testEventIds },
        },
      });
      await prisma.user.deleteMany({
        where: {
          id: { in: testUserIds },
        },
      });
    } catch (error) {
      console.error('Cleanup error:', error);
    }

    testUserIds.length = 0;
    testEventIds.length = 0;
    testTicketIds.length = 0;
  });

  it('should detect duplicate scans and display warning with scan history', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 5, maxLength: 20 }), // Scanner ID
        fc.string({ minLength: 3, maxLength: 50 }), // Location
        async (scannerId, location) => {
          // Create test user
          const user = await prisma.user.create({
            data: {
              phoneNumber: `+234${Math.floor(Math.random() * 10000000000)}`,
              phoneVerified: true,
              preferredLanguage: 'en',
              state: 'Lagos',
              role: 'attendee',
              walletBalance: 0,
              referralCode: `REF${Date.now()}-${Math.random()}`,
            },
          });
          testUserIds.push(user.id);

          // Create ticket tier data
          const tierId = `tier-${Date.now()}-${Math.random()}`;
          const tiers = [
            {
              id: tierId,
              name: 'General',
              price: 50000,
              quantity: 100,
              sold: 0,
            },
          ];

          // Create test event
          const event = await prisma.event.create({
            data: {
              organizerId: user.id,
              title: 'Test Event',
              description: 'Test Description',
              eventType: 'general',
              startDate: new Date(Date.now() + 86400000),
              endDate: new Date(Date.now() + 172800000),
              venue: 'Test Venue',
              state: 'Lagos',
              lga: 'Ikeja',
              latitude: 6.5244,
              longitude: 3.3792,
              isHidden: false,
              capacity: 1000,
              ticketsSold: 0,
              tiers: tiers,
              ussdCode: `${Math.floor(1000 + Math.random() * 9000)}`,
              status: 'published',
            },
          });
          testEventIds.push(event.id);

          // Create ticket
          const qrCode = `TKT-QR-${Date.now()}-${Math.random()}`;
          const backupCode = `${Math.floor(100000 + Math.random() * 900000)}`;
          
          const ticket = await prisma.ticket.create({
            data: {
              userId: user.id,
              eventId: event.id,
              tierId: tierId,
              qrCode,
              backupCode,
              status: 'valid',
            },
          });
          testTicketIds.push(ticket.id);

          // First scan - should succeed
          const firstScan = await ticketService.verifyTicketByQRCode(
            qrCode,
            scannerId,
            location,
            'Test Device'
          );

          // Property: First scan should be valid
          expect(firstScan.valid).toBe(true);
          expect(firstScan.message).toContain('valid');

          // Mark ticket as used
          await ticketService.markTicketAsUsed(qrCode, scannerId, location);

          // Second scan - should detect duplicate
          const secondScan = await ticketService.verifyTicketByQRCode(
            qrCode,
            scannerId,
            location,
            'Test Device'
          );

          // Property: Second scan should be invalid
          expect(secondScan.valid).toBe(false);
          expect(secondScan.message).toContain('already used');

          // Property: Should include usedAt timestamp
          expect(secondScan.usedAt).toBeDefined();

          // Property: Should include scan history
          expect(secondScan.scanHistory).toBeDefined();
          expect(Array.isArray(secondScan.scanHistory)).toBe(true);
          expect(secondScan.scanHistory!.length).toBeGreaterThan(0);

          // Property: Scan history should contain previous scan details
          const scanHistory = secondScan.scanHistory!;
          const hasSuccessfulScan = scanHistory.some(
            (scan: any) => scan.result === 'success'
          );
          expect(hasSuccessfulScan).toBe(true);

          // Property: Latest scan should be marked as duplicate
          const latestScan = scanHistory[0];
          expect(latestScan.result).toBe('duplicate');
          expect(latestScan.scannedBy).toBe(scannerId);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should detect duplicates with backup codes as well', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 5, maxLength: 20 }), // Scanner ID
        async (scannerId) => {
          // Create test user
          const user = await prisma.user.create({
            data: {
              phoneNumber: `+234${Math.floor(Math.random() * 10000000000)}`,
              phoneVerified: true,
              preferredLanguage: 'en',
              state: 'Lagos',
              role: 'attendee',
              walletBalance: 0,
              referralCode: `REF${Date.now()}-${Math.random()}`,
            },
          });
          testUserIds.push(user.id);

          // Create ticket tier data
          const tierId = `tier-${Date.now()}-${Math.random()}`;
          const tiers = [
            {
              id: tierId,
              name: 'General',
              price: 50000,
              quantity: 100,
              sold: 0,
            },
          ];

          // Create test event
          const event = await prisma.event.create({
            data: {
              organizerId: user.id,
              title: 'Test Event',
              description: 'Test Description',
              eventType: 'general',
              startDate: new Date(Date.now() + 86400000),
              endDate: new Date(Date.now() + 172800000),
              venue: 'Test Venue',
              state: 'Lagos',
              lga: 'Ikeja',
              latitude: 6.5244,
              longitude: 3.3792,
              isHidden: false,
              capacity: 1000,
              ticketsSold: 0,
              tiers: tiers,
              ussdCode: `${Math.floor(1000 + Math.random() * 9000)}`,
              status: 'published',
            },
          });
          testEventIds.push(event.id);

          // Create ticket
          const qrCode = `TKT-QR-${Date.now()}-${Math.random()}`;
          const backupCode = `${Math.floor(100000 + Math.random() * 900000)}`;
          
          const ticket = await prisma.ticket.create({
            data: {
              userId: user.id,
              eventId: event.id,
              tierId: tierId,
              qrCode,
              backupCode,
              status: 'valid',
            },
          });
          testTicketIds.push(ticket.id);

          // First scan with backup code - should succeed
          const firstScan = await ticketService.verifyTicketByBackupCode(
            backupCode,
            scannerId,
            'Event Entrance',
            'Test Device'
          );

          // Property: First scan should be valid
          expect(firstScan.valid).toBe(true);

          // Mark ticket as used
          await ticketService.markTicketAsUsed(qrCode, scannerId, 'Event Entrance');

          // Second scan with backup code - should detect duplicate
          const secondScan = await ticketService.verifyTicketByBackupCode(
            backupCode,
            scannerId,
            'Event Entrance',
            'Test Device'
          );

          // Property: Second scan should be invalid
          expect(secondScan.valid).toBe(false);
          expect(secondScan.message).toContain('already used');

          // Property: Should include scan history
          expect(secondScan.scanHistory).toBeDefined();
          expect(secondScan.scanHistory!.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});


/**
 * Feature: tikit-webapp, Property 51: Backup code validation
 * Validates: Requirements 14.4
 * 
 * For any 6-digit backup code, if it matches a valid ticket, the ticket 
 * information should be displayed; if invalid, validation should fail
 */
describe('Property 51: Backup code validation', () => {
  const testUserIds: string[] = [];
  const testEventIds: string[] = [];
  const testTicketIds: string[] = [];

  afterEach(async () => {
    // Clean up test data
    try {
      await prisma.scanHistory.deleteMany({
        where: {
          ticketId: { in: testTicketIds },
        },
      });
      await prisma.ticket.deleteMany({
        where: {
          id: { in: testTicketIds },
        },
      });
      await prisma.event.deleteMany({
        where: {
          id: { in: testEventIds },
        },
      });
      await prisma.user.deleteMany({
        where: {
          id: { in: testUserIds },
        },
      });
    } catch (error) {
      console.error('Cleanup error:', error);
    }

    testUserIds.length = 0;
    testEventIds.length = 0;
    testTicketIds.length = 0;
  });

  it('should validate correct backup codes and display ticket information', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }), // firstName
        fc.string({ minLength: 1, maxLength: 50 }), // lastName
        async (firstName, lastName) => {
          // Create test user
          const user = await prisma.user.create({
            data: {
              phoneNumber: `+234${Math.floor(Math.random() * 10000000000)}`,
              phoneVerified: true,
              firstName,
              lastName,
              preferredLanguage: 'en',
              state: 'Lagos',
              role: 'attendee',
              walletBalance: 0,
              referralCode: `REF${Date.now()}-${Math.random()}`,
            },
          });
          testUserIds.push(user.id);

          // Create ticket tier data
          const tierId = `tier-${Date.now()}-${Math.random()}`;
          const tiers = [
            {
              id: tierId,
              name: 'VIP',
              price: 50000,
              quantity: 100,
              sold: 0,
            },
          ];

          // Create test event
          const event = await prisma.event.create({
            data: {
              organizerId: user.id,
              title: 'Test Event',
              description: 'Test Description',
              eventType: 'general',
              startDate: new Date(Date.now() + 86400000),
              endDate: new Date(Date.now() + 172800000),
              venue: 'Test Venue',
              state: 'Lagos',
              lga: 'Ikeja',
              latitude: 6.5244,
              longitude: 3.3792,
              isHidden: false,
              capacity: 1000,
              ticketsSold: 0,
              tiers: tiers,
              ussdCode: `${Math.floor(1000 + Math.random() * 9000)}`,
              status: 'published',
            },
          });
          testEventIds.push(event.id);

          // Create ticket with 6-digit backup code
          const qrCode = `TKT-QR-${Date.now()}-${Math.random()}`;
          const backupCode = `${Math.floor(100000 + Math.random() * 900000)}`;
          
          const ticket = await prisma.ticket.create({
            data: {
              userId: user.id,
              eventId: event.id,
              tierId: tierId,
              qrCode,
              backupCode,
              status: 'valid',
            },
          });
          testTicketIds.push(ticket.id);

          // Verify ticket by backup code
          const result = await ticketService.verifyTicketByBackupCode(
            backupCode,
            'scanner-user-id',
            'Event Entrance',
            'Test Device'
          );

          // Property: Should validate correct backup code
          expect(result.valid).toBe(true);
          expect(result.message).toContain('valid');

          // Property: Should display ticket information
          expect(result.ticket).toBeDefined();
          expect(result.ticket.backupCode).toBe(backupCode);
          expect(result.ticket.qrCode).toBe(qrCode);

          // Property: Should display attendee information
          expect(result.ticket.user).toBeDefined();
          expect(result.ticket.user.firstName).toBe(firstName);
          expect(result.ticket.user.lastName).toBe(lastName);

          // Property: Should display event information
          expect(result.ticket.event).toBeDefined();
          expect(result.ticket.event.title).toBe('Test Event');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject invalid backup codes', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 6, maxLength: 6 }).filter(s => /^\d{6}$/.test(s)), // 6-digit code
        async (invalidBackupCode) => {
          // Verify non-existent backup code
          const result = await ticketService.verifyTicketByBackupCode(
            invalidBackupCode,
            'scanner-user-id',
            'Event Entrance',
            'Test Device'
          );

          // Property: Should reject invalid backup code
          expect(result.valid).toBe(false);
          expect(result.message).toContain('not found');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should validate backup codes are exactly 6 digits', async () => {
    // Test that backup codes must be exactly 6 digits
    const invalidCodes = ['12345', '1234567', 'abcdef', '12345a'];

    for (const code of invalidCodes) {
      const result = await ticketService.verifyTicketByBackupCode(
        code,
        'scanner-user-id',
        'Event Entrance',
        'Test Device'
      );

      // Property: Should reject non-6-digit codes
      expect(result.valid).toBe(false);
    }
  });
});
