# 👑 System Admin Dashboard Design

## URL: `/admin/dashboard`

## Layout Structure

### Main Navigation (Top Bar)
```
┌─────────────────────────────────────────────────────────────┐
│ [Logo] Grooovy Admin    [🔍 Search]    [🔔] [👤 Admin] [⚙️]  │
└─────────────────────────────────────────────────────────────┘
```

### Side Navigation (Left Sidebar)
```
┌──────────────────┐
│ 📊 Dashboard     │
│ 👥 Users         │
│ 🎪 Events        │
│ 💰 Financials    │
│ 📈 Analytics     │
│ 🛡️ Security      │
│ 📢 Announcements │
│ ⚙️ Settings      │
│ 📞 Support       │
│ 🚪 Logout        │
└──────────────────┘
```

---

## 1. Dashboard Overview

### URL: `/admin/dashboard`

```
┌─────────────────────────────────────────────────────────────┐
│  System Overview                                             │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ 👥 Users     │  │ 🎪 Events    │  │ 🎫 Tickets   │     │
│  │  12,456      │  │    1,234     │  │   45,678     │     │
│  │  +234 today  │  │  +12 today   │  │  +567 today  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ 💰 Revenue   │  │ 📊 Active    │  │ ⚠️ Issues    │     │
│  │  ₦125.5M     │  │    856       │  │    3         │     │
│  │  +₦2.5M today│  │  Sessions    │  │  Pending     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  Platform Health                                            │
│  ┌────────────────────────────────────────────────┐        │
│  │ API Response Time: 245ms ✅                     │        │
│  │ Database: Healthy ✅                            │        │
│  │ Redis Cache: Connected ✅                       │        │
│  │ SMS Service: Operational ✅                     │        │
│  │ Payment Gateway: Operational ✅                 │        │
│  └────────────────────────────────────────────────┘        │
│                                                              │
│  Recent Activity                                            │
│  • New user registered: John Doe                            │
│  • Event published: Lagos Festival 2026                     │
│  • Payment processed: ₦50,000                               │
│  • Security alert: Multiple failed login attempts           │
│                                                              │
│  Quick Actions                                              │
│  [View Reports] [Manage Users] [System Settings]            │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Users Management

### URL: `/admin/users`

```
┌─────────────────────────────────────────────────────────────┐
│  User Management                                             │
│                                                              │
│  🔍 Search users...                                          │
│  Filters: [All] [Attendees] [Organizers] [Admins]           │
│           [Active] [Suspended] [Verified]                    │
│                                                              │
│  [+ Add Admin] [Export Users]                                │
│                                                              │
│  ┌────────────────────────────────────────────────┐        │
│  │ 👤 John Doe                                     │        │
│  │ +234 801 234 5678 • john@email.com             │        │
│  │ Role: Attendee • Joined: Dec 1, 2025           │        │
│  │ Status: ✅ Active • Verified                    │        │
│  │ Tickets: 5 • Spent: ₦25,000                    │        │
│  │ [View Details] [Edit] [Suspend] [Delete]       │        │
│  └────────────────────────────────────────────────┘        │
│                                                              │
│  ┌────────────────────────────────────────────────┐        │
│  │ 👤 Mary Johnson                                 │        │
│  │ +234 802 345 6789 • mary@email.com             │        │
│  │ Role: Organizer • Joined: Nov 15, 2025         │        │
│  │ Status: ✅ Active • Verified                    │        │
│  │ Events: 12 • Revenue: ₦2.5M                    │        │
│  │ [View Details] [Edit] [Suspend] [Delete]       │        │
│  └────────────────────────────────────────────────┘        │
│                                                              │
│  Showing 1-20 of 12,456 users                               │
│  [Previous] [1] [2] [3] ... [623] [Next]                    │
└─────────────────────────────────────────────────────────────┘
```

### User Detail Modal
```
┌─────────────────────────────────────────────────────────────┐
│  User Details                                         [✕]    │
│                                                              │
│  👤 John Doe                                                 │
│  +234 801 234 5678 • john@email.com                         │
│                                                              │
│  Account Information                                        │
│  User ID: user_123456                                       │
│  Role: Attendee                                             │
│  Status: Active                                             │
│  Verified: Yes                                              │
│  Joined: December 1, 2025                                   │
│  Last Login: December 28, 2025 10:30 AM                     │
│                                                              │
│  Activity Summary                                           │
│  Tickets Purchased: 5                                       │
│  Total Spent: ₦25,000                                       │
│  Referrals: 3                                               │
│  Wallet Balance: ₦2,500                                     │
│                                                              │
│  Recent Activity                                            │
│  • Purchased ticket - Dec 28, 2025                          │
│  • Referred user - Dec 25, 2025                             │
│  • Updated profile - Dec 20, 2025                           │
│                                                              │
│  Actions                                                    │
│  [Change Role] [Suspend Account] [Reset Password]           │
│  [View Tickets] [View Transactions] [Send Message]          │
│                                                              │
│  Danger Zone                                                │
│  [Delete Account]                                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Events Management

