# User Roles & Row Level Security (RLS) - Complete Guide

## 🚨 CRITICAL SECURITY ISSUE IDENTIFIED

You're absolutely right! Your users table is missing:
1. **Role column** - No way to distinguish admin/organizer/attendee
2. **RLS (Row Level Security)** - Anyone can access anyone's data
3. **Other important columns** - organization_name, state, is_verified, etc.

This is a **critical security vulnerability** in production!

---

## 🎯 WHAT WE'RE FIXING

### Current State (INSECURE):
```
users table:
- id
- email
- phone
- first_name
- last_name
- wallet_balance
- created_at
- updated_at

❌ No role column
❌ No RLS enabled
❌ Anyone can read/write any user's data
❌ No access control
```

### Target State (SECURE):
```
users table:
- id
- email
- phone
- first_name
- last_name
- role (admin/organizer/attendee) ✅
- organization_name
- organization_type
- state
- wallet_balance
- is_verified
- referral_code
- created_at
- updated_at

✅ RLS enabled
✅ Users can only see their own data
✅ Admins can see all data
✅ Backend can update wallet balances
✅ Proper access control
```

---

## 📋 STEP-BY-STEP FIX

### Step 1: Run the Setup Script

1. Go to Supabase Dashboard → SQL Editor
2. Click "New Query"
3. Open file: `setup_proper_users_table.sql`
4. Copy ALL the SQL
5. Paste into SQL Editor
6. Click "Run"

**What this does**:
- Adds `role` column with constraint (admin/organizer/attendee)
- Adds `organization_name`, `organization_type`, `state`, `is_verified`, `referral_code`
- Updates existing users with roles from auth metadata
- Updates trigger to include all fields
- Enables RLS
- Creates 5 security policies

---

## 🔐 ROW LEVEL SECURITY (RLS) EXPLAINED

### What is RLS?

RLS is Supabase's way of controlling who can access what data at the database level.

**Without RLS** (your current state):
```javascript
// Frontend can do this:
const { data } = await supabase
  .from('users')
  .select('*')  // Gets ALL users! 😱

// Anyone can see everyone's wallet balance, email, etc.
```

**With RLS** (after fix):
```javascript
// Frontend can do this:
const { data } = await supabase
  .from('users')
  .select('*')  // Only gets YOUR data ✅

// Users can only see their own profile
// Admins can see all profiles
// Backend (service_role) can do anything
```

---

## 🛡️ SECURITY POLICIES CREATED

### Policy 1: Users Can View Own Profile
```sql
Users can SELECT their own row only
auth.uid() = id
```
**Example**: User A can see User A's data, but not User B's data

### Policy 2: Users Can Update Own Profile
```sql
Users can UPDATE their own row
BUT cannot change their role or wallet_balance
```
**Example**: User can update their name, but not make themselves admin

### Policy 3: Admins Can View All Users
```sql
If user.role = 'admin'
  Then can SELECT all users
```
**Example**: Admin dashboard can list all users

### Policy 4: Admins Can Update All Users
```sql
If user.role = 'admin'
  Then can UPDATE any user
```
**Example**: Admin can change user roles, verify users, etc.

### Policy 5: Service Role Can Do Anything
```sql
If JWT role = 'service_role'
  Then can do anything
```
**Example**: Backend can update wallet balances using service_role key

---

## 🎭 USER ROLES EXPLAINED

### Role: attendee (Default)
- Regular users who attend events
- Can buy tickets
- Can use wallet
- Can view own profile only

### Role: organizer
- Can create events
- Can sell tickets
- Can manage their events
- Has organization_name and organization_type
- Can view own profile + their event data

### Role: admin
- Full system access
- Can view all users
- Can manage all events
- Can view all transactions
- Can change user roles

---

## 🔧 HOW ROLES WORK IN YOUR SYSTEM

### During Registration:
```typescript
// Frontend sends role during signup
const { data } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password',
  options: {
    data: {
      role: 'organizer',  // Stored in auth metadata
      firstName: 'John',
      lastName: 'Doe'
    }
  }
});

// Trigger automatically creates user in users table with role
```

### During Authentication:
```typescript
// Backend extracts role from JWT
const user = await get_user_from_request(request);
console.log(user.role);  // 'admin', 'organizer', or 'attendee'

// Backend uses role for authorization
if (user.role !== 'admin') {
  throw new Error('Admin access required');
}
```

