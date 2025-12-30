import prisma from '../lib/prisma.js';
import { calculateDistance } from '../utils/geoDistance.js';

export interface EventFilters {
  state?: string;
  eventType?: string;
  dateFrom?: Date;
  dateTo?: Date;
  priceMin?: number;
  priceMax?: number;
  lga?: string;
  distance?: number;
  language?: string;
  capacityStatus?: 'available' | 'almost_full' | 'sold_out';
  organizerType?: string;
  paymentMethods?: string[];
  accessibilityFeatures?: string[];
}

export interface PaginationParams {
  page: number;
  limit: number;
}

/**
 * Get events feed with pagination and geographic filtering
 */
export async function getEventsFeed(
  userState: string,
  filters: EventFilters = {},
  pagination: PaginationParams = { page: 1, limit: 20 }
) {
  try {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      status: 'published',
      isHidden: false,
      startDate: {
        gte: new Date(), // Only future events
      },
    };

    // Apply filters
    if (filters.eventType) {
      where.eventType = filters.eventType;
    }

    if (filters.dateFrom || filters.dateTo) {
      where.startDate = {
        ...(filters.dateFrom && { gte: filters.dateFrom }),
        ...(filters.dateTo && { lte: filters.dateTo }),
      };
    }

    if (filters.lga) {
      where.lga = filters.lga;
    }

    // Get state center coordinates for distance filtering
    const stateCenter = getStateCenter(userState);

    // Fetch events
    const events = await prisma.event.findMany({
      where,
      include: {
        organizer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
      orderBy: [
        { startDate: 'asc' },
        { createdAt: 'desc' },
      ],
      skip,
      take: limit,
    });

    // Apply geographic filtering (100km radius)
    let filteredEvents = events;
    if (stateCenter && (!filters.distance || filters.distance <= 100)) {
      const maxDistance = filters.distance || 100;
      filteredEvents = events.filter((event) => {
        const distance = calculateDistance(
          stateCenter.latitude,
          stateCenter.longitude,
          event.latitude,
          event.longitude
        );
        return distance <= maxDistance;
      });
    }

    // Apply price filtering
    if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
      filteredEvents = filteredEvents.filter((event) => {
        const tiers = event.tiers as any[];
        const minPrice = Math.min(...tiers.map((t) => t.price));
        const maxPrice = Math.max(...tiers.map((t) => t.price));

        if (filters.priceMin !== undefined && maxPrice < filters.priceMin) {
          return false;
        }
        if (filters.priceMax !== undefined && minPrice > filters.priceMax) {
          return false;
        }
        return true;
      });
    }

    // Apply capacity status filtering
    if (filters.capacityStatus) {
      filteredEvents = filteredEvents.filter((event) => {
        const percentSold = (event.ticketsSold / event.capacity) * 100;
        
        if (filters.capacityStatus === 'available' && percentSold < 80) {
          return true;
        }
        if (filters.capacityStatus === 'almost_full' && percentSold >= 80 && percentSold < 100) {
          return true;
        }
        if (filters.capacityStatus === 'sold_out' && percentSold >= 100) {
          return true;
        }
        return false;
      });
    }

    // Apply language filtering (check if event supports the language)
    if (filters.language) {
      filteredEvents = filteredEvents.filter((event) => {
        // Events can have a languages field in culturalFeatures or default to all languages
        const culturalFeatures = event.culturalFeatures as any;
        if (culturalFeatures && culturalFeatures.languages) {
          return culturalFeatures.languages.includes(filters.language);
        }
        // If no language specified, assume event supports all languages
        return true;
      });
    }

    // Apply organizer type filtering
    if (filters.organizerType) {
      filteredEvents = filteredEvents.filter((event) => {
        return event.organizer.role === filters.organizerType;
      });
    }

    // Apply payment methods filtering
    if (filters.paymentMethods && filters.paymentMethods.length > 0) {
      filteredEvents = filteredEvents.filter((event) => {
        const tiers = event.tiers as any[];
        // Check if any tier supports at least one of the requested payment methods
        return tiers.some((tier) => {
          const tierPaymentMethods = tier.paymentMethods || ['card', 'bank_transfer', 'opay', 'palmpay', 'airtime', 'sponsored'];
          return filters.paymentMethods!.some((method) => tierPaymentMethods.includes(method));
        });
      });
    }

    // Apply accessibility features filtering
    if (filters.accessibilityFeatures && filters.accessibilityFeatures.length > 0) {
      filteredEvents = filteredEvents.filter((event) => {
        const culturalFeatures = event.culturalFeatures as any;
        const eventAccessibility = culturalFeatures?.accessibilityFeatures || [];
        // Check if event has all requested accessibility features
        return filters.accessibilityFeatures!.every((feature) => eventAccessibility.includes(feature));
      });
    }

    // Get total count for pagination
    const total = await prisma.event.count({ where });

    return {
      success: true,
      events: filteredEvents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    };
  } catch (error) {
    console.error('Get events feed error:', error);
    return {
      success: false,
      message: 'Failed to fetch events',
      events: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
        hasMore: false,
      },
    };
  }
}

