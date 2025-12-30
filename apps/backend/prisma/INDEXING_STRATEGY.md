# Database Indexing Strategy

## Overview

This document outlines the indexing strategy for the Tikit database to optimize query performance and meet the requirement of sub-500ms query response times.

## Index Categories

### 1. Single Column Indexes

These indexes support simple equality and range queries:

**User Table:**
- `phoneNumber` - Unique constraint, used for login
- `referralCode` - Unique constraint, used for referral lookups

**Event Table:**
- `organizerId` - Foreign key, used for organizer's event list
- `eventType` - Used for filtering by event type
- `startDate` - Used for date range queries
- `isHidden` - Used to exclude hidden events from public search
- `ussdCode` - Unique constraint, used for USSD lookups
- `accessCode` - Unique constraint, used for hidden event access
- `deepLink` - Unique constraint, used for deep link navigation

**Ticket Table:**
- `eventId` - Foreign key, used for event's ticket list
- `userId` - Foreign key, used for user's ticket list
- `qrCode` - Unique constraint, used for ticket verification
- `backupCode` - Unique constraint, used for manual verification
- `status` - Used for filtering valid/used tickets

**Payment Table:**
- `userId` - Foreign key, used for user's payment history
- `reference` - Unique constraint, used for payment verification
- `status` - Used for filtering payment status
- `createdAt` - Used for date range queries

### 2. Composite Indexes

These indexes support multi-column queries and improve performance for common query patterns:

**Event Table:**
- `(state, eventType, startDate)` - Primary feed query: events by location, type, and date
- `(eventType, startDate)` - Events by type and date (without location filter)
- `(status, startDate)` - Active/published events sorted by date
- `(state, lga)` - Geographic filtering by state and LGA
- `(latitude, longitude)` - Geospatial queries for distance-based filtering

**Ticket Table:**
- `(userId, status)` - User's valid tickets
- `(eventId, status)` - Event's valid tickets for capacity tracking

**User Table:**
- `(state, preferredLanguage)` - User segmentation for recommendations

**Payment Table:**
- `(userId, status)` - User's successful payments

**GroupBuy Table:**
- `(status, expiresAt)` - Active group buys that haven't expired

**Referral Table:**
- `(referrerId, status)` - Referrer's completed referrals

### 3. Full-Text Search Indexes

These indexes support text search functionality:

**Event Table:**
- `title` (GIN trigram) - Full-text search on event titles
- `description` (GIN trigram) - Full-text search on event descriptions

Note: These require the `pg_trgm` extension to be enabled in PostgreSQL.

## Query Optimization Guidelines

### Event Feed Query

```sql
SELECT * FROM "Event"
WHERE state = ? 
  AND eventType = ?
  AND startDate >= ?
  AND isHidden = false
ORDER BY startDate ASC
LIMIT 20;
```

**Optimized by:** `(state, eventType, startDate)` composite index

### User Tickets Query

```sql
SELECT * FROM "Ticket"
WHERE userId = ?
  AND status = 'valid'
ORDER BY purchaseDate DESC;
```

**Optimized by:** `(userId, status)` composite index

### Event Capacity Check

```sql
SELECT COUNT(*) FROM "Ticket"
WHERE eventId = ?
  AND status IN ('valid', 'used');
```

**Optimized by:** `(eventId, status)` composite index

### Geospatial Query

```sql
SELECT * FROM "Event"
WHERE latitude BETWEEN ? AND ?
  AND longitude BETWEEN ? AND ?
  AND isHidden = false;
```

**Optimized by:** `(latitude, longitude)` composite index

## Performance Targets

- **Indexed queries:** < 100ms
- **Complex queries with joins:** < 500ms
- **Full-text search:** < 200ms
- **Geospatial queries:** < 300ms

## Maintenance

### Index Monitoring

Monitor index usage with:

```sql
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;
```

### Unused Indexes

Identify unused indexes (idx_scan = 0) and consider removing them to reduce write overhead.

### Index Bloat

Monitor index bloat and rebuild indexes periodically:

```sql
REINDEX INDEX CONCURRENTLY index_name;
```

## Future Considerations

### Partitioning

Consider table partitioning for:
- **Event table:** Partition by startDate (monthly or quarterly)
- **Ticket table:** Partition by purchaseDate
- **Payment table:** Partition by createdAt

### Materialized Views

Consider materialized views for:
- Event analytics aggregations
- Referral leaderboards
- Popular events by region

### Read Replicas

For read-heavy workloads, consider:
- Read replicas for event feed queries
- Connection pooling with PgBouncer
- Query routing (writes to primary, reads to replicas)
