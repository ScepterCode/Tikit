# Auto-Scaling Configuration

## Overview

This document outlines the auto-scaling strategy for the Tikit backend to handle variable load and meet the requirement of supporting 10,000+ concurrent users.

## Scaling Strategy

### Horizontal Scaling

The application is designed to scale horizontally by adding more server instances:

```
Load Balancer
    ↓
┌───────────┬───────────┬───────────┐
│ Instance 1│ Instance 2│ Instance 3│
└───────────┴───────────┴───────────┘
    ↓           ↓           ↓
┌─────────────────────────────────┐
│     Shared Resources            │
│  - PostgreSQL (managed)         │
│  - Redis (managed)              │
│  - Firebase Realtime DB         │
└─────────────────────────────────┘
```

### Stateless Design

All application servers are stateless:
- ✅ No session state on servers (JWT tokens)
- ✅ All state in Redis/PostgreSQL
- ✅ No local file storage (use cloud storage)
- ✅ Shared cache across instances

## Platform-Specific Configuration

### Vercel (Frontend)

Vercel automatically scales frontend:
- Serverless functions scale automatically
- Edge network for global distribution
- No configuration needed

### Railway (Backend)

Railway provides auto-scaling with configuration:

**railway.json:**
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "numReplicas": 2,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

**Scaling Rules:**
- Minimum replicas: 2 (for high availability)
- Maximum replicas: 10 (cost control)
- Scale up when: CPU > 70% for 2 minutes
- Scale down when: CPU < 30% for 5 minutes

### Render (Alternative)

Render provides auto-scaling configuration:

**render.yaml:**
```yaml
services:
  - type: web
    name: tikit-backend
    env: node
    plan: standard
    buildCommand: npm run build
    startCommand: npm start
    autoDeploy: true
    
    # Auto-scaling configuration
    scaling:
      minInstances: 2
      maxInstances: 10
      targetMemoryPercent: 80
      targetCPUPercent: 70
    
    # Health check
    healthCheckPath: /health
    
    # Environment variables
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        sync: false
      - key: REDIS_URL
        sync: false
```

## Scaling Metrics

### CPU-Based Scaling

Scale when CPU usage is high:

**Thresholds:**
- Scale up: CPU > 70% for 2 minutes
- Scale down: CPU < 30% for 5 minutes
- Cooldown: 5 minutes between scaling events

**Why CPU?**
- Node.js is CPU-bound for most operations
- Good indicator of server load
- Prevents over-scaling

### Memory-Based Scaling

Scale when memory usage is high:

**Thresholds:**
- Scale up: Memory > 80% for 2 minutes
- Scale down: Memory < 40% for 5 minutes

**Why Memory?**
- Prevents OOM crashes
- Indicates memory leaks
- Complements CPU metrics

### Request-Based Scaling

Scale based on request rate:

**Thresholds:**
- Scale up: > 1000 requests/minute per instance
- Scale down: < 200 requests/minute per instance

**Why Requests?**
- Direct measure of load
- Predictive scaling
- Better for traffic spikes

### Custom Metrics

Scale based on application-specific metrics:

**Queue Length:**
- Scale up: Job queue > 100 pending jobs
- Scale down: Job queue < 10 pending jobs

**Database Connections:**
- Scale up: Connection pool > 80% utilized
- Scale down: Connection pool < 30% utilized

## Health Checks

### Liveness Probe

Checks if the application is running:

```typescript
// apps/backend/src/routes/health.routes.ts
import { Router } from 'express';

const router = Router();

router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export default router;
```

**Configuration:**
- Path: `/health`
- Interval: 30 seconds
- Timeout: 5 seconds
- Failure threshold: 3 consecutive failures

### Readiness Probe

Checks if the application is ready to serve traffic:

```typescript
router.get('/ready', async (req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Check Redis connection
    await redisClient.ping();
    
    res.status(200).json({
      status: 'ready',
      database: 'connected',
      redis: 'connected',
    });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      error: error.message,
    });
  }
});
```

**Configuration:**
- Path: `/ready`
- Interval: 10 seconds
- Timeout: 5 seconds
- Failure threshold: 2 consecutive failures

## Load Balancing

### Round Robin

Default strategy - distributes requests evenly:

```
Request 1 → Instance 1
Request 2 → Instance 2
Request 3 → Instance 3
Request 4 → Instance 1 (cycle repeats)
```

**Pros:**
- Simple
- Fair distribution
- No state needed

**Cons:**
- Doesn't account for instance load
- May overload slow instances

### Least Connections

Routes to instance with fewest active connections:

```
Instance 1: 10 connections
Instance 2: 5 connections  ← Route here
Instance 3: 8 connections
```

**Pros:**
- Better load distribution
- Accounts for slow requests

**Cons:**
- Requires connection tracking
- More complex

### IP Hash

Routes based on client IP (sticky sessions):

```
Client IP: 192.168.1.1 → Always routes to Instance 2
```

**Pros:**
- Session affinity
- Useful for WebSocket connections

**Cons:**
- Uneven distribution
- Not needed for stateless apps

**Recommendation:** Use Round Robin for stateless REST API, IP Hash for WebSocket connections.

## Database Scaling

### Connection Pooling

Use PgBouncer for connection pooling:

