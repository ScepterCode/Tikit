# 📋 Organizer Dashboard Design

## URL: `/organizer/dashboard`

## Layout Structure

### Main Navigation (Top Bar)
```
┌─────────────────────────────────────────────────────────────┐
│ [Logo] Grooovy Organizer    [🔔] [👤 John] [⚙️]              │
└─────────────────────────────────────────────────────────────┘
```

### Side Navigation (Left Sidebar)
```
┌──────────────────┐
│ 📊 Dashboard     │
│ 🎪 My Events     │
│ ➕ Create Event  │
│ 📈 Analytics     │
│ 👥 Attendees     │
│ 💰 Financials    │
│ 📢 Broadcast     │
│ 🎫 Scan Tickets  │
│ 👤 Profile       │
│ ⚙️ Settings      │
│ 📞 Help          │
│ 🚪 Logout        │
└──────────────────┘
```

---

## 1. Dashboard Overview

### URL: `/organizer/dashboard`

```
┌─────────────────────────────────────────────────────────────┐
│  Welcome back, John! 👋                                     │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ 🎪 Events    │  │ 🎫 Tickets   │  │ 💰 Revenue   │     │
│  │    12        │  │    1,234     │  │  ₦2.5M       │     │
│  │ Active       │  │ Sold         │  │  This Month  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ 👥 Attendees │  │ 📊 Conversion│  │ ⭐ Rating    │     │
│  │    856       │  │    68%       │  │  4.8/5.0     │     │
│  │ Total        │  │ Rate         │  │  (124 reviews)│    │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  Upcoming Events                                            │
│  ┌────────────────────────────────────────────────┐        │
│  │ 🎊 New Year Festival 2026                      │        │
│  │ Jan 1, 2026 • 234/500 tickets sold            │        │
│  │ [View] [Edit] [Analytics]                      │        │
│  └────────────────────────────────────────────────┘        │
│                                                              │
│  Recent Activity                                            │
│  • 5 tickets sold for "Wedding of John & Mary"             │
│  • New review (5⭐) for "Lagos Festival"                    │
│  • Payment received: ₦50,000                                │
│                                                              │
│  Quick Actions                                              │
│  [+ Create Event] [📊 View Analytics] [📢 Broadcast]       │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. My Events View

### URL: `/organizer/events`

```
┌─────────────────────────────────────────────────────────────┐
│  My Events                                                   │
│                                                              │
│  [+ Create New Event]                                        │
│                                                              │
│  [All] [Upcoming] [Past] [Draft]                            │
│  🔍 Search events...                                         │
│                                                              │
│  ┌────────────────────────────────────────────────┐        │
│  │ 🎊 New Year Festival 2026                      │        │
│  │ Jan 1, 2026 • Tafawa Balewa Square, Lagos      │        │
│  │                                                 │        │
│  │ 📊 234/500 tickets sold (47%)                  │        │
│  │ 💰 ₦1,170,000 revenue                          │        │
│  │ Status: 🟢 Active                               │        │
│  │                                                 │        │
│  │ [View] [Edit] [Analytics] [Broadcast] [•••]    │        │
│  └────────────────────────────────────────────────┘        │
│                                                              │
│  ┌────────────────────────────────────────────────┐        │
│  │ 💒 Wedding of John & Mary                      │        │
│  │ Dec 30, 2025 • Eko Hotel, Lagos                │        │
│  │                                                 │        │
│  │ 📊 450/500 tickets sold (90%)                  │        │
│  │ 💰 ₦2,250,000 revenue                          │        │
│  │ Status: 🟢 Active • 🔥 Almost Full             │        │
│  │                                                 │        │
│  │ [View] [Edit] [Analytics] [Broadcast] [•••]    │        │
│  └────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

### Event Actions Menu (•••)
```
┌──────────────────────┐
│ 📋 Duplicate Event   │
│ 📊 View Analytics    │
│ 📢 Broadcast Message │
│ 📥 Export Attendees  │
│ 🎫 Scan Tickets      │
│ ⚙️ Settings          │
│ 🗑️ Delete Event      │
└──────────────────────┘
```

---

## 3. Create Event View

### URL: `/organizer/create`

**Multi-step form with progress indicator**

