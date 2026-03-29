# 🔐 RLS Implementation - Quick Reference Card

## ⚡ 3-STEP IMPLEMENTATION (15 minutes)

### STEP 1: Users Table (3 min)
```
1. Open Supabase Dashboard → SQL Editor
2. Copy content from: setup_proper_users_table.sql
3. Paste and Run
4. Verify: "✅ RLS Status: rls_enabled = true"
```

### STEP 2: Critical Tables (3 min)
```
1. SQL Editor → New Query
2. Copy content from: PHASE1_CRITICAL_SECURITY_RLS.sql
3. Paste and Run
4. Verify: "✅ 29 total policies created"
```

### STEP 3: Verify (3 min)
```
1. SQL Editor → New Query
2. Copy content from: verify_rls_implementation.sql
3. Paste and Run
4. Check all 10 checks pass
```

---

## 📊 WHAT GETS PROTECTED

| Table | RLS Enabled | Policies | Protection |
|-------|-------------|----------|------------|
| users | ✅ | 5 | Users see only their own profile |
| events | ✅ | 8 | Public sees published, organizers see own |
| bookings | ✅ | 5 | Users see only their own bookings |
| tickets | ✅ | 5 | Users see only their own tickets |
| payments | ✅ | 3 | Users see only their own payments |
| notifications | ✅ | 3 | Users see only their own notifications |

**TOTAL: 6 tables, 29 policies** 🔒

---

## 🎭 USER ROLES

| Role | Can Do |
|------|--------|
| **attendee** | View own data, buy tickets, use wallet |
| **organizer** | Create events, manage own events, scan tickets |
| **admin** | View/manage ALL data, change roles, full access |

---

## 🔧 ASSIGN ROLES

### Make Organizer:
```sql
UPDATE public.users 
SET role = 'organizer',
    organization_name = 'Company Name'
WHERE email = 'user@example.com';
```

### Make Admin:
```sql
UPDATE public.users 
SET role = 'admin'
WHERE email = 'admin@example.com';
```

### Check Roles:
```sql
SELECT email, role, organization_name
FROM public.users
WHERE role IN ('admin', 'organizer');
```

---

## 🧪 QUICK TEST

### Browser Console Test:
```javascript
// Should only see YOUR user (not all 16)
const { data } = await window.supabase.from('users').select('*');
console.log('Users:', data.length); // Should be 1

// Should fail (users can't change wallet)
const { error } = await window.supabase
  .from('users')
  .update({ wallet_balance: 999999 })
  .eq('id', 'your-id');
console.log('Error:', error); // Should have error
```

### Or Use Test Page:
```
1. Open: test_rls_from_frontend.html
2. Login: organizer@grooovy.netlify.app
3. Click: "Run All Tests"
4. Verify: All tests pass ✅
```

---

## 🔐 BEFORE vs AFTER

### BEFORE (INSECURE):
```javascript
// Anyone can see ALL users
const { data } = await supabase.from('users').select('*');
// Returns: 16 users 😱

// Anyone can see ALL payments
const { data } = await supabase.from('payments').select('*');
// Returns: ALL payments 😱
```

### AFTER (SECURE):
```javascript
// Users see only their own data
const { data } = await supabase.from('users').select('*');
// Returns: 1 user (yourself) ✅

// Users see only their own payments
const { data } = await supabase.from('payments').select('*');
// Returns: YOUR payments only ✅
```

---

## ✅ SUCCESS CHECKLIST

- [ ] Ran setup_proper_users_table.sql
- [ ] Ran PHASE1_CRITICAL_SECURITY_RLS.sql
- [ ] Ran verify_rls_implementation.sql
- [ ] All 10 verification checks pass
- [ ] Frontend shows only 1 user (yourself)
- [ ] Cannot update wallet from frontend
- [ ] Backend wallet updates still work
- [ ] Assigned roles to key users

---

## 🐛 COMMON ISSUES

| Issue | Solution |
|-------|----------|
| "column already exists" | OK, continue |
| "policy already exists" | OK, continue |
| "permission denied" | User not logged in |
| "0 users returned" | Session expired, re-login |
| Wallet not updating | Backend needs service_role key |

---

## 📁 FILES NEEDED

All in `Tikit/` directory:

1. **setup_proper_users_table.sql** - Step 1
2. **PHASE1_CRITICAL_SECURITY_RLS.sql** - Step 2
3. **verify_rls_implementation.sql** - Step 3
4. **test_rls_from_frontend.html** - Testing
5. **RLS_IMPLEMENTATION_COMPLETE_GUIDE.md** - Full guide

---

## 🚀 BACKEND STILL WORKS

Backend uses service_role key (bypasses RLS):

```python
# Backend can still update wallets
supabase = supabase_client.get_service_client()
supabase.table('users').update({
    'wallet_balance': new_balance
}).eq('id', user_id).execute()
```

**Why safe:**
- Frontend: anon key (restricted by RLS) ✅
- Backend: service_role key (bypasses RLS) ✅

---

## 📞 NEED HELP?

1. Check: RLS_IMPLEMENTATION_COMPLETE_GUIDE.md
2. Run: verify_rls_implementation.sql
3. Test: test_rls_from_frontend.html
4. Ask with specific error messages

---

## 🎯 IMPACT

**Before**: Critical security vulnerability
**After**: Production-ready security ✅

**Time**: 15 minutes
**Effort**: Copy & paste SQL
**Result**: Database secured 🔒

---

## 🎉 READY?

**Run these 3 SQL scripts in Supabase:**
1. setup_proper_users_table.sql
2. PHASE1_CRITICAL_SECURITY_RLS.sql
3. verify_rls_implementation.sql

**Then test and you're done! 🚀**
