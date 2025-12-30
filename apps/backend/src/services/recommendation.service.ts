import prisma from '../lib/prisma.js';
import { calculateDistance } from '../utils/geoDistance.js';

interface EventScore {
  eventId: string;
  score: number;
  reasons: string[];
}

interface RecommendationFactors {
  pastAttendanceWeight: number;
  culturalPreferenceWeight: number;
  eventTypeWeight: number;
  locationWeight: number;
  datePreferenceWeight: number;
  capacityWeight: number;
}

const DEFAULT_WEIGHTS: RecommendationFactors = {
  pastAttendanceWeight: 0.3,
  culturalPreferenceWeight: 0.2,
  eventTypeWeight: 0.25,
  locationWeight: 0.15,
  datePreferenceWeight: 0.05,
  capacityWeight: 0.05,
};

/**
 * Get personalized event recommendations for a user
 */
export async function getPersonalizedRecommendations(
  userId: string,
  limit: number = 20,
  weights: RecommendationFactors = DEFAULT_WEIGHTS
) {
  try {
    // Get user profile
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        tickets: {
          include: {
            event: true,
          },
          where: {
            status: 'valid',
          },
        },
      },
    });

    if (!user) {
      return {
        success: false,
        message: 'User not found',
      };
    }

    // Get all published, non-hidden, future events
    const allEvents = await prisma.event.findMany({
      where: {
        status: 'published',
        isHidden: false,
        startDate: {
          gte: new Date(),
        },
      },
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

    // Calculate scores for each event
    const scoredEvents = allEvents.map((event) => {
      const score = calculateEventScore(user, event, weights);
      return {
        event,
        ...score,
      };
    });

    // Sort by score descending
    scoredEvents.sort((a, b) => b.score - a.score);

    // Return top N events
    const recommendations = scoredEvents.slice(0, limit).map((item) => ({
      event: item.event,
      score: item.score,
      reasons: item.reasons,
    }));

    return {
      success: true,
      recommendations,
    };
  } catch (error) {
    console.error('Get personalized recommendations error:', error);
    return {
      success: false,
      message: 'Failed to get personalized recommendations',
    };
  }
}

/**
 * Calculate recommendation score for an event based on user preferences
 */
function calculateEventScore(
  user: any,
  event: any,
  weights: RecommendationFactors
): EventScore {
  let totalScore = 0;
  const reasons: string[] = [];

  // 1. Past attendance history score
  const pastAttendanceScore = calculatePastAttendanceScore(user, event);
  totalScore += pastAttendanceScore * weights.pastAttendanceWeight;
  if (pastAttendanceScore > 0) {
    reasons.push(`Similar to events you've attended (${(pastAttendanceScore * 100).toFixed(0)}%)`);
  }

  // 2. Cultural preferences score
  const culturalScore = calculateCulturalPreferenceScore(user, event);
  totalScore += culturalScore * weights.culturalPreferenceWeight;
  if (culturalScore > 0) {
    reasons.push(`Matches your cultural preferences (${(culturalScore * 100).toFixed(0)}%)`);
  }

  // 3. Event type preference score
  const eventTypeScore = calculateEventTypeScore(user, event);
  totalScore += eventTypeScore * weights.eventTypeWeight;
  if (eventTypeScore > 0) {
    reasons.push(`You've attended ${event.eventType} events before (${(eventTypeScore * 100).toFixed(0)}%)`);
  }

  // 4. Location proximity score
  const locationScore = calculateLocationScore(user, event);
  totalScore += locationScore * weights.locationWeight;
  if (locationScore > 0.5) {
    reasons.push(`Near your location (${(locationScore * 100).toFixed(0)}%)`);
  }

  // 5. Date preference score (prefer events happening soon but not too soon)
  const dateScore = calculateDatePreferenceScore(event);
  totalScore += dateScore * weights.datePreferenceWeight;

  // 6. Capacity status score (prefer events with availability)
  const capacityScore = calculateCapacityScore(event);
  totalScore += capacityScore * weights.capacityWeight;
  if (capacityScore < 0.5 && event.ticketsSold / event.capacity > 0.8) {
    reasons.push('Almost full - book soon!');
  }

  return {
    eventId: event.id,
    score: totalScore,
    reasons,
  };
}

/**
 * Calculate score based on past attendance history
 */
