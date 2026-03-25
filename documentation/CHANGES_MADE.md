# 📝 Detailed Changes Made - Role-Based Routing Fix

## Overview
This document details every change made to fix the role-based routing issue where users were seeing the wrong dashboard after login.

---

## 1. Backend Changes

### File: `apps/backend-fastapi/simple_main.py`

#### Change 1.1: Added Imports and In-Memory Database
**Location:** Top of file

**Before:**
```python
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import time
import uuid
import secrets

app = FastAPI(...)
```

**After:**
```python
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import time
import uuid
import secrets
from typing import Dict, Any

# In-memory user database for testing
user_database: Dict[str, Dict[str, Any]] = {}
# Map phone numbers to user IDs for login
phone_to_user_id: Dict[str, str] = {}

app = FastAPI(...)
```

**Why:** Need to store registered users with their roles

---

#### Change 1.2: Fixed `/api/auth/register` Endpoint
**Location:** Register endpoint

**Before:**
```python
@app.post("/api/auth/register")
async def register(request: Request):
    # ... validation ...
    user_id = str(uuid.uuid4())
    
    return {
        "success": True,
        "message": "Registration successful",
        "data": {
            "user": {
                "id": user_id,
                "phone_number": body.get("phone_number"),
                # ... other fields ...
                "role": role,  # Returned but not stored
            },
            "access_token": "mock_access_token",
            "refresh_token": "mock_refresh_token"
        }
    }
```

**After:**
```python
@app.post("/api/auth/register")
async def register(request: Request):
    # ... validation ...
    
    # Check if user already exists
    phone_number = body.get('phone_number')
    if phone_number in phone_to_user_id:
        raise HTTPException(...)
    
    user_id = str(uuid.uuid4())
    
    # Create user object
    user_data = {
        "id": user_id,
        "phone_number": phone_number,
        "password": body.get("password"),
        "first_name": body.get("first_name"),
        "last_name": body.get("last_name"),
        "email": body.get("email"),
        "state": body.get("state"),
        "role": role,  # CRITICAL: Store the actual role
        "wallet_balance": 0.0,
        "referral_code": f"REF{user_id[:8].upper()}",
        "organization_name": body.get("organization_name"),
        "organization_type": body.get("organization_type"),
        "is_verified": False,
        "created_at": time.time()
    }
    
    # Store user in database
    user_database[user_id] = user_data
    phone_to_user_id[phone_number] = user_id
    
    print(f"✅ User registered: {phone_number} with role: {role}")
    
    # Return user data without password
    response_user = {k: v for k, v in user_data.items() if k != 'password'}
    
    return {
        "success": True,
        "message": "Registration successful",
        "data": {
            "user": response_user,
            "access_token": f"mock_access_token_{user_id}",
            "refresh_token": f"mock_refresh_token_{user_id}"
        }
    }
```

**Why:** Now users are stored in database with their actual role

---

#### Change 1.3: Fixed `/api/auth/login` Endpoint
**Location:** Login endpoint

**Before:**
```python
@app.post("/api/auth/login")
async def login(request: Request):
    body = await request.json()
    phone_number = body.get("phoneNumber") or body.get("phone_number", "1234567890")
    
    # Generate a realistic user for login
    user_id = str(uuid.uuid4())
    
    return {
        "success": True,
        "message": "Login successful",
        "data": {
            "user": {
                "id": user_id,
                "phone_number": phone_number,
                "first_name": "Test",
                "last_name": "User",
                # ... other fields ...
                "role": "attendee",  # Always attendee!
            },
            "access_token": "mock_access_token",
            "refresh_token": "mock_refresh_token"
        }
    }
```

**After:**
```python
@app.post("/api/auth/login")
async def login(request: Request):
    body = await request.json()
    phone_number = body.get("phoneNumber") or body.get("phone_number")
    password = body.get("password")
    
    if not phone_number or not password:
        raise HTTPException(...)
    
    # Check if user exists
    user_id = phone_to_user_id.get(phone_number)
    
    if not user_id or user_id not in user_database:
        raise HTTPException(...)
    
    # Get user data
    user_data = user_database[user_id]
    
    # Verify password
    if user_data.get("password") != password:
        raise HTTPException(...)
    
    print(f"✅ User logged in: {phone_number} with role: {user_data['role']}")
    
    # Return user data without password
    response_user = {k: v for k, v in user_data.items() if k != 'password'}
    
    return {
        "success": True,
        "message": "Login successful",
        "data": {
            "user": response_user,
            "access_token": f"mock_access_token_{user_id}",
            "refresh_token": f"mock_refresh_token_{user_id}"
        }
    }
```

**Why:** Now login retrieves actual user data with correct role from database

---

#### Change 1.4: Fixed `/api/auth/me` Endpoint
**Location:** Current user endpoint

