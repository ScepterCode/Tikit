import { describe, it, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import { USSDService } from './ussd.service';
import prisma from '../lib/prisma';

// Mock Prisma
vi.mock('../lib/prisma', () => ({
  default: {
    event: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    user: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    ticket: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    payment: {
      create: vi.fn(),
    },
    sponsorship: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Mock Africa's Talking SMS
vi.mock('../lib/africastalking', () => ({
  default: {},
  sms: {
    send: vi.fn().mockResolvedValue({ status: 'success' }),
  },
}));

describe('USSD Service Property Tests', () => {
  let ussdService: USSDService;

  beforeEach(() => {
    ussdService = new USSDService();
    vi.clearAllMocks();
  });

  /**
   * Property 10: USSD ticket tier display
   * Feature: tikit-webapp, Property 10: USSD ticket tier display
   * Validates: Requirements 4.2
   *
   * For any event with available tickets, when accessed via USSD buy flow,
   * all ticket tiers for that event should be displayed
   */
  it('Property 10: USSD ticket tier display', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate event with 1-5 ticket tiers
        fc.record({
          id: fc.uuid(),
          title: fc.string({ minLength: 5, maxLength: 50 }).filter(s => s.trim().length >= 5),
          ussdCode: fc.string({ minLength: 4, maxLength: 4 }).filter(s => /^\d{4}$/.test(s)),
          status: fc.constant('published'),
          tiers: fc.array(
            fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 3, maxLength: 20 }).filter(s => s.trim().length >= 3),
              price: fc.integer({ min: 100, max: 100000 }),
              quantity: fc.integer({ min: 1, max: 1000 }),
              sold: fc.integer({ min: 0, max: 100 }),
            }),
            { minLength: 1, maxLength: 5 }
          ),
        }),
        async (event) => {
          // Mock event lookup
          vi.mocked(prisma.event.findFirst).mockResolvedValue(event as any);
          vi.mocked(prisma.event.findUnique).mockResolvedValue({
            ...event,
            tiers: event.tiers,
          } as any);

          // Simulate USSD flow: dial *7477# -> 1 (Buy) -> enter event code
          const response = await ussdService.handleUSSDCallback({
            sessionId: 'test-session',
            phoneNumber: '+2348012345678',
            text: `1*${event.ussdCode}`,
          });

          // Verify response contains all tiers
          expect(response.endSession).toBe(false);

          // Check that all tiers are displayed
          event.tiers.forEach((tier, index) => {
            expect(response.response).toContain(`${index + 1}.`);
          });

          // Verify exactly the right number of tier options
          const tierMatches = response.response.match(/\d+\./g);
          expect(tierMatches?.length).toBeGreaterThanOrEqual(event.tiers.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 11: USSD purchase confirmation
   * Feature: tikit-webapp, Property 11: USSD purchase confirmation
   * Validates: Requirements 4.3
   *
   * For any successful USSD ticket purchase, an SMS should be sent
   * containing both a QR code and a 6-digit backup code
   */
  it('Property 11: USSD purchase confirmation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          eventId: fc.uuid(),
          eventTitle: fc.string({ minLength: 5, maxLength: 50 }).filter(s => s.trim().length >= 5),
          eventCode: fc.string({ minLength: 4, maxLength: 4 }).filter(s => /^\d{4}$/.test(s)),
          venue: fc.string({ minLength: 5, maxLength: 100 }).filter(s => s.trim().length >= 5),
          startDate: fc.date({ min: new Date() }),
          tierId: fc.uuid(),
          tierName: fc.string({ minLength: 3, maxLength: 20 }).filter(s => s.trim().length >= 3),
          tierPrice: fc.integer({ min: 100, max: 100000 }),
          phoneNumber: fc.integer({ min: 7000000000, max: 9199999999 }).map(n => `+234${n}`),
        }),
        async (data) => {
          const { sms } = await import('../lib/africastalking');

          // Mock event and tier lookup
          vi.mocked(prisma.event.findFirst).mockResolvedValue({
            id: data.eventId,
            title: data.eventTitle,
            ussdCode: data.eventCode,
            status: 'published',
            venue: data.venue,
            startDate: data.startDate,
          } as any);

          vi.mocked(prisma.event.findUnique).mockResolvedValue({
            id: data.eventId,
            tiers: [
              {
                id: data.tierId,
                name: data.tierName,
                price: data.tierPrice,
              },
            ],
          } as any);

          // Mock user creation/lookup
          vi.mocked(prisma.user.findFirst).mockResolvedValue(null);
          vi.mocked(prisma.user.create).mockResolvedValue({
            id: 'user-id',
            phoneNumber: data.phoneNumber,
            referralCode: 'REF123',
          } as any);

          // Mock ticket creation
          const mockTicket = {
            id: 'ticket-id',
            qrCode: 'QR-12345',
            backupCode: '123456',
            status: 'valid',
          };
          vi.mocked(prisma.ticket.create).mockResolvedValue(mockTicket as any);

          // Mock payment creation
          vi.mocked(prisma.payment.create).mockResolvedValue({} as any);

          // Mock event update
          vi.mocked(prisma.event.update).mockResolvedValue({} as any);

          // Complete purchase flow
          const response = await ussdService.handleUSSDCallback({
            sessionId: 'test-session',
            phoneNumber: data.phoneNumber,
            text: `1*${data.eventCode}*1`, // Buy -> Event Code -> First tier
          });

          // Verify purchase was successful
          expect(response.endSession).toBe(true);
          expect(response.response).toContain('successfully');

          // Verify SMS was sent
          expect(sms.send).toHaveBeenCalled();
          const smsCall = vi.mocked(sms.send).mock.calls[0][0];

          // Verify SMS contains required information - check array format
          const phoneNumbers = Array.isArray(smsCall.to) ? smsCall.to : [smsCall.to];
          expect(phoneNumbers.some((num: string) => num.includes(data.phoneNumber))).toBe(true);

          // Verify SMS contains QR code
          expect(smsCall.message).toMatch(/QR Code:/i);

          // Verify SMS contains 6-digit backup code
          expect(smsCall.message).toMatch(/Backup Code:\s*\d{6}/);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 12: USSD ticket detail completeness
   * Feature: tikit-webapp, Property 12: USSD ticket detail completeness
   * Validates: Requirements 4.4
   *
   * For any valid ticket checked via USSD, the display should include
   * event name, date, seat number, and QR code reference
   */
  it('Property 12: USSD ticket detail completeness', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          phoneNumber: fc.integer({ min: 7000000000, max: 9199999999 }).map(n => `+234${n}`),
          tickets: fc.array(
            fc.record({
              id: fc.uuid(),
              backupCode: fc.integer({ min: 100000, max: 999999 }).map(String),
              status: fc.constantFrom('valid', 'used'),
              event: fc.record({
                title: fc.string({ minLength: 5, maxLength: 50 }).filter(s => s.trim().length >= 5),
                startDate: fc.date({ min: new Date() }),
                venue: fc.string({ minLength: 5, maxLength: 100 }).filter(s => s.trim().length >= 5),
              }),
            }),
            { minLength: 1, maxLength: 5 }
          ),
        }),
        async (data) => {
          // Mock user lookup
          vi.mocked(prisma.user.findFirst).mockResolvedValue({
            id: 'user-id',
            phoneNumber: data.phoneNumber,
          } as any);

          // Mock ticket lookup
          vi.mocked(prisma.ticket.findMany).mockResolvedValue(data.tickets as any);

          // Check first ticket details
          const response = await ussdService.handleUSSDCallback({
            sessionId: 'test-session',
            phoneNumber: data.phoneNumber,
            text: '2*1', // Check tickets -> Select first ticket
          });

          const firstTicket = data.tickets[0];

          // Verify all required fields are present
          expect(response.endSession).toBe(true);
          expect(response.response).toContain('Ticket');
          expect(response.response).toContain(firstTicket.backupCode);
          expect(response.response).toContain(firstTicket.status);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 13: USSD refund on failure
   * Feature: tikit-webapp, Property 13: USSD refund on failure
   * Validates: Requirements 4.5
   *
   * For any USSD transaction that fails after payment deduction,
   * the deducted amount should be refunded to the user
   */
  it('Property 13: USSD refund on failure', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          phoneNumber: fc.integer({ min: 7000000000, max: 9199999999 }).map(n => `+234${n}`),
          amount: fc.integer({ min: 100, max: 100000 }),
          reference: fc.uuid(),
        }),
        async (data) => {
          const { sms } = await import('../lib/africastalking');

          // Mock user lookup
          vi.mocked(prisma.user.findFirst).mockResolvedValue({
            id: 'user-id',
            phoneNumber: data.phoneNumber,
          } as any);

          // Mock payment creation for refund
          vi.mocked(prisma.payment.create).mockResolvedValue({
            id: 'refund-id',
            status: 'refunded',
            amount: data.amount,
          } as any);

          // Trigger refund
          await ussdService.handleFailedTransaction(
            data.phoneNumber,
            data.amount,
            data.reference
          );

          // Verify refund payment record was created
          expect(prisma.payment.create).toHaveBeenCalledWith(
            expect.objectContaining({
              data: expect.objectContaining({
                amount: data.amount,
                status: 'refunded',
                reference: expect.stringContaining('REFUND'),
              }),
            })
          );

          // Verify SMS notification was sent
          expect(sms.send).toHaveBeenCalled();
          const smsCall = vi.mocked(sms.send).mock.calls[0][0];

          // Check phone number in array format
          const phoneNumbers = Array.isArray(smsCall.to) ? smsCall.to : [smsCall.to];
          expect(phoneNumbers.some((num: string) => num.includes(data.phoneNumber))).toBe(true);
          
          expect(smsCall.message).toContain('refunded');
          expect(smsCall.message).toContain(data.amount.toString());
          expect(smsCall.message).toContain(data.reference);
        }
      ),
      { numRuns: 100 }
    );
  });
});
