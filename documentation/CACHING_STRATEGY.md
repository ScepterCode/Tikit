# Redis Caching Strategy

## Overview

This document outlines the caching strategy for the Tikit platform to achieve sub-500ms query response times and handle 10,000+ concurrent users.

## Cache Architecture

### Cache Layers

1. **Application Cache (Redis)** - Primary caching layer
2. **Database Query Cache** - PostgreSQL query cache
3. **CDN Cache** - Static assets and images (Cloudflare)
4. **Browser Cache** - Client-side caching via service workers

## Cache Key Prefixes

Organized by data type for easy invalidation:

```typescript
CACHE_PREFIXES = {
  EVENT: 'event:',           // Individual events
  EVENT_LIST: 'event:list:', // Event lists/feeds
  USER: 'user:',             // User profiles
  TICKET: 'ticket:',         // Tickets
  PAYMENT: 'payment:',       // Payments
  GROUP_BUY: 'groupbuy:',    // Group buys
  REFERRAL: 'referral:',     // Referrals
  ANALYTICS: 'analytics:',   // Analytics data
  LEADERBOARD: 'leaderboard:', // Leaderboards
}
```

## Cache TTL Strategy

Different data types have different freshness requirements:

| Data Type | TTL | Reason |
|-----------|-----|--------|
| Event details | 30 min | Events change infrequently |
| Event lists | 5 min | Need to show new events quickly |
| User profile | 1 hour | User data changes rarely |
| Tickets | 5 min | Status changes need quick reflection |
| Analytics | 30 min | Real-time not critical |
| Leaderboards | 30 min | Can tolerate slight delay |
| Payment status | 1 min | Need fresh data for verification |

## Caching Patterns

### 1. Cache-Aside (Lazy Loading)

Most common pattern - check cache first, fetch from DB if miss:

```typescript
const event = await withCache(
  `event:${eventId}`,
  CACHE_TTL.LONG,
  async () => {
    return await prisma.event.findUnique({ where: { id: eventId } });
  }
);
```

**Use for:**
- Individual event lookups
- User profile lookups
- Ticket details

### 2. Write-Through

Update cache immediately when data changes:

```typescript
// Update database
const event = await prisma.event.update({ ... });

// Update cache
await setCache(`event:${event.id}`, event, CACHE_TTL.LONG);
```

**Use for:**
- Event updates
- User profile updates
- Critical data that must be consistent

### 3. Cache Warming

Pre-populate cache with frequently accessed data:

```typescript
// Run periodically (e.g., hourly via cron)
await warmPopularEventsCache(fetchPopularEvents);
await warmEventListCache(majorStates, fetchEventsByState);
```

**Use for:**
- Popular events
- Event lists for major states
- Leaderboards

## Cache Invalidation Strategies

### Event Cache Invalidation

When an event is created/updated/deleted:

```typescript
await invalidateEventCache(eventId);
```

This invalidates:
- Specific event cache: `event:{eventId}`
- All event list caches: `event:list:*`
- Event analytics: `analytics:{eventId}`

### Ticket Cache Invalidation

When a ticket is purchased/used:

```typescript
await invalidateTicketCache(ticketId, userId, eventId);
```

This invalidates:
- Specific ticket cache
- User's ticket list
- Event's ticket cache
- Event cache (capacity changed)

### User Cache Invalidation

When user data changes:

```typescript
await invalidateUserCache(userId);
```

This invalidates:
- User profile cache
- User's tickets cache
- User's payments cache

## Frequently Cached Queries

### 1. Event Feed Query

```typescript
const cacheKey = `event:list:state:${state}:type:${eventType}:page:${page}`;
const events = await withCache(cacheKey, CACHE_TTL.MEDIUM, async () => {
  return await prisma.event.findMany({
    where: { state, eventType, isHidden: false },
    orderBy: { startDate: 'asc' },
    skip: (page - 1) * 20,
    take: 20,
  });
});
```

### 2. User Tickets

```typescript
const cacheKey = `ticket:user:${userId}:status:valid`;
const tickets = await withCache(cacheKey, CACHE_TTL.MEDIUM, async () => {
  return await prisma.ticket.findMany({
    where: { userId, status: 'valid' },
    include: { event: true },
  });
});
```

### 3. Event Analytics

```typescript
const cacheKey = `analytics:${eventId}`;
const analytics = await withCache(cacheKey, CACHE_TTL.LONG, async () => {
  return await calculateEventAnalytics(eventId);
});
```

### 4. Referral Leaderboard

```typescript
const cacheKey = `leaderboard:referral:top100`;
const leaderboard = await withCache(cacheKey, CACHE_TTL.LONG, async () => {
  return await fetchReferralLeaderboard();
});
```

## Cache Warming Schedule

Run cache warming script periodically:

```bash
# Cron job (every hour)
0 * * * * cd /app && node dist/scripts/warmCache.js

# Or use a job scheduler (Bull queue)
cacheWarmingQueue.add('warm-cache', {}, {
  repeat: { cron: '0 * * * *' } // Every hour
});
```

## Monitoring Cache Performance

### Key Metrics

1. **Cache Hit Rate**: Should be > 80%
2. **Cache Miss Rate**: Should be < 20%
3. **Average Response Time**: Should be < 50ms for cache hits
4. **Memory Usage**: Monitor Redis memory usage

### Get Cache Statistics

```typescript
const stats = await getCacheStats();
console.log(`Cache hit rate: ${(stats.hits / (stats.hits + stats.misses)) * 100}%`);
```

### Redis Monitoring Commands

```bash
# Get cache statistics
redis-cli INFO stats

# Monitor cache operations in real-time
redis-cli MONITOR

# Check memory usage
redis-cli INFO memory

# Get slow queries
redis-cli SLOWLOG GET 10
```

## Best Practices

### DO:
- ✅ Use consistent cache key naming conventions
- ✅ Set appropriate TTLs based on data freshness requirements
- ✅ Invalidate cache when data changes
- ✅ Use cache warming for frequently accessed data
- ✅ Monitor cache hit rates and adjust strategy
- ✅ Handle cache failures gracefully (fallback to DB)

### DON'T:
- ❌ Cache user-specific sensitive data without encryption
- ❌ Set TTL too long for frequently changing data
- ❌ Forget to invalidate cache on updates
- ❌ Cache large objects (> 1MB) - use pagination instead
- ❌ Use cache for data that must be 100% consistent

## Cache Eviction Policy

Redis is configured with `maxmemory-policy allkeys-lru`:
- Evicts least recently used keys when memory limit is reached
- Ensures most frequently accessed data stays in cache

## Disaster Recovery

### Cache Failure Handling

All cache operations include error handling:

```typescript
try {
  const cached = await getCache(key);
  if (cached) return cached;
} catch (error) {
  console.error('Cache error:', error);
  // Fall through to database query
}

// Always fetch from database if cache fails
return await fetchFromDatabase();
```

### Cache Rebuild

If Redis crashes and cache is lost:

1. Application continues to work (falls back to database)
2. Cache rebuilds gradually through cache-aside pattern
3. Run cache warming script to speed up recovery

## Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| Cache hit rate | > 80% | Monitor |
| Cache response time | < 50ms | Monitor |
| Database query time (cache miss) | < 500ms | Monitor |
| Memory usage | < 80% of allocated | Monitor |

## Future Optimizations

1. **Redis Cluster**: For horizontal scaling
2. **Read-Through Cache**: Automatic cache population
3. **Cache Compression**: For large objects
4. **Multi-Level Caching**: L1 (in-memory) + L2 (Redis)
5. **Predictive Cache Warming**: ML-based prediction of popular events
