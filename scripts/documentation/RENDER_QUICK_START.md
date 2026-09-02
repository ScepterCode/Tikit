# 🚀 Render Quick Start Guide

## Prerequisites
- [x] Supabase already hosted
- [ ] GitHub repository with your code
- [ ] Render account (free signup)
- [ ] Vercel account (free signup)

## 5-Minute Deployment

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Ready for Render deployment"
git push origin main
```

### Step 2: Deploy Backend to Render
1. Go to [render.com](https://render.com) → Sign up with GitHub
2. Click **"New +"** → **"Blueprint"**
3. Connect your repository
4. Render detects `apps/backend-fastapi/render.yaml`
5. Set environment variables:
   - `SUPABASE_URL`: `https://your-project.supabase.co`
   - `SUPABASE_SERVICE_KEY`: `your-service-key`
   - `SUPABASE_ANON_KEY`: `your-anon-key`
6. Click **"Apply"** → Wait for deployment
7. Note your backend URL: `https://grooovy-fastapi-backend.onrender.com`

### Step 3: Deploy Frontend to Vercel
```bash
cd apps/frontend
npx vercel
# Follow prompts to link project
npx vercel --prod
```

### Step 4: Configure Frontend Environment
In Vercel dashboard → Settings → Environment Variables:
- `VITE_API_BASE_URL`: `https://grooovy-fastapi-backend.onrender.com`
- `VITE_SUPABASE_URL`: `https://your-project.supabase.co`
- `VITE_SUPABASE_ANON_KEY`: `your-anon-key`

### Step 5: Update CORS & Redeploy
In `apps/backend-fastapi/simple_main.py`, add your Vercel URL to CORS:
```python
allow_origins=[
    "http://localhost:3000",
    "https://your-app.vercel.app",  # Add this
],
```

Push changes:
```bash
git add .
git commit -m "Update CORS for production"
git push origin main
```

## ✅ Verification
- Backend: `https://your-backend.onrender.com/health`
- Frontend: `https://your-app.vercel.app`
- API Test: `https://your-backend.onrender.com/api/test`

## 🎉 You're Live!
Your Grooovy system is now running on:
- **Backend**: Render (FastAPI + Redis)
- **Frontend**: Vercel (React)
- **Database**: Supabase (PostgreSQL)

## Next Steps
1. Set up custom domain (optional)
2. Configure monitoring alerts
3. Test all features end-to-end
4. Set up automated backups

## Need Help?
- 📖 Full guide: `RENDER_DEPLOYMENT_GUIDE.md`
- 🤖 Automated script: `./deploy-render.sh`
- 🆘 Support: Check the troubleshooting section in the full guide