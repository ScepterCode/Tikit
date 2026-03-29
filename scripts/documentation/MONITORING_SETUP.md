# Monitoring and Error Tracking Setup

## Overview

This document outlines the monitoring and error tracking strategy for the Tikit platform to ensure system reliability and quick issue resolution.

## Error Tracking with Sentry

### Setup

1. **Create Sentry Account**
   - Sign up at https://sentry.io
   - Create a new project for Node.js
   - Copy the DSN (Data Source Name)

2. **Configure Environment Variables**

```bash
# .env
SENTRY_DSN=https://your-dsn@sentry.io/project-id
APP_VERSION=1.0.0
NODE_ENV=production
```

3. **Install Dependencies**

```bash
npm install @sentry/node @sentry/profiling-node
```

### Features

#### Error Tracking

Automatically captures:
- Unhandled exceptions
- Unhandled promise rejections
- Logged errors via logger.error()
- HTTP errors (4xx, 5xx)

#### Performance Monitoring

Tracks:
- API endpoint response times
- Database query performance
- External API call latency
- Custom transactions

#### User Context

Attaches user information to errors:

```typescript
import { setUserContext } from './services/logger.service';

// After user authentication
setUserContext(user.id, user.email, user.phoneNumber);
```

#### Breadcrumbs

Tracks user actions leading to errors:

```typescript
import { addBreadcrumb } from './services/logger.service';

addBreadcrumb('User purchased ticket', 'user-action', {
  eventId: event.id,
  ticketTier: tier.id,
  amount: tier.price,
});
```

### Error Filtering

Configured to filter out:
- Validation errors (expected user errors)
- 404 Not Found errors
- Development environment errors

### Alert Configuration

**Critical Alerts (Immediate notification):**
- Error rate > 5%
- Fatal errors
- Payment processing failures
- Database connection failures

**Warning Alerts (15-minute delay):**
- Error rate > 1%
- Slow API responses (p95 > 1s)
- High memory usage (> 90%)

**Info Alerts (1-hour summary):**
- New error types
- Performance degradation
- Unusual traffic patterns

## Logging Strategy

### Log Levels

| Level | Use Case | Example |
|-------|----------|---------|
| DEBUG | Development debugging | Variable values, flow control |
| INFO | Normal operations | Request received, user logged in |
| WARN | Potential issues | Deprecated API used, rate limit approaching |
| ERROR | Recoverable errors | Payment failed, external API error |
| FATAL | Critical failures | Database down, service crash |

### Structured Logging

All logs include:
- Timestamp (ISO 8601)
- Log level
- Message
- Context (userId, requestId, etc.)
- Error details (if applicable)

Example:

```typescript
logger.info('Ticket purchased', {
  userId: user.id,
  eventId: event.id,
  ticketId: ticket.id,
  amount: payment.amount,
  paymentMethod: payment.method,
});
```

### Log Aggregation

**Options:**

1. **Datadog Logs** (Recommended)
   - Centralized log management
   - Advanced search and filtering
   - Log-based metrics
   - Integration with APM

2. **Logtail** (Budget-friendly)
   - Simple setup
   - Good search capabilities
   - Affordable pricing

3. **Better Stack** (All-in-one)
   - Logs + Uptime monitoring
   - Incident management
   - Status pages

### Log Retention

- **Production:** 30 days
- **Staging:** 7 days
- **Development:** 1 day

## Application Performance Monitoring (APM)

### Datadog APM Setup

1. **Install Datadog Agent**

```bash
npm install dd-trace
```

2. **Initialize at Application Start**

```typescript
// src/index.ts (first line)
import tracer from 'dd-trace';

tracer.init({
  service: 'tikit-backend',
  env: process.env.NODE_ENV,
  version: process.env.APP_VERSION,
  logInjection: true,
});
```

3. **Configure Environment Variables**

```bash
DD_API_KEY=your-api-key
DD_SITE=datadoghq.com
DD_SERVICE=tikit-backend
DD_ENV=production
DD_VERSION=1.0.0
```

### Metrics to Monitor

#### Application Metrics

- **Request Rate:** Requests per second
- **Error Rate:** Percentage of failed requests
- **Response Time:** p50, p95, p99 latency
- **Throughput:** Successful requests per second

#### System Metrics

- **CPU Usage:** Percentage utilization
- **Memory Usage:** Heap used, RSS
- **Disk I/O:** Read/write operations
- **Network I/O:** Bytes sent/received

#### Business Metrics

- **Ticket Sales:** Tickets sold per hour
- **Revenue:** Total revenue per hour
- **User Registrations:** New users per hour
- **Payment Success Rate:** Successful payments / total attempts

### Custom Metrics

Track business-specific metrics:

```typescript
import { metrics } from 'dd-trace';

// Increment counter
metrics.increment('ticket.purchased', 1, {
  eventType: event.eventType,
  paymentMethod: payment.method,
});

// Record gauge
metrics.gauge('event.capacity.remaining', event.capacity - event.ticketsSold, {
  eventId: event.id,
});

// Record histogram
metrics.histogram('payment.amount', payment.amount, {
  currency: payment.currency,
});
```

## Uptime Monitoring

### Health Check Endpoints

- `/health` - Liveness probe
- `/ready` - Readiness probe
- `/metrics` - Prometheus-compatible metrics

### External Monitoring Services

**Options:**

1. **UptimeRobot** (Free)
   - 50 monitors on free plan
   - 5-minute check interval
   - Email/SMS alerts

2. **Pingdom** (Paid)
   - 1-minute check interval
   - Global monitoring locations
   - Advanced alerting

3. **Better Uptime** (Paid)
   - Status pages
   - Incident management
   - On-call scheduling

### Monitoring Configuration

