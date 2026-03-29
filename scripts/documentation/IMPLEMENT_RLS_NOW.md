# 🚨 IMPLEMENT RLS POLICIES NOW - Step-by-Step Guide

## 📋 CURRENT STATUS

Based on your database schema, you have:
- ✅ 18 tables in your database
- ❌ NO RLS enabled on ANY table
- ❌ NO role column in users table
- 🔴 **CRITICAL SECURITY VULNERABILITY**: Anyone can access anyone's data

## 🎯 WHAT WE'RE DOING

We're implementing Row Level Security (RLS) in 2 phases:

### Phase 1: Users Table + Critical Tables (DO THIS NOW)
1. Add `role` column to users table
2. Enable RLS on users table
3. Enable RLS on events, bookings, tickets, payments, notifications
4. Create 29 security policies

### Phase 2: Remaining Tables (DO LATER)
5. Enable RLS on referrals, group_buys, sponsorships, etc.
6. Fix ID type inconsistencies (text → uuid)
7. Remove redundant tables
8. Add indexes and optimizations

---

## 🚀 STEP-BY-STEP IMPLEMENTATION

### STEP 1: Run Users Table Setup (5 minutes)

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click "SQL Editor" in left sidebar
   - Click "New Query"

3. **Run First Script**
   - Open file: `Tikit/setup_proper_users_table.sql`
   - Copy ALL the SQL (entire file)
   - Paste into SQL Editor
   - Click "Run" button

4. **Verify Success**
   You should see output showing:
   ```
   ✅ Users table columns (with role, organization_name, etc.)
   ✅ RLS Status: rls_enabled = true
   ✅ RLS Policies: 5 policies listed
   ✅ User Roles Distribution: Shows count by role
   ```

5. **If You See Errors**
   - If "column already exists": That's OK, continue
   - If "policy already exists": That's OK, continue
   - If other errors: Copy error message and ask for help

---

### STEP 2: Run Critical Tables RLS (5 minutes)

1. **Still in SQL Editor**
   - Click "New Query" again

2. **Run Second Script**
   - Open file: `Tikit/PHASE1_CRITICAL_SECURITY_RLS.sql`
   - Copy ALL the SQL (entire file)
   - Paste into SQL Editor
   - Click "Run" button

3. **Verify Success**
   You should see output showing:
   ```
   ✅ RLS Status Check: 6 tables with rls_enabled = true
   ✅ Policy Count: 29 total policies created
   ```

4. **Expected Policy Counts**
   - users: 5 policies
   - events: 8 policies
   - bookings: 5 policies
   - tickets: 5 policies
   - payments: 3 policies
   - realtime_notifications: 3 policies
   - **TOTAL: 29 policies**

---

### STEP 3: Verify User Roles (2 minutes)

1. **Check Your Users**
   ```sql
   SELECT 
     email,
     role,
     organization_name,
     wallet_balance,
     is_verified
   FROM public.users
   ORDER BY created_at DESC;
   ```

2. **Expected Results**
   - All 16 users should have a role
   - Most will be 'attendee' (default)
   - Some might be 'organizer' or 'admin'

3. **Update Specific User Roles** (if needed)
   ```sql
   -- Make organizer@grooovy.netlify.app an organizer
   UPDATE public.users 
   SET 
     role = 'organizer',
     organization_name = 'Grooovy Events',
     organization_type = 'Event Management'
   WHERE email = 'organizer@grooovy.netlify.app';

   -- Make yourself an admin (replace with your email)
   UPDATE public.users 
   SET role = 'admin'
   WHERE email = 'your-email@example.com';

   -- Verify
   SELECT email, role, organization_name 
   FROM public.users 
   WHERE role IN ('admin', 'organizer');
   ```

---

### STEP 4: Test RLS is Working (5 minutes)

1. **Test as Regular User**
   - Open your frontend: http://localhost:3000
   - Login as: `organizer@grooovy.netlify.app`
   - Open browser console (F12)
   - Run this:
   ```javascript
   const { data, error } = await window.supabase
     .from('users')
     .select('*');
   console.log('Users I can see:', data);
   ```
   - **Expected**: You should only see YOUR user, not all 16 users

