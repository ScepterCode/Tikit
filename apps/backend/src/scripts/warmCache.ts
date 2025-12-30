/**
 * Cache warming script
 * Run this periodically (e.g., via cron job) to warm frequently accessed data
 */

import prisma from '../lib/prisma.js';
import {
  warmPopularEventsCache,
  warmEventListCache,
  CACHE_PREFIXES,
  CACHE_TTL,
  setCache,
} from '../services/cache.service.js';

/**
 * Fetch popular events (high ticket sales, upcoming)
 */
const fetchPopularEvents = async () => {
  const events = await prisma.event.findMany({
    where: {
      status: 'published',
      startDate: {
        gte: new Date(),
      },
      isHidden: false,
    },
    orderBy: {
      ticketsSold: 'desc',
    },
    take: 50, // Top 50 popular events
  });

  return events;
};

/**
 * Fetch events by state
 */
const fetchEventsByState = async (state: string) => {
  const events = await prisma.event.findMany({
    where: {
      state,
      status: 'published',
      startDate: {
        gte: new Date(),
      },
      isHidden: false,
    },
    orderBy: {
      startDate: 'asc',
    },
    take: 20, // First page of events
  });

  return events;
};

/**
 * Warm referral leaderboard cache
 */
const warmReferralLeaderboard = async () => {
  const topReferrers = await prisma.referral.groupBy({
    by: ['referrerId'],
    where: {
      status: 'completed',
    },
    _count: {
      referredUserId: true,
    },
    _sum: {
      rewardAmount: true,
    },
    orderBy: {
      _count: {
        referredUserId: 'desc',
      },
    },
    take: 100,
  });

  const cacheKey = `${CACHE_PREFIXES.LEADERBOARD}referral:top100`;
  await setCache(cacheKey, topReferrers, CACHE_TTL.LONG);

  console.log('Warmed referral leaderboard cache');
};

/**
 * Main cache warming function
 */
const warmCache = async () => {
  console.log('Starting cache warming...');

  try {
    // Warm popular events
    await warmPopularEventsCache(fetchPopularEvents);

    // Warm event lists for major states
    const majorStates = [
      'Lagos',
      'Abuja',
      'Kano',
      'Rivers',
      'Oyo',
      'Kaduna',
      'Anambra',
      'Enugu',
      'Delta',
      'Edo',
    ];
    await warmEventListCache(majorStates, fetchEventsByState);

    // Warm referral leaderboard
    await warmReferralLeaderboard();

    console.log('Cache warming completed successfully');
  } catch (error) {
    console.error('Cache warming failed:', error);
    process.exit(1);
  }
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  warmCache()
    .then(() => {
      console.log('Done');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error:', error);
      process.exit(1);
    });
}

export default warmCache;
