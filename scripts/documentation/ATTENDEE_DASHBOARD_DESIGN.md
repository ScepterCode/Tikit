# 🎫 Attendee Dashboard Design

## URL: `/dashboard` (for attendees)

## Layout Structure

### Main Navigation (Top Bar)
```
┌─────────────────────────────────────────────────────────────┐
│ [Logo] Grooovy    [🔍 Search]    [🔔] [👤 John] [⚙️]         │
└─────────────────────────────────────────────────────────────┘
```

### Side Navigation (Left Sidebar)
```
┌──────────────┐
│ 🏠 Home      │
│ 🎫 My Tickets│
│ 💰 Wallet    │
│ 🎁 Referrals │
│ 👤 Profile   │
│ ⚙️ Settings  │
│ 📞 Help      │
│ 🚪 Logout    │
└──────────────┘
```

---

## 1. Home/Dashboard View

### URL: `/dashboard`

```
┌─────────────────────────────────────────────────────────────┐
│  Welcome back, John! 👋                                     │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ 🎫 Tickets   │  │ 💰 Wallet    │  │ 🎁 Referrals │     │
│  │    5         │  │  ₦2,500      │  │    3 friends │     │
│  │ Active       │  │  Balance     │  │    ₦600 earned│    │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  Upcoming Events                                            │
│  ┌────────────────────────────────────────────────┐        │
│  │ 📅 Wedding of John & Mary                      │        │
│  │ Dec 30, 2025 • Lagos • VIP Ticket              │        │
│  │ [View Ticket] [Get Directions]                 │        │
│  └────────────────────────────────────────────────┘        │
│                                                              │
│  Recommended Events                                         │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐                  │
│  │Event │  │Event │  │Event │  │Event │                  │
│  │Card  │  │Card  │  │Card  │  │Card  │                  │
│  └──────┘  └──────┘  └──────┘  └──────┘                  │
│                                                              │
│  Browse All Events →                                        │
└─────────────────────────────────────────────────────────────┘
```

**Components**:
- Quick stats cards
- Upcoming events list
- Personalized recommendations
- Quick actions

---

## 2. My Tickets View

### URL: `/tickets`