#### Step 1: Event Template
```
┌─────────────────────────────────────────────────────────────┐
│  Create New Event                                            │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│  Step 1 of 5: Choose Template                                │
│                                                              │
│  Select event type:                                         │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                 │
│  │   💒     │  │   ⛪      │  │   🪦     │                 │
│  │ Wedding  │  │ Crusade  │  │ Burial   │                 │
│  └──────────┘  └──────────┘  └──────────┘                 │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                 │
│  │   🎪     │  │   🎵     │  │   📋     │                 │
│  │ Festival │  │ Concert  │  │ General  │                 │
│  └──────────┘  └──────────┘  └──────────┘                 │
│                                                              │
│  [Continue]                                                  │
└─────────────────────────────────────────────────────────────┘
```

#### Step 2: Basic Information
```
┌─────────────────────────────────────────────────────────────┐
│  Create New Event                                            │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│  Step 2 of 5: Basic Information                              │
│                                                              │
│  Event Title *                                              │
│  ┌─────────────────────────────────────────┐               │
│  │                                          │               │
│  └─────────────────────────────────────────┘               │
│                                                              │
│  Description *                                              │
│  ┌─────────────────────────────────────────┐               │
│  │                                          │               │
│  │                                          │               │
│  │                                          │               │
│  └─────────────────────────────────────────┘               │
│                                                              │
│  Event Images (up to 5)                                     │
│  ┌───────┐ ┌───────┐ ┌───────┐                            │
│  │ [+]   │ │       │ │       │                            │
│  │Upload │ │       │ │       │                            │
│  └───────┘ └───────┘ └───────┘                            │
│                                                              │
│  [Back] [Continue]                                          │
└─────────────────────────────────────────────────────────────┘
```

#### Step 3: Date & Location
```
┌─────────────────────────────────────────────────────────────┐
│  Create New Event                                            │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│  Step 3 of 5: Date & Location                                │
│                                                              │
│  Start Date & Time *                                        │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │ Dec 30, 2025 ▼   │  │ 2:00 PM ▼        │               │
│  └──────────────────┘  └──────────────────┘               │
│                                                              │
│  End Date & Time *                                          │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │ Dec 30, 2025 ▼   │  │ 11:00 PM ▼       │               │
│  └──────────────────┘  └──────────────────┘               │
│                                                              │
│  Venue *                                                    │
│  ┌─────────────────────────────────────────┐               │
│  │ Eko Hotel, Victoria Island              │               │
│  └─────────────────────────────────────────┘               │
│                                                              │
│  State *                    LGA                             │
│  ┌──────────────┐          ┌──────────────┐               │
│  │ Lagos ▼      │          │ Eti-Osa ▼    │               │
│  └──────────────┘          └──────────────┘               │
│                                                              │
│  [📍 Use Current Location] [🗺️ View on Map]                │
│                                                              │
│  [Back] [Continue]                                          │
└─────────────────────────────────────────────────────────────┘
```

#### Step 4: Tickets & Pricing
```
┌─────────────────────────────────────────────────────────────┐
│  Create New Event                                            │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│  Step 4 of 5: Tickets & Pricing                              │
│                                                              │
│  Total Capacity *                                           │
│  ┌─────────────────────────────────────────┐               │
│  │ 500                                      │               │
│  └─────────────────────────────────────────┘               │
│                                                              │
│  Ticket Tiers                                               │
│  ┌────────────────────────────────────────────────┐        │
│  │ Tier 1: VIP                                    │        │
│  │ Price: ₦10,000  Quantity: 100                 │        │
│  │ Features: Front row, VIP lounge access        │        │
│  │ [Edit] [Remove]                                │        │
│  └────────────────────────────────────────────────┘        │
│  ┌────────────────────────────────────────────────┐        │
│  │ Tier 2: Regular                                │        │
│  │ Price: ₦5,000  Quantity: 400                  │        │
│  │ Features: General admission                    │        │
│  │ [Edit] [Remove]                                │        │
│  └────────────────────────────────────────────────┘        │
│                                                              │
│  [+ Add Tier]                                               │
│                                                              │
│  Payment Options                                            │
│  ☑️ Full payment                                            │
│  ☑️ Installment plans (2, 3, 4 parts)                      │
│  ☑️ Group buy (2-5000 people)                              │
│  ☑️ Bulk booking (50-20,000)                               │
│                                                              │
│  [Back] [Continue]                                          │
└─────────────────────────────────────────────────────────────┘
```

