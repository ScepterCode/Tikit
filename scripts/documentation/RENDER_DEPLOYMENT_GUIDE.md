# 🚀 Render + Vercel Deployment Guide

## Overview
Complete guide for deploying your Grooovy system using Render for the FastAPI backend and Vercel for the React frontend.

## 🏗️ Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend │    │  FastAPI Backend │    │    Supabase     │
│   (Vercel)      │────│   (Render)      │────│   (Hosted)      │
│   Port: 3000    │    │   Port: 8000    │    │   PostgreSQL    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         │              │     Redis       │              │
         └──────────────│   (Render)      │──────────────┘
                        │   Caching       │
                        └─────────────────┘
```

## 💰 Cost Breakdown (Monthly)
- **Render Starter**: $7/month (backend)
- **Render Redis**: $7/month (caching)
- **Vercel Pro**: $20/month (frontend)
- **Supabase**: Already hosted
- **Total**: ~$34/month

## 🚀 Quick Deployment

### Option 1: Automated Script
```bash
# Run the deployment script
./deploy-render.sh
```

### Option 2: Manual Deployment
Follow the step-by-step guide below.

## 📋 Step-by-Step Manual Deployment

### Phase 1: Prepare Your Code

#### 1.1 Ensure Code is in GitHub
```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit for Render deployment"

# Push to GitHub
git remote add origin https://github.com/yourusername/grooovy.git
git push -u origin main
```

#### 1.2 Verify Backend Files
Ensure these files exist in `apps/backend-fastapi/`:
- ✅ `render.yaml` - Render configuration
- ✅ `requirements.txt` - Python dependencies
- ✅ `simple_main.py` - FastAPI application
- ✅ `Dockerfile` - Container configuration (optional)

### Phase 2: Deploy Backend to Render

#### 2.1 Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Connect your GitHub account

#### 2.2 Deploy Using Blueprint
1. Click **"New +"** → **"Blueprint"**
2. Connect your GitHub repository
3. Render will detect `render.yaml` automatically
4. Click **"Apply"** to start deployment

#### 2.3 Set Environment Variables
In Render dashboard, set these environment variables:

**Required Variables:**
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key-here
SUPABASE_ANON_KEY=your-anon-key-here
```

**Auto-generated (Render will create):**
- `JWT_SECRET` - Auto-generated secure key
- `JWT_REFRESH_SECRET` - Auto-generated secure key
- `REDIS_URL` - Auto-connected to Redis service

#### 2.4 Get Backend URL
After deployment, note your backend URL:
```
https://grooovy-fastapi-backend.onrender.com
```

### Phase 3: Deploy Frontend to Vercel

#### 3.1 Install Vercel CLI
```bash
npm install -g vercel
```

#### 3.2 Deploy Frontend
```bash
cd apps/frontend
vercel login
vercel
# Follow prompts to link project
vercel --prod
```

#### 3.3 Set Environment Variables
In Vercel dashboard or CLI:
```bash
vercel env add VITE_API_BASE_URL production
# Enter: https://grooovy-fastapi-backend.onrender.com

vercel env add VITE_SUPABASE_URL production
# Enter: https://your-project.supabase.co

vercel env add VITE_SUPABASE_ANON_KEY production
# Enter: your-supabase-anon-key
```

### Phase 4: Configure CORS

#### 4.1 Update Backend CORS
In `apps/backend-fastapi/simple_main.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://your-frontend.vercel.app",  # Add your Vercel URL
        "https://your-custom-domain.com"    # Add custom domain if any
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"]
)
```

#### 4.2 Redeploy Backend
```bash
git add .
git commit -m "Update CORS settings"
git push origin main
# Render will auto-deploy
```

## 🔧 Advanced Configuration

### Custom Domain Setup

#### For Backend (Render)
1. Go to Render dashboard → Your service → Settings
2. Add custom domain: `api.yourdomain.com`
3. Update DNS records as instructed
4. SSL is automatic

#### For Frontend (Vercel)
1. Go to Vercel dashboard → Your project → Settings → Domains
2. Add custom domain: `yourdomain.com`
3. Update DNS records as instructed
4. SSL is automatic

### Environment-Specific Configurations

#### Production Environment Variables
```env
# Backend (Render)
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=INFO
CORS_ORIGINS=https://yourdomain.com,https://your-app.vercel.app

# Frontend (Vercel)
VITE_ENVIRONMENT=production
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Scaling Configuration

#### Backend Scaling (Render)
```yaml
# In render.yaml
services:
  - type: web
    name: grooovy-fastapi-backend
    plan: standard  # Upgrade from starter
    numInstances: 2  # Multiple instances
    autoDeploy: true
    healthCheckPath: /health
```

#### Redis Configuration
```yaml
# In render.yaml
  - type: redis
    name: grooovy-redis
    plan: standard  # Upgrade for more memory
    maxmemoryPolicy: allkeys-lru