/**
 * Get event by ID (public endpoint - excludes hidden events)
 */
export async function getEventById(eventId: string) {
  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        organizer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            role: true,
          },
        },
      },
    });

    if (!event) {
      return {
        success: false,
        message: 'Event not found',
      };
    }

    // Exclude hidden events from public access
    if (event.isHidden) {
      return {
        success: false,
        message: 'Event not found',
      };
    }

    return {
      success: true,
      event,
    };
  } catch (error) {
    console.error('Get event by ID error:', error);
    return {
      success: false,
      message: 'Failed to fetch event',
    };
  }
}

/**
 * Generate unique 4-digit access code for hidden events
 */
async function generateUniqueAccessCode(): Promise<string> {
  let attempts = 0;
  const maxAttempts = 100;

  while (attempts < maxAttempts) {
    // Generate random 4-digit code
    const code = Math.floor(1000 + Math.random() * 9000).toString();

    // Check if code already exists
    const existing = await prisma.event.findUnique({
      where: { accessCode: code },
    });

    if (!existing) {
      return code;
    }

    attempts++;
  }

  throw new Error('Failed to generate unique access code after maximum attempts');
}

/**
 * Generate deep link for hidden event
 * @param eventId - The event ID
 * @param accessCode - The 4-digit access code
 * @param source - Optional source parameter for tracking (e.g., 'whatsapp', 'sms', 'email')
 */
function generateDeepLink(eventId: string, accessCode: string, source?: string): string {
  const baseUrl = process.env.FRONTEND_URL || 'https://tikit.app';
  const url = new URL(`${baseUrl}/events/${eventId}`);
  url.searchParams.set('code', accessCode);
  
  if (source) {
    url.searchParams.set('source', source);
  }
  
  return url.toString();
}

/**
 * Create hidden event with access code and deep link
 */
export async function createHiddenEvent(
  organizerId: string,
  eventData: {
    title: string;
    description: string;
    eventType: string;
    startDate: Date;
    endDate: Date;
    venue: string;
    state: string;
    lga: string;
    latitude: number;
    longitude: number;
    capacity: number;
    tiers: any[];
    culturalFeatures?: any;
    images?: string[];
  }
) {
  try {
    // Generate unique access code
    const accessCode = await generateUniqueAccessCode();

    // Generate unique USSD code (4 digits)
    const ussdCode = Math.floor(1000 + Math.random() * 9000).toString();

    // Create event
    const event = await prisma.event.create({
      data: {
        organizerId,
        title: eventData.title,
        description: eventData.description,
        eventType: eventData.eventType,
        startDate: eventData.startDate,
        endDate: eventData.endDate,
        venue: eventData.venue,
        state: eventData.state,
        lga: eventData.lga,
        latitude: eventData.latitude,
        longitude: eventData.longitude,
        capacity: eventData.capacity,
        tiers: eventData.tiers,
        culturalFeatures: eventData.culturalFeatures || {},
        images: eventData.images || [],
        ussdCode,
        isHidden: true,
        accessCode,
        deepLink: '', // Will be updated after event creation
        status: 'published',
      },
    });

    // Generate deep link with event ID
    const deepLink = generateDeepLink(event.id, accessCode);

    // Update event with deep link
    const updatedEvent = await prisma.event.update({
      where: { id: event.id },
      data: { deepLink },
    });

    return {
      success: true,
      event: updatedEvent,
      accessCode,
      deepLink,
    };
  } catch (error) {
    console.error('Create hidden event error:', error);
    return {
      success: false,
      message: 'Failed to create hidden event',
    };
  }
}

