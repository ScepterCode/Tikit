import { describe, it, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import { 
  generateReferralCode, 
  trackReferralPurchase,
  getUserReferralStats,
  applyReferralCode,
  getReferralLeaderboard
} from './referral.service.js';

/**
 * Feature: tikit-webapp, Property 41: Referral code uniqueness
 * Validates: Requirements 12.1
 * 
 * Property: For any user, they should have a unique referral code that no other user possesses
 */

// Mock Prisma
vi.mock('../lib/prisma.js', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    referral: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

describe('Referral Service Property Tests', () => {
  let prisma: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    prisma = (await import('../lib/prisma.js')).default;
  });

  describe('Property 41: Referral code uniqueness', () => {
    it('should generate unique referral codes for multiple users', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 2, max: 20 }), // Number of codes to generate
          async (numCodes) => {
            // Mock prisma to simulate existing codes
            const existingCodes = new Set<string>();
            
            vi.mocked(prisma.user.findUnique).mockImplementation(async (args: any) => {
              const code = args.where.referralCode;
              if (existingCodes.has(code)) {
                return { id: 'existing-user', referralCode: code } as any;
              }
              return null;
            });

            // Generate multiple codes
            const generatedCodes = new Set<string>();
            
            for (let i = 0; i < numCodes; i++) {
              const code = await generateReferralCode();
              
              // Verify code format: 8 characters, alphanumeric, uppercase
              expect(code).toMatch(/^[A-Z0-9]{8}$/);
              expect(code.length).toBe(8);
              
              // Verify uniqueness
              expect(generatedCodes.has(code)).toBe(false);
              
              // Add to sets
              generatedCodes.add(code);
              existingCodes.add(code);
            }
            
            // Verify all codes are unique
            expect(generatedCodes.size).toBe(numCodes);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should generate codes that are alphanumeric and uppercase', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constant(null),
          async () => {
            // Mock prisma to always return null (no existing user)
            vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

            const code = await generateReferralCode();
            
            // Verify format
            expect(code).toMatch(/^[A-Z0-9]{8}$/);
            expect(code.length).toBe(8);
            
            // Verify no lowercase letters
            expect(code).toBe(code.toUpperCase());
            
            // Verify it contains only alphanumeric characters
            expect(/^[A-Z0-9]+$/.test(code)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should retry generation if code already exists', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constant(null),
          async () => {
            let callCount = 0;
            const existingCode = 'EXISTING1';
            
            // Mock prisma to return existing user for first call, then null
            vi.mocked(prisma.user.findUnique).mockImplementation(async (args: any) => {
              callCount++;
              const code = args.where.referralCode;
              
              if (callCount === 1 && code === existingCode) {
                return { id: 'existing-user', referralCode: existingCode } as any;
              }
              
              // Return existing for the specific code we're testing
              if (code === existingCode) {
                return { id: 'existing-user', referralCode: existingCode } as any;
              }
              
              return null;
            });

            // Generate code - should retry if it generates the existing code
            const code = await generateReferralCode();
            
            // Verify we got a valid code
            expect(code).toMatch(/^[A-Z0-9]{8}$/);
            expect(code.length).toBe(8);
            
            // The function should have checked at least once
            expect(callCount).toBeGreaterThanOrEqual(1);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should generate codes with sufficient entropy', async () => {
      // Mock prisma to always return null
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      // Generate many codes and check distribution
      const codes = new Set<string>();
      const numCodes = 1000;
      
      for (let i = 0; i < numCodes; i++) {
        const code = await generateReferralCode();
        codes.add(code);
      }
      
      // With good entropy, we should have very few collisions
      // Allow for some collisions due to randomness, but expect > 95% unique
      expect(codes.size).toBeGreaterThan(numCodes * 0.95);
    });

    it('should handle concurrent code generation', async () => {
      // Mock prisma to track generated codes
      const generatedCodes = new Set<string>();
      
      vi.mocked(prisma.user.findUnique).mockImplementation(async (args: any) => {
        const code = args.where.referralCode;
        if (generatedCodes.has(code)) {
          return { id: 'existing-user', referralCode: code } as any;
        }
        return null;
      });

      // Generate multiple codes concurrently
      const promises = Array.from({ length: 10 }, () => generateReferralCode());
      const codes = await Promise.all(promises);
      
      // Add to set after generation to simulate concurrent creation
      codes.forEach(code => generatedCodes.add(code));
      
      // Verify all codes are valid
      codes.forEach(code => {
        expect(code).toMatch(/^[A-Z0-9]{8}$/);
        expect(code.length).toBe(8);
      });
      
      // Verify uniqueness
      const uniqueCodes = new Set(codes);
      expect(uniqueCodes.size).toBe(codes.length);
    });
  });

  describe('Referral Code Format Validation', () => {
    it('should always generate 8-character codes', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 50 }),
          async (iterations) => {
            for (let i = 0; i < iterations; i++) {
              const code = await generateReferralCode();
              expect(code.length).toBe(8);
            }
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should never generate codes with special characters', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 50 }),
          async (iterations) => {
            for (let i = 0; i < iterations; i++) {
              const code = await generateReferralCode();
              
              // Should not contain special characters
              expect(/[^A-Z0-9]/.test(code)).toBe(false);
              
              // Should not contain spaces
              expect(code).not.toContain(' ');
              
              // Should not contain lowercase
              expect(/[a-z]/.test(code)).toBe(false);
            }
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  /**
   * Feature: tikit-webapp, Property 42: Referral reward calculation
   * Validates: Requirements 12.2, 12.3
   * 
   * Property: When a referred user makes their first purchase, the referrer should receive ₦200.
   * After 5 successful referrals, the referrer should receive an additional ₦1000 bonus.
   */
  describe('Property 42: Referral reward calculation', () => {
    it('should credit ₦200 to referrer on first purchase by referred user', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            referrerId: fc.uuid(),
            referredUserId: fc.uuid(),
            initialBalance: fc.integer({ min: 0, max: 10000 }),
          }),
          async ({ referrerId, referredUserId, initialBalance }) => {
            // Mock pending referral
            vi.mocked(prisma.referral.findFirst).mockResolvedValue({
              id: 'ref-1',
              referrerId,
              referredUserId,
              status: 'pending',
              rewardAmount: 200,
              rewardPaid: false,
              createdAt: new Date(),
              completedAt: null,
            } as any);

            // Mock referral count (less than 5)
            vi.mocked(prisma.referral.count).mockResolvedValue(1);

            // Mock transaction
            vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
              const mockTx = {
                referral: {
                  update: vi.fn().mockResolvedValue({
                    id: 'ref-1',
                    status: 'completed',
                    rewardPaid: true,
                  }),
                  count: vi.fn().mockResolvedValue(1),
                },
                user: {
                  update: vi.fn().mockResolvedValue({
                    id: referrerId,
                    walletBalance: initialBalance + 200,
                  }),
                },
              };
              return await callback(mockTx);
            });

            // Track purchase
            const result = await trackReferralPurchase(referredUserId);

            // Verify success
            expect(result.success).toBe(true);
            expect(result.message).toContain('credited successfully');
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should award ₦1000 bonus on 5th successful referral', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            referrerId: fc.uuid(),
            referredUserId: fc.uuid(),
            initialBalance: fc.integer({ min: 0, max: 10000 }),
          }),
          async ({ referrerId, referredUserId, initialBalance }) => {
            // Mock pending referral (this is the 5th one)
            vi.mocked(prisma.referral.findFirst).mockResolvedValue({
              id: 'ref-5',
              referrerId,
              referredUserId,
              status: 'pending',
              rewardAmount: 200,
              rewardPaid: false,
              createdAt: new Date(),
              completedAt: null,
            } as any);

            let walletBalance = initialBalance;
            let updateCallCount = 0;

            // Mock transaction
            vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
              const mockTx = {
                referral: {
                  update: vi.fn().mockResolvedValue({
                    id: 'ref-5',
                    status: 'completed',
                    rewardPaid: true,
                  }),
                  count: vi.fn().mockResolvedValue(5), // This is the 5th referral
                },
                user: {
                  update: vi.fn().mockImplementation(async (args: any) => {
                    updateCallCount++;
                    if (args.data.walletBalance?.increment) {
                      walletBalance += args.data.walletBalance.increment;
                    }
                    return {
                      id: referrerId,
                      walletBalance,
                    };
                  }),
                },
              };
              return await callback(mockTx);
            });

            // Track purchase
            const result = await trackReferralPurchase(referredUserId);

            // Verify success
            expect(result.success).toBe(true);
            
            // Verify wallet was updated twice (₦200 + ₦1000 bonus)
            expect(updateCallCount).toBe(2);
            
            // Verify total credited is ₦1200 (₦200 + ₦1000)
            expect(walletBalance).toBe(initialBalance + 1200);
          }
        ),
        { numRuns: 30 }
      );
    });

    it('should not credit rewards for non-existent referrals', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          async (userId) => {
            // Mock no pending referral
            vi.mocked(prisma.referral.findFirst).mockResolvedValue(null);

            // Track purchase
            const result = await trackReferralPurchase(userId);

            // Should succeed but not credit anything
            expect(result.success).toBe(true);
            expect(result.message).toContain('No pending referral');
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should calculate total earnings correctly with multiple referrals', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            completedReferrals: fc.integer({ min: 0, max: 20 }),
            pendingReferrals: fc.integer({ min: 0, max: 10 }),
          }),
          async ({ userId, completedReferrals, pendingReferrals }) => {
            // Mock user with referrals
            const referrals = [
              ...Array(completedReferrals).fill(null).map(() => ({
                status: 'completed',
                rewardAmount: 200,
              })),
              ...Array(pendingReferrals).fill(null).map(() => ({
                status: 'pending',
                rewardAmount: 200,
              })),
            ];

            vi.mocked(prisma.user.findUnique).mockResolvedValue({
              id: userId,
              referralCode: 'TEST1234',
              walletBalance: 5000,
              referrals,
            } as any);

            // Get stats
            const result = await getUserReferralStats(userId);

            // Verify calculations
            expect(result.success).toBe(true);
            expect(result.stats).toBeDefined();
            
            if (result.stats) {
              // Base earnings: ₦200 per completed referral
              const baseEarnings = completedReferrals * 200;
              
              // Bonuses: ₦1000 for every 5 completed referrals
              const bonuses = Math.floor(completedReferrals / 5) * 1000;
              
              // Total earnings
              const expectedEarnings = baseEarnings + bonuses;
              
              expect(result.stats.completedReferrals).toBe(completedReferrals);
              expect(result.stats.pendingReferrals).toBe(pendingReferrals);
              expect(result.stats.totalReferrals).toBe(completedReferrals + pendingReferrals);
              expect(result.stats.totalEarnings).toBe(expectedEarnings);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should award multiple bonuses for high referral counts', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 10, max: 50 }),
          async (completedReferrals) => {
            const userId = 'user-123';
            
            // Mock user with many referrals
            const referrals = Array(completedReferrals).fill(null).map(() => ({
              status: 'completed',
              rewardAmount: 200,
            }));

            vi.mocked(prisma.user.findUnique).mockResolvedValue({
              id: userId,
              referralCode: 'TEST1234',
              walletBalance: 10000,
              referrals,
            } as any);

            // Get stats
            const result = await getUserReferralStats(userId);

            expect(result.success).toBe(true);
            expect(result.stats).toBeDefined();
            
            if (result.stats) {
              // Calculate expected bonuses
              const expectedBonuses = Math.floor(completedReferrals / 5);
              const baseEarnings = completedReferrals * 200;
              const bonusEarnings = expectedBonuses * 1000;
              const totalExpected = baseEarnings + bonusEarnings;
              
              expect(result.stats.totalEarnings).toBe(totalExpected);
              
              // Verify bonus is awarded for every 5 referrals
              if (completedReferrals >= 5) {
                expect(result.stats.totalEarnings).toBeGreaterThan(completedReferrals * 200);
              }
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should handle referral tracking idempotently', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            referrerId: fc.uuid(),
            referredUserId: fc.uuid(),
          }),
          async ({ referrerId, referredUserId }) => {
            // First call: pending referral exists
            vi.mocked(prisma.referral.findFirst).mockResolvedValueOnce({
              id: 'ref-1',
              referrerId,
              referredUserId,
              status: 'pending',
              rewardAmount: 200,
              rewardPaid: false,
              createdAt: new Date(),
              completedAt: null,
            } as any);

            vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
              const mockTx = {
                referral: {
                  update: vi.fn().mockResolvedValue({
                    id: 'ref-1',
                    status: 'completed',
                    rewardPaid: true,
                  }),
                  count: vi.fn().mockResolvedValue(1),
                },
                user: {
                  update: vi.fn().mockResolvedValue({
                    id: referrerId,
                    walletBalance: 200,
                  }),
                },
              };
              return await callback(mockTx);
            });

            // First purchase tracking
            const result1 = await trackReferralPurchase(referredUserId);
            expect(result1.success).toBe(true);

            // Second call: no pending referral (already completed)
            vi.mocked(prisma.referral.findFirst).mockResolvedValueOnce(null);

            // Second purchase tracking (should not credit again)
            const result2 = await trackReferralPurchase(referredUserId);
            expect(result2.success).toBe(true);
            expect(result2.message).toContain('No pending referral');
          }
        ),
        { numRuns: 30 }
      );
    });

    it('should prevent self-referral', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            referralCode: fc.string({ minLength: 8, maxLength: 8 }),
          }),
          async ({ userId, referralCode }) => {
            // Mock user trying to use their own referral code
            vi.mocked(prisma.user.findUnique).mockResolvedValue({
              id: userId,
              referralCode,
            } as any);

            // Try to apply own referral code
            const result = await applyReferralCode(referralCode, userId);

            // Should fail
            expect(result.success).toBe(false);
            expect(result.message).toContain('Cannot use your own referral code');
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Feature: tikit-webapp, Property 43: Leaderboard sorting accuracy
   * Validates: Requirements 12.4
   * 
   * Property: The referral leaderboard should correctly sort users by referral count in descending order
   * and accurately calculate total earnings including bonuses.
   */
  describe('Property 43: Leaderboard sorting accuracy', () => {
    it('should sort leaderboard by referral count in descending order', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              userId: fc.uuid(),
              firstName: fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: null }),
              lastName: fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: null }),
              completedReferrals: fc.integer({ min: 0, max: 50 }),
            }),
            { minLength: 3, maxLength: 20 }
          ),
          async (users) => {
            // Mock users with referrals
            const mockUsers = users.map(user => ({
              id: user.userId,
              firstName: user.firstName,
              lastName: user.lastName,
              referrals: Array(user.completedReferrals).fill(null).map(() => ({
                status: 'completed',
                rewardAmount: 200,
              })),
            }));

            vi.mocked(prisma.user.findMany).mockResolvedValue(mockUsers as any);

            // Get leaderboard
            const result = await getReferralLeaderboard(50);

            expect(result.success).toBe(true);
            expect(result.leaderboard).toBeDefined();

            if (result.leaderboard && result.leaderboard.length > 0) {
              // Verify sorting: each entry should have >= referrals than the next
              for (let i = 0; i < result.leaderboard.length - 1; i++) {
                expect(result.leaderboard[i].referralCount).toBeGreaterThanOrEqual(
                  result.leaderboard[i + 1].referralCount
                );
              }

              // Verify only users with referrals are included
              result.leaderboard.forEach(entry => {
                expect(entry.referralCount).toBeGreaterThan(0);
              });
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should calculate total earnings correctly including bonuses', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              userId: fc.uuid(),
              firstName: fc.string({ minLength: 1, maxLength: 20 }),
              completedReferrals: fc.integer({ min: 1, max: 30 }), // At least 1 referral
            }),
            { minLength: 1, maxLength: 10 }
          ),
          async (users) => {
            // Mock users with referrals
            const mockUsers = users.map(user => ({
              id: user.userId,
              firstName: user.firstName,
              lastName: null,
              referrals: Array(user.completedReferrals).fill(null).map(() => ({
                status: 'completed',
                rewardAmount: 200,
              })),
            }));

            vi.mocked(prisma.user.findMany).mockResolvedValue(mockUsers as any);

            // Get leaderboard
            const result = await getReferralLeaderboard(50);

            expect(result.success).toBe(true);
            expect(result.leaderboard).toBeDefined();

            if (result.leaderboard) {
              // Create a map of userId to expected referrals
              const userMap = new Map(users.map(u => [u.userId, u.completedReferrals]));
              
              result.leaderboard.forEach((entry) => {
                const expectedReferrals = userMap.get(entry.userId);
                
                if (expectedReferrals !== undefined) {
                  // Calculate expected earnings
                  const baseEarnings = expectedReferrals * 200;
                  const bonuses = Math.floor(expectedReferrals / 5) * 1000;
                  const expectedEarnings = baseEarnings + bonuses;

                  // Verify earnings calculation
                  expect(entry.referralCount).toBe(expectedReferrals);
                  expect(entry.totalEarnings).toBe(expectedEarnings);
                }
              });
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should respect the limit parameter', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            totalUsers: fc.integer({ min: 10, max: 100 }),
            limit: fc.integer({ min: 1, max: 50 }),
          }),
          async ({ totalUsers, limit }) => {
            // Mock many users with referrals
            const mockUsers = Array(totalUsers).fill(null).map((_, i) => ({
              id: `user-${i}`,
              firstName: `User${i}`,
              lastName: null,
              referrals: Array(i + 1).fill(null).map(() => ({
                status: 'completed',
                rewardAmount: 200,
              })),
            }));

            vi.mocked(prisma.user.findMany).mockResolvedValue(mockUsers as any);

            // Get leaderboard with limit
            const result = await getReferralLeaderboard(limit);

            expect(result.success).toBe(true);
            expect(result.leaderboard).toBeDefined();

            if (result.leaderboard) {
              // Should not exceed limit
              expect(result.leaderboard.length).toBeLessThanOrEqual(limit);
            }
          }
        ),
        { numRuns: 30 }
      );
    });

    it('should exclude users with zero referrals', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              userId: fc.uuid(),
              firstName: fc.string({ minLength: 1, maxLength: 20 }),
              hasReferrals: fc.boolean(),
            }),
            { minLength: 5, maxLength: 20 }
          ),
          async (users) => {
            // Mock users with and without referrals
            const mockUsers = users.map(user => ({
              id: user.userId,
              firstName: user.firstName,
              lastName: null,
              referrals: user.hasReferrals
                ? Array(Math.floor(Math.random() * 10) + 1).fill(null).map(() => ({
                    status: 'completed',
                    rewardAmount: 200,
                  }))
                : [],
            }));

            vi.mocked(prisma.user.findMany).mockResolvedValue(mockUsers as any);

            // Get leaderboard
            const result = await getReferralLeaderboard(50);

            expect(result.success).toBe(true);
            expect(result.leaderboard).toBeDefined();

            if (result.leaderboard) {
              // All entries should have at least 1 referral
              result.leaderboard.forEach(entry => {
                expect(entry.referralCount).toBeGreaterThan(0);
              });
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should handle users with same referral count', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            referralCount: fc.integer({ min: 1, max: 20 }),
            numUsers: fc.integer({ min: 2, max: 10 }),
          }),
          async ({ referralCount, numUsers }) => {
            // Mock multiple users with same referral count
            const mockUsers = Array(numUsers).fill(null).map((_, i) => ({
              id: `user-${i}`,
              firstName: `User${i}`,
              lastName: null,
              referrals: Array(referralCount).fill(null).map(() => ({
                status: 'completed',
                rewardAmount: 200,
              })),
            }));

            vi.mocked(prisma.user.findMany).mockResolvedValue(mockUsers as any);

            // Get leaderboard
            const result = await getReferralLeaderboard(50);

            expect(result.success).toBe(true);
            expect(result.leaderboard).toBeDefined();

            if (result.leaderboard) {
              // All should have same referral count
              result.leaderboard.forEach(entry => {
                expect(entry.referralCount).toBe(referralCount);
              });

              // All should have same earnings
              const expectedEarnings = 
                referralCount * 200 + Math.floor(referralCount / 5) * 1000;
              
              result.leaderboard.forEach(entry => {
                expect(entry.totalEarnings).toBe(expectedEarnings);
              });
            }
          }
        ),
        { numRuns: 30 }
      );
    });

    it('should award correct bonuses at 5, 10, 15 referral milestones', async () => {
      const testCases = [
        { referrals: 5, expectedBonus: 1000 },
        { referrals: 10, expectedBonus: 2000 },
        { referrals: 15, expectedBonus: 3000 },
        { referrals: 20, expectedBonus: 4000 },
      ];

      for (const { referrals, expectedBonus } of testCases) {
        const mockUsers = [{
          id: 'user-1',
          firstName: 'Test',
          lastName: 'User',
          referrals: Array(referrals).fill(null).map(() => ({
            status: 'completed',
            rewardAmount: 200,
          })),
        }];

        vi.mocked(prisma.user.findMany).mockResolvedValue(mockUsers as any);

        const result = await getReferralLeaderboard(50);

        expect(result.success).toBe(true);
        expect(result.leaderboard).toBeDefined();

        if (result.leaderboard && result.leaderboard.length > 0) {
          const entry = result.leaderboard[0];
          const baseEarnings = referrals * 200;
          const totalExpected = baseEarnings + expectedBonus;
          
          expect(entry.referralCount).toBe(referrals);
          expect(entry.totalEarnings).toBe(totalExpected);
        }
      }
    });
  });
});
