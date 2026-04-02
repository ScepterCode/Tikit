# Fix User Storage - Step-by-Step Instructions

## 🚨 CRITICAL ISSUE FOUND

You have 16 users registered in Supabase Auth, but only 2 users in your database.
This means 14 users are missing their profile data, and wallet payments will fail for them.

---

## 🎯 WHAT WE'RE FIXING

1. **Create Database Trigger**: Automatically create user profiles when users sign up
2. **Backfill Missing Users**: Create profiles for the 14 existing users who are missing
3. **Verify Everything Works**: Test that wallet payments now work for all users

---

## 📋 STEP-BY-STEP FIX

### Step 1: Create the Database Trigger

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click "SQL Editor" in the left sidebar
4. Click "New Query"
5. Open the file: `fix_user_storage_trigger.sql`
6. Copy ALL the SQL from that file
7. Paste it into the Supabase SQL Editor
8. Click "Run" or press Ctrl+Enter

**Expected Result**:
```
trigger_name: on_auth_user_created
event_manipulation: INSERT
event_object_table: users
action_statement: EXECUTE FUNCTION public.handle_new_user()
```

If you see this, the trigger was created successfully! ✅

---

### Step 2: Backfill Missing Users

1. Still in Supabase SQL Editor
2. Click "New Query" (or clear the previous query)
3. Open the file: `backfill_missing_users.sql`
4. Copy ALL the SQL from that file
5. Paste it into the Supabase SQL Editor
6. Click "Run" or press Ctrl+Enter

**Expected Results**:

You'll see several result sets:

1. **Missing users count**: Should show 14 (or however many are missing)
2. **List of missing users**: Shows emails of users to be backfilled
3. **Insert result**: Shows how many rows were inserted
4. **Total auth users**: Should show 16
5. **Total db users**: Should show 16 (after backfill)
6. **Still missing**: Should show 0 ✅

---

### Step 3: Verify the Fix

Run this Python script to verify:

```bash
cd Tikit
python investigate_auth_and_user_storage.py
```

**Expected Output**:
```
📊 Total users in Supabase 'users' table: 16
📊 Total users in Supabase Auth: 16
✅ All users have profiles!
```

---

## 🧪 TEST THE FIX

### Test 1: Existing User Can Make Payment

1. Login as: `organizer@grooovy.netlify.app`
2. Go to Wallet Dashboard
3. Click "Add Funds"
4. Enter amount: ₦1000
5. Complete payment
6. **Expected**: Balance updates to ₦1000 ✅

### Test 2: New User Registration

1. Logout
2. Register a new user with a new email
3. Check Supabase:
   - SQL Editor: `SELECT * FROM users WHERE email = 'newemail@example.com';`
   - **Expected**: User exists in 'users' table ✅

### Test 3: New User Can Make Payment

1. Login as the new user
2. Go to Wallet Dashboard
3. Make a payment
4. **Expected**: Balance updates correctly ✅

---

## 🔍 WHAT THE TRIGGER DOES

### Before (Broken):
```
User signs up
    ↓
Supabase Auth creates user ✅
    ↓
users table: NOTHING ❌
    ↓
Wallet payment fails ❌
```

### After (Fixed):
```
User signs up
    ↓
Supabase Auth creates user ✅
    ↓
Trigger fires automatically
    ↓
users table: Profile created ✅
    ↓
Wallet payment works ✅
```

---

## 📊 VERIFICATION QUERIES

### Check if trigger exists:
```sql
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
```

### Count users in both systems:
```sql
-- Should be equal
SELECT COUNT(*) as auth_users FROM auth.users;
SELECT COUNT(*) as db_users FROM public.users;
```

### Find any missing users:
```sql
-- Should return 0 rows
SELECT au.email 
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE u.id IS NULL;
```

---

## 🚨 TROUBLESHOOTING

### Issue: "permission denied for table auth.users"

**Solution**: You need to use the service_role key, not the anon key.
The SQL scripts need to be run in the Supabase SQL Editor (which has admin access).

### Issue: "relation auth.users does not exist"

**Solution**: Make sure you're running the SQL in your Supabase project's SQL Editor, not locally.

### Issue: Trigger created but users still not being created

**Solution**: 
1. Check trigger exists: `SELECT * FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created';`
2. Check function exists: `SELECT * FROM information_schema.routines WHERE routine_name = 'handle_new_user';`
3. Try registering a new user and check the Supabase logs for errors

---

## 📝 FILES CREATED

1. `AUTHENTICATION_STORAGE_ANALYSIS.md` - Detailed analysis of the problem
2. `fix_user_storage_trigger.sql` - SQL to create the trigger
3. `backfill_missing_users.sql` - SQL to backfill existing users
4. `FIX_USER_STORAGE_INSTRUCTIONS.md` - This file (step-by-step guide)
5. `investigate_auth_and_user_storage.py` - Python script to verify the fix

---

## ✅ SUCCESS CRITERIA

After running both SQL scripts, you should have:

- ✅ Trigger created in Supabase
- ✅ All 16 users have profiles in 'users' table
- ✅ All users have wallet_balance = 0.00
- ✅ Existing users can make payments
- ✅ New registrations automatically create profiles
- ✅ Wallet system works for all users

---

## 🎉 NEXT STEPS AFTER FIX

1. **Restart Backend Server** (to clear any cached data)
2. **Test Wallet Payment** with existing user
3. **Test New Registration** to verify trigger works
4. **Monitor Logs** for any errors

---

## 📞 IF YOU NEED HELP

If you encounter any issues:

1. Share the error message from Supabase SQL Editor
2. Run the verification script: `python investigate_auth_and_user_storage.py`
3. Share the output
4. Check Supabase logs for any trigger errors

---

## 🔐 SECURITY NOTE

The trigger uses `SECURITY DEFINER` which means it runs with the privileges of the user who created it (you). This is necessary to insert into the 'users' table from the auth trigger.

Make sure your Row Level Security (RLS) policies allow this operation.

---

**Ready to fix? Start with Step 1 above!** 🚀