/**
 * Validate access code for hidden event
 */
export async function validateAccessCode(accessCode: string) {
  try {
    const event = await prisma.event.findUnique({
      where: { accessCode },
      include: {
        organizer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    if (!event) {
      return {
        success: false,
        message: 'Invalid access code',
      };
    }

    if (!event.isHidden) {
      return {
        success: false,
        message: 'Event is not hidden',
      };
    }

    return {
      success: true,
      event,
    };
  } catch (error) {
    console.error('Validate access code error:', error);
    return {
      success: false,
      message: 'Failed to validate access code',
    };
  }
}

/**
 * Track invitation source for analytics
 */
export async function trackInvitationSource(
  eventId: string,
  userId: string,
  source: string
) {
  try {
    // Store invitation tracking in event metadata
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return {
        success: false,
        message: 'Event not found',
      };
    }

    // Get existing cultural features or create new object
    const culturalFeatures = (event.culturalFeatures as any) || {};
    const invitationTracking = culturalFeatures.invitationTracking || [];

    // Add new tracking entry
    invitationTracking.push({
      userId,
      source,
      timestamp: new Date().toISOString(),
    });

    // Update event with new tracking data
    await prisma.event.update({
      where: { id: eventId },
      data: {
        culturalFeatures: {
          ...culturalFeatures,
          invitationTracking,
        },
      },
    });

    return {
      success: true,
      message: 'Invitation source tracked',
    };
  } catch (error) {
    console.error('Track invitation source error:', error);
    return {
      success: false,
      message: 'Failed to track invitation source',
    };
  }
}

/**
 * Generate shareable deep link with source tracking
 */
export async function generateShareableLink(
  eventId: string,
  source: 'whatsapp' | 'sms' | 'email' | 'other'
) {
  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return {
        success: false,
        message: 'Event not found',
      };
    }

    if (!event.isHidden || !event.accessCode) {
      return {
        success: false,
        message: 'Event is not a hidden event',
      };
    }

    // Generate deep link with source parameter
    const deepLink = generateDeepLink(event.id, event.accessCode, source);

    return {
      success: true,
      deepLink,
    };
  } catch (error) {
    console.error('Generate shareable link error:', error);
    return {
      success: false,
      message: 'Failed to generate shareable link',
    };
  }
}

/**
 * Get invitation analytics for an event
 */
export async function getInvitationAnalytics(eventId: string) {
  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return {
        success: false,
        message: 'Event not found',
      };
    }

    const culturalFeatures = (event.culturalFeatures as any) || {};
    const invitationTracking = culturalFeatures.invitationTracking || [];

    // Aggregate analytics by source
    const analytics = invitationTracking.reduce((acc: any, entry: any) => {
      const source = entry.source || 'unknown';
      if (!acc[source]) {
        acc[source] = {
          count: 0,
          users: [],
        };
      }
      acc[source].count++;
      acc[source].users.push({
        userId: entry.userId,
        timestamp: entry.timestamp,
      });
      return acc;
    }, {});

    return {
      success: true,
      analytics: {
        total: invitationTracking.length,
        bySource: analytics,
      },
    };
  } catch (error) {
    console.error('Get invitation analytics error:', error);
    return {
      success: false,
      message: 'Failed to get invitation analytics',
    };
  }
}

/**
 * Create wedding event with cultural features
 */
