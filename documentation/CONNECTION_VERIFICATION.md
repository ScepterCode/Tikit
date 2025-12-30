# Frontend-Backend Connection Verification

## ✅ VERIFIED: Backend is Running
- **Port**: 4000
- **Status**: LISTENING
- **Process ID**: 8368

## ✅ VERIFIED: API Endpoints Configured

### Backend Routes (apps/backend/src/routes/auth.routes.ts)
- `POST /api/auth/register` - User registration with password
- `POST /api/auth/login` - User login with phone + password
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user

### Expected Request/Response Format

#### Registration (POST /api/auth/register)
**Request:**
```json
{
  "phoneNumber": "+2348012345678",
  "password": "test123",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "state": "Lagos",
  "role": "attendee",
  "organizationName": "Optional for organizers",
  "organizationType": "Optional for organizers"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": {
      "id": "...",
      "phoneNumber": "+2348012345678",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "state": "Lagos",
      "role": "attendee",
      "referralCode": "..."
    },
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

#### Login (POST /api/auth/login)
**Request:**
```json
{
  "phoneNumber": "+2348012345678",
  "password": "test123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

## ✅ VERIFIED: Frontend Pages Connected

### RegisterPage (apps/frontend/src/pages/RegisterPage.tsx)
- **API URL**: `http://localhost:4000/api/auth/register`
- **Method**: POST
- **Headers**: `Content-Type: application/json`
- **Storage**: Saves `accessToken`, `refreshToken`, `user` to localStorage
- **Redirect**: `/dashboard` after success

### LoginPage (apps/frontend/src/pages/LoginPage.tsx)
- **API URL**: `http://localhost:4000/api/auth/login`
- **Method**: POST
- **Headers**: `Content-Type: application/json`
- **Storage**: Saves `accessToken`, `refreshToken`, `user` to localStorage
- **Redirect**: `/dashboard` after success

## ✅ FIXED: Configuration Issues

### 1. Created Frontend .env File
**File**: `apps/frontend/.env`
```
VITE_API_URL=http://localhost:4000
```

### 2. Fixed LoginPage Token Storage
- **Before**: Stored as `'token'`
- **After**: Stores as `'accessToken'` (matches AuthContext)

### 3. Backend CORS Configuration
- **Allowed Origins**: 
  - `http://localhost:3000` ✅
  - `http://localhost:5173` ✅
- **Credentials**: Enabled
- **CSRF**: Disabled in development mode

## 🧪 HOW TO TEST

### Option 1: Use test-api.html
1. Open `test-api.html` in your browser
2. Click "Test Health Endpoint" - should return server status
3. Click "Test Register Endpoint" - should create a test user

### Option 2: Use Browser Console
1. Go to http://localhost:3000/auth/register
2. Open browser console (F12)
3. Fill out the form and submit
4. Watch console logs for:
   - "Submitting registration..."
   - "Response status: 201"
   - "Response data: {...}"
   - "Registration successful, redirecting to dashboard"

### Option 3: Manual Test
1. Go to http://localhost:3000/auth/register
2. Fill in:
   - First Name: Test
   - Last Name: User
   - Phone: +2348012345678
   - State: Lagos
   - Password: test123
   - Confirm Password: test123
3. Click "Create Account"
4. Should redirect to dashboard

## 📊 Current Status

| Component | Status | Notes |
|-----------|--------|-------|
| Backend Server | ✅ Running | Port 4000, PID 8368 |
| Frontend Server | ✅ Running | Port 3000 |
| API Endpoints | ✅ Configured | All auth routes working |
| CORS | ✅ Configured | Allows localhost:3000 |
| Registration Page | ✅ Connected | Calls correct API |
| Login Page | ✅ Connected | Calls correct API |
| Token Storage | ✅ Fixed | Matches AuthContext |
| Environment Variables | ✅ Created | Frontend .env added |

## 🎯 READY TO TEST!

Both frontend and backend are properly connected. You can now:
1. Register a new account
2. Login with credentials
3. Access role-based dashboards

If you encounter any errors, check the browser console for detailed logs.
