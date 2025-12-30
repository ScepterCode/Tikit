# Redis Setup Guide

## Prerequisites

- Redis 7 or higher installed

## Installation

### Windows

1. Download Redis from [Redis Windows](https://github.com/microsoftarchive/redis/releases)
2. Extract and run `redis-server.exe`

Or use Docker:
```bash
docker run -d -p 6379:6379 redis:7-alpine
```

### macOS

```bash
brew install redis
brew services start redis
```

### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

## Configuration

Add Redis URL to `apps/backend/.env`:

```env
REDIS_URL=redis://localhost:6379
```

For production with authentication:
```env
REDIS_URL=redis://username:password@host:port
```

## Usage in Tikit

Redis is used for:

### 1. Caching
- Event data caching
- User profile caching
- Search results caching
- Frequently accessed data

### 2. Session Management
- User session storage
- JWT token blacklisting
- Session persistence across server restarts

### 3. Rate Limiting
- API endpoint rate limiting
- Authentication attempt limiting
- Payment request throttling

### 4. Real-time Features Support
- Temporary data storage
- Queue management
- Pub/Sub for notifications

## Cache Service API

```typescript
import { getCache, setCache, deleteCache, withCache } from './services/cache.service';

// Get from cache
const user = await getCache<User>('user:123');

// Set in cache with 1 hour TTL
await setCache('user:123', userData, 3600);

// Delete from cache
await deleteCache('user:123');

// Cache wrapper
const events = await withCache('events:nearby', 300, async () => {
  return await fetchEventsFromDatabase();
});
```

## Rate Limiting

```typescript
import { apiRateLimiter, authRateLimiter } from './middleware/rateLimit';

// Apply to routes
app.use('/api', apiRateLimiter);
app.use('/api/auth', authRateLimiter);
```

## Testing Redis Connection

```bash
# Test Redis CLI
redis-cli ping
# Should return: PONG

# Check if Redis is running
redis-cli info server
```

## Monitoring

### View all keys
```bash
redis-cli keys "*"
```

### Monitor real-time commands
```bash
redis-cli monitor
```

### Check memory usage
```bash
redis-cli info memory
```

## Production Considerations

1. **Enable Authentication**: Set `requirepass` in redis.conf
2. **Configure Persistence**: Enable RDB or AOF for data durability
3. **Set Memory Limits**: Configure `maxmemory` and eviction policy
4. **Use Redis Cluster**: For high availability and scalability
5. **Monitor Performance**: Use Redis monitoring tools

## Troubleshooting

### Connection Refused
- Check if Redis is running: `redis-cli ping`
- Verify REDIS_URL in .env
- Check firewall settings

### Memory Issues
- Monitor memory usage: `redis-cli info memory`
- Configure eviction policy
- Clear old cache entries

### Performance Issues
- Use Redis SLOWLOG to identify slow commands
- Optimize key naming and data structures
- Consider Redis Cluster for scaling