```
┌─────────────────────────────────────────────────────────────┐
│  My Tickets                                                  │
│                                                              │
│  [All] [Upcoming] [Past] [Expired]                          │
│                                                              │
│  ┌────────────────────────────────────────────────┐        │
│  │ 🎫 Wedding of John & Mary                      │        │
│  │ Dec 30, 2025 • 2:00 PM                         │        │
│  │ Eko Hotel, Lagos                               │        │
│  │                                                 │        │
│  │ Tier: VIP • Seat: A12                          │        │
│  │ Status: ✅ Valid                                │        │
│  │                                                 │        │
│  │ [View QR Code] [Share] [Download]              │        │
│  └────────────────────────────────────────────────┘        │
│                                                              │
│  ┌────────────────────────────────────────────────┐        │
│  │ 🎪 Lagos Festival 2025                         │        │
│  │ Jan 15, 2026 • 10:00 AM                        │        │
│  │ Tafawa Balewa Square                           │        │
│  │                                                 │        │
│  │ Tier: Regular • General Admission              │        │
│  │ Status: ✅ Valid                                │        │
│  │                                                 │        │
│  │ [View QR Code] [Share] [Download]              │        │
│  └────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

### Ticket Detail Modal
```
┌─────────────────────────────────────────────────────────────┐
│  Wedding of John & Mary                              [✕]    │
│                                                              │
│  ┌──────────────────────────────────────────────┐          │
│  │                                               │          │
│  │           [QR CODE IMAGE]                     │          │
│  │                                               │          │
│  │         Scan at venue entrance                │          │
│  └──────────────────────────────────────────────┘          │
│                                                              │
│  Backup Code: 123456                                        │
│  (Use if QR code doesn't work)                              │
│                                                              │
│  Event Details:                                             │
│  📅 Date: December 30, 2025                                 │
│  🕐 Time: 2:00 PM                                           │
│  📍 Venue: Eko Hotel, Victoria Island, Lagos               │
│  🎫 Tier: VIP                                               │
│  💺 Seat: A12                                               │
│  👤 Name: John Doe                                          │
│                                                              │
│  [Share via WhatsApp] [Download PDF] [Add to Calendar]     │
│                                                              │
│  [Get Directions] [Contact Organizer]                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Wallet View

### URL: `/wallet`

```
┌─────────────────────────────────────────────────────────────┐
│  My Wallet                                                   │
│                                                              │
│  ┌────────────────────────────────────────────────┐        │
│  │  Current Balance                                │        │
│  │  ₦2,500.00                                      │        │
│  │                                                 │        │
│  │  [Add Money] [Withdraw]                         │        │
│  └────────────────────────────────────────────────┘        │
│                                                              │
│  Recent Transactions                                        │
│  ┌────────────────────────────────────────────────┐        │
│  │ ✅ Referral Bonus                               │        │
│  │ +₦200.00 • Dec 28, 2025                        │        │
│  └────────────────────────────────────────────────┘        │
│  ┌────────────────────────────────────────────────┐        │
│  │ 🎫 Ticket Purchase                              │        │
│  │ -₦5,000.00 • Dec 25, 2025                      │        │
│  │ Wedding of John & Mary                          │        │
│  └────────────────────────────────────────────────┘        │
│  ┌────────────────────────────────────────────────┐        │
│  │ ✅ Referral Bonus                               │        │
│  │ +₦200.00 • Dec 20, 2025                        │        │
│  └────────────────────────────────────────────────┘        │
│                                                              │
│  [View All Transactions]                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Referrals View

### URL: `/referrals`

```
┌─────────────────────────────────────────────────────────────┐
│  Referral Program                                            │
│                                                              │
│  ┌────────────────────────────────────────────────┐        │
│  │  Your Referral Code                             │        │
│  │  REF12345                                       │        │
│  │  [Copy Code] [Share Link]                       │        │
│  └────────────────────────────────────────────────┘        │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ 👥 Referrals │  │ 💰 Earned    │  │ 🎯 Next Goal │     │
│  │    3         │  │  ₦600        │  │  2 more for  │     │
│  │ Friends      │  │  Total       │  │  ₦1000 bonus │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  How it works:                                              │
│  1. Share your code with friends                            │
│  2. They sign up and make first purchase                    │
│  3. You earn ₦200 per referral                              │
│  4. Get ₦1000 bonus at 5 referrals!                         │
│                                                              │
│  Your Referrals                                             │
│  ┌────────────────────────────────────────────────┐        │
│  │ ✅ Mary Johnson • Joined Dec 20 • ₦200         │        │
│  └────────────────────────────────────────────────┘        │
│  ┌────────────────────────────────────────────────┐        │
│  │ ✅ Peter Obi • Joined Dec 15 • ₦200            │        │
│  └────────────────────────────────────────────────┘        │
│  ┌────────────────────────────────────────────────┐        │
│  │ ⏳ Sarah Ahmed • Pending purchase               │        │
│  └────────────────────────────────────────────────┘        │
│                                                              │
│  [Leaderboard] [Withdraw Earnings]                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Profile View

### URL: `/profile`

```
┌─────────────────────────────────────────────────────────────┐
│  My Profile                                                  │
│                                                              │
│  ┌────────────────────────────────────────────────┐        │
│  │  [Profile Photo]                                │        │
│  │                                                 │        │
│  │  John Doe                                       │        │
│  │  +234 801 234 5678                              │        │
│  │  john.doe@email.com                             │        │
│  │                                                 │        │
│  │  [Edit Profile]                                 │        │
│  └────────────────────────────────────────────────┘        │
│                                                              │
│  Personal Information                                       │
│  First Name: John                                           │
│  Last Name: Doe                                             │
│  Phone: +234 801 234 5678 ✅ Verified                       │
│  Email: john.doe@email.com                                  │
│                                                              │
│  Preferences                                                │
│  Language: English                                          │
│  State: Lagos                                               │
│  LGA: Ikeja                                                 │
│                                                              │
│  Interests                                                  │
│  ☑️ Weddings  ☑️ Festivals  ☑️ Concerts                     │
│                                                              │
│  [Save Changes]                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Settings View

### URL: `/settings`

```
┌─────────────────────────────────────────────────────────────┐
│  Settings                                                    │
│                                                              │
│  Notifications                                              │
│  ☑️ Email notifications                                     │
│  ☑️ SMS notifications                                       │
│  ☑️ WhatsApp notifications                                  │
│  ☑️ Event reminders                                         │
│  ☑️ Payment confirmations                                   │
│                                                              │
│  Privacy                                                    │
│  ☑️ Show my profile to other users                          │
│  ☐ Allow event organizers to contact me                    │
│                                                              │
│  Language & Region                                          │
│  Language: English ▼                                        │
│  Currency: NGN (₦)                                          │
│  Timezone: WAT (UTC+1)                                      │
│                                                              │
│  Security                                                   │
│  [Change Phone Number]                                      │
│  [Manage Devices]                                           │
│  [Two-Factor Authentication]                                │
│                                                              │
│  Account                                                    │
│  [Download My Data]                                         │
│  [Delete Account]                                           │
│                                                              │
│  [Save Settings]                                            │
└─────────────────────────────────────────────────────────────┘
```

---

## Mobile Responsive Design

### Bottom Navigation (Mobile)
```
┌─────────────────────────────────────────┐
│                                          │
│         [Content Area]                   │
│                                          │
├─────────────────────────────────────────┤
│ [🏠] [🎫] [🔍] [💰] [👤]               │
│ Home Tickets Browse Wallet Profile      │
└─────────────────────────────────────────┘
```

---

This completes the Attendee Dashboard design. Next file will cover Organizer Dashboard.