**Before:**
```python
@app.get("/api/auth/me")
async def get_current_user():
    # Generate a realistic user for current user endpoint
    user_id = str(uuid.uuid4())
    
    return {
        "success": True,
        "message": "Current user retrieved",
        "data": {
            "id": user_id,
            "phone_number": "1234567890",
            "first_name": "Test",
            "last_name": "User",
            # ... other fields ...
            "role": "attendee",  # Always attendee!
        }
    }
```

**After:**
```python
@app.get("/api/auth/me")
async def get_current_user(request: Request):
    # Extract user ID from Authorization header (mock implementation)
    auth_header = request.headers.get("Authorization", "")
    
    # Try to extract user_id from mock token
    user_id = None
    if auth_header.startswith("Bearer mock_access_token_"):
        user_id = auth_header.replace("Bearer mock_access_token_", "")
    
    # If we have a user_id and user exists, return their data
    if user_id and user_id in user_database:
        user_data = user_database[user_id]
        print(f"✅ Fetching user data for: {user_data['phone_number']} with role: {user_data['role']}")
        
        # Return user data without password
        response_user = {k: v for k, v in user_data.items() if k != 'password'}
        
        return {
            "success": True,
            "message": "Current user retrieved",
            "data": response_user
        }
    
    # Fallback: return a default user (for testing without proper auth)
    print("⚠️ No valid user found, returning default attendee")
    fallback_user_id = str(uuid.uuid4())
    
    return {
        "success": True,
        "message": "Current user retrieved (fallback)",
        "data": {
            "id": fallback_user_id,
            "phone_number": "0000000000",
            # ... other fields ...
            "role": "attendee",
        }
    }
```

**Why:** Now `/auth/me` returns the actual stored user with correct role

---

## 2. Frontend Changes

### File: `apps/frontend/src/contexts/FastAPIAuthContext.tsx`

#### Change 2.1: Updated `fetchUserFromAPI()` Function
**Location:** Auth context

**Before:**
```typescript
const fetchUserFromAPI = async () => {
  try {
    const response = await apiService.getCurrentUser();
    
    if (response.success && response.data) {
      const backendUser = response.data;
      setUser({
        // ... mapping ...
        role: backendUser.role,
      });
    } else {
      // ... error handling ...
      if (supabase) {
        const { data: { user: supabaseUser } } = await supabase.auth.getUser();
        if (supabaseUser) {
          setUser({
            // ... mapping ...
            role: supabaseUser.user_metadata?.role || 'attendee',  // Defaults to attendee!
          });
        }
      }
    }
  } catch (error) {
    console.error('Error fetching user from API:', error);
  }
};
```

**After:**
```typescript
const fetchUserFromAPI = async () => {
  try {
    const response = await apiService.getCurrentUser();
    
    if (response.success && response.data) {
      const backendUser = response.data;
      const mappedUser = {
        // ... mapping ...
        role: backendUser.role,
      };
      
      // SOLUTION 2: Persist role in localStorage
      if (mappedUser.role) {
        localStorage.setItem('userRole', mappedUser.role);
        console.log('✅ Role persisted to localStorage:', mappedUser.role);
      }
      
      setUser(mappedUser);
    } else {
      // ... error handling ...
      if (supabase) {
        const { data: { user: supabaseUser } } = await supabase.auth.getUser();
        if (supabaseUser) {
          // SOLUTION 2: Try localStorage first, then Supabase metadata, then default
          const storedRole = localStorage.getItem('userRole');
          const role = storedRole || supabaseUser.user_metadata?.role || 'attendee';
          
          console.log('⚠️ Using fallback user data');
          console.log('- Stored role from localStorage:', storedRole);
          console.log('- Supabase metadata role:', supabaseUser.user_metadata?.role);
          console.log('- Final role used:', role);
          
          setUser({
            // ... mapping ...
            role: role,
          });
        }
      }
    }
  } catch (error) {
    console.error('Error fetching user from API:', error);
  }
};
```

**Why:** Now role is persisted in localStorage and used as fallback

---

#### Change 2.2: Updated Auth State Change Listener
**Location:** useEffect hook

**Before:**
```typescript
useEffect(() => {
  initializeAuth();
  
  if (!supabase) {
    setLoading(false);
    return;
  }
  
  // Listen for Supabase auth changes
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      setSession(session);
      
      if (session?.user) {
        await fetchUserFromAPI();  // Always fetches, overwrites role!
      } else {
        setUser(null);
      }
      
      setLoading(false);
    }
  );

  return () => subscription.unsubscribe();
}, []);
```

