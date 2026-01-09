# 🚀 Tikit Production Deployment Guide

## Current Status: Frontend Deployed, Backend Connection Needed

The Tikit frontend has been successfully deployed to Vercel, but it's currently trying to connect to `localhost:4000` instead of a production backend. Here's how to complete the production deployment.

## 🔧 Issues Fixed

### ✅ 1. PWA Icons Created
- Added missing `pwa-192x192.png` and other PWA icons
- Fixed PWA manifest warnings

### ✅ 2. Deprecated Meta Tag Fixed
- Replaced `apple-mobile-web-app-capable` with `mobile-web-app-capable`
- Maintained iOS compatibility

### ✅ 3. Production Environment Configuration
- Created `.env.production` with production-ready settings
- Configured API URL for backend connection

## 🎯 Next Steps to Complete Deployment

### Step 1: Deploy Backend to Render

The backend is configured for Render deployment. To deploy:

1. **Push to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Production deployment configuration"
   git push origin main
   ```

2. **Deploy on Render**:
   - Go to [render.com](https://render.com)
   - Connect your GitHub repository
   - Select the `apps/backend` directory
   - Use the `render.yaml` configuration
   - Set environment variables from `apps/backend/.env.production.example`

3. **Get Backend URL**:
   - After deployment, you'll get a URL like: `https://tikit-backend.onrender.com`

### Step 2: Update Frontend Environment Variables

Once you have the backend URL, update the Vercel environment variables:

1. **Go to Vercel Dashboard**:
   - Open your Tikit project on Vercel
   - Go to Settings → Environment Variables

2. **Add Production Variables**:
   ```
   VITE_API_URL=https://tikit-backend.onrender.com
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   VITE_PAYSTACK_PUBLIC_KEY=pk_live_your_paystack_public_key_here
   VITE_FLUTTERWAVE_PUBLIC_KEY=FLWPUBK-your_flutterwave_public_key_here
   ```

3. **Redeploy Frontend**:
   - Trigger a new deployment on Vercel
   - Or push a new commit to trigger auto-deployment

### Step 3: Configure Database & Services

1. **Database Setup**:
   - Render will create a PostgreSQL database
   - Run migrations: `npm run db:migrate`
   - Seed initial data: `npm run db:seed`

2. **Redis Setup**:
   - Render will create a Redis instance
   - Configure caching and sessions

3. **Supabase Setup**:
   - Create a Supabase project
   - Run the SQL scripts in `apps/backend/src/scripts/`
   - Update environment variables

## 🌐 Expected Production URLs

After complete deployment:

- **Frontend**: `https://tikit-ik4l.vercel.app` (already deployed)
- **Backend**: `https://tikit-backend.onrender.com` (to be deployed)
- **API Endpoints**: `https://tikit-backend.onrender.com/api/*`

## 🔍 Testing Production Deployment

Once both frontend and backend are deployed:

1. **Test Authentication**:
   - Visit the deployed frontend URL
   - Try to register a new account
   - Try to login

2. **Test Core Features**:
   - Create an event (organizer dashboard)
   - Purchase tickets (attendee dashboard)
   - Test offline functionality

3. **Test Real-time Features**:
   - Spray money leaderboard
   - Group buy functionality
   - Live event updates

## 🚨 Current Error Resolution

The error you're seeing:
```
localhost:4000/api/auth/register:1 Failed to load resource: net::ERR_CONNECTION_REFUSED
```

Will be resolved once you:
1. Deploy the backend to Render
2. Update `VITE_API_URL` in Vercel environment variables
3. Redeploy the frontend

## 📋 Environment Variables Checklist

### Backend (Render):
- [ ] `DATABASE_URL` - PostgreSQL connection
- [ ] `REDIS_URL` - Redis connection
- [ ] `JWT_SECRET` - Authentication secret
- [ ] `SUPABASE_URL` - Supabase project URL
- [ ] `SUPABASE_SERVICE_KEY` - Supabase service key
- [ ] `PAYSTACK_SECRET_KEY` - Payment processing
- [ ] `FLUTTERWAVE_SECRET_KEY` - Payment processing
- [ ] `CORS_ORIGIN` - Frontend URL for CORS

### Frontend (Vercel):
- [ ] `VITE_API_URL` - Backend URL
- [ ] `VITE_SUPABASE_URL` - Supabase project URL
- [ ] `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- [ ] `VITE_PAYSTACK_PUBLIC_KEY` - Payment processing
- [ ] `VITE_FLUTTERWAVE_PUBLIC_KEY` - Payment processing

## 🎉 Success Indicators

You'll know the deployment is successful when:

- ✅ No more `localhost:4000` connection errors
- ✅ User registration and login work
- ✅ Dashboard loads with real data
- ✅ Payment integration functions
- ✅ Real-time features update properly
- ✅ PWA installation works without icon errors

## 🆘 Need Help?

If you encounter issues:

1. **Check Render Logs**: Monitor backend deployment logs
2. **Check Vercel Logs**: Monitor frontend build and runtime logs
3. **Check Browser Console**: Look for API connection errors
4. **Test API Directly**: Visit `https://your-backend-url.onrender.com/health`

The application is production-ready and just needs the backend deployment to complete the setup!