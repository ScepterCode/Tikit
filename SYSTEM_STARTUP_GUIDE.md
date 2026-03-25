# 🚀 SYSTEM STARTUP GUIDE

## QUICK START - GET RUNNING IN 5 MINUTES

### **Prerequisites Check**
- ✅ Node.js installed (v16+)
- ✅ Python installed (v3.8+)
- ✅ UI Integration complete (88.9% success rate)
- ✅ All components integrated and tested

---

## 🔧 **STEP 1: ENVIRONMENT SETUP**

### **Backend Environment (.env)**
```bash
cd apps/backend-fastapi
```

Ensure your `.env` file contains:
```env
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_ALGORITHM=HS256

# Database
DATABASE_URL=your_supabase_database_url

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
```

### **Frontend Environment (.env)**
```bash
cd apps/frontend
```

Ensure your `.env` file contains:
```env
# Supabase Configuration
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key

# API Configuration
REACT_APP_API_URL=http://localhost:8000
```

---

## 🖥️ **STEP 2: START BACKEND SERVER**

### **Terminal 1 - Backend**
```bash
# Navigate to backend directory
cd apps/backend-fastapi

# Install dependencies (if not already done)
pip install -r requirements.txt

# Start the server
python main_minimal.py
```

### **Expected Output:**
```
🚀 Starting Grooovy Backend Server...
📊 Loading configuration...
🔐 Supabase connection established
📡 Loading API routers...
✅ Server running on http://localhost:8000
📚 API Documentation: http://localhost:8000/docs
```

### **Verify Backend:**
- Open: http://localhost:8000/health
- Should see: `{"status": "healthy", "timestamp": "..."}`

---

## 🌐 **STEP 3: START FRONTEND SERVER**

### **Terminal 2 - Frontend**
```bash
# Navigate to frontend directory
cd apps/frontend

# Install dependencies (if not already done)
npm install

# Start development server
npm run dev
```

### **Expected Output:**
```
> @grooovy/frontend@1.0.0 dev
> vite

  VITE v4.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

### **Verify Frontend:**
- Open: http://localhost:3000
- Should see: Modern login page with Grooovy branding

---

## ✅ **STEP 4: SYSTEM VERIFICATION**

### **Quick Health Check**
Run our integration test:
```bash
python test_browser_integration.py
```

Expected: 80%+ success rate with servers running

### **Manual Verification**
1. **Backend Health**: http://localhost:8000/health
2. **API Documentation**: http://localhost:8000/docs
3. **Frontend App**: http://localhost:3000
4. **Database Connection**: Check backend logs for Supabase connection

---

## 🧪 **STEP 5: TEST USER FLOWS**

### **Authentication Flow**
1. **Register Account**:
   - Go to http://localhost:3000
   - Click "Sign Up"
   - Fill form with test data
   - Verify account creation

2. **Login**:
   - Use registered credentials
   - Should redirect to role-based dashboard

### **Dashboard Testing**
1. **Navigation**:
   - Test sidebar navigation
   - Verify role-based menu items
   - Check user dropdown functionality

2. **Responsive Design**:
   - Resize browser window
   - Test mobile view (< 768px)
   - Verify sidebar overlay on mobile

### **Feature Testing**
1. **Wallet System**:
   - Navigate to Wallet page
   - Verify real balance display
   - Test transaction history

2. **Event Management**:
   - Browse Events page
   - Test event creation (organizers)
   - Verify dynamic event listings

3. **Payment System**:
   - Test ticket purchasing
   - Verify payment methods
   - Check payment processing

---

## 📱 **STEP 6: MOBILE TESTING**

### **Responsive Verification**
1. **Desktop Browser**:
   - Open Developer Tools (F12)
   - Toggle device toolbar
   - Test various screen sizes

2. **Mobile Device**:
   - Connect mobile to same network
   - Open http://[your-ip]:3000
   - Test all user flows

### **Mobile Features to Test**
- ✅ Sidebar overlay with backdrop
- ✅ Touch-friendly navigation
- ✅ Proper viewport scaling
- ✅ Hamburger menu functionality
- ✅ User dropdown on mobile

---

## 🔧 **TROUBLESHOOTING**

### **Common Issues**

#### **Backend Won't Start**
```bash
# Check Python version
python --version  # Should be 3.8+

# Install missing dependencies
pip install -r requirements.txt

# Check environment variables
cat .env  # Verify all required vars are set
```

#### **Frontend Won't Start**
```bash
# Check Node version
node --version  # Should be 16+

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for port conflicts
netstat -an | findstr :3000
```

#### **Database Connection Issues**
1. Verify Supabase URL and keys in `.env`
2. Check Supabase project status
3. Verify network connectivity
4. Check backend logs for specific errors

#### **API Endpoints Not Working**
1. Verify backend server is running on port 8000
2. Check CORS configuration
3. Verify API routes in backend logs
4. Test endpoints directly: http://localhost:8000/docs

---

## 🎯 **SUCCESS CRITERIA**

### **System is Ready When:**
- ✅ Backend server running on http://localhost:8000
- ✅ Frontend server running on http://localhost:3000
- ✅ Health check returns 200 OK
- ✅ Login/registration working
- ✅ Dashboard navigation functional
- ✅ Mobile responsive design working
- ✅ API endpoints responding correctly

### **User Experience Verification**
- ✅ Modern UI with Keldan's improvements
- ✅ Role-based navigation working
- ✅ Responsive design on all devices
- ✅ Real data integration (no mock data)
- ✅ Payment system functional
- ✅ Notification system working

---

## 🚀 **PRODUCTION DEPLOYMENT**

### **When Ready for Production:**
1. **Environment Configuration**:
   - Update API URLs to production
   - Configure production Supabase
   - Set secure JWT secrets

2. **Build Process**:
   ```bash
   # Frontend production build
   cd apps/frontend
   npm run build
   
   # Backend production setup
   cd apps/backend-fastapi
   # Configure production server (Gunicorn, etc.)
   ```

3. **Deployment Options**:
   - **Frontend**: Vercel, Netlify, or static hosting
   - **Backend**: Railway, Render, or cloud providers
   - **Database**: Supabase (already configured)

---

## 📞 **SUPPORT**

### **If You Need Help:**
1. Check the troubleshooting section above
2. Review error logs in terminal output
3. Verify environment variable configuration
4. Test individual components separately

### **System Status Files:**
- `BROWSER_INTEGRATION_TEST_RESULTS.json` - Latest test results
- `UI_INTEGRATION_FINAL_SUMMARY.md` - UI integration status
- `KELDAN_UI_INTEGRATION_STATUS.md` - Detailed integration report

---

**🎉 Your integrated system with Keldan's UI improvements is ready to run!**

*Follow these steps and you'll have a fully functional, modern event management platform running locally in minutes.*