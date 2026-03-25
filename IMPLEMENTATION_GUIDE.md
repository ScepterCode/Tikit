# Implementation Guide - One by One

## 1. WALLET WITHDRAWAL (2-3 hours)

### Backend Endpoint
```python
@app.post("/api/payments/wallet/withdraw")
async def withdraw_funds(request: Request):
    body = await request.json()
    user_id = extract_user_id(request)
    amount = body.get("amount")
    bank_code = body.get("bank_code")
    account_number = body.get("account_number")
    
    # Validate amount <= balance
    # Create withdrawal record
    # Deduct from wallet
    # Return reference
```

### Frontend Form
- Amount input
- Bank dropdown
- Account number
- Submit button

---

## 2. EVENT UPDATES (5-6 hours)

### Backend Endpoints
```python
@app.put("/api/events/{event_id}")
# Update: title, description, venue, dates, capacity

@app.post("/api/events/{event_id}/postpone")
# Postpone with new date and reason

@app.get("/api/events/{event_id}/changes")
# Get change history
```

### Frontend Components
- EditEventModal with form
- Change history timeline
- Notification to attendees

---

## 3. SECRET INVITES UI (3-4 hours)

### Backend (Already Done)
- Access code validation exists
- Just need to expose it

### Frontend
```tsx
// In BrowseEvents.tsx
<button onClick={() => setShowAccessCodeModal(true)}>
  Have an access code?
</button>

// AccessCodeModal.tsx
<input placeholder="Enter 4-digit code" />
<button onClick={validateCode}>Unlock Event</button>
```

---

## 4. SPRAY MONEY (6-8 hours)

### Backend Endpoints
```python
@app.post("/api/events/{event_id}/spray-money")
# Deduct from wallet, add to organizer

@app.get("/api/events/{event_id}/spray-leaderboard")
# Real-time leaderboard
```

### Frontend Components
- SprayMoneyWidget (amount buttons + send)
- SprayMoneyLeaderboard (real-time updates)

---

## 5. GROUP BUY (7-8 hours)

### Backend Endpoints
```python
@app.post("/api/tickets/bulk-purchase")
# Create bulk purchase with discount

@app.post("/api/tickets/bulk-purchase/{id}/split-links")
# Generate payment links

@app.post("/api/tickets/bulk-purchase/{id}/pay-share")
# Process individual share payment
```

### Frontend Components
- BulkPurchaseModal
- SplitPaymentLinks
- PaymentShare page

---

## 6. ONBOARDING PREFERENCES (4-5 hours)

### Backend Endpoint
```python
@app.post("/api/users/{user_id}/preferences")
# Store event type preferences
```

### Frontend
```tsx
// Add to OnboardingFlow.tsx
<EventPreferencesSelector />
// Multi-select: Weddings, Concerts, Festivals, etc.
```

---

## Quick Implementation Order

1. **Wallet Withdrawal** - Easiest, users need it
2. **Event Updates** - Critical for organizers
3. **Secret Invites UI** - Backend ready, quick win
4. **Onboarding Preferences** - Improves UX
5. **Group Buy** - Revenue feature
6. **Spray Money** - Engagement feature

---

## Testing Checklist

After each feature:
- [ ] Backend endpoint returns correct data
- [ ] Frontend form submits correctly
- [ ] Data persists in database
- [ ] Mobile responsive
- [ ] Error handling works
- [ ] Notifications sent (if applicable)