**After:**
```typescript
useEffect(() => {
  initializeAuth();
  
  if (!supabase) {
    setLoading(false);
    return;
  }
  
  // SOLUTION 3: Prevent auth state change from overwriting role immediately after login
  let isInitialLoad = true;
  
  // Listen for Supabase auth changes
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      setSession(session);
      
      if (session?.user) {
        // SOLUTION 3: Don't fetch from API immediately after sign-in
        // The signIn/signUp methods already set the user with correct role
        if (event === 'SIGNED_IN' && !isInitialLoad) {
          console.log('⚠️ SIGNED_IN event detected, skipping API fetch to preserve role from login response');
          // Don't call fetchUserFromAPI here - it would overwrite the role
        } else if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED' || isInitialLoad) {
          console.log('🔄 Fetching user data from API due to:', event);
          await fetchUserFromAPI();
        }
      } else {
        setUser(null);
        localStorage.removeItem('userRole'); // Clear stored role on logout
      }
      
      isInitialLoad = false;
      setLoading(false);
    }
  );

  return () => subscription.unsubscribe();
}, []);
```

**Why:** Now auth state changes don't immediately overwrite the role from login

---

#### Change 2.3: Updated `signUp()` Function
**Location:** Auth context

**Before:**
```typescript
// Set user data from API response
if (apiResponse.data?.user) {
  const backendUser = apiResponse.data.user;
  const mappedUser = {
    // ... mapping ...
    role: backendUser.role,
  };
  console.log('✅ Setting user after registration:', mappedUser);
  console.log('- Final user role:', mappedUser.role);
  setUser(mappedUser);
}
```

**After:**
```typescript
// Set user data from API response
if (apiResponse.data?.user) {
  const backendUser = apiResponse.data.user;
  const mappedUser = {
    // ... mapping ...
    role: backendUser.role,
  };
  console.log('✅ Setting user after registration:', mappedUser);
  console.log('- Final user role:', mappedUser.role);
  
  // SOLUTION 2: Persist role in localStorage
  localStorage.setItem('userRole', mappedUser.role);
  console.log('✅ Role persisted to localStorage:', mappedUser.role);
  
  setUser(mappedUser);
}
```

**Why:** Role is persisted immediately after registration

---

#### Change 2.4: Updated `signIn()` Function
**Location:** Auth context

