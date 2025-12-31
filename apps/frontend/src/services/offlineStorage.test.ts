/**
 * Property-Based Tests for Offline Storage Service
 * Feature: tikit-webapp, Property 28: Offline ticket storage
 * Validates: Requirements 9.1
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { offlineStorage, OfflineTicket } from './offlineStorage';

// Custom arbitraries for generating test data
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

const _eventTypeArb = fc.constantFrom(
  'wedding',
  'crusade',
  'burial',
  'festival',
  'general'
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

describe('Offline Storage Service - Property Tests', () => {
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
   * Property 28: Offline ticket storage
   * For any ticket purchase, the QR code and 6-digit backup code should be stored in local browser storage
   */
  it('Property 28: Offline ticket storage - stored tickets can be retrieved with QR and backup codes', async () => {
    await fc.assert(
      fc.asyncProperty(offlineTicketArb, async (ticket) => {
        // Clear before this test
        await offlineStorage.clearAllTickets();
        
        // Store the ticket
        await offlineStorage.storeTicket(ticket);

        // Retrieve the ticket
        const retrieved = await offlineStorage.getTicket(ticket.id);

        // Verify the ticket was stored and can be retrieved
        expect(retrieved).not.toBeNull();
        expect(retrieved?.id).toBe(ticket.id);
        expect(retrieved?.qrCode).toBe(ticket.qrCode);
        expect(retrieved?.backupCode).toBe(ticket.backupCode);

        // Verify backup code is 6 digits
        expect(retrieved?.backupCode).toMatch(/^\d{6}$/);

        // Verify QR code is present and non-empty
        expect(retrieved?.qrCode).toBeTruthy();
        expect(retrieved?.qrCode.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });

  it('Property 28: Offline ticket storage - event details are cached with tickets', async () => {
    await fc.assert(
      fc.asyncProperty(offlineTicketArb, async (ticket) => {
        // Clear before this test
        await offlineStorage.clearAllTickets();
        
        // Store the ticket
        await offlineStorage.storeTicket(ticket);

        // Retrieve the ticket
        const retrieved = await offlineStorage.getTicket(ticket.id);

        // Verify event details are stored
        expect(retrieved?.eventDetails).toBeDefined();
        expect(retrieved?.eventDetails.title).toBe(ticket.eventDetails.title);
        expect(retrieved?.eventDetails.venue).toBe(ticket.eventDetails.venue);
        expect(retrieved?.eventDetails.startDate).toBe(
          ticket.eventDetails.startDate
        );
        expect(retrieved?.eventDetails.state).toBe(ticket.eventDetails.state);
      }),
      { numRuns: 100 }
    );
  });

  it('Property 28: Offline ticket storage - multiple tickets can be stored and retrieved', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(offlineTicketArb, { minLength: 1, maxLength: 10 }),
        async (tickets) => {
          // Clear before this test
          await offlineStorage.clearAllTickets();
          
          // Store all tickets
          await offlineStorage.storeTickets(tickets);

          // Retrieve all tickets
          const allTickets = await offlineStorage.getAllTickets();

          // Verify all tickets were stored
          expect(allTickets.length).toBe(tickets.length);

          // Verify each ticket can be retrieved individually
          for (const ticket of tickets) {
            const retrieved = await offlineStorage.getTicket(ticket.id);
            expect(retrieved).not.toBeNull();
            expect(retrieved?.id).toBe(ticket.id);
            expect(retrieved?.qrCode).toBe(ticket.qrCode);
            expect(retrieved?.backupCode).toBe(ticket.backupCode);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('Property 28: Offline ticket storage - tickets can be retrieved by user ID', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.array(offlineTicketArb, { minLength: 1, maxLength: 5 }),
        async (userId, tickets) => {
          // Clear before this test
          await offlineStorage.clearAllTickets();
          
          // Set all tickets to the same user ID
          const userTickets = tickets.map((t) => ({ ...t, userId }));

          // Store all tickets
          await offlineStorage.storeTickets(userTickets);

          // Retrieve tickets for this user
          const retrieved = await offlineStorage.getUserTickets(userId);

          // Verify all user tickets were retrieved
          expect(retrieved.length).toBe(userTickets.length);

          // Verify all retrieved tickets belong to the user
          for (const ticket of retrieved) {
            expect(ticket.userId).toBe(userId);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('Property 28: Offline ticket storage - ticket updates are persisted', async () => {
    await fc.assert(
      fc.asyncProperty(offlineTicketArb, async (ticket) => {
        // Clear before this test
        await offlineStorage.clearAllTickets();
        
        // Store the original ticket
        await offlineStorage.storeTicket(ticket);

        // Update the ticket status
        const updatedTicket = { ...ticket, status: 'used' as const };
        await offlineStorage.updateTicket(updatedTicket);

        // Retrieve the ticket
        const retrieved = await offlineStorage.getTicket(ticket.id);

        // Verify the update was persisted
        expect(retrieved?.status).toBe('used');
        expect(retrieved?.id).toBe(ticket.id);
      }),
      { numRuns: 100 }
    );
  });

  it('Property 28: Offline ticket storage - deleted tickets cannot be retrieved', async () => {
    await fc.assert(
      fc.asyncProperty(offlineTicketArb, async (ticket) => {
        // Clear before this test
        await offlineStorage.clearAllTickets();
        
        // Store the ticket
        await offlineStorage.storeTicket(ticket);

        // Verify it exists
        const beforeDelete = await offlineStorage.getTicket(ticket.id);
        expect(beforeDelete).not.toBeNull();

        // Delete the ticket
        await offlineStorage.deleteTicket(ticket.id);

        // Verify it no longer exists
        const afterDelete = await offlineStorage.getTicket(ticket.id);
        expect(afterDelete).toBeNull();
      }),
      { numRuns: 100 }
    );
  });

  it('Property 28: Offline ticket storage - storage quota information is available', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(offlineTicketArb, { minLength: 1, maxLength: 5 }),
        async (tickets) => {
          // Clear before this test
          await offlineStorage.clearAllTickets();
          
          // Store tickets
          await offlineStorage.storeTickets(tickets);

          // Get storage info
          const info = await offlineStorage.getStorageInfo();

          // Verify storage info is returned
          expect(info.ticketCount).toBe(tickets.length);
          expect(info.storageUsage).toBeDefined();
          expect(info.storageUsage.percentage).toBeGreaterThanOrEqual(0);
          expect(info.storageUsage.percentage).toBeLessThanOrEqual(1);
        }
      ),
      { numRuns: 50 }
    );
  });
});
