# 🚀 Tikit Production Hosting Guide

## Overview
Complete guide for hosting your Tikit event management system with FastAPI backend, React frontend, and Supabase database.

## 🏗️ System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend │    │  FastAPI Backend │    │    Supabase     │
│   (Vercel)      │────│   (Railway)     │────│   (Hosted)      │
│   Port: 3000    │    │   Port: 8000    │    │   PostgreSQL    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         │              │     Redis       │              │
         └──────────────│   (Railway)     │──────────────┘
                        │   Caching       │
                        └─────────────────┘
```

## 🎯 Recommended Hosting Stack

### 1. Frontend: Vercel (Free/Pro)
- **Why**: Optimized for React/Vite, automatic deployments, global CDN
- **Cost**: Free tier available, Pro at $20/month
- **Features**: Automatic HTTPS, custom domains, preview deployments

### 2. Backend: Render (Starter/Standard) ⭐ **PREFERRED**
- **Why**: Excellent Python/FastAPI support, built-in Redis, simple deployments
- **Cost**: Starter at $7/month, Standard at $25/month
- **Features**: Auto-deployments from Git, built-in monitoring, managed Redis

### 3. Database: Supabase (Free/Pro)
- **Status**: ✅ Already hosted
- **Features**: PostgreSQL, real-time subscriptions, authentication

### 4. Alternative Options
- **Backend**: Railway, DigitalOcean App Platform, AWS Lambda
- **Frontend**: Netlify, Cloudflare Pages
- **Caching**: Upstash Redis, AWS ElastiCache

## 📋 Step-by-Step Deployment

### Phase 1: Prepare for Production

#### 1.1 Environment Configuration
```bash
# Create production environment files
cp apps/backend-fastapi/.env.example apps/backend-fastapi/.env.production
cp apps/frontend/.env.local apps/frontend/.env.production
```

#### 1.2 Update Frontend Environment
```env
# apps/frontend/.env.production
VITE_API_BASE_URL=https://your-backend-url.railway.app
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_ENVIRONMENT=production
```

#### 1.3 Update Backend Environment
```env
# apps/backend-fastapi/.env.production
ENVIRONMENT=production
DEBUG=false
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-supabase-service-key
SUPABASE_ANON_KEY=your-supabase-anon-key
JWT_SECRET=your-super-secure-jwt-secret-key
FRONTEND_URL=https://your-frontend-url.vercel.app
REDIS_URL=redis://redis:6379
```

### Phase 2: Deploy Backend to Railway

#### 2.1 Install Railway CLI
```bash
npm install -g @railway/cli
```

#### 2.2 Login and Initialize
```bash
railway login
cd apps/backend-fastapi
railway init
```

#### 2.3 Add Environment Variables
```bash
# Add all environment variables from .env.production
railway variables set ENVIRONMENT=production
railway variables set SUPABASE_URL=https://your-project.supabase.co
railway variables set SUPABASE_SERVICE_KEY=your-service-key
railway variables set JWT_SECRET=your-jwt-secret
# ... add all other variables
```

#### 2.4 Add Redis Service
```bash
# In Railway dashboard, add Redis plugin
# This will automatically set REDIS_URL
```

#### 2.5 Deploy Backend
```bash
# Create railway.json
cat > railway.json << EOF
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "uvicorn main:app --host 0.0.0.0 --port \$PORT",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
EOF

# Deploy
railway up
```

#### 2.6 Get Backend URL
```bash
railway domain
# Note the URL (e.g., https://your-app.railway.app)
```

### Phase 3: Deploy Frontend to Vercel

#### 3.1 Install Vercel CLI
```bash
npm install -g vercel
```

#### 3.2 Login and Initialize
```bash
vercel login
cd apps/frontend
vercel
```

#### 3.3 Configure Environment Variables
```bash
# Add environment variables in Vercel dashboard or CLI
vercel env add VITE_API_BASE_URL production
# Enter: https://your-backend-url.railway.app

vercel env add VITE_SUPABASE_URL production
# Enter: https://your-project.supabase.co

vercel env add VITE_SUPABASE_ANON_KEY production
# Enter: your-supabase-anon-key
```

#### 3.4 Deploy Frontend
```bash
vercel --prod
```

### Phase 4: Configure Domain and SSL

#### 4.1 Custom Domain (Optional)
```bash
# Add custom domain in Vercel dashboard
# Update DNS records as instructed
# SSL is automatic with Vercel
```

#### 4.2 Update CORS Settings
Update your backend CORS settings with the production frontend URL:
```python
# In apps/backend-fastapi/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://your-frontend-url.vercel.app",
        "https://your-custom-domain.com"  # if using custom domain
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"]
)
```

## 🔧 Alternative Hosting Options

### Option A: All-in-One Platforms

#### Railway (Recommended for Simplicity)
```bash
# Deploy both frontend and backend to Railway
cd apps/backend-fastapi
railway init
railway up

cd ../frontend
railway init
railway up
```

#### Render
```yaml
# render.yaml
services:
  - type: web
    name: tikit-backend
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: ENVIRONMENT
        value: production
      - key: SUPABASE_URL
        fromDatabase:
          name: supabase-url
          property: connectionString

  - type: web
    name: tikit-frontend
    env: node
    buildCommand: npm run build
    startCommand: npm run preview
    envVars:
      - key: VITE_API_BASE_URL
        value: https://tikit-backend.onrender.com
