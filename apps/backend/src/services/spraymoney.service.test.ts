import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { prisma } from '../lib/prisma.js';
import { createWeddingEvent, addSprayMoneyTransaction, getSprayMoneyLeaderboard } from './event.service.js';

/**
 * Feature: tikit-webapp, Property 20: Spray money leaderboard updates
 * Validates: Requirements 6.3
 * 
 * Property: For any spray money transaction during a wedding event, the leaderboard
 * should update to reflect the new contribution amount and ranking
 */

describe('Property 20: Spray money leaderboard updates', () => {
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
      await prisma.event.deleteMany({ where: { id: testEventId } });
    }
    if (testUserId) {
      await prisma.user.deleteMany({ where: { id: testUserId } });
    }
  });

  it('should update leaderboard with each spray money transaction', async () => {
    /**
     * Property: For any sequence of spray money transactions, the leaderboard
     * should accurately reflect the cumulative amounts for each user
     */
    await fc.assert(
      fc.asyncProperty(
        // Generate a sequence of transactions (1-10 transactions)
        fc.array(
          fc.record({
            amount: fc.integer({ min: 100, max: 100000 }),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (transactions) => {
          // Create a wedding event with spray money enabled
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

          expect(result.success).toBe(true);
          testEventId = result.event!.id;

          // Add all transactions
          let expectedTotal = 0;
          for (const transaction of transactions) {
            const addResult = await addSprayMoneyTransaction(
              testEventId,
              testUserId,
              transaction.amount
            );
            expect(addResult.success).toBe(true);
            expectedTotal += transaction.amount;
          }

          // Get leaderboard
          const leaderboardResult = await getSprayMoneyLeaderboard(testEventId);
          expect(leaderboardResult.success).toBe(true);

          // Property assertion: Total spray money should equal sum of all transactions
          expect(leaderboardResult.totalSprayMoney).toBe(expectedTotal);

          // Property assertion: User should appear in leaderboard with correct total
          const userEntry = leaderboardResult.leaderboard!.find(
            (entry: any) => entry.userId === testUserId
          );
          expect(userEntry).toBeDefined();
          expect(userEntry!.totalAmount).toBe(expectedTotal);
          expect(userEntry!.transactionCount).toBe(transactions.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain correct ranking order in leaderboard', async () => {
    /**
     * Property: For any set of users with different spray money amounts,
     * the leaderboard should be sorted in descending order by total amount
     */
    await fc.assert(
      fc.asyncProperty(
        // Generate multiple users with different amounts (2-5 users)
        fc.array(
          fc.record({
            amount: fc.integer({ min: 1000, max: 50000 }),
          }),
          { minLength: 2, maxLength: 5 }
        ),
        async (userAmounts) => {
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

          // Create multiple users and add their transactions
          const userIds: string[] = [];
          for (const userAmount of userAmounts) {
            const user = await prisma.user.create({
              data: {
                phoneNumber: `+234${Math.floor(Math.random() * 10000000000)}`,
                phoneVerified: true,
                state: 'Lagos',
                referralCode: `REF${Math.floor(Math.random() * 1000000)}`,
              },
            });
            userIds.push(user.id);

            await addSprayMoneyTransaction(testEventId, user.id, userAmount.amount);
          }

          // Get leaderboard
          const leaderboardResult = await getSprayMoneyLeaderboard(testEventId);
          expect(leaderboardResult.success).toBe(true);

          const leaderboard = leaderboardResult.leaderboard!;

          // Property assertion: Leaderboard should be sorted in descending order
          for (let i = 0; i < leaderboard.length - 1; i++) {
            expect(leaderboard[i].totalAmount).toBeGreaterThanOrEqual(
              leaderboard[i + 1].totalAmount
            );
          }

          // Property assertion: All users should be in the leaderboard
          for (const userId of userIds) {
            const entry = leaderboard.find((e: any) => e.userId === userId);
            expect(entry).toBeDefined();
          }

          // Clean up created users
          await prisma.user.deleteMany({
            where: { id: { in: userIds } },
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should accumulate multiple transactions from same user', async () => {
    /**
     * Property: For any user making multiple spray money transactions,
     * the leaderboard should show the cumulative total, not individual transactions
     */
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.integer({ min: 100, max: 10000 }),
          { minLength: 2, maxLength: 10 }
        ),
        async (amounts) => {
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

          // Add multiple transactions from same user
          for (const amount of amounts) {
            await addSprayMoneyTransaction(testEventId, testUserId, amount);
          }

          // Get leaderboard
          const leaderboardResult = await getSprayMoneyLeaderboard(testEventId);
          const leaderboard = leaderboardResult.leaderboard!;

          // Property assertion: User should appear only once in leaderboard
          const userEntries = leaderboard.filter((e: any) => e.userId === testUserId);
          expect(userEntries.length).toBe(1);

          // Property assertion: Total should equal sum of all amounts
          const expectedTotal = amounts.reduce((sum, amount) => sum + amount, 0);
          expect(userEntries[0].totalAmount).toBe(expectedTotal);

          // Property assertion: Transaction count should match number of transactions
          expect(userEntries[0].transactionCount).toBe(amounts.length);
        }
      ),
      { numRuns: 100 }
    );
  });
});
