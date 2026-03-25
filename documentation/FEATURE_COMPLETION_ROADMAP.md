# Tikit Feature Completion Roadmap

## Executive Summary
Based on comprehensive project analysis, here's the status of 8 key features and detailed proposals for completing them.

---

## 1. WALLET FUNCTIONALITY ✅ MOSTLY COMPLETE

### Current Status
- ✅ Wallet balance tracking works
- ✅ Top-up functionality implemented
- ✅ Transaction history with filtering
- ❌ Withdrawal functionality missing

### Diagnosis
The wallet system is 95% complete. Users can:
- View balance in real-time
- Add funds via payment methods
- See transaction history with filters
- Use wallet balance to purchase tickets

**Issue**: No withdrawal mechanism to cash out funds.

### Proposal: Complete Wallet with Withdrawal
**Effort**: 2-3 hours

#### Backend Changes (simple_main.py)
1. Add withdrawal endpoint: `POST /api/payments/wallet/withdraw`
   - Validate withdrawal amount ≤ balance
   - Validate bank details (account number, bank code)
   - Create withdrawal transaction record
   - Deduct from wallet balance
   - Return withdrawal reference

2. Add withdrawal status endpoint: `GET /api/payments/wallet/withdrawals`
   - List all withdrawals with status (pending, completed, failed)
   - Filter by date range

#### Frontend Changes
1. Update Wallet.tsx component
   - Add "Withdraw Funds" button
   - Create withdrawal form modal with:
     - Amount input
     - Bank selection dropdown
     - Account number input
     - Account name input
   - Show withdrawal history with status badges

#### Database Schema
```
withdrawals table:
- id (UUID)
- user_id (FK)
- amount (decimal)
- bank_code (string)
- account_number (string)
- account_name (string)
- status (pending/completed/failed)
- reference (string)
- created_at (timestamp)
- completed_at (timestamp)
```

---

## 2. MOBILE RESPONSIVENESS (PWA) ✅ COMPLETE

### Current Status
- ✅ PWA fully configured with vite-plugin-pwa
- ✅ Service worker with offline support
- ✅ Responsive design on all pages
- ✅ iOS splash screens configured
- ✅ Manifest with proper icons

### Diagnosis
**This is already done.** The project has:
- Workbox runtime caching (NetworkFirst for API, CacheFirst for assets)
- Offline support for critical pages
- Mobile-first responsive design
- PWA installable on iOS and Android

### Proposal: No Changes Needed
The PWA is production-ready. Future mobile app can be built as native wrapper around this PWA.

---

## 3. TICKET PURCHASE & "MY TICKETS" ✅ COMPLETE

### Current Status
- ✅ Tickets stored in database after purchase
- ✅ My Tickets page exists
- ✅ Ticket details include QR code, backup code
- ✅ Ticket verification for organizers
- ✅ Scan history tracking

### Diagnosis
**This is fully implemented.** The flow works:
1. User purchases ticket → Payment processed
2. Ticket issued with QR code
3. Ticket stored in database
4. User sees ticket in "My Tickets" page
5. Organizer can scan and verify

### Proposal: No Changes Needed
The ticket system is production-ready. Just ensure the purchase flow is tested end-to-end.

---

## 4. SECRET INVITES ⚠️ PARTIALLY COMPLETE

### Current Status
- ✅ Backend: Hidden events with 4-digit access codes
- ✅ Backend: Access code validation endpoint
- ❌ Frontend: No UI for attendees to enter access codes
- ❌ Frontend: Hidden events not shown in browse

### Diagnosis
The backend is ready but frontend is missing. Attendees can't discover or access hidden events.

### Proposal: Complete Secret Invites UI
**Effort**: 3-4 hours

#### Frontend Changes
1. Create `SecretInviteModal.tsx` component
   - Input field for 4-digit access code
   - Submit button
   - Error handling for invalid codes
   - Success message showing hidden event