#### Step 5: Additional Settings
```
┌─────────────────────────────────────────────────────────────┐
│  Create New Event                                            │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│  Step 5 of 5: Additional Settings                            │
│                                                              │
│  Event Visibility                                           │
│  ○ Public (visible in search)                               │
│  ● Private (requires access code)                           │
│                                                              │
│  Cultural Features (Wedding only)                           │
│  ☑️ Aso-ebi tiers                                           │
│  ☑️ Food RSVP                                               │
│  ☑️ Spray money leaderboard                                 │
│                                                              │
│  Ticket Transfer                                            │
│  ☑️ Allow ticket transfers                                  │
│  Transfer deadline: 24 hours before event                   │
│                                                              │
│  Refund Policy                                              │
│  ┌─────────────────────────────────────────┐               │
│  │ Full refund up to 7 days before event   │               │
│  │ 50% refund up to 3 days before event    │               │
│  │ No refund within 3 days of event        │               │
│  └─────────────────────────────────────────┘               │
│                                                              │
│  [Back] [Save as Draft] [Publish Event]                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Event Analytics View

### URL: `/organizer/events/:id/analytics`

```
┌─────────────────────────────────────────────────────────────┐
│  ← Back to Events                                            │
│                                                              │
│  Wedding of John & Mary - Analytics                         │
│  Dec 30, 2025 • Eko Hotel, Lagos                            │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ 🎫 Sold      │  │ 💰 Revenue   │  │ 👥 Attendees │     │
│  │  450/500     │  │  ₦2.25M      │  │    450       │     │
│  │  90%         │  │  Target: 2.5M│  │  Checked in: 0│    │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  Sales Timeline                                             │
│  ┌────────────────────────────────────────────────┐        │
│  │     [Line Chart showing sales over time]       │        │
│  │                                                 │        │
│  └────────────────────────────────────────────────┘        │
│                                                              │
│  Sales by Tier                                              │
│  ┌────────────────────────────────────────────────┐        │
│  │ VIP:     95/100 (95%)  ₦950,000               │        │
│  │ Regular: 355/400 (89%) ₦1,300,000             │        │
│  └────────────────────────────────────────────────┘        │
│                                                              │
│  Demographics                                               │
│  ┌──────────────┐  ┌──────────────┐                       │
│  │ By Location  │  │ By Age       │                       │
│  │ [Pie Chart]  │  │ [Bar Chart]  │                       │
│  └──────────────┘  └──────────────┘                       │
│                                                              │
│  Payment Methods                                            │
│  Card: 60% • Mobile Money: 25% • Airtime: 15%              │
│                                                              │
│  [Export Report] [Share Analytics]                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Attendees View

### URL: `/organizer/attendees`