export async function createWeddingEvent(
  organizerId: string,
  eventData: {
    title: string;
    description: string;
    startDate: Date;
    endDate: Date;
    venue: string;
    state: string;
    lga: string;
    latitude: number;
    longitude: number;
    capacity: number;
    tiers: any[];
    images?: string[];
    isHidden?: boolean;
    asoEbiTiers?: Array<{
      name: string;
      price: number;
      color: string;
    }>;
    foodOptions?: Array<{
      name: string;
      dietaryInfo: string;
    }>;
    sprayMoneyEnabled?: boolean;
  }
) {
  try {
    // Generate unique USSD code (4 digits)
    const ussdCode = Math.floor(1000 + Math.random() * 9000).toString();

    // Build cultural features for wedding
    const culturalFeatures: any = {
      asoEbiTiers: eventData.asoEbiTiers || [],
      foodOptions: eventData.foodOptions || [],
      sprayMoneyEnabled: eventData.sprayMoneyEnabled !== false, // Default to true
      sprayMoneyLeaderboard: [],
    };

    let accessCode: string | undefined;
    let deepLink: string | undefined;

    // Generate access code and deep link if hidden
    if (eventData.isHidden) {
      accessCode = await generateUniqueAccessCode();
    }

    // Create event
    const event = await prisma.event.create({
      data: {
        organizerId,
        title: eventData.title,
        description: eventData.description,
        eventType: 'wedding',
        startDate: eventData.startDate,
        endDate: eventData.endDate,
        venue: eventData.venue,
        state: eventData.state,
        lga: eventData.lga,
        latitude: eventData.latitude,
        longitude: eventData.longitude,
        capacity: eventData.capacity,
        tiers: eventData.tiers,
        culturalFeatures,
        images: eventData.images || [],
        ussdCode,
        isHidden: eventData.isHidden || false,
        accessCode,
        deepLink: '', // Will be updated if hidden
        status: 'published',
      },
    });

    // Generate and update deep link if hidden
    if (eventData.isHidden && accessCode) {
      deepLink = generateDeepLink(event.id, accessCode);
      await prisma.event.update({
        where: { id: event.id },
        data: { deepLink },
      });
    }

    return {
      success: true,
      event: {
        ...event,
        deepLink,
      },
      accessCode,
      deepLink,
    };
  } catch (error) {
    console.error('Create wedding event error:', error);
    return {
      success: false,
      message: 'Failed to create wedding event',
    };
  }
}

/**
 * Create burial event with cultural features
 */
export async function createBurialEvent(
  organizerId: string,
  eventData: {
    title: string;
    description: string;
    startDate: Date;
    endDate: Date;
    venue: string;
    state: string;
    lga: string;
    latitude: number;
    longitude: number;
    capacity: number;
    tiers: any[];
    images?: string[];
    isHidden?: boolean;
    condolenceMessageEnabled?: boolean;
    donationTracking?: boolean;
  }
) {
  try {
    // Generate unique USSD code (4 digits)
    const ussdCode = Math.floor(1000 + Math.random() * 9000).toString();

    // Build cultural features for burial
    const culturalFeatures: any = {
      condolenceMessageEnabled: eventData.condolenceMessageEnabled !== false,
      donationTracking: eventData.donationTracking !== false,
      condolenceMessages: [],
      donations: [],
    };

    let accessCode: string | undefined;
    let deepLink: string | undefined;

    // Generate access code and deep link if hidden
    if (eventData.isHidden) {
      accessCode = await generateUniqueAccessCode();
    }

    // Create event
    const event = await prisma.event.create({
      data: {
        organizerId,
        title: eventData.title,
        description: eventData.description,
        eventType: 'burial',
        startDate: eventData.startDate,
        endDate: eventData.endDate,
        venue: eventData.venue,
        state: eventData.state,
        lga: eventData.lga,
        latitude: eventData.latitude,
        longitude: eventData.longitude,
        capacity: eventData.capacity,
        tiers: eventData.tiers,
        culturalFeatures,
        images: eventData.images || [],
        ussdCode,
        isHidden: eventData.isHidden || false,
        accessCode,
        deepLink: '', // Will be updated if hidden
        status: 'published',
      },
    });

    // Generate and update deep link if hidden
    if (eventData.isHidden && accessCode) {
      deepLink = generateDeepLink(event.id, accessCode);
      await prisma.event.update({
        where: { id: event.id },
        data: { deepLink },
      });
    }

    return {
      success: true,
      event: {
        ...event,
        deepLink,
      },
      accessCode,
      deepLink,
    };
  } catch (error) {
    console.error('Create burial event error:', error);
    return {
      success: false,
      message: 'Failed to create burial event',
    };
  }
}

/**
 * Add spray money transaction to wedding leaderboard
 */
