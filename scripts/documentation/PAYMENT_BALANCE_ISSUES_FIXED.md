# Payment Balance Issues - ROOT CAUSES FIXED

## Date: March 27, 2026
## Status: ⚠️ REQUIRES DATABASE MIGRATION - Then Ready for Testing

---

## 🚨 CRITICAL: DATABASE MIGRATION REQUIRED

Before testing, you MUST add the `wallet_balance` column to the Supabase `users` table.

### Quick Fix - Add Column via Supabase Dashboard:

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click "SQL Editor" in the left sidebar
4. Click "New Query"
5. Copy and paste this SQL:

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS wallet_balance NUMERIC(10, 2) DEFAULT 0.00;
COMMENT ON COLUMN users.wallet_balance IS 'User wallet balance in Naira';
```

6. Click "Run" or press Ctrl+Enter
7. You should see "Success. No rows returned"

### Alternative - Add via Table Editor:

1. Go to "Table Editor" in Supabase dashboard
2. Select "users" table
3. Click "Add Column" button
4. Fill in:
   - Name: `wallet_balance`
   - Type: `numeric` (or `float8`)
   - Default value: `0`
5. Click "Save"

---

## 🔍 ISSUES IDENTIFIED

### Issue 1: Wrong Email in Flutterwave Transaction History
**Root Cause**: The backend was using a hardcoded test user for ALL Supabase JWT tokens instead of extracting the actual user from the JWT.

**Location**: `apps/backend-fastapi/simple_main.py` - `get_user_from_request()` function

**Problem Code**:
```python
# Support Supabase JWT tokens
if auth_header.startswith("Bearer eyJ"):
    # Return the organizer test user for Supabase authenticated users
    organizer_id = "test-organizer-001"
    if organizer_id in user_database:
        return user_database[organizer_id]  # ❌ WRONG - returns test user
```

**Fix Applied**: Replaced with proper JWT validation from `auth_utils.py`:
```python
# Import proper authentication from auth_utils
from auth_utils import get_user_from_request
```

This now properly:
- Validates the Supabase JWT token
- Extracts the actual user ID and email from the token
- Returns the correct user information

---

### Issue 2: Wallet Balance Not Updating (Stays at Zero)
**Root Cause**: Wallet balance was stored in an in-memory dictionary (`user_database`) that only contained test users, not actual Supabase users.

**Location**: `apps/backend-fastapi/simple_main.py` - `/api/wallet/verify-payment` endpoint

**Problem Code**:
```python
# Update user's wallet balance
if user_id in user_database:  # ❌ Only has test users
    current_balance = user_database[user_id].get("wallet_balance", 0)
    new_balance = current_balance + amount
    user_database[user_id]["wallet_balance"] = new_balance
```

**Fix Applied**: Now stores wallet balance in Supabase database:
```python
# Get current balance from Supabase
user_result = supabase.table('users').select('wallet_balance').eq('id', user_id).execute()
current_balance = float(user_result.data[0].get('wallet_balance', 0))
new_balance = current_balance + amount

# Update wallet balance in Supabase
update_result = supabase.table('users').update({
    'wallet_balance': new_balance
}).eq('id', user_id).execute()