2. **Test Wallet Balance Protection**
   - Try to update your own wallet balance:
   ```javascript
   const { data, error } = await window.supabase
     .from('users')
     .update({ wallet_balance: 999999 })
     .eq('id', 'your-user-id');
   console.log('Error:', error);
   ```
   - **Expected**: Should fail with RLS error (users can't change their own balance)

3. **Test Backend Can Still Update Wallet**
   - Make a wallet payment (fund wallet with ₦100)
   - Check if balance updates
   - **Expected**: Should work (backend uses service_role key)

---

## 🔐 WHAT CHANGED

### Before (INSECURE):
```javascript
// Frontend could do this:
const { data } = await supabase.from('users').select('*');
// Result: ALL 16 users returned 😱

const { data } = await supabase.from('events').select('*');
// Result: ALL events returned, including drafts 😱

const { data } = await supabase.from('payments').select('*');
// Result: ALL payments visible to everyone 😱
```

### After (SECURE):
```javascript
// Frontend can do this:
const { data } = await supabase.from('users').select('*');
// Result: Only YOUR user returned ✅

const { data } = await supabase.from('events').select('*');
// Result: Only published events + your own events ✅

const { data } = await supabase.from('payments').select('*');
// Result: Only YOUR payments ✅
```

---

## 🎭 HOW ROLES WORK NOW

### Attendee (Default)
- Can view own profile
- Can view published events
- Can create bookings
- Can view own tickets
- Can view own payments
- **Cannot** view other users' data

### Organizer
- Everything attendee can do, PLUS:
- Can create events
- Can view bookings for their events
- Can view/scan tickets for their events
- Can update their events
- **Cannot** view other organizers' events

### Admin
- Can view ALL users
- Can view ALL events
- Can view ALL bookings
- Can view ALL tickets
- Can view ALL payments
- Can update any user's role
- Full system access

---

## 🔧 BACKEND STILL WORKS

Your backend uses `service_role` key which bypasses RLS:

```python
# Backend can still update wallet balances
from database import supabase_client
supabase = supabase_client.get_service_client()  # service_role key

# This works because of "Service role can do anything" policy
supabase.table('users').update({
    'wallet_balance': new_balance
}).eq('id', user_id).execute()
```

**Why this is safe**:
- Frontend uses `anon` key (restricted by RLS)
- Backend uses `service_role` key (bypasses RLS)
- Users can't directly modify their wallet balance
- Only backend can update wallet balance

---

## ⚠️ IMPORTANT NOTES

### 1. Existing Frontend Code
Your frontend code doesn't need changes! RLS works at the database level:
- Queries that should work will still work
- Queries that shouldn't work will now fail (which is good!)

### 2. Backend Code
Your backend already uses service_role key correctly:
- Wallet updates will continue to work
- Payment verification will continue to work
- No changes needed

### 3. Testing User
The user `organizer@grooovy.netlify.app` should be set to role='organizer':
```sql
UPDATE public.users 
SET role = 'organizer'
WHERE email = 'organizer@grooovy.netlify.app';
```

### 4. New Users
The trigger automatically assigns roles to new users based on signup metadata.

---

## 🐛 TROUBLESHOOTING

### Error: "new row violates row-level security policy"
**Cause**: Frontend trying to do something not allowed
**Fix**: This is expected! RLS is working. Backend should handle this operation.

### Error: "permission denied for table users"
**Cause**: RLS is too restrictive
**Fix**: Check if user is authenticated (has valid JWT token)

### Wallet Balance Not Updating
**Cause**: Backend not using service_role key
**Fix**: Verify backend uses `get_service_client()` not `get_client()`

### Can't See Any Events
**Cause**: All events might be in draft status
**Fix**: Publish some events or login as the event creator

---

## ✅ SUCCESS CHECKLIST

After running both scripts, verify:

- [ ] Users table has `role` column
- [ ] Users table has RLS enabled
- [ ] 6 tables have RLS enabled (users, events, bookings, tickets, payments, notifications)
- [ ] 29 total policies created
- [ ] All 16 users have a role assigned
- [ ] Frontend can only see own user data
- [ ] Backend can still update wallet balances
- [ ] Wallet payment test works

---

## 🚀 READY TO IMPLEMENT

**Run these 2 scripts in Supabase SQL Editor:**
1. `setup_proper_users_table.sql` (adds role, enables RLS on users)
2. `PHASE1_CRITICAL_SECURITY_RLS.sql` (enables RLS on 5 more tables)

**Total time**: ~10 minutes
**Impact**: Critical security vulnerability fixed ✅

---

## 📞 NEXT STEPS AFTER THIS

Once Phase 1 is complete, we'll do Phase 2:
1. Enable RLS on remaining tables (referrals, group_buys, etc.)
2. Fix ID type inconsistencies (text → uuid)
3. Remove redundant tables (event_capacity, group_buy_status)
4. Add indexes for performance
5. Add soft deletes (deleted_at columns)

But first, let's secure the critical tables! 🔒

---

## 🎯 READY?

**Copy the SQL from these files and run them in Supabase SQL Editor:**
1. `Tikit/setup_proper_users_table.sql`
2. `Tikit/PHASE1_CRITICAL_SECURITY_RLS.sql`

Then test that:
- You can only see your own user data
- Wallet payment still works
- Events are properly filtered

Let me know when you've run the scripts and I'll help verify everything is working! 🚀
