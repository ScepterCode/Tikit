# Tikit Deployment Guide

This guide provides step-by-step instructions for deploying the Tikit platform to production.

## Prerequisites

Before deploying, ensure you have:

1. **Accounts:**
   - GitHub account with repository access
   - Vercel account (for frontend)
   - Railway account (for backend)
   - Cloudflare account (for CDN)
   - Sentry account (for error tracking)

2. **Services:**
   - PostgreSQL database (Railway managed or external)
   - Redis instance (Railway managed or Upstash)
   - Firebase project (for real-time features)
   - Supabase project (for authentication)

3. **API Keys:**
   - Africa's Talking API credentials
   - Paystack API keys
   - Flutterwave API keys
   - WhatsApp Business API credentials

## Frontend Deployment (Vercel)

### Initial Setup

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Link Project:**
   ```bash
   cd apps/frontend
   vercel link
   ```

### Configure Environment Variables

In Vercel dashboard, add the following environment variables:

**Production:**
```
VITE_API_URL=https://api.tikit.ng
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Preview (Staging):**
```
VITE_API_URL=https://api-staging.tikit.ng
VITE_SUPABASE_URL=https://your-staging-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-staging-anon-key
```

### Deploy

**Manual Deployment:**
```bash
cd apps/frontend
vercel --prod
```

**Automatic Deployment:**
- Push to `main` branch triggers production deployment
- Push to `develop` branch triggers preview deployment

### Custom Domain Setup

1. Go to Vercel project settings
2. Navigate to "Domains"
3. Add custom domain: `tikit.ng`
4. Update DNS records:
   ```
   Type: CNAME
   Name: @
   Value: cname.vercel-dns.com
   ```

### SSL Certificate

Vercel automatically provisions SSL certificates via Let's Encrypt.

## Backend Deployment (Railway)

### Initial Setup

1. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway:**
   ```bash
   railway login
   ```

3. **Link Project:**
   ```bash
   cd apps/backend
   railway link
   ```

### Configure Environment Variables

In Railway dashboard, add the following environment variables:

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/tikit

# Redis
REDIS_URL=redis://host:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY=your-private-key

# Payment Gateways
PAYSTACK_SECRET_KEY=sk_live_your_paystack_secret_key_here
FLUTTERWAVE_SECRET_KEY=FLWSECK-your_flutterwave_secret_key_here

# Africa's Talking
AFRICAS_TALKING_API_KEY=your-api-key
AFRICAS_TALKING_USERNAME=your-username

# WhatsApp Business API
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
WHATSAPP_ACCESS_TOKEN=your-access-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id

# Monitoring
SENTRY_DSN=https://xxx@sentry.io/xxx
NODE_ENV=production

# CORS
CORS_ORIGIN=https://tikit.ng

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

### Database Setup

1. **Create PostgreSQL Database:**
   ```bash
   railway add postgresql
   ```

2. **Run Migrations:**
   ```bash
   railway run npx prisma migrate deploy
   ```

3. **Seed Database (Optional):**
   ```bash
   railway run npx prisma db seed
   ```

### Redis Setup

1. **Create Redis Instance:**
   ```bash
   railway add redis
   ```

2. **Verify Connection:**
   ```bash
   railway run node -e "require('./dist/lib/redis').default.ping().then(console.log)"
   ```

### Deploy

**Manual Deployment:**
```bash
cd apps/backend
railway up
```

**Automatic Deployment:**
- Push to `main` branch triggers production deployment
- Railway automatically builds and deploys

### Custom Domain Setup

1. Go to Railway project settings
2. Navigate to "Domains"
3. Add custom domain: `api.tikit.ng`
4. Update DNS records:
   ```
   Type: CNAME
   Name: api
   Value: your-project.up.railway.app
   ```

### Health Checks

Railway automatically monitors the `/health` endpoint configured in `railway.json`.

## Database Configuration

### PostgreSQL Setup

**Production Configuration:**
```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Create read replica (if using managed service)
-- Follow your provider's documentation

-- Configure connection pooling
-- Use PgBouncer or Railway's built-in pooling
```

**Backup Strategy:**
```bash
# Automated daily backups (Railway provides this)
# Manual backup
railway run pg_dump $DATABASE_URL > backup.sql

# Restore from backup
railway run psql $DATABASE_URL < backup.sql
```

### Redis Configuration

**Production Configuration:**
```redis
# Set maxmemory policy
maxmemory-policy allkeys-lru

# Enable persistence
save 900 1
save 300 10
save 60 10000