2. Update `BrowseEvents.tsx` page
   - Add "Have an access code?" link/button
   - Opens SecretInviteModal when clicked
   - After valid code, shows the hidden event
   - User can purchase ticket directly

3. Update `EventCard.tsx`
   - Add badge for "Secret Event" if hidden
   - Show access code requirement

#### Backend Changes (simple_main.py)
1. Add endpoint: `POST /api/events/access-code/validate`
   - Input: access_code (4 digits)
   - Output: event details if valid
   - Return 401 if invalid

#### Database Schema
```
event_access_codes table:
- id (UUID)
- event_id (FK)
- access_code (string, 4 digits)
- created_at (timestamp)
- expires_at (timestamp, optional)
```

---

## 5. EVENT UPDATES (Postponement, Venue, Time Changes) ❌ NOT IMPLEMENTED

### Current Status
- ❌ No event editing endpoint
- ❌ No postponement logic
- ❌ No venue/time update logic
- ❌ No notification to attendees
- ❌ No frontend UI for organizers

### Diagnosis
This is completely missing. Organizers can't update events after creation.

### Proposal: Implement Event Updates with Notifications
**Effort**: 5-6 hours

#### Backend Changes (simple_main.py)
1. Add endpoint: `PUT /api/events/{event_id}`
   - Allow organizers to update: title, description, venue, start_date, end_date, capacity
   - Track what changed (for notifications)
   - Validate new dates are in future
   - Return updated event

2. Add endpoint: `POST /api/events/{event_id}/postpone`
   - Input: new_date, reason
   - Create postponement record
   - Notify all ticket holders

3. Add endpoint: `GET /api/events/{event_id}/changes`
   - Return change history with timestamps

#### Frontend Changes
1. Create `EditEventModal.tsx` component
   - Form with all editable fields
   - Date/time pickers
   - Venue input with autocomplete
   - Capacity input
   - Submit button

2. Update `OrganizerDashboard.tsx`
   - Add "Edit" button on each event card
   - Opens EditEventModal
   - Shows change history

3. Create `EventChangesTimeline.tsx`
   - Shows all changes to event
   - Timestamps and what changed

#### Database Schema
```
event_changes table:
- id (UUID)
- event_id (FK)
- changed_by (user_id)
- field_name (string)
- old_value (string)
- new_value (string)
- reason (string, optional)
- created_at (timestamp)

postponements table:
- id (UUID)
- event_id (FK)
- original_date (datetime)
- new_date (datetime)
- reason (string)
- created_at (timestamp)
```

#### Notification Flow
When event is updated:
1. Check what changed
2. Send notification to all ticket holders
3. Include change details in notification
4. For postponement, include new date and reason

---

## 6. SPRAY MONEY ⚠️ PLACEHOLDER ONLY

### Current Status
- ⚠️ Backend endpoints exist but are placeholders
- ❌ No actual implementation
- ❌ No frontend UI
- ❌ No database schema

### Diagnosis
The feature is stubbed out but not implemented. Need to clarify the business logic first.

### Proposal: Implement Spray Money (Livestream Tipping)
**Effort**: 6-8 hours

#### Business Logic
- Spray money is a way to send tips during livestreams
- Users send money from wallet to event organizer
- Organizer receives money in real-time
- Leaderboard shows top sprayers
- Works during event livestream

#### Backend Changes (simple_main.py)
1. Add endpoint: `POST /api/events/{event_id}/spray-money`
   - Input: amount, sprayer_name (optional, can be anonymous)
   - Deduct from user wallet
   - Add to organizer wallet
   - Create spray transaction record
   - Broadcast to all connected users (WebSocket)

2. Add endpoint: `GET /api/events/{event_id}/spray-money-leaderboard`
   - Return top sprayers with amounts
   - Real-time updates via WebSocket

3. Add WebSocket endpoint for spray money updates
   - Broadcast spray transactions to all connected clients
   - Show real-time leaderboard updates

#### Frontend Changes
1. Create `SprayMoneyWidget.tsx` component
   - Quick amount buttons (₦100, ₦500, ₦1000, ₦5000)
   - Custom amount input
   - Sprayer name input (optional)
   - Send button
   - Shows confirmation