### URL: `/admin/events`

```
┌─────────────────────────────────────────────────────────────┐
│  Events Management                                           │
│                                                              │
│  🔍 Search events...                                         │
│  Filters: [All] [Upcoming] [Past] [Pending Review]          │
│           [Reported] [Suspended]                             │
│                                                              │
│  [Export Events] [Bulk Actions]                              │
│                                                              │
│  ┌────────────────────────────────────────────────┐        │
│  │ 🎊 New Year Festival 2026                      │        │
│  │ Organizer: Mary Johnson                        │        │
│  │ Jan 1, 2026 • Lagos • 234/500 tickets         │        │
│  │ Status: ✅ Approved • Revenue: ₦1.17M          │        │
│  │ [View] [Edit] [Suspend] [Delete]               │        │
│  └────────────────────────────────────────────────┘        │
│                                                              │
│  ┌────────────────────────────────────────────────┐        │
│  │ ⚠️ Lagos Concert 2026                           │        │
│  │ Organizer: Peter Obi                           │        │
│  │ Feb 14, 2026 • Lagos • 0/1000 tickets         │        │
│  │ Status: ⏳ Pending Review                       │        │
│  │ [Review] [Approve] [Reject]                    │        │
│  └────────────────────────────────────────────────┘        │
│                                                              │
│  ┌────────────────────────────────────────────────┐        │
│  │ 🚫 Suspicious Event                             │        │
│  │ Organizer: Unknown User                        │        │
│  │ Mar 1, 2026 • Lagos • 0/5000 tickets          │        │
│  │ Status: 🚨 Flagged • Reason: Fraud suspicion   │        │
│  │ [Investigate] [Suspend] [Delete]               │        │
│  └────────────────────────────────────────────────┘        │
│                                                              │
│  Showing 1-20 of 1,234 events                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Financial Management

### URL: `/admin/financials`

```
┌─────────────────────────────────────────────────────────────┐
│  Financial Dashboard                                         │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ 💰 Total     │  │ 💳 Platform  │  │ 📊 Organizer │     │
│  │  ₦125.5M     │  │  ₦12.5M      │  │  ₦113M       │     │
│  │  Revenue     │  │  Fees (10%)  │  │  Payouts     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ ⏳ Pending   │  │ ✅ Completed │  │ 🔄 Refunds   │     │
│  │  ₦5.2M       │  │  ₦120.3M     │  │  ₦850K       │     │
│  │  Settlements │  │  Transactions│  │  Processed   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  Revenue Trend (Last 30 Days)                               │
│  ┌────────────────────────────────────────────────┐        │
│  │     [Line Chart showing revenue over time]     │        │
│  │                                                 │        │
│  └────────────────────────────────────────────────┘        │
│                                                              │
│  Pending Payouts                                            │
│  ┌────────────────────────────────────────────────┐        │
│  │ Mary Johnson • ₦500,000 • Requested Dec 28     │        │
│  │ [Approve] [Reject] [View Details]              │        │
│  └────────────────────────────────────────────────┘        │
│                                                              │
│  Recent Transactions                                        │
│  • Ticket sale: ₦10,000 - Dec 28, 2025                     │
│  • Payout: ₦500,000 to Mary Johnson - Dec 27               │
│  • Refund: ₦5,000 to John Doe - Dec 26                     │
│                                                              │
│  [Export Report] [View All Transactions]                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Platform Analytics