```yaml
# UptimeRobot configuration
monitors:
  - name: Tikit API Health
    url: https://api.tikit.app/health
    type: HTTP
    interval: 300 # 5 minutes
    expected_status: 200
    
  - name: Tikit API Ready
    url: https://api.tikit.app/ready
    type: HTTP
    interval: 300
    expected_status: 200
    
  - name: Tikit Frontend
    url: https://tikit.app
    type: HTTP
    interval: 300
    expected_status: 200
```

## Alerting Strategy

### Alert Channels

1. **Email:** All team members
2. **Slack:** #alerts channel
3. **PagerDuty:** On-call engineer (critical only)
4. **SMS:** Critical alerts only

### Alert Severity Levels

#### P0 - Critical (Immediate response required)
- Service completely down
- Database unavailable
- Payment processing broken
- Data loss detected

**Response Time:** < 15 minutes
**Notification:** PagerDuty + SMS + Slack + Email

#### P1 - High (Urgent response required)
- Partial service degradation
- Error rate > 5%
- Response time > 3s (p99)
- External API failures

**Response Time:** < 1 hour
**Notification:** Slack + Email

#### P2 - Medium (Response required during business hours)
- Error rate > 1%
- Response time > 1s (p99)
- Cache hit rate < 60%
- Disk space > 80%

**Response Time:** < 4 hours
**Notification:** Slack + Email

#### P3 - Low (Informational)
- New error types
- Performance degradation
- Unusual patterns

**Response Time:** Next business day
**Notification:** Email

### Alert Rules

```yaml
# Example alert rules (Datadog format)
alerts:
  - name: High Error Rate
    query: "avg(last_5m):sum:trace.express.request.errors{env:production} / sum:trace.express.request.hits{env:production} > 0.05"
    message: "Error rate is above 5% @pagerduty"
    priority: P0
    
  - name: Slow API Response
    query: "avg(last_10m):p99:trace.express.request.duration{env:production} > 3000"
    message: "API response time (p99) is above 3s @slack-alerts"
    priority: P1
    
  - name: Database Connection Pool Exhausted
    query: "avg(last_5m):postgresql.connections.used{env:production} / postgresql.connections.max{env:production} > 0.95"
    message: "Database connection pool is 95% utilized @slack-alerts"
    priority: P1
    
  - name: High Memory Usage
    query: "avg(last_5m):system.mem.pct_usable{env:production} < 0.1"
    message: "Memory usage is above 90% @slack-alerts"
    priority: P2
```

## Dashboards

### Main Dashboard

**Metrics:**
- Request rate (last 1h, 24h, 7d)
- Error rate (last 1h, 24h, 7d)
- Response time (p50, p95, p99)
- Active users
- Ticket sales (last 1h, 24h, 7d)
- Revenue (last 1h, 24h, 7d)

### Infrastructure Dashboard

**Metrics:**
- CPU usage per instance
- Memory usage per instance
- Disk I/O
- Network I/O
- Database connections
- Redis memory usage

### Business Dashboard

**Metrics:**
- New user registrations
- Ticket sales by event type
- Revenue by payment method
- Top events by sales
- Referral conversions
- Group buy completion rate

## Incident Response

### Incident Workflow

1. **Detection:** Alert triggered
2. **Acknowledgment:** On-call engineer acknowledges
3. **Investigation:** Identify root cause
4. **Mitigation:** Apply temporary fix
5. **Resolution:** Implement permanent fix
6. **Post-mortem:** Document learnings

### Incident Communication

**Status Page:** https://status.tikit.app
- Automatically updated via API
- Subscribe for updates
- Historical uptime data

**Communication Channels:**
- Twitter: @TikitStatus
- Email: status@tikit.app
- In-app banner

### Post-Mortem Template

```markdown
# Incident Post-Mortem: [Title]

## Summary
Brief description of the incident.

## Timeline
- HH:MM - Alert triggered
- HH:MM - Engineer acknowledged
- HH:MM - Root cause identified
- HH:MM - Mitigation applied
- HH:MM - Incident resolved

## Root Cause
Detailed explanation of what caused the incident.

## Impact
- Duration: X hours
- Affected users: X
- Failed requests: X
- Revenue impact: ₦X

## Resolution
What was done to resolve the incident.

## Action Items
- [ ] Implement monitoring for X
- [ ] Add alerting for Y
- [ ] Update documentation
- [ ] Conduct training

## Lessons Learned
What we learned and how we'll prevent this in the future.
```

## Performance Targets

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Uptime | > 99.9% | < 99.5% |
| Error rate | < 0.1% | > 1% |
| Response time (p95) | < 500ms | > 1s |
| Response time (p99) | < 1s | > 3s |
| MTTR (Mean Time To Resolve) | < 1 hour | > 4 hours |
| MTTD (Mean Time To Detect) | < 5 minutes | > 15 minutes |

## Cost Optimization

### Monitoring Costs

**Estimated Monthly Costs:**
- Sentry (Team plan): $26/month
- Datadog (Pro plan): $15/host/month
- UptimeRobot (Free): $0
- Total: ~$50-100/month

**Cost Reduction Tips:**
- Use sampling for performance monitoring (10%)
- Filter out non-critical errors
- Use free tier for uptime monitoring
- Aggregate logs before sending to reduce volume

## Checklist

- [ ] Sentry configured and tested
- [ ] Logger service implemented
- [ ] Request logging middleware added
- [ ] Error logging middleware added
- [ ] Health check endpoints created
- [ ] APM configured (optional)
- [ ] Uptime monitoring configured
- [ ] Alert rules configured
- [ ] Dashboards created
- [ ] Incident response plan documented
- [ ] Status page set up (optional)
- [ ] Team trained on monitoring tools
