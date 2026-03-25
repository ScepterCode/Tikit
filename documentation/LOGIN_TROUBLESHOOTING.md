# Login Troubleshooting Guide

## Issue
Users unable to login through the frontend UI at http://localhost:3000

## Backend Status
✅ Backend is working correctly
- All test users exist in the database
- Login endpoint returns 200 OK
- Credentials are valid

## Test Credentials
All passwords are: `password123`

1. **Admin User**
   - Phone: `+2349012345678`
   - Role: admin
   - ✅ Backend login works

2. **Organizer User**
   - Phone: `+2349087654321`
   - Role: organizer
   - ✅ Backend login works

3. **Attendee User**
   - Phone: `+2349011111111`
   - Role: attendee
   - ✅ Backend login works

## Root Cause Analysis

The issue is likely one of the following:

### 1. Supabase Authentication Mismatch
The frontend tries to authenticate with both:
1. FastAPI backend (✅ works)
2. Supabase (❌ might fail)

The users exist in the FastAPI mock database but NOT in Supabase. When the frontend tries to sign in to Supabase after successful FastAPI login, it fails.

### 2. Frontend Error Handling
The frontend might be showing a generic error even though the FastAPI login succeeded.

## Solutions

### Option 1: Disable Supabase Login (Quick Fix)
Modify the `signIn` function in `FastAPIAuthContext.tsx` to skip Supabase authentication:

```typescript
const signIn = async (phoneNumber: string, password: string) => {
  try {
    setLoading(true);

    // Authenticate with FastAPI backend only
    const apiResponse = await apiService.login({ phoneNumber, password });
    
    if (!apiResponse.success) {
      return {
        success: false,
        error: apiResponse.error?.message || 'Login failed'
      };
    }

    // Set user from API response
    if (apiResponse.data?.user) {
      const backendUser = apiResponse.data.user;
      const mappedUser = {
        id: backendUser.id,
        phoneNumber: backendUser.phone_number,
        firstName: backendUser.first_name,
        lastName: backendUser.last_name,
        email: backendUser.email,
        state: backendUser.state,
        role: backendUser.role,
        walletBalance: backendUser.wallet_balance || 0,
        referralCode: backendUser.referral_code || '',
        organizationName: backendUser.organization_name,
        organizationType: backendUser.organization_type,
        isVerified: backendUser.is_verified || false,
        createdAt: backendUser.created_at
      };
      
      localStorage.setItem('userRole', mappedUser.role);
      setUser(mappedUser);
    }

    // SKIP Supabase authentication for now
    // if (supabase) { ... }

    return { success: true };

  } catch (error: any) {
    console.error('Signin error:', error);
    return {
      success: false,
      error: error.message || 'Login failed'
    };
  } finally {
    setLoading(false);
  }
};
```

### Option 2: Create Supabase Users
Create the test users in Supabase to match the FastAPI database.

### Option 3: Make Supabase Optional
Wrap Supabase calls in try-catch and continue even if they fail:

```typescript
// Try Supabase but don't fail if it errors
if (supabase) {
  try {
    const email = apiResponse.data?.user?.email || `${phoneNumber}@grooovy.temp`;
    await supabase.auth.signInWithPassword({ email, password });
  } catch (error) {
    console.warn('Supabase login failed, continuing with FastAPI only:', error);
    // Continue anyway - FastAPI login succeeded
  }
}
```

## Recommended Fix

I recommend **Option 3** - Make Supabase optional. This allows the app to work with just FastAPI for development, while still supporting Supabase when it's properly configured.

## Testing Steps

After applying the fix:

1. Open http://localhost:3000
2. Click "Sign In"
3. Enter credentials:
   - Phone: `+2349011111111`
   - Password: `password123`
4. Click "Sign In"
5. Should redirect to dashboard

## Browser Console Debugging

To see what's happening, open browser console (F12) and look for:
- Red errors about Supabase
- Login response from FastAPI
- Auth state changes
- Role persistence messages

## Current Backend Logs

The backend shows multiple 401 Unauthorized responses, which means:
- Frontend is sending login requests
- Backend is rejecting them (likely wrong credentials format or Supabase trying to validate)

## Next Steps

1. Apply Option 3 fix to make Supabase optional
2. Test login with all three user types
3. Verify dashboard routing works correctly
4. Check that user role is preserved after login