# Record transaction in payments table
payment_record = {
    'user_id': user_id,
    'amount': amount,
    'payment_method': 'flutterwave',
    'transaction_reference': tx_ref,
    'transaction_id': transaction_id,
    'status': 'completed',
    'payment_type': 'wallet_funding',
    'created_at': time.time()
}
supabase.table('payments').insert(payment_record).execute()
```

---

### Issue 3: Balance Not Persisting Across Sessions
**Root Cause**: Same as Issue 2 - in-memory storage is lost on server restart.

**Fix Applied**: Supabase database storage ensures persistence.

---

## ✅ CHANGES MADE

### 1. Fixed User Authentication (`simple_main.py`)
- **Removed**: Broken `get_user_from_request()` function that returned hardcoded test users
- **Added**: Import of proper authentication from `auth_utils.py`
- **Result**: Now correctly identifies the actual user making the payment

### 2. Updated `/api/wallet/verify-payment` Endpoint
- **Added**: Supabase database integration
- **Added**: Proper wallet balance retrieval from database
- **Added**: Wallet balance update in database
- **Added**: Payment transaction recording in `payments` table
- **Added**: Detailed logging with user email for debugging
- **Result**: Wallet balance now persists in database and updates correctly

### 3. Updated `/api/wallet/balance` Endpoint
- **Added**: Supabase database integration
- **Added**: Proper balance retrieval from database
- **Added**: Detailed logging with user email
- **Result**: Balance now reflects actual database value

---

## 🧪 TESTING INSTRUCTIONS

### PREREQUISITE: Add wallet_balance Column (see above)

### Step 1: Restart Backend Server
The backend needs to be restarted to load the new code:

```bash
cd apps/backend-fastapi
# Stop the current server (Ctrl+C)
# Start it again
python simple_main.py
```

### Step 2: Open Browser Console
1. Open your browser (Chrome/Edge/Firefox)
2. Press F12 to open Developer Tools
3. Go to the "Console" tab
4. Keep it open during testing

### Step 3: Make a Test Payment
1. Login as organizer: `organizer@grooovy.netlify.app`
2. Go to Wallet Dashboard
3. Click "Add Funds"
4. Enter amount (e.g., ₦1000)
5. Click "Add Funds" button
6. Complete payment in Flutterwave modal

### Step 4: Check Console Logs
Look for these logs in the browser console:
```
🔍 FLUTTERWAVE CALLBACK RECEIVED
Full response: {...}
Response status: [THE ACTUAL STATUS VALUE]
✅ Payment successful, calling verify-payment endpoint...
Verify-payment response: {...}
```

### Step 5: Check Backend Logs
Look for these logs in the backend terminal:
```
✅ Payment verification for user: organizer@grooovy.netlify.app (ID: xxx)
   tx_ref=xxx, transaction_id=xxx, amount=₦1,000.00
✅ Updated Supabase wallet for organizer@grooovy.netlify.app: ₦0.00 -> ₦1,000.00
✅ Payment record created in database
```

### Step 6: Verify Balance Update
1. Check if the success popup shows the correct new balance
2. Refresh the page
3. Verify the wallet balance is still showing the correct amount (not zero)

---

## 🎯 EXPECTED RESULTS

### ✅ Correct Email
- Flutterwave transaction history should show: `organizer@grooovy.netlify.app`
- NOT a test user email like `organizer@grooovy.com`

### ✅ Balance Updates
- After payment, wallet balance should increase by the payment amount
- Balance should persist after page refresh
- Balance should persist after server restart

### ✅ Transaction Recording
- Payment should be recorded in the `payments` table in Supabase
- Transaction should have correct user_id, amount, and reference

---

## 🔧 TECHNICAL DETAILS

### Files Modified
1. `apps/backend-fastapi/simple_main.py`
   - Replaced broken authentication with proper JWT validation
   - Updated `/api/wallet/verify-payment` to use Supabase
   - Updated `/api/wallet/balance` to use Supabase

### Dependencies Used
- `auth_utils.py` - Proper JWT validation and user extraction
- `jwt_validator.py` - Supabase JWT token validation
- `database.py` - Supabase client connection
- `config.py` - Environment configuration

### Database Tables Used
- `users` table - Stores wallet_balance
- `payments` table - Records all payment transactions

---

## 🚨 IMPORTANT NOTES

1. **Supabase Service Key**: The backend uses `SUPABASE_SERVICE_KEY` to bypass Row Level Security (RLS) for wallet updates. This is necessary because the wallet balance update is a privileged operation.

2. **Fallback Mode**: If Supabase is not configured, the code falls back to in-memory storage for development purposes.

3. **Transaction Recording**: Every successful payment is recorded in the `payments` table for audit trail and transaction history.

4. **User Identification**: The system now correctly identifies users by their Supabase JWT token, ensuring the right user's wallet is updated.

---

## 📊 NEXT STEPS AFTER TESTING

If the test payment works correctly:
1. ✅ Verify balance shows correct amount
2. ✅ Verify correct email in Flutterwave dashboard
3. ✅ Verify balance persists after refresh
4. ✅ Check Supabase database to confirm wallet_balance updated
5. ✅ Check Supabase database to confirm payment record created

If there are still issues:
1. Share the browser console logs (especially the Flutterwave callback response)
2. Share the backend terminal logs
3. We'll investigate further based on the actual response data

---

## 🎉 SUMMARY

The payment system now:
- ✅ Correctly identifies the actual user making the payment
- ✅ Updates the correct user's wallet balance in Supabase database
- ✅ Persists wallet balance across sessions and server restarts
- ✅ Records all transactions in the database for audit trail
- ✅ Shows correct user email in Flutterwave transaction history

**Ready for testing!** 🚀
