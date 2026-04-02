# 💰 Organizer Payment Flow - Visual Diagram

## 🎫 Complete Ticket Purchase Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    ATTENDEE PURCHASES TICKET                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Payment Choice  │
                    │  Modal Opens     │
                    └──────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
            ┌──────────────┐    ┌──────────────┐
            │  Use Wallet  │    │  Pay w/Card  │
            └──────────────┘    └──────────────┘
                    │                   │
                    │                   ▼
                    │         ┌──────────────────┐
                    │         │  Flutterwave     │
                    │         │  Payment Modal   │
                    │         └──────────────────┘
                    │                   │
                    └─────────┬─────────┘
                              ▼
                    ┌──────────────────┐
                    │  Payment Success │
                    └──────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              POST /api/tickets/create (NEW ENDPOINT)             │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
        ┌────────────────────┐  ┌────────────────────┐
        │  Create Ticket(s)  │  │  Get Event Details │
        │  in Database       │  │  & Organizer ID    │
        └────────────────────┘  └────────────────────┘
                    │                   │
                    └─────────┬─────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│         ⭐ CREDIT ORGANIZER (organizer_payment_service)          │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
        ┌────────────────────┐  ┌────────────────────┐
        │  Calculate Fees    │  │  Check for         │
        │  Platform: 5%      │  │  Duplicate         │
        │  Organizer: 95%    │  │  Transaction       │
        └────────────────────┘  └────────────────────┘
                    │                   │
                    └─────────┬─────────┘
                              ▼
                    ┌──────────────────┐
                    │  Update Wallet   │
                    │  Balance         │
                    │  +₦23,750        │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Create          │
                    │  Transaction     │
                    │  Record          │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Send            │
                    │  Notification    │
                    │  to Organizer    │
                    └──────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ✅ SUCCESS RESPONSE                           │
│  - Tickets created                                               │
│  - Organizer credited                                            │
│  - Transaction recorded                                          │
│  - Notification sent                                             │
└─────────────────────────────────────────────────────────────────┘
```

## 💸 Money Flow Example

### Scenario: Attendee buys 2 VIP tickets @ ₦25,000 each

```
┌─────────────────────────────────────────────────────────┐
│  ATTENDEE PAYMENT                                        │
├─────────────────────────────────────────────────────────┤
│  2 tickets × ₦25,000 = ₦50,000                          │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│  PLATFORM FEE CALCULATION                                │
├─────────────────────────────────────────────────────────┤
│  Total: ₦50,000                                          │
│  Platform Fee (5%): ₦2,500                               │
│  Organizer Share (95%): ₦47,500                          │
└─────────────────────────────────────────────────────────┘
                        │
            ┌───────────┴───────────┐
            │                       │
            ▼                       ▼
┌──────────────────────┐  ┌──────────────────────┐
│  PLATFORM REVENUE    │  │  ORGANIZER WALLET    │
├──────────────────────┤  ├──────────────────────┤
│  +₦2,500             │  │  +₦47,500            │
│  (5% fee)            │  │  (95% share)         │
└──────────────────────┘  └──────────────────────┘
```

## 🔄 Database Updates

```
┌─────────────────────────────────────────────────────────┐
│  TICKETS TABLE                                           │
├─────────────────────────────────────────────────────────┤
│  INSERT 2 new tickets                                    │
│  - event_id: abc-123                                     │
│  - user_id: attendee-456                                 │
│  - tier_name: VIP                                        │
│  - price: 25000                                          │
│  - payment_reference: FLW_REF_789                        │
│  - status: active                                        │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  WALLETS TABLE                                           │
├─────────────────────────────────────────────────────────┤
│  UPDATE organizer wallet                                 │
│  - user_id: organizer-123                                │
│  - balance: 100000 → 147500 (+47500)                     │
│  - updated_at: NOW()                                     │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  TRANSACTIONS TABLE                                      │
├─────────────────────────────────────────────────────────┤
│  INSERT new transaction                                  │
│  - user_id: organizer-123                                │
│  - type: credit                                          │
│  - amount: 47500                                         │
│  - description: "Ticket sale: 2x Event Name"             │
│  - reference: TICKET_SALE_FLW_REF_789                    │
│  - status: completed                                     │
│  - metadata: {event_id, ticket_price, quantity, ...}     │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  NOTIFICATIONS TABLE                                     │
├─────────────────────────────────────────────────────────┤
│  INSERT new notification                                 │
│  - user_id: organizer-123                                │
│  - type: ticket_sold                                     │
│  - title: "🎉 Ticket Sold!"                              │
│  - message: "You earned ₦47,500 from 2 tickets..."      │
│  - read: false                                           │
└─────────────────────────────────────────────────────────┘
```

## 🛡️ Security & Error Handling

```
┌─────────────────────────────────────────────────────────┐
│  DUPLICATE PREVENTION                                    │
├─────────────────────────────────────────────────────────┤
│  Check if transaction with same reference exists         │
│  If exists → Return error, don't credit again            │
│  If not exists → Proceed with credit                     │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  ERROR HANDLING                                          │
├─────────────────────────────────────────────────────────┤
│  If organizer credit fails:                              │
│  - Log error with full details                           │
│  - Don't fail ticket creation                            │
│  - Return success with organizer_credited: false         │
│  - Admin can manually credit later                       │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  AUDIT TRAIL                                             │
├─────────────────────────────────────────────────────────┤
│  Every credit is logged with:                            │
│  - Event ID                                              │
│  - Attendee ID                                           │
│  - Payment reference                                     │
│  - Amount credited                                       │
│  - Platform fee                                          │
│  - Timestamp                                             │
│  - Full metadata                                         │
└─────────────────────────────────────────────────────────┘
```

## 📊 Monitoring Dashboard (Future)

```
┌─────────────────────────────────────────────────────────┐
│  ORGANIZER EARNINGS DASHBOARD                            │
├─────────────────────────────────────────────────────────┤
│  Total Earnings:        ₦147,500                         │
│  Total Tickets Sold:    6                                │
│  Platform Fees Paid:    ₦7,500                           │
│  Available to Withdraw: ₦147,500                         │
│  Pending Payouts:       ₦0                               │
│                                                          │
│  Recent Sales:                                           │
│  - 2 tickets @ ₦25,000 → +₦47,500 (2 mins ago)          │
│  - 1 ticket @ ₦10,000 → +₦9,500 (1 hour ago)            │
│  - 3 tickets @ ₦15,000 → +₦42,750 (3 hours ago)         │
└─────────────────────────────────────────────────────────┘
```

---

**This flow ensures organizers get paid automatically and reliably!**
