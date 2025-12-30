import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { prisma } from '../lib/prisma.js';
import { createWeddingEvent, getWeddingAnalytics, addSprayMoneyTransaction } from './event.service.js';
import { ticketService } from './ticket.service.js';

/**
 * Feature: tikit-webapp, Property 21: Wedding analytics accuracy
 * Validates: Requirements 6.4
 * 
 * Property: For any wedding event, the analytics should accurately aggregate
 * food counts, aso-ebi sales by tier, and total spray money collected
 */

describe('Property 21: Wedding analytics accuracy', () => {
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
      await prisma.payment.deleteMany({ where: { userId: testUserId } });
      await prisma.event.deleteMany({ where: { id: testEventId } });
    }
    if (testUserId) {
      await prisma.user.deleteMany({ where: { id: testUserId } });
    }
  });

  it('should accurately count food selections', async () => {
    /**
     * Property: For any set of tickets with food selections, the analytics
     * should show the correct count for each food option
     */
    await fc.assert(
      fc.asyncProperty(
        // Generate food options
        fc.array(
          fc.record({
            name: fc.string({ minLength: 3, maxLength: 30 }),
            dietaryInfo: fc.string({ minLength: 0, maxLength: 50 }),
          }),
          { minLength: 2, maxLength: 5 }
        ),
        // Generate ticket selections (2-10 tickets)
        fc.array(
          fc.nat(),
          { minLength: 2, maxLength: 10 }
        ),
        async (foodOptions, ticketFoodIndices) => {
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
            asoEbiTiers: [{ name: 'Gold', price: 10000, color: '#FFD700' }],
            foodOptions,
            sprayMoneyEnabled: true,
          });

          testEventId = result.event!.id;

          // Count expected food selections
          const expectedFoodCounts: Record<string, number> = {};
          
          // Create tickets with food selections
          for (const foodIndex of ticketFoodIndices) {
            const selectedFood = foodOptions[foodIndex % foodOptions.length];
            expectedFoodCounts[selectedFood.name] = (expectedFoodCounts[selectedFood.name] || 0) + 1;

            // Create payment
            const payment = await prisma.payment.create({
              data: {
                userId: testUserId,
                amount: 5000,
                currency: 'NGN',
                method: 'card',
                status: 'successful',
                provider: 'paystack',
                reference: `REF${Date.now()}-${Math.random()}`,
              },
            });

            // Issue ticket with cultural selections
            await ticketService.issueTicket({
              userId: testUserId,
              eventId: testEventId,
              tierId: 'tier1',
              paymentId: payment.id,
              culturalSelections: {
                foodChoice: selectedFood.name,
                asoEbiTier: 'Gold',
              },
            });
          }

          // Get analytics
          const analyticsResult = await getWeddingAnalytics(testEventId);
          expect(analyticsResult.success).toBe(true);

          const analytics = analyticsResult.analytics!;

          // Property assertion: Food counts should match expected counts
          for (const [foodName, expectedCount] of Object.entries(expectedFoodCounts)) {
            expect(analytics.foodCounts[foodName]).toBe(expectedCount);
          }

          // Property assertion: Total tickets should match number of selections
          expect(analytics.totalTickets).toBe(ticketFoodIndices.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should accurately count aso-ebi tier sales', async () => {
    /**
     * Property: For any set of tickets with aso-ebi selections, the analytics
     * should show the correct count for each tier
     */
    await fc.assert(
      fc.asyncProperty(
        // Generate aso-ebi tiers
        fc.array(
          fc.record({
            name: fc.string({ minLength: 3, maxLength: 20 }),
            price: fc.integer({ min: 1000, max: 100000 }),
            color: fc.hexaString({ minLength: 6, maxLength: 6 }).map(h => `#${h}`),
          }),
          { minLength: 2, maxLength: 5 }
        ),
        // Generate ticket selections (2-10 tickets)
        fc.array(
          fc.nat(),
          { minLength: 2, maxLength: 10 }
        ),
        async (asoEbiTiers, ticketAsoEbiIndices) => {
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
            asoEbiTiers,
            foodOptions: [{ name: 'Jollof Rice', dietaryInfo: 'None' }],
            sprayMoneyEnabled: true,
          });

          testEventId = result.event!.id;

          // Count expected aso-ebi selections
          const expectedAsoEbiCounts: Record<string, number> = {};
          
          // Create tickets with aso-ebi selections
          for (const asoEbiIndex of ticketAsoEbiIndices) {
            const selectedAsoEbi = asoEbiTiers[asoEbiIndex % asoEbiTiers.length];
            expectedAsoEbiCounts[selectedAsoEbi.name] = (expectedAsoEbiCounts[selectedAsoEbi.name] || 0) + 1;

            // Create payment
            const payment = await prisma.payment.create({
              data: {
                userId: testUserId,
                amount: 5000,
                currency: 'NGN',
                method: 'card',
                status: 'successful',
                provider: 'paystack',
                reference: `REF${Date.now()}-${Math.random()}`,
              },
            });

            // Issue ticket with cultural selections
            await ticketService.issueTicket({
              userId: testUserId,
              eventId: testEventId,
              tierId: 'tier1',
              paymentId: payment.id,
              culturalSelections: {
                foodChoice: 'Jollof Rice',
                asoEbiTier: selectedAsoEbi.name,
              },
            });
          }

          // Get analytics
          const analyticsResult = await getWeddingAnalytics(testEventId);
          expect(analyticsResult.success).toBe(true);

          const analytics = analyticsResult.analytics!;

          // Property assertion: Aso-ebi counts should match expected counts
          for (const [tierName, expectedCount] of Object.entries(expectedAsoEbiCounts)) {
            expect(analytics.asoEbiSales[tierName]).toBe(expectedCount);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should accurately sum total spray money', async () => {
    /**
     * Property: For any set of spray money transactions, the analytics
     * should show the correct total sum
     */
    await fc.assert(
      fc.asyncProperty(
        // Generate spray money transactions (1-10 transactions)
        fc.array(
          fc.integer({ min: 100, max: 50000 }),
          { minLength: 1, maxLength: 10 }
        ),
        async (sprayMoneyAmounts) => {
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
            asoEbiTiers: [{ name: 'Gold', price: 10000, color: '#FFD700' }],
            foodOptions: [{ name: 'Jollof Rice', dietaryInfo: 'None' }],
            sprayMoneyEnabled: true,
          });

          testEventId = result.event!.id;

          // Add spray money transactions
          let expectedTotal = 0;
          for (const amount of sprayMoneyAmounts) {
            await addSprayMoneyTransaction(testEventId, testUserId, amount);
            expectedTotal += amount;
          }

          // Get analytics
          const analyticsResult = await getWeddingAnalytics(testEventId);
          expect(analyticsResult.success).toBe(true);

          const analytics = analyticsResult.analytics!;

          // Property assertion: Total spray money should equal sum of all transactions
          expect(analytics.totalSprayMoney).toBe(expectedTotal);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should provide complete analytics with all metrics', async () => {
    /**
     * Property: For any wedding event with tickets and spray money, the analytics
     * should include all required metrics: foodCounts, asoEbiSales, totalSprayMoney, totalTickets
     */
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 5 }), // Number of tickets
        fc.integer({ min: 0, max: 10000 }), // Spray money amount
        async (numTickets, sprayMoneyAmount) => {
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
            asoEbiTiers: [{ name: 'Gold', price: 10000, color: '#FFD700' }],
            foodOptions: [{ name: 'Jollof Rice', dietaryInfo: 'None' }],
            sprayMoneyEnabled: true,
          });

          testEventId = result.event!.id;

          // Create tickets
          for (let i = 0; i < numTickets; i++) {
            const payment = await prisma.payment.create({
              data: {
                userId: testUserId,
                amount: 5000,
                currency: 'NGN',
                method: 'card',
                status: 'successful',
                provider: 'paystack',
                reference: `REF${Date.now()}-${i}`,
              },
            });

            await ticketService.issueTicket({
              userId: testUserId,
              eventId: testEventId,
              tierId: 'tier1',
              paymentId: payment.id,
              culturalSelections: {
                foodChoice: 'Jollof Rice',
                asoEbiTier: 'Gold',
              },
            });
          }

          // Add spray money if amount > 0
          if (sprayMoneyAmount > 0) {
            await addSprayMoneyTransaction(testEventId, testUserId, sprayMoneyAmount);
          }

          // Get analytics
          const analyticsResult = await getWeddingAnalytics(testEventId);
          expect(analyticsResult.success).toBe(true);

          const analytics = analyticsResult.analytics!;

          // Property assertion: All required fields should be present
          expect(analytics).toHaveProperty('foodCounts');
          expect(analytics).toHaveProperty('asoEbiSales');
          expect(analytics).toHaveProperty('totalSprayMoney');
          expect(analytics).toHaveProperty('totalTickets');

          // Property assertion: Values should be correct
          expect(analytics.totalTickets).toBe(numTickets);
          expect(analytics.totalSprayMoney).toBe(sprayMoneyAmount);
          expect(analytics.foodCounts['Jollof Rice']).toBe(numTickets);
          expect(analytics.asoEbiSales['Gold']).toBe(numTickets);
        }
      ),
      { numRuns: 100 }
    );
  });
});