2. Create `SprayMoneyLeaderboard.tsx` component
   - Real-time leaderboard of top sprayers
   - Updates as new sprays come in
   - Shows sprayer name and amount

3. Update `EventDetail.tsx` page
   - Add SprayMoneyWidget during livestream
   - Add SprayMoneyLeaderboard on side panel
   - Only show during event time

#### Database Schema
```
spray_money_transactions table:
- id (UUID)
- event_id (FK)
- sprayer_id (user_id, FK)
- sprayer_name (string, optional)
- amount (decimal)
- is_anonymous (boolean)
- created_at (timestamp)
```

#### WebSocket Events
```
spray_money:new_spray
{
  event_id: string,
  sprayer_name: string,
  amount: number,
  timestamp: ISO8601
}

spray_money:leaderboard_update
{
  event_id: string,
  leaderboard: [
    { sprayer_name: string, amount: number, rank: number }
  ]
}
```

---

## 7. GROUP BUY (Bulk Ticket Purchase) ⚠️ PLACEHOLDER ONLY

### Current Status
- ⚠️ Backend endpoint exists but is placeholder
- ❌ No actual implementation
- ❌ No frontend UI
- ❌ No split payment logic

### Diagnosis
The feature is stubbed out. Need to implement bulk purchase with split payment links.

### Proposal: Implement Group Buy with Split Payments
**Effort**: 7-8 hours

#### Business Logic
- Organizer/group leader buys multiple tickets at once
- Gets discount for bulk purchase (e.g., 10% off for 10+ tickets)
- Can create split payment links to share with group members
- Each member pays their share via unique link
- Tickets distributed once all payments received

#### Backend Changes (simple_main.py)
1. Add endpoint: `POST /api/tickets/bulk-purchase`
   - Input: event_id, quantity, buyer_type (individual/organization)
   - Calculate bulk discount
   - Create bulk purchase record
   - Return purchase_id and split payment links

2. Add endpoint: `POST /api/tickets/bulk-purchase/{purchase_id}/split-links`
   - Generate unique payment links for each ticket
   - Each link is shareable
   - Link includes: event, ticket price, buyer name

3. Add endpoint: `POST /api/tickets/bulk-purchase/{purchase_id}/pay-share`
   - Input: share_link_id, payment_method
   - Process payment for one share
   - Check if all shares paid
   - If all paid, issue all tickets

4. Add endpoint: `GET /api/tickets/bulk-purchase/{purchase_id}/status`
   - Return: total tickets, paid count, pending count
   - List of who paid and who hasn't

#### Frontend Changes
1. Create `BulkPurchaseModal.tsx` component
   - Event selection
   - Quantity input with bulk discount display
   - Buyer type selection (individual/organization)
   - Organization name input (if org)
   - Submit button

2. Create `SplitPaymentLinks.tsx` component
   - Shows all split payment links
   - Copy to clipboard button for each link
   - QR code for each link
   - Shows payment status for each share

3. Create `BulkPurchaseStatus.tsx` component
   - Shows progress: X of Y paid
   - List of participants with payment status
   - Resend payment link button

4. Update `EventDetail.tsx` page
   - Add "Buy in Bulk" button
   - Opens BulkPurchaseModal

5. Create `PaymentShare.tsx` page
   - Accessed via split payment link
   - Shows event details
   - Shows share amount
   - Payment form
   - Confirmation after payment

#### Database Schema
```
bulk_purchases table:
- id (UUID)
- event_id (FK)
- buyer_id (user_id, FK)
- quantity (integer)
- total_amount (decimal)
- discount_percentage (decimal)
- final_amount (decimal)
- status (pending/partial/completed)
- created_at (timestamp)

bulk_purchase_shares table:
- id (UUID)
- bulk_purchase_id (FK)
- share_link (string, unique)
- share_number (integer)
- amount (decimal)
- status (pending/paid)
- paid_by_user_id (user_id, FK, nullable)
- paid_at (timestamp, nullable)
- created_at (timestamp)
```