# Set max memory (adjust based on plan)
maxmemory 256mb
```

## CDN Configuration (Cloudflare)

### Setup

1. **Add Site to Cloudflare:**
   - Go to Cloudflare dashboard
   - Add `tikit.ng` domain
   - Update nameservers at domain registrar

2. **Configure DNS:**
   ```
   Type: CNAME
   Name: @
   Value: cname.vercel-dns.com
   Proxy: Enabled (Orange cloud)

   Type: CNAME
   Name: api
   Value: your-project.up.railway.app
   Proxy: Enabled (Orange cloud)
   ```

3. **Configure Caching:**
   - Go to Caching > Configuration
   - Set caching level: Standard
   - Browser cache TTL: 4 hours
   - Enable "Always Online"

4. **Configure Page Rules:**
   ```
   Rule 1: tikit.ng/assets/*
   - Cache Level: Cache Everything
   - Edge Cache TTL: 1 month

   Rule 2: tikit.ng/api/*
   - Cache Level: Bypass

   Rule 3: tikit.ng/*
   - Cache Level: Standard
   - Browser Cache TTL: 4 hours
   ```

5. **Enable Security Features:**
   - SSL/TLS: Full (strict)
   - Always Use HTTPS: On
   - Automatic HTTPS Rewrites: On
   - Minimum TLS Version: 1.2
   - TLS 1.3: On
   - HSTS: Enabled (max-age: 31536000)

## Monitoring Setup

### Sentry Configuration

1. **Create Sentry Project:**
   - Go to Sentry dashboard
   - Create new project: "tikit"
   - Select platform: Node.js and React

2. **Configure Frontend:**
   ```typescript
   // apps/frontend/src/main.tsx
   import * as Sentry from "@sentry/react";

   Sentry.init({
     dsn: "https://xxx@sentry.io/xxx",
     environment: "production",
     tracesSampleRate: 0.1,
   });
   ```

3. **Configure Backend:**
   ```typescript
   // apps/backend/src/index.ts
   import * as Sentry from "@sentry/node";

   Sentry.init({
     dsn: process.env.SENTRY_DSN,
     environment: process.env.NODE_ENV,
     tracesSampleRate: 0.1,
   });
   ```

### Datadog Configuration (Optional)

1. **Install Datadog Agent:**
   ```bash
   railway add datadog
   ```

2. **Configure APM:**
   ```typescript
   // apps/backend/src/index.ts
   import tracer from 'dd-trace';
   tracer.init({
     service: 'tikit-backend',
     env: 'production',
   });
   ```

## Post-Deployment Checklist

### Verification Steps

1. **Frontend Checks:**
   - [ ] Site loads at https://tikit.ng
   - [ ] PWA manifest loads correctly
   - [ ] Service worker registers successfully
   - [ ] "Add to Home Screen" works on mobile
   - [ ] Offline mode works
   - [ ] All assets load from CDN

2. **Backend Checks:**
   - [ ] Health endpoint responds: https://api.tikit.ng/health
   - [ ] API endpoints work correctly
   - [ ] Database connection is stable
   - [ ] Redis connection is stable
   - [ ] Authentication works
   - [ ] Payment gateways respond

3. **Integration Checks:**
   - [ ] Frontend can communicate with backend
   - [ ] CORS is configured correctly
   - [ ] Real-time features work (Firebase)
   - [ ] SMS sending works (Africa's Talking)
   - [ ] WhatsApp messages send correctly
   - [ ] Payment processing works

4. **Performance Checks:**
   - [ ] Lighthouse score > 90
   - [ ] Page load time < 2s
   - [ ] API response time < 500ms
   - [ ] Database queries < 100ms
   - [ ] CDN cache hit rate > 90%

5. **Security Checks:**
   - [ ] SSL certificate is valid
   - [ ] HTTPS redirect works
   - [ ] Security headers are set
   - [ ] Rate limiting works
   - [ ] CORS whitelist is correct
   - [ ] Environment variables are secure

### Smoke Tests

Run the following smoke tests after deployment:

```bash
# Frontend
curl -f https://tikit.ng
curl -f https://tikit.ng/manifest.json

# Backend
curl -f https://api.tikit.ng/health
curl -f https://api.tikit.ng/api/events

# Test user registration
curl -X POST https://api.tikit.ng/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+2348012345678"}'

# Test event listing
curl https://api.tikit.ng/api/events?page=1&limit=20
```

## Rollback Procedures

### Frontend Rollback

```bash
# List recent deployments
vercel ls

# Rollback to specific deployment
vercel rollback <deployment-url>
```

### Backend Rollback

```bash
# Rollback to previous deployment
railway rollback

# Or redeploy specific commit
git checkout <commit-hash>
railway up
```

### Database Rollback

```bash
# Rollback last migration
npx prisma migrate resolve --rolled-back <migration-name>

# Restore from backup
railway run psql $DATABASE_URL < backup.sql
```

## Troubleshooting

### Common Issues

**Issue: Frontend not loading**
- Check Vercel deployment logs
- Verify environment variables
- Check browser console for errors
- Verify DNS configuration

**Issue: Backend API errors**
- Check Railway deployment logs
- Verify database connection
- Check Redis connection
- Verify environment variables

**Issue: Database connection errors**
- Check DATABASE_URL format
- Verify database is running
- Check connection pool settings
- Verify firewall rules

**Issue: Payment gateway errors**
- Verify API keys are correct
- Check payment gateway status
- Review webhook configuration
- Check error logs in Sentry

### Support Contacts

- **Vercel Support:** https://vercel.com/support
- **Railway Support:** https://railway.app/help
- **Cloudflare Support:** https://support.cloudflare.com
- **Sentry Support:** https://sentry.io/support

## Maintenance

### Regular Tasks

**Daily:**
- Monitor error rates in Sentry
- Check API response times
- Review payment success rates

**Weekly:**
- Review database performance
- Check cache hit rates
- Update dependencies (security patches)
- Review user feedback

**Monthly:**
- Database maintenance (VACUUM, ANALYZE)
- Review and optimize slow queries
- Update documentation
- Security audit

### Scaling Considerations

**When to Scale:**
- CPU usage > 70% consistently
- Memory usage > 80%
- Response time p99 > 3s
- Database connections > 80% of pool

**Scaling Options:**
- Increase Railway replicas
- Add database read replicas
- Upgrade Redis instance
- Enable Cloudflare Argo for faster routing

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Railway Documentation](https://docs.railway.app/)
- [Cloudflare Documentation](https://developers.cloudflare.com/)
- [Prisma Deployment Guide](https://www.prisma.io/docs/guides/deployment)
- [Sentry Documentation](https://docs.sentry.io/)
