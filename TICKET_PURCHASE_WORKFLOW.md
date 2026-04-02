# Attendee Dashboard Ticket Purchase Workflow

## Overview
The ticket purchase workflow in Grooovy allows attendees to browse events, select ticket tiers, and complete purchases using multiple payment methods (Flutterwave card payment or wallet balance).

---

## Complete User Journey

### 1. **Event Discovery** (AttendeeDashboard.tsx)
**Entry Points:**
- Attendee Dashboard → "Browse Events" card
- Direct navigation to `/events`
- Event recommendations/notifications

**What Happens:**
- User sees list of available events
- Can filter by category, location, date
- Clicks on event card to view details

---

### 2. **Event Details Page** (EventDetail.tsx)

**URL**: `/events/:eventId`

**Page Components:**
```
┌─────────────────────────────────────┐
│  Event Header (Title, Organizer)   │
├─────────────────────────────────────┤
│  Event Images/Gallery               │
├─────────────────────────────────────┤
│  Description & Details              │
│  - Venue                            │
│  - Date/Time                        │
│  - Category                         │
├─────────────────────────────────────┤
│  Ticket Tiers Section               │
│  ┌───────────────────────────────┐  │
│  │ Tier 1: VIP - ₦50,000        │  │
│  │ Tier 2: Regular - ₦25,000    │  │
│  │ Tier 3: Standing - ₦10,000   │  │
│  └───────────────────────────────┘  │
├─────────────────────────────────────┤
│  Quantity Selector (1-10)           │
├─────────────────────────────────────┤
│  [Purchase Button]                  │
└─────────────────────────────────────┘
```

**User Actions:**
1. Select ticket tier (dropdown/radio buttons)
2. Choose quantity (1-10 tickets)
3. See total price calculation: `price × quantity`
4. Click "Buy Ticket" button

**Data Fetched:**
```javascript
GET /api/events/:eventId
Response: {
  success: true,
  data: {
    id: "event-123",
    title: "Concert Night",
    ticketTiers: [
      { name: "VIP", price: 50000, quantity: 100, sold: 45 },
      { name: "Regular", price: 25000, quantity: 500, sold: 320 }
    ],
    // ... other event details
  }
}
```

---

### 3. **Purchase Button Click** (PurchaseButton.tsx)

**Component Props:**
```typescript
{
  eventId: string,
  eventTitle: string,
  tierName: string,
  unitPrice: number,
  quantity: number,
  totalAmount: number
}
```

**Authentication Check:**
```javascript
if (!user) {
  // Redirect to login with return URL
  navigate('/login', { 
    state: { 
      returnTo: `/events/${eventId}`,
      message: 'Please log in to purchase tickets'
    }
  });
  return;
}
```

**If Authenticated:**
- Opens `SecurePaymentModal`
- Passes all ticket details to modal

---

### 4. **Payment Modal** (SecurePaymentModal.tsx)

**Modal Structure:**
```
┌─────────────────────────────────────┐
│  Secure Payment                     │
├─────────────────────────────────────┤
│  Event: Concert Night               │
│  Tier: VIP                          │
│  Quantity: 2 tickets                │
│  Total: ₦100,000                    │
├─────────────────────────────────────┤
│  Payment Method:                    │
│  ○ Card (Flutterwave)               │
│  ○ Wallet (Balance: ₦50,000)        │
├─────────────────────────────────────┤
│  [Cancel]  [Pay Now]                │
└─────────────────────────────────────┘
```

**On Modal Open:**
1. Loads Flutterwave SDK script
2. Fetches user's wallet balance:
   ```javascript
   GET /api/wallet/balance
   Response: { success: true, balance: 50000 }
   ```
3. Shows available payment methods

---

### 5. **Payment Processing**

#### **Option A: Card Payment (Flutterwave)**

**Step 1: Generate Transaction Reference**
```javascript
const reference = `TKT_${Date.now()}_${randomString}`;
// Example: "TKT_1704067200000_abc123xyz"
```

