/**
 * Property-Based Tests for Offline Wallet Accessibility
 * Feature: tikit-webapp, Property 29: Offline wallet accessibility
 * Validates: Requirements 9.2
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { offlineStorage, OfflineTicket } from './offlineStorage';

// Reuse the same arbitraries from offlineStorage.test.ts
const ticketStatusArb = fc.constantFrom(
  'valid',
  'used',
  'cancelled',
  'refunded'
);

const nigerianStateArb = fc.constantFrom(
  'Lagos',
  'Kano',
  'Rivers',
  'Kaduna',
  'Oyo',
  'Abuja'
);

const offlineTicketArb: fc.Arbitrary<OfflineTicket> = fc.record({
  id: fc.uuid(),
  eventId: fc.uuid(),
  userId: fc.uuid(),
  tierId: fc.uuid(),
  qrCode: fc.string({ minLength: 20, maxLength: 100 }),
  backupCode: fc
    .integer({ min: 100000, max: 999999 })
    .map((n) => n.toString()),
  status: ticketStatusArb,
  purchaseDate: fc
    .integer({ min: Date.parse('2020-01-01'), max: Date.parse('2030-12-31') })
    .map((ts) => new Date(ts).toISOString()),
  usedAt: fc.option(
    fc
      .integer({ min: Date.parse('2020-01-01'), max: Date.parse('2030-12-31') })
      .map((ts) => new Date(ts).toISOString()),
    { nil: undefined }
  ),
  eventDetails: fc.record({
    title: fc.string({ minLength: 5, maxLength: 100 }),
    description: fc.string({ minLength: 10, maxLength: 500 }),
    startDate: fc
      .integer({ min: Date.parse('2025-01-01'), max: Date.parse('2030-12-31') })
      .map((ts) => new Date(ts).toISOString()),
    endDate: fc
      .integer({ min: Date.parse('2025-01-01'), max: Date.parse('2030-12-31') })
      .map((ts) => new Date(ts).toISOString()),
    venue: fc.string({ minLength: 5, maxLength: 200 }),
    state: nigerianStateArb,
    lga: fc.string({ minLength: 3, maxLength: 50 }),
    images: fc.array(fc.webUrl(), { minLength: 0, maxLength: 5 }),
  }),
  tierDetails: fc.record({
    name: fc.constantFrom('VIP', 'Regular', 'Economy', 'Premium'),
    price: fc.integer({ min: 1000, max: 100000 }),
  }),
  culturalSelections: fc.option(
    fc.record({
      asoEbiTier: fc.option(fc.string(), { nil: undefined }),
      foodChoice: fc.option(fc.string(), { nil: undefined }),
    }),
    { nil: undefined }
  ),
  lastSyncedAt: fc
    .integer({ min: Date.parse('2020-01-01'), max: Date.parse('2030-12-31') })
    .map((ts) => new Date(ts).toISOString()),
});

describe('Offline Wallet Accessibility - Property Tests', () => {
  beforeEach(async () => {
    // Clear any existing data first
    try {
      await offlineStorage.clearAllTickets();
    } catch (e) {
      // Database might not be initialized yet
    }
    // Initialize the database before each test
    await offlineStorage.init();
    // Clear any existing data again to ensure clean state
    await offlineStorage.clearAllTickets();
  });

  afterEach(async () => {
    // Clean up after each test
    await offlineStorage.clearAllTickets();
  });

  /**
   * Property 29: Offline wallet accessibility
   * For any offline state (no internet connection), all previously stored tickets
   * should be accessible with their QR codes and event details
   */
  it('Property 29: Offline wallet accessibility - tickets are accessible without internet', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(offlineTicketArb, { minLength: 1, maxLength: 10 }),
        async (tickets) => {
          // Clear before this test
          await offlineStorage.clearAllTickets();

          // Store tickets (simulating online state)
          await offlineStorage.storeTickets(tickets);

          // Simulate offline state by retrieving tickets
          // (IndexedDB works offline, so this simulates offline access)
          const retrievedTickets = await offlineStorage.getAllTickets();

          // Verify all tickets are accessible
          expect(retrievedTickets.length).toBe(tickets.length);

          // Verify each ticket has QR code and event details
          for (const ticket of retrievedTickets) {
            // QR code should be accessible
            expect(ticket.qrCode).toBeTruthy();
            expect(ticket.qrCode.length).toBeGreaterThan(0);

            // Backup code should be accessible
            expect(ticket.backupCode).toBeTruthy();
            expect(ticket.backupCode).toMatch(/^\d{6}$/);

            // Event details should be accessible
            expect(ticket.eventDetails).toBeDefined();
            expect(ticket.eventDetails.title).toBeTruthy();
            expect(ticket.eventDetails.venue).toBeTruthy();
            expect(ticket.eventDetails.startDate).toBeTruthy();
            expect(ticket.eventDetails.state).toBeTruthy();
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('Property 29: Offline wallet accessibility - individual tickets can be retrieved offline', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(offlineTicketArb, { minLength: 1, maxLength: 5 }),
        async (tickets) => {
          // Clear before this test
          await offlineStorage.clearAllTickets();

          // Store tickets
          await offlineStorage.storeTickets(tickets);

          // Verify each ticket can be retrieved individually (offline access)
          for (const ticket of tickets) {
            const retrieved = await offlineStorage.getTicket(ticket.id);

            // Ticket should be accessible
            expect(retrieved).not.toBeNull();
            expect(retrieved?.id).toBe(ticket.id);

            // QR code and backup code should be accessible
            expect(retrieved?.qrCode).toBe(ticket.qrCode);
            expect(retrieved?.backupCode).toBe(ticket.backupCode);

            // Event details should be complete
            expect(retrieved?.eventDetails.title).toBe(
              ticket.eventDetails.title
            );
            expect(retrieved?.eventDetails.venue).toBe(
              ticket.eventDetails.venue
            );
            expect(retrieved?.eventDetails.startDate).toBe(
              ticket.eventDetails.startDate
            );
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('Property 29: Offline wallet accessibility - user tickets are accessible offline', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.array(offlineTicketArb, { minLength: 1, maxLength: 5 }),
        async (userId, tickets) => {
          // Clear before this test
          await offlineStorage.clearAllTickets();

          // Set all tickets to the same user
          const userTickets = tickets.map((t) => ({ ...t, userId }));

          // Store tickets
          await offlineStorage.storeTickets(userTickets);

          // Retrieve user's tickets (offline access)
          const retrieved = await offlineStorage.getUserTickets(userId);

          // All user tickets should be accessible
          expect(retrieved.length).toBe(userTickets.length);

          // Each ticket should have complete data
          for (const ticket of retrieved) {
            expect(ticket.userId).toBe(userId);
            expect(ticket.qrCode).toBeTruthy();
            expect(ticket.backupCode).toBeTruthy();
            expect(ticket.eventDetails).toBeDefined();
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('Property 29: Offline wallet accessibility - ticket status is accessible offline', async () => {
    await fc.assert(
      fc.asyncProperty(offlineTicketArb, async (ticket) => {
        // Clear before this test
        await offlineStorage.clearAllTickets();

        // Store ticket
        await offlineStorage.storeTicket(ticket);

        // Retrieve ticket (offline access)
        const retrieved = await offlineStorage.getTicket(ticket.id);

        // Status should be accessible
        expect(retrieved?.status).toBe(ticket.status);

        // If ticket is used, usedAt should be accessible
        if (ticket.status === 'used' && ticket.usedAt) {
          expect(retrieved?.usedAt).toBe(ticket.usedAt);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('Property 29: Offline wallet accessibility - cultural selections are accessible offline', async () => {
    await fc.assert(
      fc.asyncProperty(offlineTicketArb, async (ticket) => {
        // Clear before this test
        await offlineStorage.clearAllTickets();

        // Store ticket
        await offlineStorage.storeTicket(ticket);

        // Retrieve ticket (offline access)
        const retrieved = await offlineStorage.getTicket(ticket.id);

        // Cultural selections should be accessible if present
        if (ticket.culturalSelections) {
          expect(retrieved?.culturalSelections).toBeDefined();
          if (ticket.culturalSelections.asoEbiTier) {
            expect(retrieved?.culturalSelections?.asoEbiTier).toBe(
              ticket.culturalSelections.asoEbiTier
            );
          }
          if (ticket.culturalSelections.foodChoice) {
            expect(retrieved?.culturalSelections?.foodChoice).toBe(
              ticket.culturalSelections.foodChoice
            );
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  it('Property 29: Offline wallet accessibility - tier details are accessible offline', async () => {
    await fc.assert(
      fc.asyncProperty(offlineTicketArb, async (ticket) => {
        // Clear before this test
        await offlineStorage.clearAllTickets();

        // Store ticket
        await offlineStorage.storeTicket(ticket);

        // Retrieve ticket (offline access)
        const retrieved = await offlineStorage.getTicket(ticket.id);

        // Tier details should be accessible
        expect(retrieved?.tierDetails).toBeDefined();
        expect(retrieved?.tierDetails.name).toBe(ticket.tierDetails.name);
        expect(retrieved?.tierDetails.price).toBe(ticket.tierDetails.price);
      }),
      { numRuns: 100 }
    );
  });

  it('Property 29: Offline wallet accessibility - event images are accessible offline', async () => {
    await fc.assert(
      fc.asyncProperty(offlineTicketArb, async (ticket) => {
        // Clear before this test
        await offlineStorage.clearAllTickets();

        // Store ticket
        await offlineStorage.storeTicket(ticket);

        // Retrieve ticket (offline access)
        const retrieved = await offlineStorage.getTicket(ticket.id);

        // Event images should be accessible
        expect(retrieved?.eventDetails.images).toBeDefined();
        expect(retrieved?.eventDetails.images.length).toBe(
          ticket.eventDetails.images.length
        );

        // Each image URL should match
        for (let i = 0; i < ticket.eventDetails.images.length; i++) {
          expect(retrieved?.eventDetails.images[i]).toBe(
            ticket.eventDetails.images[i]
          );
        }
      }),
      { numRuns: 100 }
    );
  });
});