### URL: `/admin/analytics`

```
┌─────────────────────────────────────────────────────────────┐
│  Platform Analytics                                          │
│                                                              │
│  Date Range: [Last 30 Days ▼]  [Custom Range]               │
│                                                              │
│  User Growth                                                │
│  ┌────────────────────────────────────────────────┐        │
│  │     [Line Chart: New users over time]          │        │
│  │     Total: 12,456 (+234 this month)            │        │
│  └────────────────────────────────────────────────┘        │
│                                                              │
│  Event Statistics                                           │
│  ┌────────────────────────────────────────────────┐        │
│  │ Events by Type:                                 │        │
│  │ Weddings: 45% • Crusades: 25%                  │        │
│  │ Festivals: 15% • Concerts: 10% • Other: 5%     │        │
│  └────────────────────────────────────────────────┘        │
│                                                              │
│  Ticket Sales                                               │
│  ┌────────────────────────────────────────────────┐        │
│  │     [Bar Chart: Tickets sold by month]         │        │
│  │     Total: 45,678 (+567 this month)            │        │
│  └────────────────────────────────────────────────┘        │
│                                                              │
│  Geographic Distribution                                    │
│  ┌──────────────┐  ┌──────────────┐                       │
│  │ Top States   │  │ Top LGAs     │                       │
│  │ 1. Lagos 35% │  │ 1. Ikeja     │                       │
│  │ 2. Abuja 20% │  │ 2. Lekki     │                       │
│  │ 3. Kano 15%  │  │ 3. Surulere  │                       │
│  └──────────────┘  └──────────────┘                       │
│                                                              │
│  Payment Methods                                            │
│  Card: 55% • Mobile Money: 30% • Airtime: 15%              │
│                                                              │
│  [Export Full Report] [Schedule Report]                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Security & Monitoring

### URL: `/admin/security`

```
┌─────────────────────────────────────────────────────────────┐
│  Security Dashboard                                          │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ 🚨 Alerts    │  │ 🔒 Blocked   │  │ ⚠️ Suspicious│     │
│  │    3         │  │    45        │  │    12        │     │
│  │  Active      │  │  IPs         │  │  Activities  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  Active Security Alerts                                     │
│  ┌────────────────────────────────────────────────┐        │
│  │ 🚨 Multiple Failed Login Attempts               │        │
│  │ User: john@email.com                           │        │
│  │ IP: 197.210.xxx.xxx • Time: 10:30 AM           │        │
│  │ [Investigate] [Block IP] [Dismiss]             │        │
│  └────────────────────────────────────────────────┘        │
│                                                              │
│  ┌────────────────────────────────────────────────┐        │
│  │ ⚠️ Unusual Payment Pattern                      │        │
│  │ Event: Lagos Concert 2026                      │        │
│  │ Multiple purchases from same IP                │        │
│  │ [Investigate] [Flag Event] [Dismiss]           │        │
│  └────────────────────────────────────────────────┘        │
│                                                              │
│  System Logs                                                │
│  • Failed login: john@email.com - 10:30 AM                  │
│  • Account suspended: user_789 - 10:15 AM                   │
│  • Payment failed: ₦10,000 - 10:00 AM                       │
│                                                              │
│  Blocked IPs                                                │
│  • 197.210.xxx.xxx - Reason: Brute force attack             │
│  • 41.203.xxx.xxx - Reason: Spam                            │
│                                                              │
│  [View All Logs] [Security Settings]                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. Announcements