function calculatePastAttendanceScore(user: any, event: any): number {
  const pastEvents = user.tickets.map((ticket: any) => ticket.event);
  
  if (pastEvents.length === 0) {
    return 0.5; // Neutral score for new users
  }

  let score = 0;
  let matchCount = 0;

  pastEvents.forEach((pastEvent: any) => {
    // Same event type
    if (pastEvent.eventType === event.eventType) {
      score += 0.4;
      matchCount++;
    }

    // Same state
    if (pastEvent.state === event.state) {
      score += 0.2;
      matchCount++;
    }

    // Same LGA
    if (pastEvent.lga === event.lga) {
      score += 0.2;
      matchCount++;
    }

    // Similar cultural features
    const pastCultural = pastEvent.culturalFeatures as any;
    const eventCultural = event.culturalFeatures as any;
    
    if (pastCultural && eventCultural) {
      // Check for similar features
      if (pastCultural.sprayMoneyEnabled && eventCultural.sprayMoneyEnabled) {
        score += 0.1;
        matchCount++;
      }
      if (pastCultural.asoEbiTiers && eventCultural.asoEbiTiers) {
        score += 0.1;
        matchCount++;
      }
    }
  });

  // Normalize by number of past events
  return matchCount > 0 ? Math.min(score / pastEvents.length, 1) : 0.5;
}

/**
 * Calculate score based on cultural preferences
 */
function calculateCulturalPreferenceScore(user: any, event: any): number {
  let score = 0;

  // Language match
  const eventCultural = event.culturalFeatures as any;
  if (eventCultural && eventCultural.languages) {
    if (eventCultural.languages.includes(user.preferredLanguage)) {
      score += 0.5;
    }
  } else {
    // If no language specified, assume it supports all languages
    score += 0.3;
  }

  // State match (cultural affinity)
  if (event.state === user.state) {
    score += 0.5;
  }

  return Math.min(score, 1);
}

/**
 * Calculate score based on event type preferences from past attendance
 */
function calculateEventTypeScore(user: any, event: any): number {
  const pastEvents = user.tickets.map((ticket: any) => ticket.event);
  
  if (pastEvents.length === 0) {
    return 0.5; // Neutral score for new users
  }

  // Count how many times user attended this event type
  const eventTypeCount = pastEvents.filter(
    (pastEvent: any) => pastEvent.eventType === event.eventType
  ).length;

  // Calculate percentage of past events that match this type
  const percentage = eventTypeCount / pastEvents.length;

  return percentage;
}

/**
 * Calculate score based on location proximity
 */
function calculateLocationScore(user: any, event: any): number {
  const stateCenter = getStateCenter(user.state);
  
  if (!stateCenter) {
    return 0.5; // Neutral score if state center not found
  }

  const distance = calculateDistance(
    stateCenter.latitude,
    stateCenter.longitude,
    event.latitude,
    event.longitude
  );

  // Score decreases with distance
  // 0-50km: 1.0
  // 50-100km: 0.7
  // 100-200km: 0.4
  // 200+km: 0.1
  if (distance <= 50) {
    return 1.0;
  } else if (distance <= 100) {
    return 0.7;
  } else if (distance <= 200) {
    return 0.4;
  } else {
    return 0.1;
  }
}

/**
 * Calculate score based on date preferences
 */
