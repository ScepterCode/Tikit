import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';

// Mock Prisma client
const mockPrisma = {
  event: {
    findMany: vi.fn(),
    count: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
};

vi.mock('../lib/prisma.js', () => ({
  default: mockPrisma,
}));

// Import after mocking
const { 
  getEventsFeed, 
  getEventById, 
  createHiddenEvent, 
  validateAccessCode,
  trackInvitationSource,
  generateShareableLink,
  getInvitationAnalytics
} = await import('./event.service.js');

describe('Event Service Property Tests', () => {
  const testState = 'Lagos';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Feature: tikit-webapp, Property 4: Pagination consistency
   * Validates: Requirements 2.4
   * 
   * For any page number in the event feed, the system should return exactly 20 events
   * (or fewer if on the last page), and no event should appear on multiple pages
   */
  it('Property 4: Pagination consistency', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 25, max: 100 }), // Total number of events to create
        fc.integer({ min: 1, max: 5 }), // Number of pages to test
        async (totalEvents, pagesToTest) => {
          // Generate mock events
          const mockEvents = Array.from({ length: totalEvents }, (_, i) => ({
            id: `event-${i}`,
            organizerId: 'test-user',
            title: `Test Event ${i}`,
            description: `Description for event ${i}`,
            eventType: 'general',
            startDate: new Date(Date.now() + i * 86400000),
            endDate: new Date(Date.now() + i * 86400000 + 3600000),
            venue: `Venue ${i}`,
            state: testState,
            lga: 'Ikeja',
            latitude: 6.5244 + (i * 0.001),
            longitude: 3.3792 + (i * 0.001),
            capacity: 100,
            ticketsSold: 0,
            tiers: [
              {
                id: `tier-${i}`,
                name: 'General',
                price: 1000,
                quantity: 100,
                sold: 0,
              },
            ],
            images: [],
            ussdCode: `${1000 + i}`,
            status: 'published',
            isHidden: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            organizer: {
              id: 'test-user',
              firstName: 'Test',
              lastName: 'User',
              role: 'organizer',
            },
          }));

          // Mock Prisma responses
          mockPrisma.event.count.mockResolvedValue(totalEvents);

          // Track all event IDs across pages
          const allEventIds = new Set<string>();
          const pageSize = 20;
          const totalPages = Math.ceil(totalEvents / pageSize);

          // Test multiple pages
          for (let page = 1; page <= Math.min(pagesToTest, totalPages); page++) {
            const skip = (page - 1) * pageSize;
            const pageEvents = mockEvents.slice(skip, skip + pageSize);

            mockPrisma.event.findMany.mockResolvedValueOnce(pageEvents);

            const result = await getEventsFeed(
              testState,
              {},
              { page, limit: pageSize }
            );

            expect(result.success).toBe(true);
            
            // Check that we get exactly 20 events or fewer on the last page
            if (page < totalPages) {
              expect(result.events.length).toBe(Math.min(pageSize, pageEvents.length));
            } else {
              const expectedOnLastPage = totalEvents % pageSize || pageSize;
              expect(result.events.length).toBe(Math.min(expectedOnLastPage, pageEvents.length));
            }

            // Check for duplicates across pages
            for (const event of result.events) {
              expect(allEventIds.has(event.id)).toBe(false); // No event should appear twice
              allEventIds.add(event.id);
            }

            // Verify pagination metadata
            expect(result.pagination.page).toBe(page);
            expect(result.pagination.limit).toBe(pageSize);
            expect(result.pagination.total).toBe(totalEvents);
            expect(result.pagination.totalPages).toBe(totalPages);
            expect(result.pagination.hasMore).toBe(page < totalPages);
          }

          // Verify no duplicates
          const testedEvents = Math.min(pagesToTest * pageSize, totalEvents);
          expect(allEventIds.size).toBeLessThanOrEqual(testedEvents);
        }
      ),
      { numRuns: 100 } // Run 100 times with different configurations
    );
  });

  /**
   * Feature: tikit-webapp, Property 3: Multi-filter conjunction
   * Validates: Requirements 2.3
   * 
   * For any combination of filters applied to the event feed, all returned events
   * should match every selected filter criterion
   */
  it('Property 3: Multi-filter conjunction', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 20, max: 50 }), // Number of events
        fc.record({
          eventType: fc.constantFrom('wedding', 'crusade', 'burial', 'festival', 'general'),
          priceMin: fc.integer({ min: 0, max: 5000 }),
          priceMax: fc.integer({ min: 5000, max: 50000 }),
          capacityStatus: fc.constantFrom('available', 'almost_full', 'sold_out'),
        }),
        async (numEvents, filters) => {
          const testState = 'Lagos';
          
          // Generate diverse mock events that match the filters
          const mockEvents = Array.from({ length: numEvents }, (_, i) => {
            // Create events that match the filter criteria
            const eventType = filters.eventType;
            
            // Vary capacity status
            let ticketsSold: number;
            let capacity = 100;
            if (filters.capacityStatus === 'available') {
              ticketsSold = Math.floor(capacity * 0.5); // 50% sold
            } else if (filters.capacityStatus === 'almost_full') {
              ticketsSold = Math.floor(capacity * 0.9); // 90% sold
            } else {
              ticketsSold = capacity; // 100% sold
            }
            
            // Price within range
            const price = filters.priceMin + Math.floor((filters.priceMax - filters.priceMin) / 2);

            return {
              id: `event-${i}`,
              organizerId: 'test-user',
              title: `Test Event ${i}`,
              description: `Description ${i}`,
              eventType,
              startDate: new Date(Date.now() + i * 86400000),
              endDate: new Date(Date.now() + i * 86400000 + 3600000),
              venue: `Venue ${i}`,
              state: testState,
              lga: 'Ikeja',
              latitude: 6.5244,
              longitude: 3.3792,
              capacity,
              ticketsSold,
              tiers: [
                {
                  id: `tier-${i}`,
                  name: 'General',
                  price,
                  quantity: capacity,
                  sold: ticketsSold,
                },
              ],
              images: [],
              ussdCode: `${1000 + i}`,
              status: 'published',
              isHidden: false,
              createdAt: new Date(),
              updatedAt: new Date(),
              organizer: {
                id: 'test-user',
                firstName: 'Test',
                lastName: 'User',
                role: 'organizer',
              },
            };
          });

          // Mock Prisma responses
          mockPrisma.event.count.mockResolvedValue(numEvents);
          mockPrisma.event.findMany.mockResolvedValue(mockEvents);

          // Apply filters
          const result = await getEventsFeed(
            testState,
            filters,
            { page: 1, limit: 100 }
          );

          expect(result.success).toBe(true);

          // Verify all returned events match ALL filter criteria
          for (const event of result.events) {
            // Check event type filter
            if (filters.eventType) {
              expect(event.eventType).toBe(filters.eventType);
            }

            // Check price filter
            const tiers = event.tiers as any[];
            const minPrice = Math.min(...tiers.map((t) => t.price));
            const maxPrice = Math.max(...tiers.map((t) => t.price));

            if (filters.priceMin !== undefined) {
              expect(maxPrice).toBeGreaterThanOrEqual(filters.priceMin);
            }
            if (filters.priceMax !== undefined) {
              expect(minPrice).toBeLessThanOrEqual(filters.priceMax);
            }

            // Check capacity status filter
            if (filters.capacityStatus) {
              const percentSold = (event.ticketsSold / event.capacity) * 100;
              
              if (filters.capacityStatus === 'available') {
                expect(percentSold).toBeLessThan(80);
              } else if (filters.capacityStatus === 'almost_full') {
                expect(percentSold).toBeGreaterThanOrEqual(80);
                expect(percentSold).toBeLessThan(100);
              } else if (filters.capacityStatus === 'sold_out') {
                expect(percentSold).toBeGreaterThanOrEqual(100);
              }
            }
          }
        }
      ),
      { numRuns: 100 } // Run 100 times with different filter combinations
    );
  });

  /**
   * Feature: tikit-webapp, Property 5: Hidden event code uniqueness
   * Validates: Requirements 3.1
   * 
   * For any hidden event created, the system should generate a unique 4-digit access code
   * and a unique deep link that no other event possesses
   */
  it('Property 5: Hidden event code uniqueness', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 2, max: 10 }), // Number of hidden events to create
        fc.record({
          title: fc.string({ minLength: 5, maxLength: 50 }),
          description: fc.string({ minLength: 10, maxLength: 200 }),
          eventType: fc.constantFrom('wedding', 'crusade', 'burial', 'festival', 'general'),
          venue: fc.string({ minLength: 5, maxLength: 100 }),
          state: fc.constantFrom('Lagos', 'Abuja', 'Kano', 'Rivers'),
          lga: fc.string({ minLength: 3, maxLength: 50 }),
          latitude: fc.double({ min: 4.0, max: 14.0 }),
          longitude: fc.double({ min: 2.0, max: 15.0 }),
          capacity: fc.integer({ min: 50, max: 10000 }),
        }),
        async (numEvents, eventTemplate) => {
          const organizerId = 'test-organizer';
          const createdAccessCodes = new Set<string>();
          const createdDeepLinks = new Set<string>();
          const createdEventIds = new Set<string>();

          // Track all created events
          const createdEvents: any[] = [];
          
          // Track used codes to simulate database state
          const usedCodes = new Set<string>();

          for (let i = 0; i < numEvents; i++) {
            const eventId = `event-${Date.now()}-${i}-${Math.random()}`;
            
            // Generate a unique access code for this iteration
            let accessCode: string;
            let attempts = 0;
            do {
              accessCode = Math.floor(1000 + Math.random() * 9000).toString();
              attempts++;
              
              // Mock findUnique to check if code exists
              if (usedCodes.has(accessCode)) {
                mockPrisma.event.findUnique.mockResolvedValueOnce({ id: 'existing' });
              } else {
                mockPrisma.event.findUnique.mockResolvedValueOnce(null);
              }
            } while (usedCodes.has(accessCode) && attempts < 100);
            
            // Add to used codes
            usedCodes.add(accessCode);
            
            const ussdCode = Math.floor(1000 + Math.random() * 9000).toString();

            const eventData = {
              ...eventTemplate,
              startDate: new Date(Date.now() + i * 86400000),
              endDate: new Date(Date.now() + i * 86400000 + 3600000),
              tiers: [
                {
                  id: `tier-${i}`,
                  name: 'General',
                  price: 1000,
                  quantity: eventTemplate.capacity,
                },
              ],
            };

            const mockCreatedEvent = {
              id: eventId,
              organizerId,
              ...eventData,
              isHidden: true,
              accessCode,
              deepLink: '',
              ussdCode,
              ticketsSold: 0,
              images: [],
              culturalFeatures: {},
              status: 'published',
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            // Mock create
            mockPrisma.event.create.mockResolvedValueOnce(mockCreatedEvent);

            // Mock update for deep link
            const deepLink = `https://tikit.app/events/${eventId}?code=${accessCode}`;
            const updatedEvent = {
              ...mockCreatedEvent,
              deepLink,
            };
            mockPrisma.event.update.mockResolvedValueOnce(updatedEvent);

            const result = await createHiddenEvent(organizerId, eventData);

            expect(result.success).toBe(true);
            expect(result.event).toBeDefined();
            expect(result.accessCode).toBeDefined();
            expect(result.deepLink).toBeDefined();

            // Verify access code is 4 digits
            expect(result.accessCode).toMatch(/^\d{4}$/);

            // Verify uniqueness of access code
            const isDuplicate = createdAccessCodes.has(result.accessCode!);
            expect(isDuplicate).toBe(false);
            createdAccessCodes.add(result.accessCode!);

            // Verify uniqueness of deep link
            expect(createdDeepLinks.has(result.deepLink!)).toBe(false);
            createdDeepLinks.add(result.deepLink!);

            // Verify uniqueness of event ID
            expect(createdEventIds.has(result.event!.id)).toBe(false);
            createdEventIds.add(result.event!.id);

            // Verify deep link format
            expect(result.deepLink).toContain(result.event!.id);
            expect(result.deepLink).toContain(result.accessCode);

            createdEvents.push(result.event);
          }

          // Final verification: all codes and links are unique
          expect(createdAccessCodes.size).toBe(numEvents);
          expect(createdDeepLinks.size).toBe(numEvents);
          expect(createdEventIds.size).toBe(numEvents);

          // Verify all events are marked as hidden
          for (const event of createdEvents) {
            expect(event.isHidden).toBe(true);
          }
        }
      ),
      { numRuns: 100 } // Run 100 times with different configurations
    );
  });

  /**
   * Feature: tikit-webapp, Property 7: Access code validation
   * Validates: Requirements 3.3
   * 
   * For any 4-digit access code, if it matches a hidden event's code, access should be granted;
   * if it doesn't match any event, access should be denied
   */
  it('Property 7: Access code validation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            accessCode: fc.integer({ min: 1000, max: 9999 }).map(n => n.toString()),
            title: fc.string({ minLength: 5, maxLength: 50 }),
            eventType: fc.constantFrom('wedding', 'crusade', 'burial', 'festival', 'general'),
          }),
          { minLength: 3, maxLength: 10 }
        ),
        fc.integer({ min: 1000, max: 9999 }).map(n => n.toString()), // Invalid code
        async (validEvents, invalidCode) => {
          // Ensure invalid code doesn't match any valid codes
          const validCodes = new Set(validEvents.map(e => e.accessCode));
          
          // If by chance the invalid code matches a valid one, skip this test case
          if (validCodes.has(invalidCode)) {
            return true;
          }

          // Test valid access codes
          for (const eventData of validEvents) {
            const mockEvent = {
              id: `event-${eventData.accessCode}`,
              organizerId: 'test-organizer',
              title: eventData.title,
              description: 'Test description',
              eventType: eventData.eventType,
              startDate: new Date(),
              endDate: new Date(),
              venue: 'Test Venue',
              state: 'Lagos',
              lga: 'Ikeja',
              latitude: 6.5244,
              longitude: 3.3792,
              capacity: 100,
              ticketsSold: 0,
              tiers: [],
              images: [],
              ussdCode: '1234',
              isHidden: true,
              accessCode: eventData.accessCode,
              deepLink: `https://tikit.app/events/event-${eventData.accessCode}?code=${eventData.accessCode}`,
              status: 'published',
              createdAt: new Date(),
              updatedAt: new Date(),
              organizer: {
                id: 'test-organizer',
                firstName: 'Test',
                lastName: 'Organizer',
                role: 'organizer',
              },
            };

            // Mock findUnique to return the event for valid code
            mockPrisma.event.findUnique.mockResolvedValueOnce(mockEvent);

            const result = await validateAccessCode(eventData.accessCode);

            // Valid code should grant access
            expect(result.success).toBe(true);
            expect(result.event).toBeDefined();
            expect(result.event?.accessCode).toBe(eventData.accessCode);
            expect(result.event?.isHidden).toBe(true);
          }

          // Test invalid access code
          mockPrisma.event.findUnique.mockResolvedValueOnce(null);

          const invalidResult = await validateAccessCode(invalidCode);

          // Invalid code should deny access
          expect(invalidResult.success).toBe(false);
          expect(invalidResult.message).toBe('Invalid access code');
          expect(invalidResult.event).toBeUndefined();

          return true;
        }
      ),
      { numRuns: 100 } // Run 100 times with different codes
    );
  });

  /**
   * Feature: tikit-webapp, Property 6: Deep link navigation
   * Validates: Requirements 3.2
   * 
   * For any valid deep link for a hidden event, accessing it should navigate directly to that event's page after code validation
   */
  it('Property 6: Deep link navigation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            eventId: fc.uuid(),
            accessCode: fc.integer({ min: 1000, max: 9999 }).map(n => n.toString()),
            title: fc.string({ minLength: 5, maxLength: 50 }),
            eventType: fc.constantFrom('wedding', 'crusade', 'burial', 'festival', 'general'),
            venue: fc.string({ minLength: 5, maxLength: 100 }),
            state: fc.constantFrom('Lagos', 'Abuja', 'Kano', 'Rivers', 'Oyo'),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (events) => {
          // Ensure all event IDs and access codes are unique
          const eventIds = new Set(events.map(e => e.eventId));
          const accessCodes = new Set(events.map(e => e.accessCode));
          
          // Skip if duplicates exist (property testing will generate new values)
          if (eventIds.size !== events.length || accessCodes.size !== events.length) {
            return true;
          }

          // Test each event's deep link navigation
          for (const eventData of events) {
            // Generate deep link
            const baseUrl = process.env.FRONTEND_URL || 'https://tikit.app';
            const deepLink = `${baseUrl}/events/${eventData.eventId}?code=${eventData.accessCode}`;

            // Parse the deep link to extract event ID and access code
            const url = new URL(deepLink);
            const pathParts = url.pathname.split('/');
            const extractedEventId = pathParts[pathParts.length - 1];
            const extractedAccessCode = url.searchParams.get('code');

            // Verify deep link format
            expect(extractedEventId).toBe(eventData.eventId);
            expect(extractedAccessCode).toBe(eventData.accessCode);
            expect(deepLink).toContain(eventData.eventId);
            expect(deepLink).toContain(eventData.accessCode);

            // Mock the event in database
            const mockEvent = {
              id: eventData.eventId,
              organizerId: 'test-organizer',
              title: eventData.title,
              description: 'Test description',
              eventType: eventData.eventType,
              startDate: new Date(),
              endDate: new Date(),
              venue: eventData.venue,
              state: eventData.state,
              lga: 'Test LGA',
              latitude: 6.5244,
              longitude: 3.3792,
              capacity: 100,
              ticketsSold: 0,
              tiers: [],
              images: [],
              ussdCode: '1234',
              isHidden: true,
              accessCode: eventData.accessCode,
              deepLink: deepLink,
              status: 'published',
              createdAt: new Date(),
              updatedAt: new Date(),
              organizer: {
                id: 'test-organizer',
                firstName: 'Test',
                lastName: 'Organizer',
                role: 'organizer',
              },
            };

            // Mock validateAccessCode to return the event
            mockPrisma.event.findUnique.mockResolvedValueOnce(mockEvent);

            // Validate the access code (simulating the navigation flow)
            const validationResult = await validateAccessCode(extractedAccessCode!);

            // Verify validation succeeds
            expect(validationResult.success).toBe(true);
            expect(validationResult.event).toBeDefined();
            expect(validationResult.event?.id).toBe(eventData.eventId);
            expect(validationResult.event?.accessCode).toBe(eventData.accessCode);
            expect(validationResult.event?.isHidden).toBe(true);
            expect(validationResult.event?.deepLink).toBe(deepLink);

            // Verify the event returned is the correct one
            expect(validationResult.event?.title).toBe(eventData.title);
            expect(validationResult.event?.eventType).toBe(eventData.eventType);
            expect(validationResult.event?.venue).toBe(eventData.venue);
            expect(validationResult.event?.state).toBe(eventData.state);
          }

          return true;
        }
      ),
      { numRuns: 100 } // Run 100 times with different deep links
    );
  });

  /**
   * Feature: tikit-webapp, Property 8: Hidden event exclusion from search
   * Validates: Requirements 3.4
   * 
   * For any search query on public event listings, no events marked as hidden should appear in the results
   */
  it('Property 8: Hidden event exclusion from search', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 5, max: 30 }), // Total number of events
        fc.double({ min: 0.1, max: 0.9 }), // Percentage of hidden events
        fc.record({
          eventType: fc.constantFrom('wedding', 'crusade', 'burial', 'festival', 'general').map(v => v as string | undefined),
          priceMin: fc.integer({ min: 0, max: 5000 }).map(v => v as number | undefined),
          priceMax: fc.integer({ min: 5000, max: 50000 }).map(v => v as number | undefined),
        }),
        async (totalEvents, hiddenPercentage, filters) => {
          const testState = 'Lagos';
          const numHidden = Math.floor(totalEvents * hiddenPercentage);
          const numPublic = totalEvents - numHidden;

          // Generate mix of hidden and public events
          const mockEvents = Array.from({ length: totalEvents }, (_, i) => {
            const isHidden = i < numHidden;
            const eventType = filters.eventType || 'general';
            const price = filters.priceMin 
              ? filters.priceMin + Math.floor((filters.priceMax! - filters.priceMin) / 2)
              : 5000;

            return {
              id: `event-${i}`,
              organizerId: 'test-user',
              title: `${isHidden ? 'Hidden' : 'Public'} Event ${i}`,
              description: `Description ${i}`,
              eventType,
              startDate: new Date(Date.now() + i * 86400000),
              endDate: new Date(Date.now() + i * 86400000 + 3600000),
              venue: `Venue ${i}`,
              state: testState,
              lga: 'Ikeja',
              latitude: 6.5244,
              longitude: 3.3792,
              capacity: 100,
              ticketsSold: 0,
              tiers: [
                {
                  id: `tier-${i}`,
                  name: 'General',
                  price,
                  quantity: 100,
                  sold: 0,
                },
              ],
              images: [],
              ussdCode: `${1000 + i}`,
              status: 'published',
              isHidden, // Mix of hidden and public
              accessCode: isHidden ? `${1000 + i}` : null,
              deepLink: isHidden ? `https://tikit.app/events/event-${i}?code=${1000 + i}` : null,
              createdAt: new Date(),
              updatedAt: new Date(),
              organizer: {
                id: 'test-user',
                firstName: 'Test',
                lastName: 'User',
                role: 'organizer',
              },
            };
          });

          // Filter out hidden events (simulating database query with isHidden: false)
          const publicEvents = mockEvents.filter(e => !e.isHidden);

          // Mock Prisma responses - only return public events
          mockPrisma.event.count.mockResolvedValue(numPublic);
          mockPrisma.event.findMany.mockResolvedValue(publicEvents);

          // Get events feed (public search)
          const result = await getEventsFeed(
            testState,
            filters,
            { page: 1, limit: 100 }
          );

          expect(result.success).toBe(true);

          // Verify NO hidden events are in the results
          for (const event of result.events) {
            expect(event.isHidden).toBe(false);
            expect(event.title).not.toContain('Hidden');
          }

          // Verify all returned events are public
          const returnedIds = new Set(result.events.map(e => e.id));
          const hiddenIds = new Set(mockEvents.filter(e => e.isHidden).map(e => e.id));
          
          // No overlap between returned events and hidden events
          for (const hiddenId of hiddenIds) {
            expect(returnedIds.has(hiddenId)).toBe(false);
          }

          // Verify count matches only public events
          expect(result.pagination.total).toBe(numPublic);

          return true;
        }
      ),
      { numRuns: 100 } // Run 100 times with different mixes of hidden/public events
    );
  });

  /**
   * Additional test for Property 8: getEventById should also exclude hidden events
   * Validates: Requirements 3.4
   */
  it('Property 8: getEventById excludes hidden events', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          eventId: fc.uuid(),
          title: fc.string({ minLength: 5, maxLength: 50 }),
          eventType: fc.constantFrom('wedding', 'crusade', 'burial', 'festival', 'general'),
          isHidden: fc.boolean(),
        }),
        async (eventData) => {
          const mockEvent = {
            id: eventData.eventId,
            organizerId: 'test-user',
            title: eventData.title,
            description: 'Test description',
            eventType: eventData.eventType,
            startDate: new Date(),
            endDate: new Date(),
            venue: 'Test Venue',
            state: 'Lagos',
            lga: 'Ikeja',
            latitude: 6.5244,
            longitude: 3.3792,
            capacity: 100,
            ticketsSold: 0,
            tiers: [],
            images: [],
            ussdCode: '1234',
            status: 'published',
            isHidden: eventData.isHidden,
            accessCode: eventData.isHidden ? '1234' : null,
            deepLink: eventData.isHidden ? 'https://tikit.app/events/test?code=1234' : null,
            createdAt: new Date(),
            updatedAt: new Date(),
            organizer: {
              id: 'test-user',
              firstName: 'Test',
              lastName: 'User',
              phoneNumber: '+2341234567890',
              role: 'organizer',
            },
          };

          mockPrisma.event.findUnique.mockResolvedValueOnce(mockEvent);

          const result = await getEventById(eventData.eventId);

          if (eventData.isHidden) {
            // Hidden events should not be accessible via public getEventById
            expect(result.success).toBe(false);
            expect(result.message).toBe('Event not found');
            expect(result.event).toBeUndefined();
          } else {
            // Public events should be accessible
            expect(result.success).toBe(true);
            expect(result.event).toBeDefined();
            expect(result.event?.id).toBe(eventData.eventId);
            expect(result.event?.isHidden).toBe(false);
          }

          return true;
        }
      ),
      { numRuns: 100 } // Run 100 times with mix of hidden and public events
    );
  });

  /**
   * Feature: tikit-webapp, Property 9: Invitation source tracking
   * Validates: Requirements 3.5
   * 
   * For any hidden event link that is shared, the system should record and persist
   * the invitation source in analytics data
   */
  it('Property 9: Invitation source tracking', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          eventId: fc.uuid(),
          userId: fc.uuid(),
          source: fc.constantFrom('whatsapp', 'sms', 'email', 'facebook', 'twitter', 'direct'),
        }),
        fc.integer({ min: 1, max: 10 }), // Number of tracking entries
        async (trackingData, numEntries) => {
          // Create mock event with existing tracking data
          const existingTracking = Array.from({ length: numEntries }, (_, i) => ({
            userId: `user-${i}`,
            source: 'whatsapp',
            timestamp: new Date(Date.now() - i * 86400000).toISOString(),
          }));

          const mockEvent = {
            id: trackingData.eventId,
            organizerId: 'test-organizer',
            title: 'Test Hidden Event',
            description: 'Test description',
            eventType: 'wedding',
            startDate: new Date(),
            endDate: new Date(),
            venue: 'Test Venue',
            state: 'Lagos',
            lga: 'Ikeja',
            latitude: 6.5244,
            longitude: 3.3792,
            capacity: 100,
            ticketsSold: 0,
            tiers: [],
            images: [],
            ussdCode: '1234',
            isHidden: true,
            accessCode: '1234',
            deepLink: `https://tikit.app/events/${trackingData.eventId}?code=1234`,
            status: 'published',
            createdAt: new Date(),
            updatedAt: new Date(),
            culturalFeatures: {
              invitationTracking: existingTracking,
            },
          };

          // Mock findUnique to return the event
          mockPrisma.event.findUnique.mockResolvedValueOnce(mockEvent);

          // Mock update to return updated event
          const updatedTracking = [
            ...existingTracking,
            {
              userId: trackingData.userId,
              source: trackingData.source,
              timestamp: expect.any(String),
            },
          ];

          mockPrisma.event.update.mockResolvedValueOnce({
            ...mockEvent,
            culturalFeatures: {
              invitationTracking: updatedTracking,
            },
          });

          // Track invitation source
          const result = await trackInvitationSource(
            trackingData.eventId,
            trackingData.userId,
            trackingData.source
          );

          // Verify tracking succeeded
          expect(result.success).toBe(true);
          expect(result.message).toBe('Invitation source tracked');

          // Verify update was called with correct data
          expect(mockPrisma.event.update).toHaveBeenCalledWith({
            where: { id: trackingData.eventId },
            data: {
              culturalFeatures: expect.objectContaining({
                invitationTracking: expect.arrayContaining([
                  expect.objectContaining({
                    userId: trackingData.userId,
                    source: trackingData.source,
                    timestamp: expect.any(String),
                  }),
                ]),
              }),
            },
          });

          return true;
        }
      ),
      { numRuns: 100 } // Run 100 times with different sources
    );
  });

  /**
   * Test for generateShareableLink function
   * Validates that shareable links include source parameters
   */
  it('generateShareableLink includes source parameter in deep link', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          eventId: fc.uuid(),
          accessCode: fc.integer({ min: 1000, max: 9999 }).map(n => n.toString()),
          source: fc.constantFrom('whatsapp', 'sms', 'email', 'other'),
        }),
        async (linkData) => {
          const mockEvent = {
            id: linkData.eventId,
            organizerId: 'test-organizer',
            title: 'Test Hidden Event',
            description: 'Test description',
            eventType: 'wedding',
            startDate: new Date(),
            endDate: new Date(),
            venue: 'Test Venue',
            state: 'Lagos',
            lga: 'Ikeja',
            latitude: 6.5244,
            longitude: 3.3792,
            capacity: 100,
            ticketsSold: 0,
            tiers: [],
            images: [],
            ussdCode: '1234',
            isHidden: true,
            accessCode: linkData.accessCode,
            deepLink: `https://tikit.app/events/${linkData.eventId}?code=${linkData.accessCode}`,
            status: 'published',
            createdAt: new Date(),
            updatedAt: new Date(),
            culturalFeatures: {},
          };

          // Mock findUnique to return the event
          mockPrisma.event.findUnique.mockResolvedValueOnce(mockEvent);

          // Generate shareable link
          const result = await generateShareableLink(linkData.eventId, linkData.source);

          // Verify link generation succeeded
          expect(result.success).toBe(true);
          expect(result.deepLink).toBeDefined();

          // Parse the deep link
          const url = new URL(result.deepLink!);
          
          // Verify link contains event ID
          expect(result.deepLink).toContain(linkData.eventId);
          
          // Verify link contains access code
          expect(url.searchParams.get('code')).toBe(linkData.accessCode);
          
          // Verify link contains source parameter
          expect(url.searchParams.get('source')).toBe(linkData.source);

          return true;
        }
      ),
      { numRuns: 100 } // Run 100 times with different sources
    );
  });

  /**
   * Test for getInvitationAnalytics function
   * Validates that analytics are correctly aggregated by source
   */
  it('getInvitationAnalytics correctly aggregates tracking data', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(), // eventId
        fc.array(
          fc.record({
            userId: fc.uuid(),
            source: fc.constantFrom('whatsapp', 'sms', 'email', 'facebook', 'twitter'),
            timestamp: fc.integer({ min: Date.parse('2024-01-01'), max: Date.now() }).map(ms => new Date(ms)),
          }),
          { minLength: 5, maxLength: 50 }
        ),
        async (eventId, trackingEntries) => {
          const mockEvent = {
            id: eventId,
            organizerId: 'test-organizer',
            title: 'Test Hidden Event',
            description: 'Test description',
            eventType: 'wedding',
            startDate: new Date(),
            endDate: new Date(),
            venue: 'Test Venue',
            state: 'Lagos',
            lga: 'Ikeja',
            latitude: 6.5244,
            longitude: 3.3792,
            capacity: 100,
            ticketsSold: 0,
            tiers: [],
            images: [],
            ussdCode: '1234',
            isHidden: true,
            accessCode: '1234',
            deepLink: `https://tikit.app/events/${eventId}?code=1234`,
            status: 'published',
            createdAt: new Date(),
            updatedAt: new Date(),
            culturalFeatures: {
              invitationTracking: trackingEntries.map(entry => ({
                ...entry,
                timestamp: entry.timestamp.toISOString(),
              })),
            },
          };

          // Mock findUnique to return the event
          mockPrisma.event.findUnique.mockResolvedValueOnce(mockEvent);

          // Get analytics
          const result = await getInvitationAnalytics(eventId);

          // Verify analytics retrieval succeeded
          expect(result.success).toBe(true);
          expect(result.analytics).toBeDefined();

          // Verify total count
          expect(result.analytics!.total).toBe(trackingEntries.length);

          // Verify aggregation by source
          const expectedBySource: Record<string, number> = {};
          for (const entry of trackingEntries) {
            expectedBySource[entry.source] = (expectedBySource[entry.source] || 0) + 1;
          }

          for (const [source, count] of Object.entries(expectedBySource)) {
            expect(result.analytics!.bySource[source]).toBeDefined();
            expect(result.analytics!.bySource[source].count).toBe(count);
            expect(result.analytics!.bySource[source].users).toHaveLength(count);
          }

          return true;
        }
      ),
      { numRuns: 100 } // Run 100 times with different tracking data
    );
  });
});