export async function addSprayMoneyTransaction(
  eventId: string,
  userId: string,
  amount: number
) {
  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return {
        success: false,
        message: 'Event not found',
      };
    }

    if (event.eventType !== 'wedding') {
      return {
        success: false,
        message: 'Spray money is only available for wedding events',
      };
    }

    const culturalFeatures = (event.culturalFeatures as any) || {};
    
    if (!culturalFeatures.sprayMoneyEnabled) {
      return {
        success: false,
        message: 'Spray money is not enabled for this event',
      };
    }

    const leaderboard = culturalFeatures.sprayMoneyLeaderboard || [];

    // Add new transaction
    leaderboard.push({
      userId,
      amount,
      timestamp: new Date().toISOString(),
    });

    // Update event with new leaderboard
    await prisma.event.update({
      where: { id: eventId },
      data: {
        culturalFeatures: {
          ...culturalFeatures,
          sprayMoneyLeaderboard: leaderboard,
        },
      },
    });

    // Update real-time leaderboard via Supabase
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { firstName: true, lastName: true },
      });

      const userName = user
        ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Anonymous'
        : 'Anonymous';

      // Import realtime service dynamically to avoid circular dependencies
      const { updateSprayMoneyLeaderboard } = await import('./realtime.service.js');
      await updateSprayMoneyLeaderboard(eventId, userId, amount, userName);
    } catch (realtimeError) {
      console.error('Failed to update real-time leaderboard:', realtimeError);
      // Don't fail the transaction if real-time update fails
    }

    return {
      success: true,
      message: 'Spray money transaction added',
    };
  } catch (error) {
    console.error('Add spray money transaction error:', error);
    return {
      success: false,
      message: 'Failed to add spray money transaction',
    };
  }
}

/**
 * Get spray money leaderboard for a wedding event
 */
export async function getSprayMoneyLeaderboard(eventId: string) {
  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        organizer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!event) {
      return {
        success: false,
        message: 'Event not found',
      };
    }

    if (event.eventType !== 'wedding') {
      return {
        success: false,
        message: 'Spray money leaderboard is only available for wedding events',
      };
    }

    const culturalFeatures = (event.culturalFeatures as any) || {};
    const transactions = culturalFeatures.sprayMoneyLeaderboard || [];

    // Aggregate by user
    const userTotals = transactions.reduce((acc: any, transaction: any) => {
      const userId = transaction.userId;
      if (!acc[userId]) {
        acc[userId] = {
          userId,
          totalAmount: 0,
          transactionCount: 0,
          lastTransaction: transaction.timestamp,
        };
      }
      acc[userId].totalAmount += transaction.amount;
      acc[userId].transactionCount++;
      if (new Date(transaction.timestamp) > new Date(acc[userId].lastTransaction)) {
        acc[userId].lastTransaction = transaction.timestamp;
      }
      return acc;
    }, {});

    // Convert to array and sort by total amount
    const leaderboard = Object.values(userTotals).sort(
      (a: any, b: any) => b.totalAmount - a.totalAmount
    );

    // Get user details for top contributors
    const topContributors = await Promise.all(
      leaderboard.slice(0, 10).map(async (entry: any) => {
        const user = await prisma.user.findUnique({
          where: { id: entry.userId },
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        });
        return {
          ...entry,
          user,
        };
      })
    );

    return {
      success: true,
      leaderboard: topContributors,
      totalSprayMoney: leaderboard.reduce((sum: number, entry: any) => sum + entry.totalAmount, 0),
    };
  } catch (error) {
    console.error('Get spray money leaderboard error:', error);
    return {
      success: false,
      message: 'Failed to get spray money leaderboard',
    };
  }
}

/**
 * Get wedding analytics
 */