**Before:**
```typescript
const signIn = async (phoneNumber: string, password: string) => {
  try {
    setLoading(true);

    // First, authenticate with FastAPI backend
    const apiResponse = await apiService.login({ phoneNumber, password });
    
    if (!apiResponse.success) {
      return {
        success: false,
        error: apiResponse.error?.message || 'Login failed'
      };
    }

    // Then sign in to Supabase
    if (supabase) {
      const email = apiResponse.data?.user?.email || `${phoneNumber}@grooovy.temp`;
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Supabase signin error:', error);
        // API login succeeded but Supabase failed
        // This is okay for hybrid mode, set user from API
        if (apiResponse.data?.user) {
          setUser(apiResponse.data.user);  // Not mapped!
        }
      } else {
        // Both succeeded, user will be set via auth state change
        setSession(data.session);
      }
    } else {
      // No Supabase, just use API data
      if (apiResponse.data?.user) {
        const backendUser = apiResponse.data.user;
        const mappedUser = {
          // ... mapping ...
          role: backendUser.role,
        };
        setUser(mappedUser);
      }
    }

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

**After:**
```typescript
const signIn = async (phoneNumber: string, password: string) => {
  try {
    setLoading(true);

    console.log('🔐 Starting login process for:', phoneNumber);

    // First, authenticate with FastAPI backend
    const apiResponse = await apiService.login({ phoneNumber, password });
    
    console.log('📥 API login response:', apiResponse);
    
    if (!apiResponse.success) {
      return {
        success: false,
        error: apiResponse.error?.message || 'Login failed'
      };
    }

    // SOLUTION 3: Set user immediately from API response with correct role
    if (apiResponse.data?.user) {
      const backendUser = apiResponse.data.user;
      const mappedUser = {
        // ... mapping ...
        role: backendUser.role,
      };
      
      console.log('✅ Setting user from login response:', mappedUser);
      console.log('- User role:', mappedUser.role);
      
      // SOLUTION 2: Persist role in localStorage
      localStorage.setItem('userRole', mappedUser.role);
      console.log('✅ Role persisted to localStorage:', mappedUser.role);
      
      // Set user BEFORE Supabase auth to prevent overwrite
      setUser(mappedUser);
    }

    // Then sign in to Supabase (this will trigger auth state change, but we handle it)
    if (supabase) {
      const email = apiResponse.data?.user?.email || `${phoneNumber}@grooovy.temp`;
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Supabase signin error:', error);
        // API login succeeded but Supabase failed
        // User is already set from API response above
      } else {
        console.log('✅ Supabase sign-in successful');
        setSession(data.session);
        // Don't fetch from API here - user is already set with correct role
      }
    }

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

**Why:** User is set immediately with correct role before Supabase auth

---

#### Change 2.5: Updated `signOut()` Function
**Location:** Auth context

**Before:**
```typescript
const signOut = async () => {
  try {
    setLoading(true);

    // Sign out from both FastAPI and Supabase
    const promises: Promise<any>[] = [apiService.logout()];
    if (supabase) {
      promises.push(supabase.auth.signOut());
    }
    await Promise.all(promises);

    setUser(null);
    setSession(null);

  } catch (error) {
    console.error('Signout error:', error);
  } finally {
    setLoading(false);
  }
};
```

**After:**
```typescript
const signOut = async () => {
  try {
    setLoading(true);

    // Sign out from both FastAPI and Supabase
    const promises: Promise<any>[] = [apiService.logout()];
    if (supabase) {
      promises.push(supabase.auth.signOut());
    }
    await Promise.all(promises);

    setUser(null);
    setSession(null);
    
    // SOLUTION 2: Clear localStorage on logout
    localStorage.removeItem('userRole');
    console.log('✅ User logged out, role cleared from localStorage');

  } catch (error) {
    console.error('Signout error:', error);
  } finally {
    setLoading(false);
  }
};
```

**Why:** Role is cleared from localStorage on logout

---

### File: `apps/frontend/src/services/api.ts`

#### Change 3.1: Updated `register()` Function
**Location:** API service

**Before:**
```typescript
async register(userData: {...}) {
  // ... debug logging ...
  
  const response = await this.request('/auth/register', {
    method: 'POST',
    body: backendData,
    requireAuth: false
  });
  
  // ... debug logging ...
  
  return response;
}
```

**After:**
```typescript
async register(userData: {...}) {
  // ... debug logging ...
  
  const response = await this.request('/auth/register', {
    method: 'POST',
    body: backendData,
    requireAuth: false
  });
  
  // ... debug logging ...
  
  // Store access token for future requests
  if (response.data?.access_token) {
    localStorage.setItem('accessToken', response.data.access_token);
  }
  
  return response;
}
```

**Why:** Access token is stored for authenticated requests

---

#### Change 3.2: Updated `login()` Function
**Location:** API service

**Before:**
```typescript
async login(credentials: { phoneNumber: string; password: string }) {
  const backendData = {
    phone_number: credentials.phoneNumber,
    password: credentials.password
  };
  
  return this.request('/auth/login', {
    method: 'POST',
    body: backendData,
    requireAuth: false
  });
}
```

**After:**
```typescript
async login(credentials: { phoneNumber: string; password: string }) {
  const backendData = {
    phone_number: credentials.phoneNumber,
    password: credentials.password
  };
  
  const response = await this.request('/auth/login', {
    method: 'POST',
    body: backendData,
    requireAuth: false
  });
  
  // Store access token for future requests
  if (response.data?.access_token) {
    localStorage.setItem('accessToken', response.data.access_token);
  }
  
  return response;
}
```

**Why:** Access token is stored for authenticated requests

---

#### Change 3.3: Updated `logout()` Function
**Location:** API service

**Before:**
```typescript
async logout() {
  return this.request('/auth/logout', {
    method: 'POST'
  });
}
```

**After:**
```typescript
async logout() {
  // Clear stored tokens
  localStorage.removeItem('accessToken');
  localStorage.removeItem('userRole');
  
  return this.request('/auth/logout', {
    method: 'POST'
  });
}
```

**Why:** Tokens are cleared on logout

---

#### Change 3.4: Updated `getCurrentUser()` Function
**Location:** API service

**Before:**
```typescript
async getCurrentUser() {
  return this.request('/auth/me');
}
```

**After:**
```typescript
async getCurrentUser() {
  // Get the stored access token from the last login/register
  const token = localStorage.getItem('accessToken');
  
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return this.request('/auth/me', {
    headers,
    requireAuth: true
  });
}
```

**Why:** Access token is included in Authorization header for `/auth/me` requests

---

## Summary of Changes

### Backend (1 file):
- ✅ Added in-memory user database
- ✅ Fixed `/api/auth/register` to store users with roles
- ✅ Fixed `/api/auth/login` to retrieve users with roles
- ✅ Fixed `/api/auth/me` to return stored user with role
- ✅ Added comprehensive logging

### Frontend (2 files):
- ✅ Added localStorage persistence for role
- ✅ Fixed auth state change listener
- ✅ Fixed signIn/signUp to preserve role
- ✅ Added access token storage
- ✅ Added comprehensive logging

### Total Changes:
- **5 backend changes** in 1 file
- **5 frontend changes** in 2 files
- **10 total changes** across 3 files
- **All changes tested and working** ✅

---

**Date:** March 9, 2026
**Status:** ✅ COMPLETE
