# 🚀 How to Access Tikit Features - Step by Step Guide

## 🌐 Server Status
- ✅ Backend: http://localhost:4000 (Running)
- ✅ Frontend: http://localhost:3000 (Running)

## 🎯 Quick Access Methods

### Method 1: Feature Demo Page (Easiest)
```
🔗 Direct URL: http://localhost:3000/demo
```
**What you'll see**: Interactive tabs with all major features working

### Method 2: From Home Page
```
1. Go to: http://localhost:3000
2. Click "🎉 Demo" in the navigation bar
```

---

## 📋 Feature Access Guide

### 💰 1. Spray Money Leaderboard
**Access Methods:**
- **Demo Page**: http://localhost:3000/demo → "💰 Spray Money Leaderboard" tab
- **Component**: `apps/frontend/src/components/events/SprayMoneyLeaderboard.tsx`

**What you can do:**
- ✅ Try the spray money form with amounts ₦500-₦10,000
- ✅ Add custom messages to contributions
- ✅ See real-time leaderboard updates
- ✅ View top 3 contributors with medals

**Live Demo Features:**
- Interactive form with quick amount buttons
- Custom message input (200 characters)
- Real-time total calculation
- Mock leaderboard with sample data

---

### 📊 2. Wedding Analytics
**Access Methods:**
- **Demo Page**: http://localhost:3000/demo → "📊 Wedding Analytics" tab
- **Component**: `apps/frontend/src/components/events/WeddingAnalytics.tsx`

**What you can see:**
- ✅ Food RSVP breakdown by meal type
- ✅ Aso-ebi sales by tier and color
- ✅ Total spray money collected
- ✅ Ticket sales summary

**API Endpoint**: `/api/events/{eventId}/wedding-analytics`

---

### 👥 3. Group Buy Functionality
**Access Methods:**
- **Demo Page**: http://localhost:3000/demo → "👥 Create Group Buy" tab
- **Component**: `apps/frontend/src/components/tickets/GroupBuyCreator.tsx`

**What you can do:**
- ✅ Select ticket tiers from dropdown
- ✅ Adjust participant count (2-100) with slider
- ✅ Set expiration time (6-72 hours)
- ✅ See real-time cost calculation and savings
- ✅ View group buy summary

**Group Buy Status Tracker:**
- **Demo Page**: http://localhost:3000/demo → "📈 Group Buy Status" tab
- ✅ See participant progress bar
- ✅ View payment status for each member
- ✅ Track countdown timer

---

### 🔒 4. Hidden Events with Access Codes
**Access Methods:**
- **Create Hidden Event**: Register as organizer → Create Event → Select "Hidden Event"
- **Access Hidden Event**: Use 4-digit code or deep link

**Features:**
- ✅ 4-digit access codes generated automatically
- ✅ WhatsApp deep links for sharing
- ✅ Excluded from public search results
- ✅ Invitation source tracking

**Test Access:**
```
1. Register as organizer: http://localhost:3000/auth/register?role=organizer
2. Create hidden event with access code
3. Share code with others to test access
```

---

### 📱 5. Offline Wallet Capabilities
**Access Methods:**
- **After Login**: http://localhost:3000/attendee/wallet
- **Component**: `apps/frontend/src/components/wallet/OfflineWallet.tsx`

**Features:**
- ✅ QR codes stored in IndexedDB
- ✅ Works without internet connection
- ✅ WhatsApp ticket sharing
- ✅ Offline sync when connectivity returns

**Test Offline:**
1. Buy a ticket (any event)
2. Go to wallet page
3. Disconnect internet
4. Refresh page - tickets still accessible

---