```

### Option B: Cloud Providers

#### AWS (Advanced)
```bash
# Use AWS CDK or Terraform
# Deploy FastAPI to Lambda or ECS
# Deploy React to S3 + CloudFront
# Use RDS for database (or keep Supabase)
```

#### Google Cloud Platform
```bash
# Deploy FastAPI to Cloud Run
# Deploy React to Firebase Hosting
# Use Cloud SQL (or keep Supabase)
```

#### DigitalOcean App Platform
```yaml
# app.yaml
name: tikit
services:
- name: backend
  source_dir: /apps/backend-fastapi
  run_command: uvicorn main:app --host 0.0.0.0 --port 8000
  environment_slug: python
  instance_count: 1
  instance_size_slug: basic-xxs
  http_port: 8000

- name: frontend
  source_dir: /apps/frontend
  build_command: npm run build
  run_command: npm run preview
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  http_port: 3000
```

## 💰 Cost Breakdown

### Recommended Stack (Monthly)
- **Vercel Pro**: $20/month (includes team features)
- **Render Starter**: $7/month (backend)
- **Render Redis**: $7/month (caching)
- **Supabase Pro**: $25/month (already hosted)
- **Total**: ~$59/month

### Budget Option (Monthly)
- **Vercel Free**: $0/month (hobby projects)
- **Render Starter**: $7/month (backend)
- **Render Redis**: $7/month (caching)
- **Supabase Free**: $0/month (if within limits)
- **Total**: ~$14/month

### Enterprise Option (Monthly)
- **Vercel Enterprise**: $150+/month
- **Railway Pro**: $20+/month
- **Supabase Pro**: $25+/month
- **Total**: $195+/month

## 🔒 Security Checklist

### Environment Variables
- [ ] All secrets stored in hosting platform (not in code)
- [ ] Different secrets for production vs development
- [ ] JWT secrets are cryptographically secure
- [ ] Database credentials are rotated regularly

### HTTPS and Domains
- [ ] HTTPS enabled on all services
- [ ] Custom domain configured (optional)
- [ ] CORS properly configured
- [ ] Security headers enabled

### Database Security
- [ ] Supabase RLS policies enabled
- [ ] Service key access restricted
- [ ] Regular backups configured
- [ ] Connection pooling enabled

## 📊 Monitoring and Maintenance

### Health Checks
```bash
# Backend health
curl https://your-backend-url.railway.app/health

# Frontend health
curl https://your-frontend-url.vercel.app

# Database health (via backend)
curl https://your-backend-url.railway.app/api/health/database
```

### Logging
- **Railway**: Built-in logging dashboard
- **Vercel**: Function logs and analytics
- **Supabase**: Database logs and metrics

### Monitoring Tools
- **Uptime**: UptimeRobot, Pingdom
- **Performance**: Vercel Analytics, Railway Metrics
- **Errors**: Sentry, LogRocket
- **Database**: Supabase Dashboard

## 🚀 Deployment Automation

### GitHub Actions (Recommended)
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Railway
        run: |
          npm install -g @railway/cli
          railway up --service backend
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-args: '--prod'
```

### Manual Deployment Scripts
```bash
# deploy.sh
#!/bin/bash
echo "Deploying Tikit to production..."

# Deploy backend
cd apps/backend-fastapi
railway up
echo "✅ Backend deployed"

# Deploy frontend
cd ../frontend
vercel --prod
echo "✅ Frontend deployed"

echo "🎉 Deployment complete!"
```

## 🔄 Database Migration

### Supabase Schema Setup
```sql
-- Run in Supabase SQL Editor
-- Your existing schema from apps/backend/src/scripts/supabase-schema.sql
```

### Data Migration (if needed)
```bash
# If migrating from existing database
python migrate_data.py --source old_db --target supabase
```

## 📱 Mobile App Considerations

### PWA Deployment
- Already configured in your frontend
- Works automatically with Vercel deployment
- Users can install as mobile app

### Native Apps (Future)
- React Native using same backend
- Flutter with FastAPI backend
- Ionic with existing React components

## 🎯 Go-Live Checklist

### Pre-Launch
- [ ] All environment variables configured
- [ ] Database schema deployed
- [ ] CORS settings updated
- [ ] SSL certificates active
- [ ] Health checks passing
- [ ] Performance testing completed

### Launch Day
- [ ] DNS records updated (if custom domain)
- [ ] Monitoring alerts configured
- [ ] Backup procedures tested
- [ ] Team access configured
- [ ] Documentation updated

### Post-Launch
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Verify all features working
- [ ] User feedback collection
- [ ] Scale resources if needed

## 🆘 Troubleshooting

### Common Issues
1. **CORS Errors**: Update backend CORS settings
2. **Environment Variables**: Check all secrets are set
3. **Database Connection**: Verify Supabase credentials
4. **Build Failures**: Check dependency versions
5. **Performance Issues**: Enable caching, optimize queries

### Support Resources
- **Railway**: [docs.railway.app](https://docs.railway.app)
- **Vercel**: [vercel.com/docs](https://vercel.com/docs)
- **Supabase**: [supabase.com/docs](https://supabase.com/docs)

## 🎉 Conclusion

Your Tikit system is now ready for production! The recommended Railway + Vercel + Supabase stack provides:

- **Scalability**: Auto-scaling based on demand
- **Reliability**: 99.9% uptime guarantees
- **Performance**: Global CDN and optimized infrastructure
- **Cost-Effective**: Pay-as-you-scale pricing
- **Developer Experience**: Easy deployments and monitoring

Start with the budget option and scale up as your user base grows!