# 🎫 Tikit User Flow Guide

## Overview

Tikit is a Nigerian event ticketing platform designed for weddings, crusades, burials, festivals, and rural events. It bridges the digital divide with USSD support, offline capabilities, multilingual interface, and flexible payment options.

## Target Users

1. **Event Attendees** - People buying tickets for events
2. **Event Organizers** - People creating and managing events
3. **Feature Phone Users** - Users accessing via USSD (*7477#)
4. **Ticket Scanners** - Staff verifying tickets at event venues

---

## 🚀 User Journey: First-Time Attendee

### 1. Onboarding (First Visit)

**Step 1: Language Selection**
- User opens http://localhost:3000
- System displays language options:
  - English
  - Hausa (Hausa)
  - Igbo (Igbo)
  - Yoruba (Yorùbá)
  - Pidgin (Naija Pidgin)
- User selects preferred language
- All subsequent content displays in selected language

**Step 2: Location Selection**
- System prompts for state selection
- User selects from 36 Nigerian states + FCT
- Optionally selects Local Government Area (LGA)
- System saves preferences

**Step 3: Phone Registration (Optional)**
- User can browse without registration
- To purchase tickets, user must register
- Enter Nigerian phone number
- Receive OTP via SMS
- Enter OTP to verify
- Account created

**Result**: User lands on personalized home feed showing events within 100km

---

### 2. Discovering Events

**Home Feed**
- Displays events near user's location (100km radius)
- Shows event cards with:
  - Event image
  - Title and type (Wedding, Crusade, Festival, etc.)
  - Date and time
  - Location (venue, LGA, state)
  - Price range
  - Capacity status ("Almost Full" if >80%)
  - Distance from user

**Filtering Options**
- Event Type: Wedding, Crusade, Burial, Festival, Concert, etc.
- Date Range: Today, This Week, This Month, Custom
- Price Range: Free, ₦0-₦5000, ₦5000-₦20000, etc.
- Location: By LGA, Distance (10km, 50km, 100km)
- Language: Events in specific languages
- Capacity: Available, Almost Full
- Payment Methods: Card, Mobile Money, Airtime
- Accessibility: Wheelchair accessible, Sign language

**Search**
- Search by event name
- Search by organizer
- Search by venue

**Infinite Scroll**
- Loads 20 events per page
- Automatically loads more as user scrolls

---

### 3. Viewing Event Details

**Event Page Shows:**

**Basic Information**
- Event title and description
- Event type and category
- Date, time, and duration
- Venue with map
- Organizer information

**Ticket Tiers**
- Multiple pricing tiers (VIP, Regular, Economy, etc.)
- Quantity available per tier
- Features included in each tier
- Real-time availability counter

**Cultural Features (for Weddings)**
- Aso-ebi tiers (traditional attire)
  - Different colors/styles with prices
  - Size selection
- Food RSVP
  - Menu options (Jollof Rice, Fried Rice, etc.)
  - Dietary restrictions (Vegetarian, Halal, etc.)
- Spray Money Leaderboard
  - Live ranking of top contributors
  - Total amount sprayed

**Event-Specific Features**
- **Weddings**: Aso-ebi, Food RSVP, Gift Registry
- **Crusades**: Prayer requests, Offering options
- **Burials**: Condolence messages, Donation tracking
- **Festivals**: Cultural activities, Vendor listings

**Actions Available**
- Purchase ticket
- Share event (WhatsApp, SMS, Copy link)
- Add to calendar
- Report event

---

### 4. Purchasing Tickets

**Step 1: Select Ticket Tier**
- Choose from available tiers
- Select quantity (1-10 for regular, up to 20,000 for bulk)
- See total price calculation

**Step 2: Additional Options**

**For Weddings:**
- Select aso-ebi tier and size
- Choose food preference
- Add dietary restrictions

**For All Events:**
- Add guest names (optional)
- Select seat preferences (if applicable)

**Step 3: Choose Purchase Method**

**Option A: Individual Purchase**
- Proceed to payment directly

**Option B: Group Buy**
- Select number of participants (2-5000)
- System generates unique payment links
- Share links via WhatsApp
- Track payment status in real-time
- Tickets issued when all participants pay
- 48-hour expiration (refund if incomplete)

**Option C: Bulk Booking (50-20,000 tickets)**
- Available for churches, organizations
- Select quantity with slider
- Get volume discount
- Receive CSV file with all QR codes
- Option for split payment links

**Step 4: Payment Options**

**Full Payment**
- Pay entire amount at once

**Installment Plans**
- 2-part: 50% now, 50% later
- 3-part: 33% each
- 4-part: 25% each
- Deadlines before event date

**Payment Methods**
1. **Debit Card** (Paystack/Flutterwave)
   - Enter card details
   - Verify with OTP
   - Instant confirmation

2. **Bank Transfer**
   - Get account details
   - Transfer amount
   - Upload proof
   - Manual verification (5-30 mins)

3. **Mobile Money**
   - Opay
   - Palmpay
   - Enter phone number
   - Approve on mobile app

4. **Airtime Deduction**
   - Deduct from phone credit
   - Works with all Nigerian networks
   - Instant confirmation

5. **Sponsorship Request**
   - Generate unique code
   - Share with sponsor
   - Sponsor approves with OTP
   - Ticket issued to requester

**Step 5: Confirmation**
- Payment processed
- Ticket generated with:
  - Unique QR code
  - 6-digit backup code
  - Event details
  - Attendee information
- Confirmation sent via:
  - SMS (with QR code link)
  - Email (with PDF attachment)
  - WhatsApp (if opted in)

---

### 5. Managing Tickets (Offline Wallet)

**Accessing Wallet**
- Navigate to "My Tickets" section
- View all purchased tickets
- Works offline (PWA)

**Ticket Display**
- Event name and date
- QR code (scannable)
- 6-digit backup code
- Seat/tier information
- Event location
- Status (Valid, Used, Expired)

**Ticket Actions**
- **Share**: Send via WhatsApp/SMS
- **Download**: Save as image/PDF
- **Add to Calendar**: Set reminder
- **Get Directions**: Navigate to venue
- **Transfer**: Send to another user (if allowed)

**Offline Functionality**
- All tickets stored locally
- QR codes accessible without internet
- Syncs when online
- Works as PWA (installable app)

---

### 6. Attending the Event

**At Venue Entrance:**

**Option 1: QR Code Scan**
- Scanner opens camera
- User shows QR code
- Scanner scans code
- System validates in <1 second
- Shows: ✅ Valid or ❌ Invalid/Used
- Displays attendee name and tier
- Entry granted

**Option 2: Backup Code**
- If QR code doesn't work
- User provides 6-digit code
- Scanner enters manually
- System validates
- Entry granted

**Offline Scanning**
- Scanner can work offline
- Validations queued
- Processed when online
- Prevents duplicate entries

---

## 🎯 User Journey: Event Organizer

### 1. Creating an Event

**Step 1: Access Organizer Dashboard**
- Register/login as organizer
- Navigate to "Create Event"
- Choose event template:
  - Wedding
  - Crusade/Religious
  - Burial/Memorial
  - Festival/Cultural
  - General Event

**Step 2: Basic Information**
- Event title
- Description (supports rich text)
- Event type and category
- Date and time (start/end)
- Venue details
  - Address
  - State and LGA
  - GPS coordinates (auto-detected)
- Upload images (up to 5)
- Set capacity limit

**Step 3: Ticket Configuration**

**Create Tiers**
- Add multiple tiers (VIP, Regular, etc.)
- Set price for each tier
- Set quantity available
- Add tier descriptions
- Set tier-specific features

**Pricing Options**
- Free event
- Paid tiers
- Early bird pricing
- Group discounts
- Bulk booking discounts

**Step 4: Cultural Features (Optional)**

**For Weddings:**
- **Aso-ebi Tiers**
  - Add colors/styles
  - Set prices
  - Upload images
  - Size options

- **Food RSVP**
  - Add menu items
  - Set dietary options
  - Track counts

- **Spray Money**
  - Enable live leaderboard
  - Set minimum amount
  - Track contributions

**For Crusades:**
- Prayer request form
- Offering/donation options
- Live streaming link

**For Burials:**
- Condolence message board
- Donation tracking
- Memorial tribute section

**Step 5: Access Control**

**Public Event**
- Visible in search
- Anyone can purchase

**Hidden Event (Private)**
- Not in public search
- Requires access code or link
- System generates:
  - 4-digit access code
  - Unique deep link
  - WhatsApp shareable link

**Step 6: Payment Settings**
- Enable payment methods
- Set installment options
- Enable group buy (2-5000 people)
- Enable bulk booking (50-20,000)
- Set refund policy

**Step 7: Additional Settings**
- Enable ticket transfers
- Set transfer deadline
- Add terms and conditions
- Set cancellation policy
- Enable waitlist

**Step 8: Publish**
- Preview event
- Publish immediately or schedule
- Share event link
- Generate USSD code

---

### 2. Managing Events

**Dashboard Overview**
- Total events created
- Active events
- Past events
- Draft events

**Per-Event Analytics**
- **Sales Metrics**
  - Total tickets sold
  - Revenue generated
  - Tickets remaining
  - Sales by tier
  - Sales timeline graph

- **Attendee Demographics**
  - By location (state/LGA)
  - By age group
  - By gender
  - By language preference

- **Payment Analytics**
  - Payment methods used
  - Installment status
  - Group buy progress
  - Refund requests

**Real-Time Updates**
- Live sales counter
- Capacity indicator
- Recent purchases
- Group buy status

---

### 3. Managing Attendees

**Attendee List**
- View all ticket holders
- Filter by:
  - Ticket tier
  - Payment status
  - Check-in status
  - Purchase date
- Search by name/phone

**Export Options**
- Download Excel/CSV
- Includes:
  - Names
  - Phone numbers
  - Email addresses
  - Ticket tiers
  - Payment status
  - Special requests (food, aso-ebi)

**Communication**
- **Broadcast Messages**
  - Send WhatsApp to all attendees
  - Send SMS updates
  - Email notifications
- **Message Templates**
  - Event reminders
  - Venue changes
  - Schedule updates
  - Thank you messages

---

### 4. Event Day Management

**Check-In Dashboard**
- Real-time check-in counter
- Attendees checked in vs. total
- No-show tracking
- Late arrivals

**Ticket Scanning**
- Multiple scanners supported
- Assign scanners to entrances
- Track scanner activity
- Prevent duplicate entries

**Live Features (Weddings)**
- Spray money leaderboard
- Live photo gallery
- Guest messages
- Real-time analytics

---

### 5. Post-Event

**Analytics Report**
- Total attendance
- Revenue summary
- No-show rate
- Feedback ratings
- Photo gallery

**Financial Settlement**
- View total revenue
- Platform fees deducted
- Payout schedule
- Transaction history

**Attendee Feedback**
- Collect ratings
- Read reviews
- Respond to feedback

---

## 📱 User Journey: USSD User (Feature Phone)

### Accessing Tikit via USSD

**Dial: *7477#**

**Main Menu:**
```
Welcome to Tikit
1. Buy Ticket
2. Check My Tickets
3. Sponsor Someone
4. My Wallet
5. Help
```

### 1. Buying a Ticket

**Step 1: Enter Event Code**
```
Enter 4-digit event code:
____
```
- User enters code from poster/SMS
- System loads event

**Step 2: View Event Details**
```
Wedding of John & Mary
Date: Dec 30, 2025
Venue: Lagos
Select Tier:
1. VIP - ₦10,000 (50 left)
2. Regular - ₦5,000 (200 left)
3. Economy - ₦2,000 (500 left)
```

**Step 3: Select Payment**
```
Pay ₦5,000 for Regular ticket
1. Airtime
2. Mobile Money
3. Sponsor Request
```

**Step 4: Confirm**
```
Confirm purchase?
Regular ticket - ₦5,000
1. Yes
2. No
```

**Step 5: Payment Processing**
```
Processing payment...
Please wait...
```

**Step 6: Confirmation**
```
Success! Ticket purchased
QR Code: ABCD1234
Backup Code: 123456
SMS sent to your phone
```

### 2. Checking Tickets

```
My Tickets:
1. Wedding - Dec 30
2. Crusade - Jan 5
3. Festival - Jan 15
Select ticket to view
```

**Ticket Details:**
```
Wedding of John & Mary
Date: Dec 30, 2025, 2PM
Venue: Eko Hotel, Lagos
Tier: Regular
QR: ABCD1234
Backup: 123456
Status: Valid
```

### 3. Sponsorship Request

```
Request Sponsorship:
Enter event code: ____
Select tier: ____
Your code: SPNS789
Share this code with sponsor
```

**Sponsor Approves:**
```
Approve Sponsorship?
Code: SPNS789
Event: Wedding
Amount: ₦5,000
Enter OTP: ____
```

---

## 🎁 User Journey: Referral Program

### Earning Rewards

**Step 1: Get Referral Code**
- Navigate to "Referrals" section
- View unique code (e.g., REF12345)
- Get shareable link

**Step 2: Share**
- Share via WhatsApp
- Share via SMS
- Share on social media

**Step 3: Track Referrals**
- View referred users
- See their status:
  - Registered
  - First purchase made
  - Active user
- Track earnings

**Rewards:**
- ₦200 per successful referral (after first purchase)
- ₦1,000 bonus at 5 referrals
- ₦5,000 bonus at 25 referrals
- Leaderboard rankings

**Step 4: Withdraw**
- Minimum balance: ₦500
- Withdraw to:
  - Opay
  - Palmpay
  - Bank account
- Or use as ticket credit

---

## 🔐 User Journey: Private Events

### Accessing Hidden Events

**Method 1: Access Code**
- User receives 4-digit code
- Opens Tikit app
- Clicks "Enter Event Code"
- Enters code
- Event page opens

**Method 2: Deep Link**
- User receives WhatsApp link
- Clicks link
- App opens directly to event
- No code needed

**Method 3: QR Code**
- Scan QR code on invitation
- App opens to event

**Privacy Features:**
- Event not in public search
- Not visible in feeds
- Only accessible with code/link
- Organizer can track invitation sources

---

## 👥 User Journey: Group Buy

### Initiating Group Buy

**Step 1: Select Group Buy**
- On event page, click "Group Buy"
- Select number of participants (2-5000)
- Choose ticket tier

**Step 2: Create Group**
- System calculates per-person cost
- Generates unique payment links
- Creates group tracking page

**Step 3: Share Links**
- Share via WhatsApp
- Each participant gets unique link
- Real-time payment tracking

**Step 4: Payment Tracking**
```
Group Buy Status:
3 of 5 paid
- John ✅ Paid
- Mary ✅ Paid
- Peter ✅ Paid
- Sarah ⏳ Pending
- David ⏳ Pending

Expires in: 36 hours
```

**Step 5: Completion**
- All participants pay
- Tickets issued to everyone
- Confirmation sent to all

**If Incomplete:**
- 48-hour expiration
- Automatic refunds
- Notification sent

---

## 🏢 User Journey: Bulk Booking

### For Organizations (Churches, Companies)

**Step 1: Select Bulk Booking**
- Available for 50-20,000 tickets
- Use slider to select quantity
- See volume discount applied

**Step 2: Organization Details**
- Organization name
- Contact person
- Distribution method

**Step 3: Payment Options**

**Option A: Single Payment**
- Pay full amount
- Receive CSV with all codes

**Option B: Split Payment**
- Generate payment links
- Distribute to members
- Track collection
- Receive codes when complete

**Step 4: Receive Tickets**
- Download CSV file with:
  - QR codes
  - Backup codes
  - Unique identifiers
- Print or distribute digitally

---

## 🎨 Key Features Summary

### Multilingual Support
- 5 languages (English, Hausa, Igbo, Yoruba, Pidgin)
- Automatic translation
- Cultural context preserved

### Offline Capabilities
- PWA (installable app)
- Offline ticket storage
- Offline scanning
- Background sync

### Payment Flexibility
- 6 payment methods
- Installment plans
- Group buying
- Sponsorship requests
- Airtime deduction

### Cultural Features
- Aso-ebi management
- Food RSVP
- Spray money tracking
- Condolence boards
- Prayer requests

### Accessibility
- USSD for feature phones
- Works on 2G networks
- Screen reader support
- High contrast mode
- Large text options

### Security
- Phone OTP verification
- JWT authentication
- AES-256 encryption
- Rate limiting
- Fraud detection

---

## 🎯 User Personas

### Persona 1: Chioma (Urban Attendee)
- **Age**: 28
- **Location**: Lagos
- **Device**: Smartphone
- **Use Case**: Attending friend's wedding
- **Journey**: Browse → Find event → Group buy with friends → Pay with card → Store ticket offline → Attend event

### Persona 2: Musa (Rural Feature Phone User)
- **Age**: 45
- **Location**: Kano
- **Device**: Feature phone
- **Use Case**: Attending crusade
- **Journey**: Dial USSD → Enter event code → Pay with airtime → Receive SMS → Show backup code at venue

### Persona 3: Pastor Emmanuel (Organizer)
- **Age**: 52
- **Location**: Port Harcourt
- **Device**: Tablet
- **Use Case**: Organizing church crusade
- **Journey**: Create event → Set up bulk booking → Share with congregation → Track sales → Scan tickets at venue

### Persona 4: Amina (Wedding Planner)
- **Age**: 35
- **Location**: Abuja
- **Device**: Laptop + Phone
- **Use Case**: Managing client's wedding
- **Journey**: Create hidden event → Set up aso-ebi tiers → Configure food RSVP → Share invite codes → Monitor spray money → Export attendee list

---

## 📊 User Flow Diagrams

### Quick Reference

**New User Flow:**
```
Landing → Language → State → Home Feed → Browse Events → Event Details → Purchase → Wallet
```

**Returning User Flow:**
```
Login → Home Feed → Filtered Events → Purchase → Wallet
```

**Organizer Flow:**
```
Login → Dashboard → Create Event → Configure → Publish → Monitor → Scan Tickets
```

**USSD Flow:**
```
Dial *7477# → Menu → Buy Ticket → Enter Code → Pay → Receive SMS
```

---

## 🚀 Getting Started

To experience these flows:

1. **Open the app**: http://localhost:3000
2. **Select language**: Choose your preferred language
3. **Select state**: Pick a Nigerian state
4. **Browse events**: Explore the home feed
5. **Create test event**: Switch to organizer mode
6. **Test purchase**: Try buying a ticket
7. **Check wallet**: View your offline tickets

The app is now running and ready to test all these user flows!
