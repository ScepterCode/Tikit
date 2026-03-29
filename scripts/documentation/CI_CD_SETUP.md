# CI/CD Pipeline Setup

This document describes the Continuous Integration and Continuous Deployment (CI/CD) pipeline for the Tikit platform.

## Overview

The Tikit platform uses GitHub Actions for CI/CD with the following workflows:

1. **CI Pipeline** - Runs on every pull request and push
2. **Staging Deployment** - Deploys to staging on push to `develop` branch
3. **Production Deployment** - Deploys to production on push to `main` branch or version tags

## Workflows

### 1. CI Pipeline (`.github/workflows/ci.yml`)

Runs on: Pull requests and pushes to `main` and `develop` branches

**Jobs:**
- **Lint and Test**: Runs ESLint and all tests for frontend and backend
- **Build Frontend**: Builds the React PWA
- **Build Backend**: Builds the Node.js API
- **Security Scan**: Runs npm audit and Snyk security scans

**Services:**
- PostgreSQL 15 (for backend tests)
- Redis 7 (for caching tests)

**Artifacts:**
- Frontend build output (retained for 7 days)
- Backend build output (retained for 7 days)
- Test coverage reports (uploaded to Codecov)

### 2. Staging Deployment (`.github/workflows/deploy-staging.yml`)

Runs on: Push to `develop` branch

**Jobs:**
- **Deploy Frontend to Vercel Staging**: Builds and deploys frontend to Vercel preview environment
- **Deploy Backend to Railway Staging**: Builds and deploys backend to Railway staging service
- **Notify Deployment**: Sends Slack notification with deployment status

**Post-Deployment:**
- Runs database migrations
- Executes smoke tests
- Verifies health endpoints

### 3. Production Deployment (`.github/workflows/deploy-production.yml`)

Runs on: Push to `main` branch or version tags (`v*`)

**Jobs:**
- **Deploy Frontend to Vercel Production**: Builds and deploys frontend to production
- **Deploy Backend to Railway Production**: Builds and deploys backend to production
- **Run Integration Tests**: Executes Playwright integration tests against production
- **Notify Deployment**: Sends Slack notification and creates Sentry release

**Post-Deployment:**
- Runs database migrations
- Warms cache with popular events
- Executes comprehensive smoke tests
- Runs Lighthouse CI for performance audits
- Creates Sentry release for error tracking

## Required Secrets

Configure the following secrets in GitHub repository settings:

### Vercel Secrets
- `VERCEL_TOKEN` - Vercel authentication token
- `VERCEL_ORG_ID` - Vercel organization ID
- `VERCEL_PROJECT_ID` - Vercel project ID

### Railway Secrets
- `RAILWAY_TOKEN` - Railway authentication token

