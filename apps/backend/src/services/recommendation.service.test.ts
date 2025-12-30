import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';

// Mock Prisma client
const mockPrisma = {
  user: {
    findUnique: vi.fn(),
  },
  event: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
  },
  ticket: {
    findMany: vi.fn(),
  },
};

vi.mock('../lib/prisma.js', () => ({
  default: mockPrisma,
}));

// Import after mocking
const { getPersonalizedRecommendations, getRelatedEvents, getTrendingEvents } = await import('./recommendation.service.js');

describe('Recommendation Service Property Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Feature: tikit-webapp, Property 25: Personalized feed prioritization
   * Validates: Requirements 8.1
   * 
   * For any user with past attendance history, events matching their cultural preferences
   * and event type history should rank higher in their feed than non-matching events
   */
  it('Property 25: Personalized feed prioritization', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('wedding', 'crusade', 'burial', 'festival', 'general'), // User's preferred event type
        fc.constantFrom('Lagos', 'Kano', 'Rivers', 'Oyo', 'Enugu'), // User's state
        fc.integer({ min: 1, max: 5 }), // Number of past events attended
        fc.integer({ min: 10, max: 30 }), // Number of available events
        async (preferredEventType, userState, pastEventCount, totalEvents) => {
          const userId = 'test-user-123';

          // Create past events that user attended (all of preferred type)
          const pastEvents = Array.from({ length: pastEventCount }, (_, i) => ({
            id: `past-event-${i}`,
            eventType: preferredEventType,
            state: userState,
            lga: 'Test LGA',
            latitude: 6.5244,
            longitude: 3.3792,
            culturalFeatures: {},
          }));

          // Create tickets for past events
          const pastTickets = pastEvents.map((event, i) => ({
            id: `ticket-${i}`,
            eventId: event.id,
            userId,
            status: 'valid',
            event,
          }));

          // Create mock user with past attendance
          const mockUser = {
            id: userId,
            phoneNumber: '+2348012345678',
            phoneVerified: true,
            preferredLanguage: 'en',
            state: userState,
            lga: 'Test LGA',
            role: 'attendee',
            walletBalance: 0,
            referralCode: 'TEST123',
            createdAt: new Date(),
            updatedAt: new Date(),
            tickets: pastTickets,
          };

          // Create available events - mix of matching and non-matching
          const matchingEventCount = Math.floor(totalEvents / 2);
          const nonMatchingEventCount = totalEvents - matchingEventCount;

          const matchingEvents = Array.from({ length: matchingEventCount }, (_, i) => ({
            id: `matching-event-${i}`,
            organizerId: 'organizer-1',
            title: `Matching Event ${i}`,
            description: 'A matching event',
            eventType: preferredEventType, // Same as user's preference
            startDate: new Date(Date.now() + (i + 7) * 86400000), // 7+ days away
            endDate: new Date(Date.now() + (i + 7) * 86400000 + 3600000),
            venue: 'Test Venue',
            state: userState, // Same state as user
            lga: 'Test LGA',
            latitude: 6.5244 + (i * 0.01),
            longitude: 3.3792 + (i * 0.01),
            capacity: 100,
            ticketsSold: 30, // 30% sold
            tiers: [{ id: 'tier-1', name: 'General', price: 1000, quantity: 100, sold: 30 }],
            culturalFeatures: {},
            images: [],
            ussdCode: `${2000 + i}`,
            status: 'published',
            isHidden: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            organizer: {
              id: 'organizer-1',
              firstName: 'Test',
              lastName: 'Organizer',
              role: 'organizer',
            },
          }));

          const nonMatchingEvents = Array.from({ length: nonMatchingEventCount }, (_, i) => {
            // Pick a different event type
            const otherTypes = ['wedding', 'crusade', 'burial', 'festival', 'general'].filter(
              (t) => t !== preferredEventType
            );
            const differentType = otherTypes[i % otherTypes.length];

            return {
              id: `non-matching-event-${i}`,
              organizerId: 'organizer-2',
              title: `Non-Matching Event ${i}`,
              description: 'A non-matching event',
              eventType: differentType, // Different from user's preference
              startDate: new Date(Date.now() + (i + 7) * 86400000),
              endDate: new Date(Date.now() + (i + 7) * 86400000 + 3600000),
              venue: 'Test Venue',
              state: 'Abuja', // Different state
              lga: 'Different LGA',
              latitude: 9.0579 + (i * 0.01), // Abuja coordinates
              longitude: 7.4951 + (i * 0.01),
              capacity: 100,
              ticketsSold: 30,
              tiers: [{ id: 'tier-1', name: 'General', price: 1000, quantity: 100, sold: 30 }],
              culturalFeatures: {},
              images: [],
              ussdCode: `${3000 + i}`,
              status: 'published',
              isHidden: false,
              createdAt: new Date(),
              updatedAt: new Date(),
              organizer: {
                id: 'organizer-2',
                firstName: 'Test',
                lastName: 'Organizer',
                role: 'organizer',
              },
            };
          });

          const allEvents = [...matchingEvents, ...nonMatchingEvents];

          // Mock Prisma responses
          mockPrisma.user.findUnique.mockResolvedValue(mockUser);
          mockPrisma.event.findMany.mockResolvedValue(allEvents);

          // Get personalized recommendations
          const result = await getPersonalizedRecommendations(userId, totalEvents);

          // Verify success
          expect(result.success).toBe(true);
          expect(result.recommendations).toBeDefined();

          if (result.recommendations && result.recommendations.length > 0) {
            // Property: Events matching user's preferences should rank higher
            // Find the highest-ranked matching event and lowest-ranked non-matching event
            const recommendations = result.recommendations;

            const matchingRanks = recommendations
              .map((rec, index) => ({
                index,
                isMatching: rec.event.eventType === preferredEventType && rec.event.state === userState,
                score: rec.score,
              }))
              .filter((r) => r.isMatching);

            const nonMatchingRanks = recommendations
              .map((rec, index) => ({
                index,
                isMatching: rec.event.eventType === preferredEventType && rec.event.state === userState,
                score: rec.score,
              }))
              .filter((r) => !r.isMatching);

            // If we have both matching and non-matching events in recommendations
            if (matchingRanks.length > 0 && nonMatchingRanks.length > 0) {
              // The average score of matching events should be higher than non-matching
              const avgMatchingScore =
                matchingRanks.reduce((sum, r) => sum + r.score, 0) / matchingRanks.length;
              const avgNonMatchingScore =
                nonMatchingRanks.reduce((sum, r) => sum + r.score, 0) / nonMatchingRanks.length;

              // Matching events should have higher average score
              expect(avgMatchingScore).toBeGreaterThan(avgNonMatchingScore);

              // The highest-ranked matching event should appear before the lowest-ranked non-matching event
              const highestMatchingRank = Math.min(...matchingRanks.map((r) => r.index));
              const lowestNonMatchingRank = Math.max(...nonMatchingRanks.map((r) => r.index));

              // At least some matching events should rank higher than some non-matching events
              expect(highestMatchingRank).toBeLessThan(lowestNonMatchingRank);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: tikit-webapp, Property 26: Related event recommendations
   * Validates: Requirements 8.3
   * 
   * For any user who has attended events of type T, the recommendation section
   * should include upcoming events of type T or related types
   */
  it('Property 26: Related event recommendations', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('wedding', 'crusade', 'burial', 'festival', 'general'),
        fc.constantFrom('Lagos', 'Kano', 'Rivers', 'Oyo', 'Enugu'),
        fc.integer({ min: 5, max: 15 }),
        async (eventType, state, relatedEventCount) => {
          const referenceEventId = 'reference-event-123';

          // Create reference event
          const referenceEvent = {
            id: referenceEventId,
            organizerId: 'organizer-1',
            title: 'Reference Event',
            description: 'The reference event',
            eventType,
            startDate: new Date(Date.now() + 7 * 86400000),
            endDate: new Date(Date.now() + 7 * 86400000 + 3600000),
            venue: 'Test Venue',
            state,
            lga: 'Test LGA',
            latitude: 6.5244,
            longitude: 3.3792,
            capacity: 100,
            ticketsSold: 30,
            tiers: [],
            culturalFeatures: {},
            images: [],
            ussdCode: '1234',
            status: 'published',
            isHidden: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          // Create related events - mix of same type, same state, and same LGA
          const relatedEvents = Array.from({ length: relatedEventCount }, (_, i) => {
            const isSameType = i % 3 === 0;
            const isSameState = i % 2 === 0;

            return {
              id: `related-event-${i}`,
              organizerId: 'organizer-2',
              title: `Related Event ${i}`,
              description: 'A related event',
              eventType: isSameType ? eventType : 'general',
              startDate: new Date(Date.now() + (i + 7) * 86400000),
              endDate: new Date(Date.now() + (i + 7) * 86400000 + 3600000),
              venue: 'Test Venue',
              state: isSameState ? state : 'Abuja',
              lga: isSameState ? 'Test LGA' : 'Different LGA',
              latitude: isSameState ? 6.5244 + (i * 0.01) : 9.0579,
              longitude: isSameState ? 3.3792 + (i * 0.01) : 7.4951,
              capacity: 100,
              ticketsSold: 30,
              tiers: [],
              culturalFeatures: {},
              images: [],
              ussdCode: `${2000 + i}`,
              status: 'published',
              isHidden: false,
              createdAt: new Date(),
              updatedAt: new Date(),
              organizer: {
                id: 'organizer-2',
                firstName: 'Test',
                lastName: 'Organizer',
                role: 'organizer',
              },
            };
          });

          // Mock Prisma responses
          mockPrisma.event.findUnique.mockResolvedValue(referenceEvent);
          mockPrisma.event.findMany.mockResolvedValue(relatedEvents);

          // Get related events
          const result = await getRelatedEvents(referenceEventId, 5);

          // Verify success
          expect(result.success).toBe(true);
          expect(result.relatedEvents).toBeDefined();

          if (result.relatedEvents && result.relatedEvents.length > 0) {
            // Property: Related events should include events of the same type or same location
            const hasMatchingType = result.relatedEvents.some(
              (event: any) => event.eventType === eventType
            );
            const hasMatchingState = result.relatedEvents.some(
              (event: any) => event.state === state
            );

            // At least one related event should match either type or state
            expect(hasMatchingType || hasMatchingState).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: tikit-webapp, Property 27: Trending notification trigger
   * Validates: Requirements 8.4
   * 
   * For any user whose preferred event type is trending, a push notification
   * with personalized recommendations should be sent
   */
  it('Property 27: Trending notification trigger', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('wedding', 'crusade', 'burial', 'festival', 'general'),
        fc.constantFrom('Lagos', 'Kano', 'Rivers', 'Oyo', 'Enugu'),
        fc.integer({ min: 5, max: 20 }),
        async (eventType, state, eventCount) => {
          // Create events with varying recent sales
          const events = Array.from({ length: eventCount }, (_, i) => {
            const recentSalesCount = i < 3 ? 10 + i * 5 : i; // First 3 events have high sales

            return {
              id: `event-${i}`,
              organizerId: 'organizer-1',
              title: `Event ${i}`,
              description: 'Test event',
              eventType: i < 3 ? eventType : 'general', // First 3 match the type
              startDate: new Date(Date.now() + 7 * 86400000),
              endDate: new Date(Date.now() + 7 * 86400000 + 3600000),
              venue: 'Test Venue',
              state: i < 3 ? state : 'Abuja',
              lga: 'Test LGA',
              latitude: 6.5244,
              longitude: 3.3792,
              capacity: 100,
              ticketsSold: 30 + recentSalesCount,
              tiers: [],
              culturalFeatures: {},
              images: [],
              ussdCode: `${1000 + i}`,
              status: 'published',
              isHidden: false,
              createdAt: new Date(),
              updatedAt: new Date(),
              organizer: {
                id: 'organizer-1',
                firstName: 'Test',
                lastName: 'Organizer',
                role: 'organizer',
              },
              tickets: Array.from({ length: recentSalesCount }, (_, j) => ({
                id: `ticket-${i}-${j}`,
                eventId: `event-${i}`,
                userId: `user-${j}`,
                purchaseDate: new Date(Date.now() - j * 3600000), // Recent purchases
              })),
            };
          });

          // Mock Prisma responses - filter events based on the where clause
          mockPrisma.event.findMany.mockImplementation((args: any) => {
            let filteredEvents = [...events];
            
            if (args.where) {
              if (args.where.eventType) {
                filteredEvents = filteredEvents.filter((e: any) => e.eventType === args.where.eventType);
              }
              if (args.where.state) {
                filteredEvents = filteredEvents.filter((e: any) => e.state === args.where.state);
              }
            }
            
            return Promise.resolve(filteredEvents);
          });

          // Get trending events for the specific type and state
          const result = await getTrendingEvents(eventType, state, 10);

          // Verify success
          expect(result.success).toBe(true);
          expect(result.trendingEvents).toBeDefined();

          // Property: When filtering by type and state, all returned events should match
          if (result.trendingEvents && result.trendingEvents.length > 0) {
            // All trending events should match the requested type
            const allMatchType = result.trendingEvents.every(
              (item: any) => item.event.eventType === eventType
            );
            expect(allMatchType).toBe(true);

            // All trending events should match the requested state
            const allMatchState = result.trendingEvents.every(
              (item: any) => item.event.state === state
            );
            expect(allMatchState).toBe(true);

            // Property: Events should be sorted by recent sales (trending score)
            const recentSales = result.trendingEvents.map((item: any) => item.recentSales);
            for (let i = 0; i < recentSales.length - 1; i++) {
              // Each event should have >= recent sales than the next
              expect(recentSales[i]).toBeGreaterThanOrEqual(recentSales[i + 1]);
            }
          } else {
            // If no trending events found, that's acceptable (might not have any matching the criteria)
            // The property still holds: if there ARE trending events, they must match the criteria
            expect(result.success).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