```
Application Instances (100 connections each)
    ↓
PgBouncer (pools to 20 connections)
    ↓
PostgreSQL (20 actual connections)
```

**Configuration:**
```ini
[databases]
tikit = host=postgres.railway.internal port=5432 dbname=tikit

[pgbouncer]
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 20
reserve_pool_size = 5
reserve_pool_timeout = 3
```

### Read Replicas

For read-heavy workloads:

```typescript
// Write to primary
await prisma.$executeRaw`INSERT INTO events ...`;

// Read from replica
const events = await prismaReplica.event.findMany(...);
```

**Configuration:**
```typescript
// Primary database (writes)
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Read replica (reads)
const prismaReplica = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_REPLICA_URL,
    },
  },
});
```

## Monitoring and Alerts

### Key Metrics to Monitor

1. **Application Metrics:**
   - Request rate (requests/second)
   - Response time (p50, p95, p99)
   - Error rate (%)
   - Active connections

2. **System Metrics:**
   - CPU usage (%)
   - Memory usage (%)
   - Disk I/O
   - Network I/O

3. **Database Metrics:**
   - Query time (ms)
   - Connection pool usage (%)
   - Slow queries (> 1s)
   - Deadlocks

4. **Cache Metrics:**
   - Cache hit rate (%)
   - Cache memory usage (%)
   - Eviction rate

### Alert Thresholds

| Metric | Warning | Critical | Action |
|--------|---------|----------|--------|
| CPU Usage | > 70% | > 90% | Scale up |
| Memory Usage | > 80% | > 95% | Scale up |
| Error Rate | > 1% | > 5% | Investigate |
| Response Time (p99) | > 1s | > 3s | Optimize |
| Database Connections | > 80% | > 95% | Scale DB |
| Cache Hit Rate | < 80% | < 60% | Review cache |

### Monitoring Tools

**Application Performance Monitoring (APM):**
- Datadog APM
- New Relic
- Sentry Performance

**Infrastructure Monitoring:**
- Railway Metrics (built-in)
- Datadog Infrastructure
- Prometheus + Grafana

**Log Aggregation:**
- Datadog Logs
- Logtail
- Better Stack

## Cost Optimization

### Right-Sizing Instances

Start small and scale up:

**Development:**
- 1 instance, 512MB RAM, 0.5 CPU

**Staging:**
- 2 instances, 1GB RAM, 1 CPU

**Production:**
- 2-10 instances, 2GB RAM, 2 CPU

### Scaling Schedule

Scale based on predictable traffic patterns:

```yaml
# Scale up during peak hours (6 PM - 11 PM WAT)
- schedule: "0 18 * * *"  # 6 PM
  minInstances: 5
  maxInstances: 10

# Scale down during off-peak hours (12 AM - 6 AM WAT)
- schedule: "0 0 * * *"   # 12 AM
  minInstances: 2
  maxInstances: 5
```

### Spot Instances

Use spot instances for non-critical workloads:
- Background jobs
- Cache warming
- Analytics processing

**Savings:** Up to 70% compared to on-demand instances

## Disaster Recovery

### Multi-Region Deployment

Deploy to multiple regions for high availability:

```
Primary Region: Lagos, Nigeria
Backup Region: London, UK
```

**Failover Strategy:**
1. Health check fails in primary region
2. DNS switches to backup region
3. Traffic routes to backup
4. Primary region recovers
5. Traffic switches back

### Backup and Restore

**Database Backups:**
- Automated daily backups
- Point-in-time recovery (7 days)
- Cross-region backup replication

**Application State:**
- Redis persistence (AOF + RDB)
- Backup to S3 every hour

## Testing Auto-Scaling

### Load Testing

Use k6 for load testing:

```javascript
// load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 },   // Ramp up to 100 users
    { duration: '5m', target: 100 },   // Stay at 100 users
    { duration: '2m', target: 1000 },  // Ramp up to 1000 users
    { duration: '5m', target: 1000 },  // Stay at 1000 users
    { duration: '2m', target: 0 },     // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests < 500ms
    http_req_failed: ['rate<0.01'],   // Error rate < 1%
  },
};

export default function () {
  const res = http.get('https://api.tikit.app/api/events');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
  sleep(1);
}
```

Run test:
```bash
k6 run load-test.js
```

### Chaos Engineering

Test resilience with chaos engineering:

**Scenarios:**
1. Kill random instance
2. Introduce network latency
3. Simulate database failure
4. Overload with traffic

**Tools:**
- Chaos Monkey
- Gremlin
- Litmus

## Deployment Checklist

- [ ] Health check endpoints implemented
- [ ] Auto-scaling configuration deployed
- [ ] Monitoring and alerts configured
- [ ] Load testing completed
- [ ] Database connection pooling configured
- [ ] Redis cluster configured
- [ ] CDN configured
- [ ] Multi-region deployment (optional)
- [ ] Disaster recovery plan documented
- [ ] Cost alerts configured

## Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| Concurrent users | 10,000+ | Monitor |
| Response time (p95) | < 500ms | Monitor |
| Response time (p99) | < 1s | Monitor |
| Error rate | < 1% | Monitor |
| Uptime | > 99.9% | Monitor |
| Auto-scale time | < 2 min | Monitor |
