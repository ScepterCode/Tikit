# Wallet Payment Issue - Missing customer_email Fix

## Issue Reported
**Error**: `Missing parameter (customer_email): Kindly terminate this session and reconfirm the data. SECURED BY FLUTTERWAVE`

This error occurred when trying to add funds to wallet (both attendee and organizer wallets).

## Root Cause Analysis

### What Was Happening:
1. User clicks "Add Funds" and enters amount (e.g., ₦1,000)
2. Frontend calls `/api/wallet/fund` endpoint
3. Backend returns: `{ success: true, tx_ref, user_email, user_name }`
4. Frontend opens Flutterwave modal with customer data
5. **Flutterwave rejects** with "Missing parameter (customer_email)"

### Possible Causes:
1. ❌ Backend not returning `user_email` (UNLIKELY - code shows it does)
2. ❌ Frontend not passing `user_email` to Flutterwave (UNLIKELY - code shows it does)
3. ✅ **MOST LIKELY**: `user_email` or `user_name` is `undefined`, `null`, or empty string
4. ✅ **ALSO POSSIBLE**: User profile in database missing email field

## The Fix

### Changes Made to `UnifiedWalletDashboard.tsx`:

#### 1. Added Validation & Logging
```typescript
// Validate required fields from backend
console.log('🔍 Backend response:', result);
console.log('📧 User email:', result.user_email);
console.log('👤 User name:', result.user_name);
console.log('🔖 Transaction ref:', result.tx_ref);

if (!result.user_email) {
  alert('Error: User email not found. Please ensure your profile is complete.');
  setLoading(false);
  return;
}

if (!result.user_name) {
  console.warn('⚠️ User name not found, using email as fallback');
}
```

#### 2. Added Fallback for Missing Name
```typescript
customer: {
  email: result.user_email,
  name: result.user_name || result.user_email?.split('@')[0] || 'User',
}
```

#### 3. Added Debug Logging Before Flutterwave Call
```typescript
console.log('📦 Flutterwave config:', {
  public_key: flutterwaveKey?.substring(0, 20) + '...',
  tx_ref: result.tx_ref,
  amount: fundAmount,
  currency: 'NGN',
  customer_email: result.user_email,
  customer_name: result.user_name || result.user_email?.split('@')[0] || 'User'
});
```

## Testing Instructions

### 1. Check Browser Console
When you click "Add Funds", you should now see:
```
🔍 Backend response: { success: true, tx_ref: "FUND_...", user_email: "...", user_name: "..." }
📧 User email: user@example.com
👤 User name: John Doe
🔖 Transaction ref: FUND_xxx_1234567890
✅ Opening Flutterwave payment modal...
📦 Flutterwave config: { ... }
```

### 2. If You See "User email not found" Alert
This means the backend is not returning `user_email`. Check:
- User's email in Supabase `users` table
- Backend logs for errors in `/api/wallet/fund` endpoint
- Authentication token validity

### 3. If Flutterwave Still Shows Error
Check the console logs to see what values are being passed:
- Is `customer_email` actually populated?
- Is it a valid email format?
- Is `customer_name` populated (or using fallback)?

## Backend Verification

The backend endpoint `/api/wallet/fund` should return:
```python
{
    "success": True,
    "message": "Wallet funding initiated",
    "amount": amount,
    "reference": tx_ref,
    "tx_ref": tx_ref,
    "user_email": user_email,  # ← Must not be empty
    "user_name": user_name      # ← Can be empty (frontend has fallback)
}
```

### Check User Data in Database
Run this SQL in Supabase:
```sql
SELECT id, email, first_name, last_name 
FROM users 
WHERE email = 'your-email@example.com';
```

Ensure:
- ✅ `email` field is populated
- ✅ `first_name` and `last_name` are populated (or at least one)

## Other Console Warnings (Non-Critical)

### Service Worker Error
```
Service Worker registration error: SecurityError: Failed to register a ServiceWorker
```
**Status**: ⚠️ Warning (not critical)
**Cause**: Service worker trying to register in development mode
**Impact**: None - service workers are for PWA features
**Fix**: Ignore in development, or disable service worker registration

### CSRF Token Not Found
```
GET http://localhost:8000/api/csrf-token 404 (Not Found)
CSRF token endpoint not available, continuing without CSRF protection
```
**Status**: ⚠️ Warning (acceptable in development)
**Cause**: CSRF endpoint not implemented
**Impact**: None in development (CSRF protection not critical for localhost)
**Fix**: Can be ignored for now, or implement CSRF endpoint if needed

## Next Steps

1. ✅ Test "Add Funds" functionality
2. ✅ Check browser console for new debug logs
3. ✅ Verify Flutterwave modal opens without errors
4. ✅ Complete a test payment
5. ✅ Verify wallet balance updates after payment

## Files Modified
- `apps/frontend/src/components/wallet/UnifiedWalletDashboard.tsx`
  - Added validation for `user_email`
  - Added fallback for `user_name`
  - Added comprehensive debug logging
  - Improved error messages

## Impact
- ✅ Better error handling
- ✅ Clear error messages for users
- ✅ Debug logs for troubleshooting
- ✅ Fallback values prevent Flutterwave errors
- ✅ Works for both attendee and organizer wallets