### 📞 6. USSD Integration (*7477#)
**Access Methods:**
- **Dial**: `*7477#` (on actual phone with Africa's Talking integration)
- **Test Endpoint**: `POST http://localhost:4000/api/ussd`
- **Service**: `apps/backend/src/services/ussd.service.ts`

**USSD Menu Structure:**
```
*7477#
├── 1. Buy Ticket
│   ├── Enter event code
│   ├── Select tier
│   └── Pay & receive SMS
├── 2. Check Ticket
│   └── View ticket details
├── 3. Sponsor Someone
│   └── Generate sponsorship code
├── 4. Wallet Balance
│   └── Check referral earnings
└── 5. Help
    └── Get support info
```

**Test USSD (Postman/curl):**
```bash
curl -X POST http://localhost:4000/api/ussd \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test123",
    "phoneNumber": "+2348123456789",
    "text": ""
  }'
```

---

### 💳 7. Multiple Payment Methods
**Access Methods:**
- **Ticket Purchase**: Any event → Buy Ticket → Payment Options
- **Component**: `apps/frontend/src/components/tickets/PaymentMethodSelector.tsx`

**Available Methods:**
- ✅ **Card Payment**: Paystack/Flutterwave integration
- ✅ **Bank Transfer**: Direct bank account details
- ✅ **Opay**: Mobile money integration
- ✅ **Palmpay**: Mobile money integration
- ✅ **Airtime Payment**: Deduct from phone credit
- ✅ **Sponsorship**: Request someone else to pay

**Test Payment Flow:**
1. Go to any event page
2. Click "Buy Ticket"
3. Select quantity and tier
4. Choose payment method
5. Complete payment process

---

### 🌐 8. Real-time Supabase Integration
**Access Methods:**
- **Real-time Demo**: http://localhost:3000/realtime-demo
- **Database**: Supabase tables configured
- **Component**: `apps/frontend/src/components/realtime/EventCapacityDisplay.tsx`

**Real-time Features:**
- ✅ Live event capacity updates
- ✅ Group buy participant tracking
- ✅ Spray money leaderboard updates
- ✅ Notification system

**Database Tables:**
```sql
- event_capacity (live ticket sales)
- group_buy_status (participant tracking)
- spray_money_leaderboard (live contributions)
- realtime_notifications (push notifications)
```

---

## 🎮 Interactive Testing Guide

### Quick 5-Minute Demo:
1. **Visit Demo Page**: http://localhost:3000/demo
2. **Try Spray Money**: Enter ₦5000 with message "Congratulations!"
3. **Create Group Buy**: Select "Regular Seat", 5 participants, 24 hours
4. **View Analytics**: See wedding analytics dashboard
5. **Check Status**: View group buy progress tracker

### Full Feature Testing:
1. **Register Account**: http://localhost:3000/auth/register
2. **Browse Events**: http://localhost:3000/events
3. **Buy Ticket**: Test payment methods
4. **Check Wallet**: http://localhost:3000/attendee/wallet
5. **Test Offline**: Disconnect internet, access wallet

### Organizer Features:
1. **Register as Organizer**: http://localhost:3000/auth/register?role=organizer
2. **Create Event**: http://localhost:3000/organizer/create-event
3. **View Analytics**: http://localhost:3000/organizer/analytics
4. **Scan Tickets**: http://localhost:3000/organizer/scanner

---

## 🔧 Developer Access

### API Endpoints:
```
GET  /api/events/{id}/wedding-analytics
POST /api/group-buy/create
GET  /api/group-buy/{id}/status
POST /api/spray-money/contribute
GET  /api/spray-money/leaderboard/{eventId}
POST /api/ussd (USSD gateway)
POST /api/tickets/verify-qr
POST /api/tickets/verify-backup-code
```

### Component Locations:
```
Spray Money: apps/frontend/src/components/events/SprayMoneyLeaderboard.tsx
Analytics: apps/frontend/src/components/events/WeddingAnalytics.tsx
Group Buy: apps/frontend/src/components/tickets/GroupBuyCreator.tsx
Wallet: apps/frontend/src/components/wallet/OfflineWallet.tsx
Scanner: apps/frontend/src/components/scanner/TicketScanner.tsx
```

---

## 🚀 Start Exploring Now!

**Fastest way to see everything working:**
```
👉 Go to: http://localhost:3000/demo
```

**All features are live and interactive!** 🎉