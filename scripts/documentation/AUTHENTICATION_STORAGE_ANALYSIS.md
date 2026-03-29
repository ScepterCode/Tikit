# Authentication & User Storage - Deep Analysis

## Date: March 27, 2026
## Status: 🚨 CRITICAL ISSUES FOUND

---

## 🔍 INVESTIGATION RESULTS

### Current State:
- **Supabase Auth Users**: 16 users registered
- **Supabase 'users' Table**: Only 2 users
- **Discrepancy**: 14 users missing from database!

### Users in Supabase Auth (16 total):
1. destinoboss@gmail.com ✅ (in users table)
2. dpkreativ@gmail.com ❌ (missing from users table)
3. sc@gmail.com ❌ (missing from users table)
4. attendee@grooovy.netlify.app ❌ (missing from users table)
5. organizer@grooovy.netlify.app ❌ (missing from users table)
6. admin@grooovy.netlify.app ❌ (missing from users table)
7. keldan40k@gmail.com ❌ (missing from users table)
8. emmanuelonyekachi04122000@gmail.com ❌ (missing from users table)
9. scepterboss111@gmail.com ❌ (missing from users table)
10. onyewuchidaniel6@gmail.com ❌ (missing from users table)
11. suolise234@gmail.com ❌ (missing from users table)
12. suolise@gmail.com ❌ (missing from users table)
13. papilojojo@gmail.com ❌ (missing from users table)
14. papilo@gmail.com ❌ (missing from users table)
15. trylonofficial@gmail.com ❌ (missing from users table)
16. scepterboss@gmail.com ✅ (in users table)

---

## 🚨 ROOT CAUSE ANALYSIS

### Problem 1: Dual Registration System (Broken)

Your app has TWO registration systems running simultaneously:

#### System A: FastAPI Backend Registration (`simple_main.py`)
```python
@app.post("/api/auth/register")
async def register(request: Request):
    # Creates user in IN-MEMORY dictionary
    user_database[user_id] = user_data  # ❌ NOT SAVED TO SUPABASE
    phone_to_user_id[phone_number] = user_id
```

**Issues**:
- Stores users in `user_database` (in-memory dictionary)
- Data is LOST when server restarts
- Does NOT save to Supabase database
- Only exists in RAM

#### System B: Supabase Auth (`FastAPIAuthContext.tsx`)
```typescript
const { error } = await supabase.auth.signUp({
  email: userData.email,
  password: userData.password,
  // ... metadata
});
```

**Issues**:
- Creates user in Supabase Auth (authentication system)
- Does NOT create user in Supabase 'users' table (database)
- User can authenticate but has no profile data

### Problem 2: Missing Database Trigger

**What Should Happen**:
When a user signs up via Supabase Auth, a database trigger should automatically create a corresponding row in the 'users' table.

**What's Actually Happening**:
No trigger exists, so users are created in Auth but NOT in the database.

### Problem 3: Wallet Balance Storage

**Current Flow**:
1. User registers → Supabase Auth (authentication)
2. User NOT created in 'users' table
3. User makes payment → Backend tries to update wallet_balance
4. Backend queries: `SELECT wallet_balance FROM users WHERE id = user_id`
5. **FAILS**: User doesn't exist in 'users' table!

---

## 🎯 THE IDEAL, SAFE WAY IT SHOULD WORK

### Option 1: Supabase-First (Recommended)

This is the standard, secure way to use Supabase:

```
1. Frontend calls Supabase Auth signUp()
   ↓
2. Supabase Auth creates user
   ↓
3. Database trigger automatically creates row in 'users' table
   ↓
4. User profile exists in database
   ↓
5. All operations (wallet, payments, etc.) work correctly
```

**Implementation**:
1. Create a Supabase database trigger
2. Remove backend `/api/auth/register` endpoint
3. Use Supabase Auth exclusively

### Option 2: Backend-First (Alternative)

Use your FastAPI backend as the source of truth:

```
1. Frontend calls /api/auth/register
   ↓
2. Backend creates user in Supabase 'users' table
   ↓
3. Backend creates Supabase Auth user
   ↓
4. Both systems synchronized
```

**Implementation**:
1. Update `/api/auth/register` to save to Supabase database
2. Keep Supabase Auth creation as secondary step

---

## 🔧 RECOMMENDED SOLUTION: Supabase Database Trigger

### Step 1: Create Database Trigger

Run this SQL in Supabase SQL Editor:

```sql
-- Function to create user profile when auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    phone,
    first_name,
    last_name,
    wallet_balance,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.phone,
    COALESCE(NEW.raw_user_meta_data->>'firstName', ''),
    COALESCE(NEW.raw_user_meta_data->>'lastName', ''),
    0.00,
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call function when new auth user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

### Step 2: Backfill Missing Users

Run this SQL to create profiles for existing auth users:

```sql
-- Create profiles for existing auth users who don't have profiles
INSERT INTO public.users (
  id,
  email,
  phone,
  first_name,
  last_name,
  wallet_balance,
  created_at,
  updated_at
)
SELECT 
  au.id,
  au.email,
  au.phone,
  COALESCE(au.raw_user_meta_data->>'firstName', ''),
  COALESCE(au.raw_user_meta_data->>'lastName', ''),
  0.00,
  au.created_at,
  NOW()
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE u.id IS NULL;
```

### Step 3: Update Backend Registration

Remove or update the backend registration endpoint to use Supabase:

```python
@app.post("/api/auth/register")
async def register(request: Request):
    """
    Register user via Supabase Auth
    The database trigger will automatically create the user profile
    """
    try:
        body = await request.json()
        
        # Use Supabase Admin API to create user
        from database import supabase_client
        supabase = supabase_client.get_service_client()
        
        # Create auth user (trigger will create profile)
        auth_response = supabase.auth.admin.create_user({
            "email": body.get("email"),
            "password": body.get("password"),
            "phone": body.get("phone_number"),
            "user_metadata": {
                "first_name": body.get("first_name"),
                "last_name": body.get("last_name"),
                "state": body.get("state"),
                "role": body.get("role", "attendee"),
                "organization_name": body.get("organization_name"),
                "organization_type": body.get("organization_type")
            },
            "email_confirm": True  # Auto-confirm for development
        })
        
        if auth_response.user:
            return {
                "success": True,
                "message": "Registration successful",
                "data": {
                    "user": {
                        "id": auth_response.user.id,
                        "email": auth_response.user.email,
                        # ... other fields
                    }
                }
            }
        else:
            raise HTTPException(status_code=400, detail="Registration failed")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

---

## 🚨 IMMEDIATE IMPACT ON YOUR SYSTEM

### Current Problems:

1. **Wallet Payments Fail**:
   - User makes payment
   - Backend tries to update wallet_balance
   - User doesn't exist in 'users' table
   - Payment succeeds but balance not updated

2. **User Data Missing**:
   - 14 users can authenticate
   - But have no profile data
   - No wallet balance
   - No transaction history

3. **Data Inconsistency**:
   - Auth system says user exists
   - Database says user doesn't exist
   - System in inconsistent state

### Why Only 2 Users Exist:

The 2 users in your 'users' table were likely:
1. Created manually via SQL
2. Created before the current registration system
3. Created through a different registration flow

---

## 📋 ACTION PLAN

### Immediate (Do Now):

1. **Create Database Trigger** (see SQL above)
   - This ensures future registrations work correctly

2. **Backfill Missing Users** (see SQL above)
   - This fixes existing users

3. **Test Registration**:
   - Register a new user
   - Verify user appears in both Auth and 'users' table
   - Verify wallet_balance column exists and is set to 0

### Short-term (Next):

1. **Update Backend Registration**:
   - Make it use Supabase database
   - Remove in-memory storage

2. **Test Wallet Payments**:
   - Login as existing user
   - Make payment
   - Verify balance updates

### Long-term (Future):

1. **Remove Dual System**:
   - Choose either Supabase-first or Backend-first
   - Remove the other system
   - Simplify authentication flow

2. **Add Data Validation**:
   - Ensure users always exist in both systems
   - Add health checks
   - Monitor for inconsistencies

---

## 🎯 EXPECTED RESULTS AFTER FIX

### After Creating Trigger:
- ✅ New registrations create user in both Auth and 'users' table
- ✅ Wallet balance initialized to 0
- ✅ All user data properly stored

### After Backfilling:
- ✅ All 16 auth users have profiles in 'users' table
- ✅ Existing users can make payments
- ✅ Wallet balances work correctly

### After Backend Update:
- ✅ Single source of truth
- ✅ No data inconsistencies
- ✅ Reliable user management

---

## 🔍 VERIFICATION COMMANDS

### Check if trigger exists:
```sql
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
```

### Count users in both systems:
```sql
-- Auth users
SELECT COUNT(*) as auth_users FROM auth.users;

-- Database users
SELECT COUNT(*) as db_users FROM public.users;

-- Should be equal after fix
```

### Find missing users:
```sql
SELECT au.email, au.created_at
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE u.id IS NULL;
```

---

## 📊 SUMMARY

**Current State**: BROKEN
- 16 users in Auth
- 2 users in database
- 14 users missing
- Wallet payments fail for most users

**Root Cause**: No database trigger + Dual registration system

**Solution**: Create trigger + Backfill users + Update backend

**Priority**: 🔴 CRITICAL - Affects all user operations

**Estimated Fix Time**: 15 minutes (run 2 SQL scripts)

---

## 🚀 NEXT STEPS

1. Run the trigger creation SQL
2. Run the backfill SQL
3. Verify all 16 users now exist in 'users' table
4. Test wallet payment with existing user
5. Test new registration
6. Update backend registration endpoint (optional but recommended)