### Environment URLs
- `STAGING_API_URL` - Staging backend URL
- `STAGING_FRONTEND_URL` - Staging frontend URL
- `PRODUCTION_API_URL` - Production backend URL (https://api.tikit.ng)

### Supabase Secrets
**Staging:**
- `STAGING_SUPABASE_URL`
- `STAGING_SUPABASE_ANON_KEY`

**Production:**
- `PRODUCTION_SUPABASE_URL`
- `PRODUCTION_SUPABASE_ANON_KEY`

### Monitoring & Notifications
- `SLACK_WEBHOOK` - Slack webhook URL for deployment notifications
- `SENTRY_AUTH_TOKEN` - Sentry authentication token
- `SENTRY_ORG` - Sentry organization name
- `SNYK_TOKEN` - Snyk security scanning token

## Environment Configuration

### Staging Environment

**Frontend (Vercel):**
- URL: `https://tikit-staging.vercel.app`
- Environment: `staging`
- Auto-deploy: On push to `develop`

**Backend (Railway):**
- URL: `https://api-staging.tikit.ng`
- Service: `backend-staging`
- Database: PostgreSQL (Railway managed)
- Redis: Redis (Railway managed)

### Production Environment

**Frontend (Vercel):**
- URL: `https://tikit.ng`
- Environment: `production`
- Auto-deploy: On push to `main`
- CDN: Cloudflare

**Backend (Railway):**
- URL: `https://api.tikit.ng`
- Service: `backend-production`
- Database: PostgreSQL with read replicas
- Redis: Redis cluster
- Monitoring: Sentry, Datadog

## Deployment Process

### Staging Deployment

1. Create a feature branch from `develop`
2. Make changes and commit
3. Open a pull request to `develop`
4. CI pipeline runs automatically
5. After review and approval, merge to `develop`
6. Staging deployment workflow triggers automatically
7. Verify changes in staging environment

### Production Deployment

1. Create a pull request from `develop` to `main`
2. CI pipeline runs automatically
3. After review and approval, merge to `main`
4. Production deployment workflow triggers automatically
5. Integration tests run against production
6. Monitor deployment in Sentry and Datadog

### Hotfix Deployment

1. Create a hotfix branch from `main`
2. Make critical fixes
3. Open a pull request to `main`
4. After review, merge to `main`
5. Production deployment triggers automatically
6. Backport changes to `develop` branch

## Rollback Procedures

### Frontend Rollback (Vercel)

```bash
# List recent deployments
vercel ls

# Rollback to a specific deployment
vercel rollback <deployment-url>
```

### Backend Rollback (Railway)

```bash
# List recent deployments
railway status

# Rollback to previous deployment
railway rollback
```

### Database Rollback

```bash
# Rollback last migration
npx prisma migrate resolve --rolled-back <migration-name>

# Apply previous migration
npx prisma migrate deploy
```

## Monitoring and Alerts

### Health Checks

**Frontend:**
- URL: `https://tikit.ng`
- Manifest: `https://tikit.ng/manifest.json`
- Service Worker: Check in DevTools > Application

**Backend:**
- Health: `https://api.tikit.ng/health`
- Events API: `https://api.tikit.ng/api/events`

### Performance Monitoring

**Lighthouse CI:**
- Runs on every production deployment
- Checks performance, accessibility, SEO, PWA
- Results uploaded to temporary public storage

**Metrics Tracked:**
- Performance score > 90
- Accessibility score > 95
- PWA score > 90
- First Contentful Paint < 1.5s
- Time to Interactive < 3s

### Error Tracking

**Sentry:**
- Automatic error reporting
- Release tracking
- Performance monitoring
- User feedback

**Alerts:**
- Error rate > 1%
- Response time p99 > 3s
- Payment failure rate > 5%

## Testing Strategy

### Unit Tests
- Run on every commit
- Coverage threshold: 80%
- Fast feedback (< 2 minutes)

### Integration Tests
- Run on staging deployment
- Test critical user flows
- Use Playwright for E2E testing

### Smoke Tests
- Run after every deployment
- Verify core functionality
- Quick validation (< 1 minute)

### Load Tests
- Run manually before major releases
- Use k6 for load testing
- Target: 10,000 concurrent users

## Best Practices

### Commit Messages
Follow conventional commits format:
```
feat: add offline ticket caching
fix: resolve payment gateway timeout
docs: update deployment guide
test: add integration tests for group buy
```

### Branch Strategy
- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - Feature branches
- `hotfix/*` - Critical fixes for production

### Code Review
- All changes require PR approval
- CI must pass before merging
- At least one reviewer required
- Security scans must pass

### Database Migrations
- Always test migrations in staging first
- Use reversible migrations when possible
- Backup database before production migrations
- Monitor migration performance

## Troubleshooting

### CI Pipeline Failures

**Lint Errors:**
```bash
# Fix automatically
pnpm --filter @tikit/frontend lint --fix
pnpm --filter @tikit/backend lint --fix
```

**Test Failures:**
```bash
# Run tests locally
pnpm --filter @tikit/frontend test
pnpm --filter @tikit/backend test

# Run specific test
pnpm --filter @tikit/frontend test <test-file>
```

**Build Failures:**
```bash
# Clear cache and rebuild
rm -rf node_modules
pnpm install
pnpm build
```

### Deployment Failures

**Vercel Deployment:**
- Check build logs in Vercel dashboard
- Verify environment variables
- Check for build errors in CI logs

**Railway Deployment:**
- Check deployment logs in Railway dashboard
- Verify database connection
- Check for migration errors

### Database Issues

**Migration Failures:**
```bash
# Check migration status
npx prisma migrate status

# Reset database (staging only!)
npx prisma migrate reset

# Apply migrations manually
npx prisma migrate deploy
```

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel Deployment Documentation](https://vercel.com/docs)
- [Railway Deployment Documentation](https://docs.railway.app/)
- [Prisma Migrations Guide](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Playwright Testing Documentation](https://playwright.dev/)