```

## 🔄 Automated Deployments

### GitHub Actions Setup
The deployment script creates `.github/workflows/deploy-render.yml` for automatic deployments.

#### Required GitHub Secrets
Add these in GitHub repository settings → Secrets:
```
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-org-id
VERCEL_PROJECT_ID=your-project-id
VITE_API_BASE_URL=https://your-backend.onrender.com
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Deployment Triggers
- **Backend**: Auto-deploys on every push to `main` branch
- **Frontend**: Deploys via GitHub Actions on push to `main`

## 📊 Monitoring & Maintenance

### Health Checks
```bash
# Backend health
curl https://your-backend.onrender.com/health

# Frontend health
curl https://your-frontend.vercel.app

# API test
curl https://your-backend.onrender.com/api/test
```

### Render Dashboard Features
- **Logs**: Real-time application logs
- **Metrics**: CPU, memory, response times
- **Deployments**: Deployment history and rollbacks
- **Environment**: Environment variable management

### Vercel Dashboard Features
- **Analytics**: Page views, performance metrics
- **Functions**: Serverless function logs
- **Deployments**: Preview deployments and rollbacks
- **Domains**: Custom domain management

## 🔒 Security Best Practices

### Environment Variables
- ✅ All secrets stored in platform dashboards
- ✅ Different secrets for production vs development
- ✅ JWT secrets are auto-generated and secure
- ✅ Database credentials are encrypted

### HTTPS & Security Headers
- ✅ HTTPS enforced on both platforms
- ✅ Security headers configured in Vercel
- ✅ CORS properly configured
- ✅ Rate limiting enabled in backend

### Database Security
- ✅ Supabase RLS policies enabled
- ✅ Service key access restricted
- ✅ Connection pooling configured
- ✅ Regular backups via Supabase

## 🚨 Troubleshooting

### Common Issues

#### Backend Issues
1. **Build Failures**
   ```bash
   # Check requirements.txt
   pip install -r requirements.txt
   
   # Test locally
   uvicorn simple_main:app --reload
   ```

2. **Environment Variable Issues**
   - Verify all required variables are set in Render dashboard
   - Check for typos in variable names
   - Ensure Supabase credentials are correct

3. **CORS Errors**
   - Update `allow_origins` in `simple_main.py`
   - Redeploy backend after changes
   - Check frontend URL is correct

#### Frontend Issues
1. **Build Failures**
   ```bash
   # Check dependencies
   cd apps/frontend
   npm install
   npm run build
   ```

2. **API Connection Issues**
   - Verify `VITE_API_BASE_URL` is correct
   - Check backend is running and accessible
   - Test API endpoints directly

3. **Environment Variables**
   - Ensure all `VITE_*` variables are set in Vercel
   - Redeploy after adding variables

### Performance Optimization

#### Backend Optimization
- Enable Redis caching
- Use connection pooling
- Optimize database queries
- Enable gzip compression

#### Frontend Optimization
- Enable Vercel Analytics
- Optimize images and assets
- Use code splitting
- Enable service worker caching

## 📈 Scaling Considerations

### Traffic Growth
- **Low Traffic** (< 1K users): Starter plans sufficient
- **Medium Traffic** (1K-10K users): Upgrade to Standard plans
- **High Traffic** (10K+ users): Consider Pro plans + CDN

### Database Scaling
- Monitor Supabase usage
- Optimize queries and indexes
- Consider read replicas for high read loads
- Implement proper caching strategies

## 🎯 Go-Live Checklist

### Pre-Launch
- [ ] Backend deployed and healthy
- [ ] Frontend deployed and accessible
- [ ] All environment variables configured
- [ ] CORS settings updated
- [ ] Custom domains configured (optional)
- [ ] SSL certificates active
- [ ] Database schema deployed
- [ ] Health checks passing

### Launch Day
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Verify all features working
- [ ] Test user registration/login
- [ ] Confirm payment processing
- [ ] Monitor server resources

### Post-Launch
- [ ] Set up monitoring alerts
- [ ] Configure backup procedures
- [ ] Document deployment process
- [ ] Train team on platform dashboards
- [ ] Plan scaling strategy

## 🆘 Support Resources

- **Render Support**: [render.com/docs](https://render.com/docs)
- **Vercel Support**: [vercel.com/docs](https://vercel.com/docs)
- **Supabase Support**: [supabase.com/docs](https://supabase.com/docs)
- **FastAPI Docs**: [fastapi.tiangolo.com](https://fastapi.tiangolo.com)

## 🎉 Conclusion

Your Grooovy system is now deployed on a robust, scalable infrastructure:

- **Render**: Excellent Python support, automatic deployments, built-in Redis
- **Vercel**: Optimized for React, global CDN, automatic HTTPS
- **Supabase**: Managed PostgreSQL, real-time features, authentication

This stack provides:
- 99.9% uptime guarantees
- Automatic scaling
- Global performance
- Developer-friendly dashboards
- Cost-effective pricing

Start with the Starter plans and scale up as your user base grows!