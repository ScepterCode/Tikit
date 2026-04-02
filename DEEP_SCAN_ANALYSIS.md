# Deep Scan Analysis - Root Cause Found 🔍

## CRITICAL ISSUE IDENTIFIED

The authentication system has a **fatal flaw** in how it handles Supabase JWT tokens.

### The Problem

**File**: `apps/backend-fastapi/services/auth_service.py`  
**Method**: `verify_token()` (lines 47-90)  
**Issue**: Database lookup failure causes role to default to "attendee"

### The Broken Flow

```python
# Line 60: Decode Supabase token without verification
unverified_payload = jose_jwt.decode(token, options={"verify_signature": False})

# Line 63-76: Try to get user from database
user_data = self.supabase.table('users').select('*').eq('id', user_id).execute()
if user_data.data:
    user = user_data.data[0]
    return {
        "user_id": user["id"],
        "phone_number": user.get("phone_number", ""),
        "role": user.get("role", "attendee"),  # ✅ Gets real role
        "state": user.get("state", "active")
    }

# Line 77-84: If database lookup fails, return default
return {
    "user_id": user_id,
    "phone_number": unverified_payload.get("phone", ""),
    "role": "attendee",  # ❌ ALWAYS DEFAULTS TO ATTENDEE
    "state": "active"
}
```

### Why This Breaks Everything

1. **Organizer tries to edit event**:
   - Token is valid Supabase JWT
   - Database lookup succeeds → role = "organizer" ✅
   - BUT: User ID from Supabase doesn't match `host_id` in events table
   - Result: 403 Forbidden (correct behavior, wrong event)

2. **Attendee tries to view event**:
   - Token is valid Supabase JWT  
   - Endpoint uses `get_current_user_optional` (should allow no auth)
   - BUT: HTTPBearer still tries to validate token
   - If validation fails → returns None
   - Result: 403 Forbidden (should be 200 OK)

### Additional Issues Found

#### Issue 1: Database User ID Mismatch
- Supabase Auth creates users with UUID in `auth.users` table
- App creates users with UUID in `public.users` table
- These UUIDs are DIFFERENT
- Token contains Supabase Auth UUID
- Events table has `host_id` pointing to `public.users` UUID
- **They never match!**

#### Issue 2: No JWT Signature Verification
```python
# Line 60 - SECURITY RISK
unverified_payload = jose_jwt.decode(token, options={"verify_signature": False})
```
This accepts ANY token, even forged ones!

#### Issue 3: HTTPBearer Auto-Error
```python
# middleware/auth.py line 14
security = HTTPBearer()  # auto_error=True by default

# Line 52
async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))
)
```
Creates a NEW HTTPBearer instance each time, but the global `security` is still used elsewhere.

#### Issue 4: Frontend Port Confusion
- Some components call `http://localhost:8000` (simple_main.py)
- Some components call `http://localhost:8001` (main.py)
- EventDetail.tsx calls port 8001 but without auth
- TicketTierManager calls port 8001 with auth

### The Real Architecture Problem

The system is trying to use **TWO authentication systems simultaneously**:

1. **Supabase Auth** (frontend):
   - Users sign up via Supabase
   - Get Supabase JWT tokens
   - Tokens contain Supabase user ID

2. **Custom Auth** (backend):
   - Backend expects custom JWT tokens
   - Or tries to validate Supabase tokens
   - But can't properly link Supabase users to app users

### Why Database Lookup Fails

When a user signs up via Supabase:
1. Supabase creates user in `auth.users` with UUID `abc-123`
2. Frontend stores this in `public.users` with SAME UUID `abc-123` ✅
3. User creates event → `host_id` = `abc-123` ✅
4. User tries to edit event:
   - Token contains `sub: abc-123`
   - Backend looks up `users.id = abc-123`
   - Finds user ✅
   - Gets role = "organizer" ✅
   - Checks `event.host_id == current_user.user_id`
   - `abc-123 == abc-123` ✅
   - **Should work!**

But it doesn't work because:
- Database lookup is FAILING silently
- Exception is caught and ignored (line 77)
- Returns default role "attendee"
- Organizer check fails

### The Silent Failure

```python
try:
    user_data = self.supabase.table('users').select('*').eq('id', user_id).execute()
    if user_data.data:
        # This works
        return user_data
except Exception as db_error:
    logger.debug(f"Database lookup failed: {db_error}")  # ❌ Only DEBUG level
    # Falls through to default return
```

The exception is logged at DEBUG level, so it's invisible in production!

## The Complete Fix Required

### 1. Fix verify_token() Method
- Add proper error handling
- Log failures at ERROR level
- Don't return default role on failure
- Validate JWT signature properly

### 2. Fix Database Connection
- Ensure Supabase client is properly initialized
- Check if `get_service_client()` returns valid client
- Verify database permissions

### 3. Fix HTTPBearer Usage
- Use single HTTPBearer instance
- Ensure `auto_error=False` for optional auth

### 4. Fix Frontend API Calls
- Standardize on single backend port
- Ensure all authenticated calls use `authenticatedFetch()`
- Ensure public calls use plain `fetch()`

### 5. Add Proper Logging
- Log all authentication attempts
- Log database lookup results
- Log token validation steps
- Make debugging possible

## Files That Need Changes

1. `apps/backend-fastapi/services/auth_service.py` - Fix verify_token()
2. `apps/backend-fastapi/middleware/auth.py` - Fix HTTPBearer usage
3. `apps/backend-fastapi/database/supabase_client.py` - Verify client init
4. `apps/frontend/src/pages/EventDetail.tsx` - Fix API calls
5. `apps/frontend/src/components/organizer/TicketTierManager.tsx` - Verify auth

## Next Steps

1. Fix the verify_token() method to properly handle errors
2. Add comprehensive logging
3. Test database connectivity
4. Verify Supabase client initialization
5. Test with real user tokens