**Step 2: Open Flutterwave Checkout**
```javascript
window.FlutterwaveCheckout({
  public_key: VITE_FLUTTERWAVE_PUBLIC_KEY,
  tx_ref: reference,
  amount: 100000, // Total amount in Naira
  currency: 'NGN',
  payment_options: 'card,mobilemoney,ussd,banktransfer',
  customer: {
    email: user.email,
    phone_number: user.phoneNumber,
    name: `${user.firstName} ${user.lastName}`
  },
  customizations: {
    title: 'Grooovy Ticket Purchase',
    description: '2x VIP - Concert Night',
    logo: ''
  },
  meta: {
    event_id: eventId,
    user_id: user.id,
    ticket_quantity: 2,
    ticket_tier: 'VIP'
  },
  callback: (response) => {
    // Handle success
  },
  onclose: () => {
    // Handle cancellation
  }
});
```

**Step 3: Flutterwave Modal Opens**
- User enters card details
- Completes 3D Secure authentication
- Flutterwave processes payment

**Step 4: Payment Callback**
```javascript
callback: async (response) => {
  if (response.status === 'successful') {
    // Verify payment on backend
    await verifyPayment(response.transaction_id, reference);
  }
}
```

**Step 5: Backend Verification**
```javascript
POST /api/payments/verify
Body: {
  transaction_id: "flw_tx_123456",
  reference: "TKT_1704067200000_abc123xyz"
}

Response: {
  success: true,
  verified: true,
  amount: 100000,
  status: "successful"
}
```

#### **Option B: Wallet Payment**

**Step 1: Check Sufficient Balance**
```javascript
if (userWalletBalance < totalAmount) {
  alert('Insufficient wallet balance. Please top up or use card payment.');
  return;
}
```

**Step 2: Process Wallet Payment**
```javascript
POST /api/payments/wallet
Body: {
  amount: 10000000, // Amount in kobo (₦100,000 × 100)
  reference: "TKT_1704067200000_abc123xyz",
  event_id: "event-123",
  ticket_details: {
    quantity: 2,
    tierName: "VIP",
    unitPrice: 50000
  }
}

Response: {
  success: true,
  transaction_id: "wallet_tx_789",
  new_balance: 0 // Updated wallet balance
}
```

---

### 6. **Ticket Creation** (After Successful Payment)

**Triggered by:** `onSuccess` callback in PurchaseButton

**API Call:**
```javascript
POST /api/tickets/create
Headers: {
  Authorization: "Bearer {access_token}"
}
Body: {
  event_id: "event-123",
  quantity: 2,
  tier_name: "VIP",
  payment_reference: "TKT_1704067200000_abc123xyz",
  transaction_id: "flw_tx_123456" // or "wallet_tx_789"
}

Response: {
  success: true,
  tickets: [
    {
      id: "ticket-001",
      qr_code: "base64_encoded_qr",
      ticket_number: "GRV-001-VIP-001"
    },
    {
      id: "ticket-002",
      qr_code: "base64_encoded_qr",
      ticket_number: "GRV-001-VIP-002"
    }
  ]
}
```

**Backend Actions:**
1. Validates payment reference
2. Creates ticket records in database
3. Generates unique QR codes for each ticket
4. Updates event's `tickets_sold` count
5. Sends confirmation email/SMS
6. Creates transaction record

---

### 7. **Success & Redirect**

**User Sees:**
```
┌─────────────────────────────────────┐
│  ✅ Purchase Successful!            │
│                                     │
│  🎉 2 tickets have been added      │
│     to your account.                │
│                                     │
│  [View My Tickets]                  │
└─────────────────────────────────────┘
```

**Automatic Redirect:**
```javascript
navigate('/attendee/tickets');
```

---

### 8. **My Tickets Page** (MyTickets.tsx)

**URL**: `/attendee/tickets`

