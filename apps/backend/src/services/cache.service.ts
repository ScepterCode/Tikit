import redisClient from '../lib/redis.js';

/**
 * Cache utility service for Redis operations
 */

// Cache key prefixes for organization
export const CACHE_PREFIXES = {
  EVENT: 'event:',
  EVENT_LIST: 'event:list:',
  USER: 'user:',
  TICKET: 'ticket:',
  PAYMENT: 'payment:',
  GROUP_BUY: 'groupbuy:',
  REFERRAL: 'referral:',
  ANALYTICS: 'analytics:',
  LEADERBOARD: 'leaderboard:',
};

// Cache TTL values (in seconds)
export const CACHE_TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 1800, // 30 minutes
  VERY_LONG: 3600, // 1 hour
  DAY: 86400, // 24 hours
};

/**
 * Get value from cache
 */
export const getCache = async <T>(key: string): Promise<T | null> => {
  try {
    if (!redisClient.isOpen) {
      return null; // Cache disabled
    }
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
};

/**
 * Set value in cache with optional TTL (in seconds)
 */
export const setCache = async (
  key: string,
  value: Record<string, unknown> | string | number | boolean | null,
  ttl?: number
): Promise<void> => {
  try {
    if (!redisClient.isOpen) {
      return; // Cache disabled
    }
    const serialized = JSON.stringify(value);
    if (ttl) {
      await redisClient.setEx(key, ttl, serialized);
    } else {
      await redisClient.set(key, serialized);
    }
  } catch (error) {
    console.error('Cache set error:', error);
  }
};

/**
 * Delete value from cache
 */
export const deleteCache = async (key: string): Promise<void> => {
  try {
    if (!redisClient.isOpen) {
      return; // Cache disabled
    }
    await redisClient.del(key);
  } catch (error) {
    console.error('Cache delete error:', error);
  }
};

/**
 * Delete multiple keys matching a pattern
 */
export const deleteCachePattern = async (pattern: string): Promise<void> => {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (error) {
    console.error('Cache pattern delete error:', error);
  }
};

/**
 * Check if key exists in cache
 */
export const cacheExists = async (key: string): Promise<boolean> => {
  try {
    const exists = await redisClient.exists(key);
    return exists === 1;
  } catch (error) {
    console.error('Cache exists error:', error);
    return false;
  }
};

/**
 * Increment a counter in cache
 */
export const incrementCache = async (key: string, amount: number = 1): Promise<number> => {
  try {
    return await redisClient.incrBy(key, amount);
  } catch (error) {
    console.error('Cache increment error:', error);
    return 0;
  }
};

/**
 * Set expiration time for a key
 */
export const expireCache = async (key: string, seconds: number): Promise<void> => {
  try {
    await redisClient.expire(key, seconds);
  } catch (error) {
    console.error('Cache expire error:', error);
  }
};

/**
 * Get multiple values from cache
 */
export const getCacheMultiple = async <T>(keys: string[]): Promise<(T | null)[]> => {
  try {
    const values = await redisClient.mGet(keys);
    return values.map((value) => (value ? JSON.parse(value) : null));
  } catch (error) {
    console.error('Cache mGet error:', error);
    return keys.map(() => null);
  }
};

/**
 * Cache wrapper for functions
 */
export const withCache = async <T>(
  key: string,
  ttl: number,
  fetchFn: () => Promise<T>
): Promise<T> => {
  // Try to get from cache
  const cached = await getCache<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Fetch fresh data
  const data = await fetchFn();

  // Store in cache
  await setCache(key, data as any, ttl);

  return data;
};

/**
 * Cache invalidation strategies
 */

/**
 * Invalidate all event-related caches
 */
export const invalidateEventCache = async (eventId: string): Promise<void> => {
  try {
    // Delete specific event cache
    await deleteCache(`${CACHE_PREFIXES.EVENT}${eventId}`);
    
    // Delete event list caches (they may contain this event)
    await deleteCachePattern(`${CACHE_PREFIXES.EVENT_LIST}*`);
    
    // Delete analytics cache for this event
    await deleteCache(`${CACHE_PREFIXES.ANALYTICS}${eventId}`);
  } catch (error) {
    console.error('Event cache invalidation error:', error);
  }
};

/**
 * Invalidate user-related caches
 */
export const invalidateUserCache = async (userId: string): Promise<void> => {
  try {
    // Delete user profile cache
    await deleteCache(`${CACHE_PREFIXES.USER}${userId}`);
    
    // Delete user's ticket cache
    await deleteCachePattern(`${CACHE_PREFIXES.TICKET}user:${userId}*`);
    
    // Delete user's payment cache
    await deleteCachePattern(`${CACHE_PREFIXES.PAYMENT}user:${userId}*`);
  } catch (error) {
    console.error('User cache invalidation error:', error);
  }
};

/**
 * Invalidate ticket-related caches
 */
export const invalidateTicketCache = async (ticketId: string, userId: string, eventId: string): Promise<void> => {
  try {
    // Delete specific ticket cache
    await deleteCache(`${CACHE_PREFIXES.TICKET}${ticketId}`);
    
    // Delete user's ticket list cache
    await deleteCachePattern(`${CACHE_PREFIXES.TICKET}user:${userId}*`);
    
    // Delete event's ticket cache
    await deleteCachePattern(`${CACHE_PREFIXES.TICKET}event:${eventId}*`);
    
    // Invalidate event cache (capacity changed)
    await invalidateEventCache(eventId);
  } catch (error) {
    console.error('Ticket cache invalidation error:', error);
  }
};

/**
 * Invalidate referral leaderboard cache
 */
export const invalidateReferralLeaderboard = async (): Promise<void> => {
  try {
    await deleteCachePattern(`${CACHE_PREFIXES.LEADERBOARD}referral*`);
  } catch (error) {
    console.error('Referral leaderboard cache invalidation error:', error);
  }
};

/**
 * Cache warming strategies
 */

/**
 * Warm cache for popular events
 * Should be called periodically (e.g., every hour)
 */
export const warmPopularEventsCache = async (
  fetchPopularEvents: () => Promise<any[]>
): Promise<void> => {
  try {
    const popularEvents = await fetchPopularEvents();
    
    for (const event of popularEvents) {
      const cacheKey = `${CACHE_PREFIXES.EVENT}${event.id}`;
      await setCache(cacheKey, event, CACHE_TTL.LONG);
    }
    
    console.log(`Warmed cache for ${popularEvents.length} popular events`);
  } catch (error) {
    console.error('Cache warming error:', error);
  }
};

/**
 * Warm cache for event lists by state
 * Should be called periodically or on-demand
 */
export const warmEventListCache = async (
  states: string[],
  fetchEventsByState: (state: string) => Promise<any[]>
): Promise<void> => {
  try {
    for (const state of states) {
      const events = await fetchEventsByState(state);
      const cacheKey = `${CACHE_PREFIXES.EVENT_LIST}state:${state}`;
      await setCache(cacheKey, events, CACHE_TTL.MEDIUM);
    }
    
    console.log(`Warmed event list cache for ${states.length} states`);
  } catch (error) {
    console.error('Event list cache warming error:', error);
  }
};

/**
 * Batch cache operations for efficiency
 */
export const batchSetCache = async (
  items: Array<{ key: string; value: any; ttl?: number }>
): Promise<void> => {
  try {
    const pipeline = redisClient.multi();
    
    for (const item of items) {
      const serialized = JSON.stringify(item.value);
      if (item.ttl) {
        pipeline.setEx(item.key, item.ttl, serialized);
      } else {
        pipeline.set(item.key, serialized);
      }
    }
    
    await pipeline.exec();
  } catch (error) {
    console.error('Batch cache set error:', error);
  }
};

/**
 * Get cache statistics
 */
export const getCacheStats = async (): Promise<{
  keys: number;
  memory: string;
  hits: number;
  misses: number;
}> => {
  try {
    const info = await redisClient.info('stats');
    const dbSize = await redisClient.dbSize();
    
    // Parse info string for stats
    const stats = info.split('\r\n').reduce((acc, line) => {
      const [key, value] = line.split(':');
      if (key && value) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, string>);
    
    return {
      keys: dbSize,
      memory: stats.used_memory_human || '0',
      hits: parseInt(stats.keyspace_hits || '0'),
      misses: parseInt(stats.keyspace_misses || '0'),
    };
  } catch (error) {
    console.error('Cache stats error:', error);
    return { keys: 0, memory: '0', hits: 0, misses: 0 };
  }
};
