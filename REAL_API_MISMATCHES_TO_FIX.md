# REAL API MISMATCHES - 21 Issues Found

## Summary
Deep trace found **21 frontend API calls** with NO matching backend endpoints.
Match rate: Only 4.5% (1 out of 22 calls matched)

---

## Category 1: Wrong Port (localhost:8001 → should be 8000)
**6 instances in PaymentModal.tsx and PreferencesPage.tsx**

### Files to Fix:
1. `pages/PaymentSharePage.tsx` - bulk-purchase endpoint
2. `pages/PreferencesPage.tsx` - user preferences endpoint  
3. `components/payment/PaymentModal.tsx` - 5 payment endpoints

### Issues:
- Using `http://localhost:8001` instead of environment variable
- Backend runs on port 8000, not 8001

---

## Category 2: Malformed URLs (${VITE_API_URL} not resolving)
**8 instances - template strings not being constructed properly**

### Files to Fix:
1. `pages/organizer/OrganizerScanner.tsx` - 2 endpoints
2. `components/payment/PaymentModal.tsx` - 1 endpoint
3. `components/payment/SecurePaymentModal.tsx` - 3 endpoints
4. `components/tickets/PurchaseButton.tsx` - 1 endpoint

### Issues:
- URLs like `${import.meta.env.VITE_API_URL}/api/...` 
- Resulting in `/{id}/api/...` instead of proper URL

---

## Category 3: Anonymous Chat Endpoints
**7 instances - Need to verify backend has these**

### Endpoints:
1. `/api/anonymous-chat/join-room` - POST
2. `/api/anonymous-chat/messages/{id}` - GET
3. `/api/anonymous-chat/send-message` - POST
4. `/api/anonymous-chat/premium-messages/{id}` - GET
5. `/api/anonymous-chat/send-premium-message` - POST
6. `/api/anonymous-chat/rooms/by-event/{id}` - GET
7. `/api/anonymous-chat/create-room` - POST

### Backend Check:
Need to verify `routers/anonymous_chat.py` has all these endpoints

---

## Category 4: Missing Backend Endpoints
**2 instances - Backend doesn't have these**

1. `/api/users/preferences` - Used in PreferencesPage.tsx
2. `/api/tickets/bulk-purchase/{id}` - Used in PaymentSharePage.tsx

---

## Detailed Fix Plan

### Fix 1: Update PaymentModal.tsx
**File:** `components/payment/PaymentModal.tsx`

**Current (WRONG):**
```typescript
http://localhost:8001/api/payments/wallet
http://localhost:8001/api/payments/bank-transfer
http://localhost:8001/api/payments/ussd
http://localhost:8001/api/payments/airtime
http://localhost:8001/api/payments/verify
```

**Should be:**
```typescript
`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/payments/wallet`
```

### Fix 2: Update SecurePaymentModal.tsx
**File:** `components/payment/SecurePaymentModal.tsx`

**Issue:** Template string not resolving properly
**Fix:** Ensure VITE_API_URL is set in .env

### Fix 3: Update OrganizerScanner.tsx
**File:** `pages/organizer/OrganizerScanner.tsx`

**Current endpoints:**
- `/api/organizer/scan-history`
- `/api/organizer/verify-ticket`

**Backend has:**
- `POST /tickets/verify`
- `GET /tickets/{ticket_id}/scan-history`

**Fix:** Update frontend to use correct paths

### Fix 4: Create Missing Backend Endpoints

#### A. User Preferences Endpoint
```python
# In routers/auth.py or new routers/users.py
@router.get("/users/preferences")
async def get_user_preferences(request: Request):
    # Implementation
    pass

@router.put("/users/preferences")
async def update_user_preferences(request: Request, preferences: dict):
    # Implementation
    pass
```

#### B. Bulk Purchase Endpoint
```python
# In routers/tickets.py
@router.get("/tickets/bulk-purchase/{purchase_id}")
async def get_bulk_purchase(purchase_id: str):
    # Implementation
    pass
```

### Fix 5: Verify Anonymous Chat Endpoints
Check `routers/anonymous_chat.py` and ensure all 7 endpoints exist

---

## Priority Order

### CRITICAL (Breaks Features):
1. Fix PaymentModal.tsx port issue (5 endpoints)
2. Fix OrganizerScanner.tsx paths (2 endpoints)
3. Fix SecurePaymentModal.tsx template strings (3 endpoints)

### HIGH (Optional Features):
4. Verify anonymous chat endpoints (7 endpoints)
5. Create user preferences endpoint (1 endpoint)
6. Create bulk purchase endpoint (1 endpoint)

### MEDIUM:
7. Fix PurchaseButton.tsx template string (1 endpoint)
8. Fix PaymentSharePage.tsx (1 endpoint)

---

## Root Causes

1. **Hardcoded localhost:8001** - Should use environment variable
2. **Template string issues** - VITE_API_URL not set or not resolving
3. **Path mismatches** - Frontend expects different paths than backend provides
4. **Missing endpoints** - Backend doesn't have some features frontend expects

---

## Next Steps

1. Fix all hardcoded ports
2. Ensure .env has VITE_API_URL=http://localhost:8000
3. Update frontend paths to match backend
4. Create missing backend endpoints
5. Test all API calls

