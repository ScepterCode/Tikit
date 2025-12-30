import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { prisma } from '../lib/prisma.js';
import { createWeddingEvent } from './event.service.js';
import { ticketService } from './ticket.service.js';

/**
 * Feature: tikit-webapp, Property 19: Wedding ticket purchase prompts
 * Validates: Requirements 6.2
 * 
 * Property: For any wedding event ticket purchase, the system should prompt 
 * the buyer for food RSVP selection and aso-ebi tier preference
 */

describe('Property 19: Wedding ticket purchase prompts', () => {
  let testUserId: string;
  let testEventId: string;

  beforeEach(async () => {
    // Create a test user
    const user = await prisma.user.create({
      data: {
        phoneNumber: `+234${Math.floor(Math.random() * 10000000000)}`,
        phoneVerified: true,
        state: 'Lagos',
        referralCode: `REF${Math.floor(Math.random() * 1000000)}`,
      },
    });
    testUserId = user.id;
  });

  afterEach(async () => {
    // Clean up test data
    if (testEventId) {
      await prisma.ticket.deleteMany({ where: { eventId: testEventId } });
      await prisma.event.deleteMany({ where: { id: testEventId } });
    }
    if (testUserId) {
      await prisma.user.deleteMany({ where: { id: testUserId } });
    }
  });

  it('should require food and aso-ebi selections for wedding events', async () => {
    /**
     * Property: For any wedding event with food options and aso-ebi tiers,
     * when a ticket is purchased, the cultural selections should include
     * both foodChoice and asoEbiTier fields
     */
    await fc.assert(
      fc.asyncProperty(
        // Generate random food options (1-5 options)
        fc.array(
          fc.record({
            name: fc.string({ minLength: 3, maxLength: 30 }),
            dietaryInfo: fc.string({ minLength: 0, maxLength: 50 }),
          }),
          { minLength: 1, maxLength: 5 }
        ),
        // Generate random aso-ebi tiers (1-5 tiers)
        fc.array(
          fc.record({
            name: fc.string({ minLength: 3, maxLength: 20 }),
            price: fc.integer({ min: 1000, max: 100000 }),
            color: fc.hexaString({ minLength: 6, maxLength: 6 }).map(h => `#${h}`),
          }),
          { minLength: 1, maxLength: 5 }
        ),
        async (foodOptions, asoEbiTiers) => {
          // Create a wedding event with cultural features
          const result = await createWeddingEvent(testUserId, {
            title: 'Test Wedding',
            description: 'Test wedding event',
            startDate: new Date(Date.now() + 86400000), // Tomorrow
            endDate: new Date(Date.now() + 86400000 * 2), // Day after tomorrow
            venue: 'Test Venue',
            state: 'Lagos',
            lga: 'Ikeja',
            latitude: 6.5244,
            longitude: 3.3792,
            capacity: 100,
            tiers: [
              {
                id: 'tier1',
                name: 'Regular',
                price: 5000,
                quantity: 100,
                sold: 0,
              },
            ],
            foodOptions,
            asoEbiTiers,
            sprayMoneyEnabled: true,
          });

          expect(result.success).toBe(true);
          testEventId = result.event!.id;

          // Verify the event has cultural features
          const event = await prisma.event.findUnique({
            where: { id: testEventId },
          });

          expect(event).toBeTruthy();
          const culturalFeatures = event!.culturalFeatures as any;
          
          // Property assertion: Wedding events must have food options and aso-ebi tiers
          expect(culturalFeatures.foodOptions).toBeDefined();
          expect(culturalFeatures.asoEbiTiers).toBeDefined();
          expect(Array.isArray(culturalFeatures.foodOptions)).toBe(true);
          expect(Array.isArray(culturalFeatures.asoEbiTiers)).toBe(true);
          expect(culturalFeatures.foodOptions.length).toBeGreaterThan(0);
          expect(culturalFeatures.asoEbiTiers.length).toBeGreaterThan(0);

          // Simulate ticket purchase with cultural selections
          const payment = await prisma.payment.create({
            data: {
              userId: testUserId,
              amount: 5000,
              currency: 'NGN',
              method: 'card',
              status: 'successful',
              provider: 'paystack',
              reference: `REF${Date.now()}`,
            },
          });

          // Select random food and aso-ebi options
          const selectedFood = foodOptions[Math.floor(Math.random() * foodOptions.length)];
          const selectedAsoEbi = asoEbiTiers[Math.floor(Math.random() * asoEbiTiers.length)];

          const culturalSelections = {
            foodChoice: selectedFood.name,
            asoEbiTier: selectedAsoEbi.name,
          };

          const ticket = await ticketService.issueTicket({
            userId: testUserId,
            eventId: testEventId,
            tierId: 'tier1',
            paymentId: payment.id,
            culturalSelections,
          });

          // Property assertion: Ticket must contain cultural selections
          const savedTicket = await prisma.ticket.findUnique({
            where: { id: ticket.id },
          });

          expect(savedTicket).toBeTruthy();
          const savedSelections = savedTicket!.culturalSelections as any;
          
          // Core property: Wedding tickets must have both food and aso-ebi selections
          expect(savedSelections).toBeDefined();
          expect(savedSelections.foodChoice).toBeDefined();
          expect(savedSelections.asoEbiTier).toBeDefined();
          expect(savedSelections.foodChoice).toBe(selectedFood.name);
          expect(savedSelections.asoEbiTier).toBe(selectedAsoEbi.name);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should validate that food choice is from available options', async () => {
    /**
     * Property: For any wedding event, the food choice in cultural selections
     * must be one of the available food options defined in the event
     */
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            name: fc.string({ minLength: 3, maxLength: 30 }),
            dietaryInfo: fc.string({ minLength: 0, maxLength: 50 }),
          }),
          { minLength: 1, maxLength: 5 }
        ),
        fc.array(
          fc.record({
            name: fc.string({ minLength: 3, maxLength: 20 }),
            price: fc.integer({ min: 1000, max: 100000 }),
            color: fc.hexaString({ minLength: 6, maxLength: 6 }).map(h => `#${h}`),
          }),
          { minLength: 1, maxLength: 5 }
        ),
        async (foodOptions, asoEbiTiers) => {
          // Create wedding event
          const result = await createWeddingEvent(testUserId, {
            title: 'Test Wedding',
            description: 'Test wedding event',
            startDate: new Date(Date.now() + 86400000),
            endDate: new Date(Date.now() + 86400000 * 2),
            venue: 'Test Venue',
            state: 'Lagos',
            lga: 'Ikeja',
            latitude: 6.5244,
            longitude: 3.3792,
            capacity: 100,
            tiers: [
              {
                id: 'tier1',
                name: 'Regular',
                price: 5000,
                quantity: 100,
                sold: 0,
              },
            ],
            foodOptions,
            asoEbiTiers,
          });

          testEventId = result.event!.id;

          const payment = await prisma.payment.create({
            data: {
              userId: testUserId,
              amount: 5000,
              currency: 'NGN',
              method: 'card',
              status: 'successful',
              provider: 'paystack',
              reference: `REF${Date.now()}`,
            },
          });

          // Select valid options
          const selectedFood = foodOptions[Math.floor(Math.random() * foodOptions.length)];
          const selectedAsoEbi = asoEbiTiers[Math.floor(Math.random() * asoEbiTiers.length)];

          const ticket = await ticketService.issueTicket({
            userId: testUserId,
            eventId: testEventId,
            tierId: 'tier1',
            paymentId: payment.id,
            culturalSelections: {
              foodChoice: selectedFood.name,
              asoEbiTier: selectedAsoEbi.name,
            },
          });

          const savedTicket = await prisma.ticket.findUnique({
            where: { id: ticket.id },
          });

          const savedSelections = savedTicket!.culturalSelections as any;
          const event = await prisma.event.findUnique({
            where: { id: testEventId },
          });
          const culturalFeatures = event!.culturalFeatures as any;

          // Property: Selected food must be in the available food options
          const availableFoodNames = culturalFeatures.foodOptions.map((f: any) => f.name);
          expect(availableFoodNames).toContain(savedSelections.foodChoice);

          // Property: Selected aso-ebi must be in the available tiers
          const availableAsoEbiNames = culturalFeatures.asoEbiTiers.map((t: any) => t.name);
          expect(availableAsoEbiNames).toContain(savedSelections.asoEbiTier);
        }
      ),
      { numRuns: 100 }
    );
  });
});