function calculateDatePreferenceScore(event: any): number {
  const now = new Date();
  const eventDate = new Date(event.startDate);
  const daysUntilEvent = Math.floor((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  // Prefer events 7-30 days away
  // Too soon (< 3 days): 0.3
  // Soon (3-7 days): 0.7
  // Optimal (7-30 days): 1.0
  // Far (30-60 days): 0.7
  // Very far (60+ days): 0.4
  if (daysUntilEvent < 3) {
    return 0.3;
  } else if (daysUntilEvent < 7) {
    return 0.7;
  } else if (daysUntilEvent <= 30) {
    return 1.0;
  } else if (daysUntilEvent <= 60) {
    return 0.7;
  } else {
    return 0.4;
  }
}

/**
 * Calculate score based on capacity status
 */
function calculateCapacityScore(event: any): number {
  const percentSold = (event.ticketsSold / event.capacity) * 100;

  // Prefer events with good availability
  // 0-50%: 1.0 (plenty of space)
  // 50-80%: 0.8 (good availability)
  // 80-95%: 0.5 (almost full - creates urgency)
  // 95-100%: 0.2 (very limited)
  // 100%+: 0.0 (sold out)
  if (percentSold < 50) {
    return 1.0;
  } else if (percentSold < 80) {
    return 0.8;
  } else if (percentSold < 95) {
    return 0.5;
  } else if (percentSold < 100) {
    return 0.2;
  } else {
    return 0.0;
  }
}

/**
 * Get related events based on event type and location
 */
export async function getRelatedEvents(
  eventId: string,
  limit: number = 5
) {
  try {
    // Get the reference event
    const referenceEvent = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!referenceEvent) {
      return {
        success: false,
        message: 'Event not found',
      };
    }

    // Find similar events
    const relatedEvents = await prisma.event.findMany({
      where: {
        id: { not: eventId }, // Exclude the reference event
        status: 'published',
        isHidden: false,
        startDate: {
          gte: new Date(),
        },
        OR: [
          { eventType: referenceEvent.eventType }, // Same event type
          { state: referenceEvent.state }, // Same state
          { lga: referenceEvent.lga }, // Same LGA
        ],
      },
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
      take: limit * 2, // Get more than needed for filtering
    });

    // Score related events by similarity
    const scoredEvents = relatedEvents.map((event) => {
      let score = 0;

      // Same event type: +3 points
      if (event.eventType === referenceEvent.eventType) {
        score += 3;
      }

      // Same state: +2 points
      if (event.state === referenceEvent.state) {
        score += 2;
      }

      // Same LGA: +1 point
      if (event.lga === referenceEvent.lga) {
        score += 1;
      }

      // Calculate distance
      const distance = calculateDistance(
        referenceEvent.latitude,
        referenceEvent.longitude,
        event.latitude,
        event.longitude
      );

      // Nearby (< 50km): +2 points
      if (distance < 50) {
        score += 2;
      } else if (distance < 100) {
        score += 1;
      }

      return {
        event,
        score,
      };
    });

    // Sort by score and return top N
    scoredEvents.sort((a, b) => b.score - a.score);
    const topRelated = scoredEvents.slice(0, limit).map((item) => item.event);

    return {
      success: true,
      relatedEvents: topRelated,
    };
  } catch (error) {
    console.error('Get related events error:', error);
    return {
      success: false,
      message: 'Failed to get related events',
    };
  }
}

/**
 * Check if an event should show "Almost Full" banner
 */
export function shouldShowAlmostFullBanner(event: any): boolean {
  const percentSold = (event.ticketsSold / event.capacity) * 100;
  return percentSold > 80 && percentSold < 100;
}

/**
 * Get capacity status for an event
 */
export function getCapacityStatus(event: any): {
  status: 'available' | 'almost_full' | 'sold_out';
  percentSold: number;
  remainingTickets: number;
} {
  const percentSold = (event.ticketsSold / event.capacity) * 100;
  const remainingTickets = event.capacity - event.ticketsSold;

  let status: 'available' | 'almost_full' | 'sold_out';
  if (percentSold >= 100) {
    status = 'sold_out';
  } else if (percentSold > 80) {
    status = 'almost_full';
  } else {
    status = 'available';
  }

  return {
    status,
    percentSold: Math.min(percentSold, 100),
    remainingTickets: Math.max(remainingTickets, 0),
  };
}

/**
 * Detect trending events based on recent ticket sales
 */
export async function getTrendingEvents(
  eventType?: string,
  state?: string,
  limit: number = 10
) {
  try {
    // Get events with recent ticket sales
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 7); // Last 7 days

    const where: any = {
      status: 'published',
      isHidden: false,
      startDate: {
        gte: new Date(),
      },
    };

    if (eventType) {
      where.eventType = eventType;
    }

    if (state) {
      where.state = state;
    }

    const events = await prisma.event.findMany({
      where,
      include: {
        tickets: {
          where: {
            purchaseDate: {
              gte: recentDate,
            },
          },
        },
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

    // Score events by recent sales velocity
    const scoredEvents = events.map((event) => {
      const recentSales = event.tickets.length;
      const percentSold = (event.ticketsSold / event.capacity) * 100;
      
      // Trending score = recent sales + capacity factor
      const score = recentSales * (1 + percentSold / 100);

      return {
        event,
        score,
        recentSales,
      };
    });

    // Sort by score and return top N
    scoredEvents.sort((a, b) => b.score - a.score);
    const trending = scoredEvents.slice(0, limit).map((item) => ({
      event: item.event,
      recentSales: item.recentSales,
    }));

    return {
      success: true,
      trendingEvents: trending,
    };
  } catch (error) {
    console.error('Get trending events error:', error);
    return {
      success: false,
      message: 'Failed to get trending events',
    };
  }
}

/**
 * Get state center coordinates for geographic filtering
 */
function getStateCenter(state: string): { latitude: number; longitude: number } | null {
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