```
┌─────────────────────────────────────────────────────────────┐
│  Attendees Management                                        │
│                                                              │
│  Event: [All Events ▼]                                       │
│  🔍 Search by name, phone, or ticket...                      │
│                                                              │
│  [Export to Excel] [Send Broadcast]                         │
│                                                              │
│  Filters: [All] [Checked In] [Not Checked In] [VIP]         │
│                                                              │
│  ┌────────────────────────────────────────────────┐        │
│  │ ☑️ John Doe                                     │        │
│  │ +234 801 234 5678 • john@email.com             │        │
│  │ VIP Ticket • Seat A12 • Paid ₦10,000           │        │
│  │ Status: ✅ Valid • Not checked in               │        │
│  │ [View Details] [Send Message] [Refund]         │        │
│  └────────────────────────────────────────────────┘        │
│                                                              │
│  ┌────────────────────────────────────────────────┐        │
│  │ ☑️ Mary Johnson                                 │        │
│  │ +234 802 345 6789 • mary@email.com             │        │
│  │ Regular Ticket • General Admission              │        │
│  │ Status: ✅ Valid • Not checked in               │        │
│  │ [View Details] [Send Message] [Refund]         │        │
│  └────────────────────────────────────────────────┘        │
│                                                              │
│  Showing 1-20 of 450 attendees                              │
│  [Previous] [1] [2] [3] ... [23] [Next]                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Financials View

### URL: `/organizer/financials`

```
┌─────────────────────────────────────────────────────────────┐
│  Financial Dashboard                                         │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ 💰 Total     │  │ 💳 Pending   │  │ ✅ Paid Out  │     │
│  │  ₦5.2M       │  │  ₦1.2M       │  │  ₦4.0M       │     │
│  │  Revenue     │  │  Settlement  │  │  To Account  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  Revenue by Event                                           │
│  ┌────────────────────────────────────────────────┐        │
│  │ Wedding of John & Mary    ₦2.25M  (43%)       │        │
│  │ Lagos Festival 2025       ₦1.80M  (35%)       │        │
│  │ New Year Festival 2026    ₦1.15M  (22%)       │        │
│  └────────────────────────────────────────────────┘        │
│                                                              │
│  Recent Transactions                                        │
│  ┌────────────────────────────────────────────────┐        │
│  │ ✅ Payout Completed                             │        │
│  │ ₦500,000 • Dec 28, 2025                        │        │
│  │ To: GTBank •••• 1234                           │        │
│  └────────────────────────────────────────────────┘        │
│  ┌────────────────────────────────────────────────┐        │
│  │ 💳 Ticket Sale                                  │        │
│  │ +₦10,000 • Dec 27, 2025                        │        │
│  │ Wedding of John & Mary - VIP Ticket            │        │
│  └────────────────────────────────────────────────┘        │
│                                                              │
│  [Request Payout] [View All Transactions]                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. Broadcast Messages View

### URL: `/organizer/broadcast`

```
┌─────────────────────────────────────────────────────────────┐
│  Broadcast Messages                                          │
│                                                              │
│  Send updates to your attendees                             │
│                                                              │
│  Select Event *                                             │
│  ┌─────────────────────────────────────────┐               │
│  │ Wedding of John & Mary ▼                 │               │
│  └─────────────────────────────────────────┘               │
│                                                              │
│  Recipients: 450 attendees                                  │
│                                                              │
│  Message Template                                           │
│  ┌─────────────────────────────────────────┐               │
│  │ Event Reminder ▼                         │               │
│  └─────────────────────────────────────────┘               │
│                                                              │
│  Message *                                                  │
│  ┌─────────────────────────────────────────┐               │
│  │ Hi {name},                               │               │
│  │                                          │               │
│  │ This is a reminder about {event}        │               │
│  │ on {date} at {time}.                    │               │
│  │                                          │               │
│  │ See you there!                           │               │
│  └─────────────────────────────────────────┘               │
│                                                              │
│  Send via:                                                  │
│  ☑️ WhatsApp  ☑️ SMS  ☑️ Email                              │
│                                                              │
│  [Preview] [Send to All] [Schedule]                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. Ticket Scanning View

### URL: `/organizer/scan`

```
┌─────────────────────────────────────────────────────────────┐
│  Ticket Scanner                                              │
│                                                              │
│  Event: [Wedding of John & Mary ▼]                          │
│                                                              │
│  ┌────────────────────────────────────────────────┐        │
│  │                                                 │        │
│  │         [Camera View for QR Scanning]          │        │
│  │                                                 │        │
│  │         Point camera at QR code                │        │
│  │                                                 │        │
│  └────────────────────────────────────────────────┘        │
│                                                              │
│  Or enter backup code:                                      │
│  ┌─────────────────────────────────────────┐               │
│  │ ______                                   │               │
│  └─────────────────────────────────────────┘               │
│  [Verify]                                                    │
│                                                              │
│  Today's Stats:                                             │
│  ✅ Checked in: 234  ⏳ Remaining: 216                      │
│                                                              │
│  Recent Scans:                                              │
│  • John Doe - VIP - 2:15 PM ✅                              │
│  • Mary Johnson - Regular - 2:14 PM ✅                      │
│  • Peter Obi - VIP - 2:12 PM ✅                             │
└─────────────────────────────────────────────────────────────┘
```

---

This completes the Organizer Dashboard. Next will be Admin Dashboard.