### URL: `/admin/announcements`

```
┌─────────────────────────────────────────────────────────────┐
│  Platform Announcements                                      │
│                                                              │
│  [+ Create Announcement]                                     │
│                                                              │
│  Active Announcements                                       │
│  ┌────────────────────────────────────────────────┐        │
│  │ 📢 System Maintenance Scheduled                 │        │
│  │ Dec 30, 2025 • 2:00 AM - 4:00 AM               │        │
│  │ Target: All Users                              │        │
│  │ [Edit] [Deactivate] [Delete]                   │        │
│  └────────────────────────────────────────────────┘        │
│                                                              │
│  Past Announcements                                         │
│  • New Feature: Group Buy - Dec 15, 2025                    │
│  • Holiday Hours - Dec 24, 2025                             │
│  • Platform Update - Dec 1, 2025                            │
│                                                              │
│  [View All]                                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. System Settings

### URL: `/admin/settings`

```
┌─────────────────────────────────────────────────────────────┐
│  System Settings                                             │
│                                                              │
│  Platform Configuration                                     │
│  ┌─────────────────────────────────────────┐               │
│  │ Platform Name: Grooovy                     │               │
│  │ Platform Fee: 10%                        │               │
│  │ Currency: NGN (₦)                        │               │
│  │ Timezone: WAT (UTC+1)                    │               │
│  └─────────────────────────────────────────┘               │
│                                                              │
│  Payment Settings                                           │
│  ☑️ Paystack                                                │
│  ☑️ Flutterwave                                             │
│  ☑️ Mobile Money (Opay, Palmpay)                            │
│  ☑️ Airtime Deduction                                       │
│                                                              │
│  SMS/WhatsApp Settings                                      │
│  Provider: Africa's Talking                                 │
│  Sender ID: Grooovy                                           │
│  ☑️ OTP Messages                                            │
│  ☑️ Event Reminders                                         │
│  ☑️ Payment Confirmations                                   │
│                                                              │
│  Security Settings                                          │
│  Max Login Attempts: 5                                      │
│  OTP Expiration: 5 minutes                                  │
│  Session Timeout: 24 hours                                  │
│  ☑️ Two-Factor Authentication                               │
│  ☑️ IP Blocking                                             │
│                                                              │
│  Email Settings                                             │
│  SMTP Server: smtp.gmail.com                                │
│  From Email: noreply@grooovy.com                               │
│  ☑️ Welcome Emails                                          │
│  ☑️ Transaction Receipts                                    │
│                                                              │
│  [Save Settings] [Test Configuration]                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 9. Support Tickets

### URL: `/admin/support`

```
┌─────────────────────────────────────────────────────────────┐
│  Support Tickets                                             │
│                                                              │
│  [Open] [In Progress] [Resolved] [Closed]                    │
│  🔍 Search tickets...                                        │
│                                                              │
│  ┌────────────────────────────────────────────────┐        │
│  │ 🔴 Payment Failed                               │        │
│  │ User: John Doe • Ticket #1234                  │        │
│  │ Created: Dec 28, 2025 10:30 AM                 │        │
│  │ Priority: High • Status: Open                  │        │
│  │ [View] [Assign] [Resolve]                      │        │
│  └────────────────────────────────────────────────┘        │
│                                                              │
│  ┌────────────────────────────────────────────────┐        │
│  │ 🟡 Cannot Access Ticket                         │        │
│  │ User: Mary Johnson • Ticket #1233              │        │
│  │ Created: Dec 28, 2025 9:15 AM                  │        │
│  │ Priority: Medium • Status: In Progress         │        │
│  │ [View] [Assign] [Resolve]                      │        │
│  └────────────────────────────────────────────────┘        │
│                                                              │
│  Showing 1-20 of 156 tickets                                │
└─────────────────────────────────────────────────────────────┘
```

---

This completes all three dashboard designs. Next, I'll create the implementation guide.