#### Bulk Discount Logic
```
1-5 tickets: 0% discount
6-10 tickets: 5% discount
11-20 tickets: 10% discount
21+ tickets: 15% discount
```

---

## 8. ONBOARDING WITH EVENT PREFERENCES ⚠️ PARTIALLY COMPLETE

### Current Status
- ✅ Onboarding flow exists
- ✅ Language selection implemented
- ✅ State selection implemented
- ❌ Event preferences NOT collected
- ❌ Preferences NOT used for recommendations

### Diagnosis
The onboarding collects basic info but doesn't ask about event interests. This means recommendations aren't personalized.

### Proposal: Complete Onboarding with Event Preferences
**Effort**: 4-5 hours

#### Backend Changes (simple_main.py)
1. Add endpoint: `POST /api/users/{user_id}/preferences`
   - Input: event_types (array), interests (array)
   - Store in user profile
   - Return success

2. Add endpoint: `GET /api/users/{user_id}/preferences`
   - Return user's event preferences

3. Update event feed endpoint to use preferences
   - Filter events based on user preferences
   - Boost events matching user interests

#### Frontend Changes
1. Update `OnboardingFlow.tsx` component
   - Add new step: "What events interest you?"
   - Show after language and state selection

2. Create `EventPreferencesSelector.tsx` component
   - Multi-select checkboxes for event types:
     - Weddings
     - Concerts
     - Festivals
     - Conferences
     - Parties
     - Sports
     - Comedy
     - Theater
     - Other
   - Allow selecting 3-5 preferences
   - Next button to continue

3. Update `BrowseEvents.tsx` page
   - Show personalized recommendations first
   - Filter by user preferences
   - Show "Based on your interests" section

#### Database Schema
```
user_preferences table:
- id (UUID)
- user_id (FK)
- event_types (array of strings)
- interests (array of strings)
- updated_at (timestamp)
```

#### Onboarding Flow
```
1. Language Selection
2. State Selection
3. Role Selection (Attendee/Organizer)
4. Event Preferences (NEW)
5. Profile Completion
6. Redirect to Dashboard
```

---

## Implementation Priority & Timeline

### Phase 1: Critical (Week 1)
1. **Event Updates** (5-6 hrs) - Organizers need to update events
2. **Wallet Withdrawal** (2-3 hrs) - Users need to cash out

### Phase 2: High Value (Week 2)
3. **Secret Invites UI** (3-4 hrs) - Complete existing backend
4. **Onboarding Preferences** (4-5 hrs) - Better recommendations

### Phase 3: Revenue Features (Week 3)
5. **Group Buy** (7-8 hrs) - Bulk purchase with split payments
6. **Spray Money** (6-8 hrs) - Livestream tipping

### Phase 4: Polish (Week 4)
7. Testing & bug fixes
8. Performance optimization
9. Mobile testing

---

## Summary Table

| Feature | Status | Effort | Priority | Impact |
|---------|--------|--------|----------|--------|
| Wallet Withdrawal | ❌ | 2-3h | High | Revenue |
| Event Updates | ❌ | 5-6h | Critical | UX |
| Secret Invites UI | ⚠️ | 3-4h | High | UX |
| Spray Money | ❌ | 6-8h | Medium | Revenue |
| Group Buy | ❌ | 7-8h | Medium | Revenue |
| Onboarding Prefs | ⚠️ | 4-5h | Medium | UX |
| PWA/Mobile | ✅ | 0h | Done | - |
| Tickets | ✅ | 0h | Done | - |

**Total Effort**: ~35-40 hours
**Recommended Timeline**: 4 weeks with 2 developers

---

## Next Steps
1. Prioritize which features to build first
2. Assign developers to each feature
3. Set up feature branches
4. Begin with Phase 1 (Event Updates + Wallet Withdrawal)
5. Test each feature thoroughly before merging
