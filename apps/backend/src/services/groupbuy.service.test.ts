import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { groupBuyService } from './groupbuy.service.js';
import { prisma } from '../lib/prisma.js';
import fc from 'fast-check';

describe('GroupBuyService', () => {
  // Clean up test data after each test
  afterEach(async () => {
    await prisma.groupBuy.deleteMany({
      where: {
        event: {
          title: {
            contains: 'Test Event',
          },
        },
      },
    });
    await prisma.event.deleteMany({
      where: {
        title: {
          contains: 'Test Event',
        },
      },
    });
    await prisma.user.deleteMany({
      where: {
        phoneNumber: {
          startsWith: '+234TEST',
        },
      },
    });
  });

  /**
   * Feature: tikit-webapp, Property 15: Group buy link uniqueness
   * Validates: Requirements 5.2
   * 
   * For any group buy with N participants (where 2 ≤ N ≤ 5000), 
   * the system should generate exactly N unique payment links
   */
  it('Property 15: Group buy link uniqueness', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 2, max: 100 }), // Limit to 100 for test performance
        async (totalParticipants) => {
          // Create test user
          const user = await prisma.user.create({
            data: {
              phoneNumber: `+234TEST${Date.now()}${Math.random()}`,
              phoneVerified: true,
              state: 'Lagos',
              referralCode: `REF${Date.now()}${Math.random()}`,
            },
          });

          // Create test event with tiers
          const event = await prisma.event.create({
            data: {
              organizerId: user.id,
              title: `Test Event ${Date.now()}`,
              description: 'Test event for group buy',
              eventType: 'general',
              startDate: new Date(Date.now() + 86400000), // Tomorrow
              endDate: new Date(Date.now() + 172800000), // Day after tomorrow
              venue: 'Test Venue',
              state: 'Lagos',
              lga: 'Ikeja',
              latitude: 6.5244,
              longitude: 3.3792,
              capacity: 10000,
              tiers: [
                {
                  id: 'tier1',
                  name: 'Regular',
                  price: 5000,
                  quantity: 1000,
                  sold: 0,
                },
              ],
              ussdCode: `${Date.now()}`,
              status: 'published',
            },
          });

          // Initiate group buy
          const groupBuy = await groupBuyService.initiateGroupBuy({
            eventId: event.id,
            initiatorId: user.id,
            totalParticipants,
            tierId: 'tier1',
          });

          // Verify exactly N links were generated
          expect(groupBuy.shareableLinks.length).toBe(totalParticipants);
          expect(groupBuy.participants.length).toBe(totalParticipants);

          // Verify all links are unique
          const uniqueLinks = new Set(groupBuy.shareableLinks);
          expect(uniqueLinks.size).toBe(totalParticipants);

          // Verify all participant payment links are unique
          const participantLinks = groupBuy.participants.map(p => p.paymentLink);
          const uniqueParticipantLinks = new Set(participantLinks);
          expect(uniqueParticipantLinks.size).toBe(totalParticipants);

          // Verify shareable links match participant links
          expect(groupBuy.shareableLinks.sort()).toEqual(participantLinks.sort());

          // Clean up
          await prisma.groupBuy.delete({ where: { id: groupBuy.id } });
          await prisma.event.delete({ where: { id: event.id } });
          await prisma.user.delete({ where: { id: user.id } });
        }
      ),
      { numRuns: 10 } // Run 10 times with different participant counts
    );
  });

  /**
   * Feature: tikit-webapp, Property 16: Group buy payment status consistency
   * Validates: Requirements 5.3
   * 
   * For any group buy, the payment status tracked for each participant 
   * should accurately reflect their actual payment state at all times
   */
  it('Property 16: Group buy payment status consistency', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 2, max: 20 }), // Number of participants
        fc.array(fc.boolean(), { minLength: 2, maxLength: 20 }), // Payment statuses
        async (totalParticipants, paymentStatuses) => {
          // Ensure arrays match in length
          const statuses = paymentStatuses.slice(0, totalParticipants);
          
          // Create test user
          const user = await prisma.user.create({
            data: {
              phoneNumber: `+234TEST${Date.now()}${Math.random()}`,
              phoneVerified: true,
              state: 'Lagos',
              referralCode: `REF${Date.now()}${Math.random()}`,
            },
          });

          // Create test event
          const event = await prisma.event.create({
            data: {
              organizerId: user.id,
              title: `Test Event ${Date.now()}`,
              description: 'Test event for group buy',
              eventType: 'general',
              startDate: new Date(Date.now() + 86400000),
              endDate: new Date(Date.now() + 172800000),
              venue: 'Test Venue',
              state: 'Lagos',
              lga: 'Ikeja',
              latitude: 6.5244,
              longitude: 3.3792,
              capacity: 10000,
              tiers: [
                {
                  id: 'tier1',
                  name: 'Regular',
                  price: 5000,
                  quantity: 1000,
                  sold: 0,
                },
              ],
              ussdCode: `${Date.now()}`,
              status: 'published',
            },
          });

          // Initiate group buy
          const groupBuy = await groupBuyService.initiateGroupBuy({
            eventId: event.id,
            initiatorId: user.id,
            totalParticipants,
            tierId: 'tier1',
          });

          // Create test users for participants and update their payment statuses
          const participantUsers = [];
          for (let i = 0; i < totalParticipants; i++) {
            const participantUser = await prisma.user.create({
              data: {
                phoneNumber: `+234PART${Date.now()}${i}${Math.random()}`,
                phoneVerified: true,
                state: 'Lagos',
                referralCode: `PREF${Date.now()}${i}${Math.random()}`,
              },
            });
            participantUsers.push(participantUser);

            // Join group buy
            await groupBuyService.joinGroupBuy(
              groupBuy.id,
              participantUser.id,
              groupBuy.shareableLinks[i]
            );

            // Update payment status
            const paymentStatus = statuses[i] ? 'paid' : 'pending';
            await groupBuyService.updateParticipantPaymentStatus(
              groupBuy.id,
              participantUser.id,
              paymentStatus
            );
          }

          // Get current status
          const status = await groupBuyService.getGroupBuyStatus(groupBuy.id);

          // Verify payment count matches actual paid statuses
          const expectedPaidCount = statuses.filter(s => s).length;
          expect(status.paidCount).toBe(expectedPaidCount);
          expect(status.currentParticipants).toBe(expectedPaidCount);

          // Verify completion status
          const expectedComplete = expectedPaidCount === totalParticipants;
          expect(status.isComplete).toBe(expectedComplete);

          // Verify each participant's status
          for (let i = 0; i < totalParticipants; i++) {
            const paymentInfo = await groupBuyService.getParticipantPaymentInfo(
              groupBuy.id,
              participantUsers[i].id
            );
            const expectedStatus = statuses[i] ? 'paid' : 'pending';
            expect(paymentInfo.paymentStatus).toBe(expectedStatus);
          }

          // Clean up
          await prisma.groupBuy.delete({ where: { id: groupBuy.id } });
          await prisma.event.delete({ where: { id: event.id } });
          await prisma.user.delete({ where: { id: user.id } });
          for (const participantUser of participantUsers) {
            await prisma.user.delete({ where: { id: participantUser.id } });
          }
        }
      ),
      { numRuns: 5 } // Run 5 times with different scenarios
    );
  });

  /**
   * Feature: tikit-webapp, Property 17: Group buy ticket issuance
   * Validates: Requirements 5.4
   * 
   * For any group buy where all participants have completed payment, 
   * tickets should be issued to all participants
   */
  it('Property 17: Group buy ticket issuance', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 2, max: 10 }), // Number of participants
        async (totalParticipants) => {
          // Create test user
          const user = await prisma.user.create({
            data: {
              phoneNumber: `+234TEST${Date.now()}${Math.random()}`,
              phoneVerified: true,
              state: 'Lagos',
              referralCode: `REF${Date.now()}${Math.random()}`,
            },
          });

          // Create test event
          const event = await prisma.event.create({
            data: {
              organizerId: user.id,
              title: `Test Event ${Date.now()}`,
              description: 'Test event for group buy',
              eventType: 'general',
              startDate: new Date(Date.now() + 86400000),
              endDate: new Date(Date.now() + 172800000),
              venue: 'Test Venue',
              state: 'Lagos',
              lga: 'Ikeja',
              latitude: 6.5244,
              longitude: 3.3792,
              capacity: 10000,
              tiers: [
                {
                  id: 'tier1',
                  name: 'Regular',
                  price: 5000,
                  quantity: 1000,
                  sold: 0,
                },
              ],
              ussdCode: `${Date.now()}`,
              status: 'published',
            },
          });

          // Initiate group buy
          const groupBuy = await groupBuyService.initiateGroupBuy({
            eventId: event.id,
            initiatorId: user.id,
            totalParticipants,
            tierId: 'tier1',
          });

          // Create test users for participants and mark all as paid
          const participantUsers = [];
          for (let i = 0; i < totalParticipants; i++) {
            const participantUser = await prisma.user.create({
              data: {
                phoneNumber: `+234PART${Date.now()}${i}${Math.random()}`,
                phoneVerified: true,
                state: 'Lagos',
                referralCode: `PREF${Date.now()}${i}${Math.random()}`,
              },
            });
            participantUsers.push(participantUser);

            // Join group buy
            await groupBuyService.joinGroupBuy(
              groupBuy.id,
              participantUser.id,
              groupBuy.shareableLinks[i]
            );

            // Mark as paid
            await groupBuyService.updateParticipantPaymentStatus(
              groupBuy.id,
              participantUser.id,
              'paid'
            );
          }

          // Wait a bit for async completion to trigger
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Verify group buy is completed
          const updatedGroupBuy = await groupBuyService.getGroupBuyById(groupBuy.id);
          expect(updatedGroupBuy?.status).toBe('completed');

          // Verify tickets were issued to all participants
          for (const participantUser of participantUsers) {
            const tickets = await prisma.ticket.findMany({
              where: {
                userId: participantUser.id,
                eventId: event.id,
                groupBuyId: groupBuy.id,
              },
            });

            // Each participant should have exactly one ticket
            expect(tickets.length).toBe(1);
            expect(tickets[0].status).toBe('valid');
          }

          // Verify total tickets issued equals total participants
          const allTickets = await prisma.ticket.findMany({
            where: {
              eventId: event.id,
              groupBuyId: groupBuy.id,
            },
          });
          expect(allTickets.length).toBe(totalParticipants);

          // Clean up
          await prisma.ticket.deleteMany({ where: { groupBuyId: groupBuy.id } });
          await prisma.payment.deleteMany({
            where: {
              reference: {
                startsWith: `GB-${groupBuy.id}`,
              },
            },
          });
          await prisma.groupBuy.delete({ where: { id: groupBuy.id } });
          await prisma.event.delete({ where: { id: event.id } });
          await prisma.user.delete({ where: { id: user.id } });
          for (const participantUser of participantUsers) {
            await prisma.user.delete({ where: { id: participantUser.id } });
          }
        }
      ),
      { numRuns: 3 } // Run 3 times with different participant counts
    );
  });

  /**
   * Feature: tikit-webapp, Property 18: Expired group buy refunds
   * Validates: Requirements 5.5
   * 
   * For any group buy that expires before completion, 
   * all participants who made partial payments should receive refunds
   */
  it('Property 18: Expired group buy refunds', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 2, max: 10 }), // Number of participants
        fc.array(fc.boolean(), { minLength: 2, maxLength: 10 }), // Payment statuses
        async (totalParticipants, paymentStatuses) => {
          // Ensure arrays match in length
          const statuses = paymentStatuses.slice(0, totalParticipants);
          
          // Ensure at least one participant paid (otherwise no refunds to test)
          if (!statuses.some(s => s)) {
            statuses[0] = true;
          }

          // Ensure not all participants paid (otherwise it would complete, not expire)
          if (statuses.every(s => s)) {
            statuses[statuses.length - 1] = false;
          }

          // Create test user
          const user = await prisma.user.create({
            data: {
              phoneNumber: `+234TEST${Date.now()}${Math.random()}`,
              phoneVerified: true,
              state: 'Lagos',
              referralCode: `REF${Date.now()}${Math.random()}`,
            },
          });

          // Create test event
          const event = await prisma.event.create({
            data: {
              organizerId: user.id,
              title: `Test Event ${Date.now()}`,
              description: 'Test event for group buy',
              eventType: 'general',
              startDate: new Date(Date.now() + 86400000),
              endDate: new Date(Date.now() + 172800000),
              venue: 'Test Venue',
              state: 'Lagos',
              lga: 'Ikeja',
              latitude: 6.5244,
              longitude: 3.3792,
              capacity: 10000,
              tiers: [
                {
                  id: 'tier1',
                  name: 'Regular',
                  price: 5000,
                  quantity: 1000,
                  sold: 0,
                },
              ],
              ussdCode: `${Date.now()}`,
              status: 'published',
            },
          });

          // Initiate group buy with expiration in the past
          const groupBuy = await prisma.groupBuy.create({
            data: {
              eventId: event.id,
              initiatorId: user.id,
              totalParticipants,
              currentParticipants: 0,
              pricePerPerson: 5000,
              expiresAt: new Date(Date.now() - 1000), // Already expired
              status: 'active',
              participants: [],
            },
          });

          // Create test users for participants
          const participantUsers = [];
          const participants = [];
          for (let i = 0; i < totalParticipants; i++) {
            const participantUser = await prisma.user.create({
              data: {
                phoneNumber: `+234PART${Date.now()}${i}${Math.random()}`,
                phoneVerified: true,
                state: 'Lagos',
                referralCode: `PREF${Date.now()}${i}${Math.random()}`,
              },
            });
            participantUsers.push(participantUser);

            const paymentLink = `http://localhost:5173/group-buy/${groupBuy.id}/pay/${i}`;
            participants.push({
              userId: participantUser.id,
              paymentStatus: statuses[i] ? 'paid' : 'pending',
              paymentLink,
            });

            // Create payment record for paid participants
            if (statuses[i]) {
              await prisma.payment.create({
                data: {
                  userId: participantUser.id,
                  amount: 5000,
                  currency: 'NGN',
                  method: 'group_buy',
                  status: 'successful',
                  provider: 'group_buy',
                  reference: `GB-${groupBuy.id}-${participantUser.id}`,
                },
              });
            }
          }

          // Update group buy with participants
          await prisma.groupBuy.update({
            where: { id: groupBuy.id },
            data: { participants: participants as any },
          });

          // Expire the group buy
          const result = await groupBuyService.expireGroupBuy(groupBuy.id);

          // Verify group buy is expired
          const expiredGroupBuy = await groupBuyService.getGroupBuyById(groupBuy.id);
          expect(expiredGroupBuy?.status).toBe('expired');

          // Verify refunds were processed for all paid participants
          const expectedRefunds = statuses.filter(s => s).length;
          expect(result.refundsProcessed).toBe(expectedRefunds);

          // Verify each paid participant has a refunded payment
          for (let i = 0; i < totalParticipants; i++) {
            if (statuses[i]) {
              const payment = await prisma.payment.findFirst({
                where: {
                  userId: participantUsers[i].id,
                  reference: `GB-${groupBuy.id}-${participantUsers[i].id}`,
                },
              });

              expect(payment).toBeDefined();
              expect(payment?.status).toBe('refunded');
            }
          }

          // Clean up
          await prisma.payment.deleteMany({
            where: {
              reference: {
                startsWith: `GB-${groupBuy.id}`,
              },
            },
          });
          await prisma.groupBuy.delete({ where: { id: groupBuy.id } });
          await prisma.event.delete({ where: { id: event.id } });
          await prisma.user.delete({ where: { id: user.id } });
          for (const participantUser of participantUsers) {
            await prisma.user.delete({ where: { id: participantUser.id } });
          }
        }
      ),
      { numRuns: 3 } // Run 3 times with different scenarios
    );
  });

  it('should initiate a group buy with valid data', async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        phoneNumber: `+234TEST${Date.now()}`,
        phoneVerified: true,
        state: 'Lagos',
        referralCode: `REF${Date.now()}`,
      },
    });

    // Create test event
    const event = await prisma.event.create({
      data: {
        organizerId: user.id,
        title: `Test Event ${Date.now()}`,
        description: 'Test event for group buy',
        eventType: 'general',
        startDate: new Date(Date.now() + 86400000),
        endDate: new Date(Date.now() + 172800000),
        venue: 'Test Venue',
        state: 'Lagos',
        lga: 'Ikeja',
        latitude: 6.5244,
        longitude: 3.3792,
        capacity: 10000,
        tiers: [
          {
            id: 'tier1',
            name: 'Regular',
            price: 5000,
            quantity: 1000,
            sold: 0,
          },
        ],
        ussdCode: `${Date.now()}`,
        status: 'published',
      },
    });

    // Initiate group buy
    const groupBuy = await groupBuyService.initiateGroupBuy({
      eventId: event.id,
      initiatorId: user.id,
      totalParticipants: 5,
      tierId: 'tier1',
    });

    expect(groupBuy.id).toBeDefined();
    expect(groupBuy.totalParticipants).toBe(5);
    expect(groupBuy.pricePerPerson).toBe(5000);
    expect(groupBuy.shareableLinks.length).toBe(5);
    expect(groupBuy.participants.length).toBe(5);

    // Clean up
    await prisma.groupBuy.delete({ where: { id: groupBuy.id } });
    await prisma.event.delete({ where: { id: event.id } });
    await prisma.user.delete({ where: { id: user.id } });
  });

  it('should reject group buy with invalid participant count', async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        phoneNumber: `+234TEST${Date.now()}`,
        phoneVerified: true,
        state: 'Lagos',
        referralCode: `REF${Date.now()}`,
      },
    });

    // Create test event
    const event = await prisma.event.create({
      data: {
        organizerId: user.id,
        title: `Test Event ${Date.now()}`,
        description: 'Test event for group buy',
        eventType: 'general',
        startDate: new Date(Date.now() + 86400000),
        endDate: new Date(Date.now() + 172800000),
        venue: 'Test Venue',
        state: 'Lagos',
        lga: 'Ikeja',
        latitude: 6.5244,
        longitude: 3.3792,
        capacity: 10000,
        tiers: [
          {
            id: 'tier1',
            name: 'Regular',
            price: 5000,
            quantity: 1000,
            sold: 0,
          },
        ],
        ussdCode: `${Date.now()}`,
        status: 'published',
      },
    });

    // Try to initiate group buy with 1 participant (invalid)
    await expect(
      groupBuyService.initiateGroupBuy({
        eventId: event.id,
        initiatorId: user.id,
        totalParticipants: 1,
        tierId: 'tier1',
      })
    ).rejects.toThrow('Total participants must be between 2 and 5000');

    // Try to initiate group buy with 5001 participants (invalid)
    await expect(
      groupBuyService.initiateGroupBuy({
        eventId: event.id,
        initiatorId: user.id,
        totalParticipants: 5001,
        tierId: 'tier1',
      })
    ).rejects.toThrow('Total participants must be between 2 and 5000');

    // Clean up
    await prisma.event.delete({ where: { id: event.id } });
    await prisma.user.delete({ where: { id: user.id } });
  });
});