### In Frontend:
```typescript
// Frontend checks role for UI
const { user } = useAuth();

if (user.role === 'organizer') {
  // Show organizer dashboard
} else if (user.role === 'admin') {
  // Show admin dashboard
} else {
  // Show attendee dashboard
}
```

---

## 🧪 TESTING THE FIX

### Test 1: Verify Columns Added
```sql
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;
```

**Expected**: Should see role, organization_name, state, etc.

### Test 2: Verify RLS Enabled
```sql
SELECT tablename, rowsecurity 
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'users';
```

**Expected**: `rowsecurity = true`

### Test 3: Verify Policies Created
```sql
SELECT policyname, cmd 
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'users';
```

**Expected**: 5 policies listed

### Test 4: Check User Roles
```sql
SELECT role, COUNT(*) 
FROM public.users
GROUP BY role;
```

**Expected**: Shows distribution of admin/organizer/attendee

---

## 🚨 IMPORTANT: BACKEND ACCESS

### Why Backend Needs Service Role

Your backend needs to update wallet balances, which users shouldn't be able to do directly.

**Current backend code** (already correct):
```python
from database import supabase_client
supabase = supabase_client.get_service_client()  # Uses service_role key

# This bypasses RLS and can update wallet_balance
supabase.table('users').update({
    'wallet_balance': new_balance
}).eq('id', user_id).execute()
```

**Why this works**:
- Service role key has special `service_role` JWT claim
- Policy 5 allows service_role to do anything
- Frontend uses anon key (restricted by RLS)
- Backend uses service_role key (bypasses RLS)

---

## 📊 BEFORE vs AFTER

### Before (INSECURE):
```
Frontend Query:
SELECT * FROM users;

Result: ALL 18 users returned 😱
- Can see everyone's wallet balance
- Can see everyone's email
- Can see everyone's phone
- No access control
```

### After (SECURE):
```
Frontend Query (as regular user):
SELECT * FROM users;

Result: Only YOUR user returned ✅
- Can only see your own data
- Other users' data is hidden
- Wallet balances protected
- Proper access control

Frontend Query (as admin):
SELECT * FROM users;

Result: ALL users returned ✅
- Admin can see all data
- Proper authorization
- Audit trail
```

---

## 🎯 WHAT HAPPENS NEXT

### Immediate Effects:
1. ✅ Role column added to all users
2. ✅ RLS enabled - data is now protected
3. ✅ Users can only access their own data
4. ✅ Admins can access all data
5. ✅ Backend can still update wallets

### For New Users:
1. User signs up with role in metadata
2. Trigger creates user in database with role
3. RLS policies automatically apply
4. User can only see their own data

### For Existing Users:
1. Roles populated from auth metadata
2. If no role in metadata, defaults to 'attendee'
3. You may need to manually update some roles

---

## 🔧 MANUAL ROLE UPDATES (If Needed)

If some users have wrong roles:

```sql
-- Make user an organizer
UPDATE public.users 
SET role = 'organizer',
    organization_name = 'Company Name',
    organization_type = 'Event Management'
WHERE email = 'organizer@grooovy.netlify.app';

-- Make user an admin
UPDATE public.users 
SET role = 'admin'
WHERE email = 'admin@grooovy.netlify.app';

-- Verify
SELECT email, role, organization_name 
FROM public.users 
WHERE role IN ('admin', 'organizer');
```

---

## ✅ SUCCESS CRITERIA

After running the setup script, you should have:

- ✅ `role` column exists with CHECK constraint
- ✅ RLS is enabled on users table
- ✅ 5 security policies are active
- ✅ All users have a role assigned
- ✅ Users can only query their own data (test in frontend)
- ✅ Backend can still update wallet balances
- ✅ Admin users can see all data

---

## 🚀 READY TO FIX

**Run `setup_proper_users_table.sql` in Supabase SQL Editor now!**

This is a critical security fix that should be done immediately before going to production.

---

## 📞 VERIFICATION

After running the script, you'll see output showing:
1. Columns added
2. RLS status (enabled)
3. Policies created (5 total)
4. User roles distribution

If you see all of this, the fix was successful! ✅