export async function getWeddingAnalytics(eventId: string) {
  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        tickets: true,
      },
    });

    if (!event) {
      return {
        success: false,
        message: 'Event not found',
      };
    }

    if (event.eventType !== 'wedding') {
      return {
        success: false,
        message: 'Wedding analytics are only available for wedding events',
      };
    }

    const culturalFeatures = (event.culturalFeatures as any) || {};
    
    // Aggregate food counts
    const foodCounts: Record<string, number> = {};
    const asoEbiSales: Record<string, number> = {};

    event.tickets.forEach((ticket) => {
      const selections = ticket.culturalSelections as any;
      if (selections) {
        // Count food choices
        if (selections.foodChoice) {
          foodCounts[selections.foodChoice] = (foodCounts[selections.foodChoice] || 0) + 1;
        }
        // Count aso-ebi tier sales
        if (selections.asoEbiTier) {
          asoEbiSales[selections.asoEbiTier] = (asoEbiSales[selections.asoEbiTier] || 0) + 1;
        }
      }
    });

    // Calculate total spray money
    const sprayMoneyTransactions = culturalFeatures.sprayMoneyLeaderboard || [];
    const totalSprayMoney = sprayMoneyTransactions.reduce(
      (sum: number, transaction: any) => sum + transaction.amount,
      0
    );

    return {
      success: true,
      analytics: {
        foodCounts,
        asoEbiSales,
        totalSprayMoney,
        totalTickets: event.tickets.length,
      },
    };
  } catch (error) {
    console.error('Get wedding analytics error:', error);
    return {
      success: false,
      message: 'Failed to get wedding analytics',
    };
  }
}

/**
 * Get state center coordinates for geographic filtering
 */
function getStateCenter(state: string): { latitude: number; longitude: number } | null {
  // Nigerian state centers (approximate coordinates)
  const stateCenters: Record<string, { latitude: number; longitude: number }> = {
    'Abia': { latitude: 5.4527, longitude: 7.5248 },
    'Adamawa': { latitude: 9.3265, longitude: 12.3984 },
    'Akwa Ibom': { latitude: 5.0077, longitude: 7.8536 },
    'Anambra': { latitude: 6.2209, longitude: 6.9370 },
    'Bauchi': { latitude: 10.3158, longitude: 9.8442 },
    'Bayelsa': { latitude: 4.7719, longitude: 6.0699 },
    'Benue': { latitude: 7.3364, longitude: 8.7403 },
    'Borno': { latitude: 11.8333, longitude: 13.1500 },
    'Cross River': { latitude: 5.8735, longitude: 8.5989 },
    'Delta': { latitude: 5.6806, longitude: 5.9184 },
    'Ebonyi': { latitude: 6.2649, longitude: 8.0137 },
    'Edo': { latitude: 6.3350, longitude: 5.6037 },
    'Ekiti': { latitude: 7.7190, longitude: 5.3110 },
    'Enugu': { latitude: 6.5244, longitude: 7.5102 },
    'FCT': { latitude: 9.0579, longitude: 7.4951 },
    'Gombe': { latitude: 10.2897, longitude: 11.1689 },
    'Imo': { latitude: 5.5720, longitude: 7.0588 },
    'Jigawa': { latitude: 12.2230, longitude: 9.5619 },
    'Kaduna': { latitude: 10.5105, longitude: 7.4165 },
    'Kano': { latitude: 12.0022, longitude: 8.5920 },
    'Katsina': { latitude: 12.9908, longitude: 7.6177 },
    'Kebbi': { latitude: 11.4969, longitude: 4.1975 },
    'Kogi': { latitude: 7.7333, longitude: 6.7333 },
    'Kwara': { latitude: 8.9670, longitude: 4.3830 },
    'Lagos': { latitude: 6.5244, longitude: 3.3792 },
    'Nasarawa': { latitude: 8.5402, longitude: 8.1162 },
    'Niger': { latitude: 9.9315, longitude: 5.5933 },
    'Ogun': { latitude: 6.9978, longitude: 3.4717 },
    'Ondo': { latitude: 7.2571, longitude: 5.2058 },
    'Osun': { latitude: 7.5629, longitude: 4.5200 },
    'Oyo': { latitude: 8.1574, longitude: 3.6155 },
    'Plateau': { latitude: 9.2182, longitude: 9.5179 },
    'Rivers': { latitude: 4.8396, longitude: 6.9115 },
    'Sokoto': { latitude: 13.0622, longitude: 5.2339 },
    'Taraba': { latitude: 7.9999, longitude: 10.7739 },
    'Yobe': { latitude: 12.2939, longitude: 11.9660 },
    'Zamfara': { latitude: 12.1704, longitude: 6.6599 },
  };

  return stateCenters[state] || null;
}