**Displays:**
```
┌─────────────────────────────────────┐
│  My Tickets                         │
├─────────────────────────────────────┤
│  ┌───────────────────────────────┐  │
│  │ Concert Night                 │  │
│  │ VIP Ticket #GRV-001-VIP-001   │  │
│  │ Date: Jan 20, 2024            │  │
│  │ [QR Code]                     │  │
│  │ [Download] [Share]            │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │ Concert Night                 │  │
│  │ VIP Ticket #GRV-001-VIP-002   │  │
│  │ Date: Jan 20, 2024            │  │
│  │ [QR Code]                     │  │
│  │ [Download] [Share]            │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

---

## Error Handling

### Common Error Scenarios:

#### 1. **Not Logged In**
```
Action: Redirect to /login with return URL
Message: "Please log in to purchase tickets"
```

#### 2. **Insufficient Wallet Balance**
```
Action: Show alert, suggest card payment or top-up
Message: "Insufficient wallet balance. Please top up or use card payment."
```

#### 3. **Payment Failed**
```
Action: Show error modal, allow retry
Message: "Payment failed: [error reason]"
```

#### 4. **Sold Out**
```
Action: Disable purchase button
Message: "This tier is sold out"
```

#### 5. **Ticket Creation Failed**
```
Action: Show error, contact support
Message: "Payment was successful, but there was an issue creating your tickets. Please contact support."
Note: Payment reference is saved for manual ticket creation
```

---

## Database Updates

### Tables Affected:

#### 1. **tickets**
```sql
INSERT INTO tickets (
  id, event_id, user_id, tier_name, 
  price, qr_code, ticket_number, status
) VALUES (...)
```

#### 2. **payments**
```sql
INSERT INTO payments (
  id, user_id, amount, reference, 
  transaction_id, status, payment_method
) VALUES (...)
```

#### 3. **events**
```sql
UPDATE events 
SET tickets_sold = tickets_sold + 2
WHERE id = 'event-123'
```

#### 4. **wallets** (if wallet payment)
```sql
UPDATE wallets 
SET balance = balance - 100000
WHERE user_id = 'user-456'
```

---

## Key Components Summary

| Component | Purpose | Location |
|-----------|---------|----------|
| **AttendeeDashboard** | Entry point, event discovery | `pages/attendee/` |
| **EventDetail** | Event info, tier selection | `pages/` |
| **PurchaseButton** | Initiates purchase flow | `components/tickets/` |
| **SecurePaymentModal** | Payment method selection | `components/payment/` |
| **PaymentMethodSelector** | Card/Wallet toggle | `components/tickets/` |
| **MyTickets** | View purchased tickets | `pages/attendee/` |

---

## Payment Flow Diagram

```
User Clicks "Buy Ticket"
         ↓
   Check Authentication
         ↓
   [Not Logged In] → Redirect to Login
         ↓
   [Logged In] → Open Payment Modal
         ↓
   Select Payment Method
         ↓
   ┌─────────┴─────────┐
   ↓                   ↓
[Card]            [Wallet]
   ↓                   ↓
Flutterwave      Check Balance
Checkout              ↓
   ↓            [Sufficient] → Deduct
   ↓                   ↓
User Pays        Backend Confirms
   ↓                   ↓
Verify Payment   ←─────┘
   ↓
Create Tickets
   ↓
Send Confirmation
   ↓
Redirect to My Tickets
```

---

## Security Features

1. ✅ **Authentication Required** - Must be logged in
2. ✅ **JWT Token Validation** - All API calls authenticated
3. ✅ **Payment Verification** - Backend verifies with Flutterwave
4. ✅ **Transaction References** - Unique, timestamped references
5. ✅ **QR Code Generation** - Unique codes per ticket
6. ✅ **Balance Checks** - Wallet balance validated before deduction
7. ✅ **Idempotency** - Duplicate payments prevented by reference

---

## Future Enhancements

- [ ] Group buy functionality
- [ ] Split payment links
- [ ] Bulk purchase discounts
- [ ] Referral code application
- [ ] Promo code support
- [ ] Installment payments
- [ ] Gift tickets feature
