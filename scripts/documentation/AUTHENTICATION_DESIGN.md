# 🔐 Authentication & User Management Design

## 1. Landing Page (Public)

### URL: `/`

**Purpose**: Welcome page with clear CTAs for different user types

**Layout**:
```
┌─────────────────────────────────────────────────────┐
│  [Logo] Grooovy                    [Login] [Sign Up]  │
├─────────────────────────────────────────────────────┤
│                                                      │
│         🎫 Nigeria's #1 Event Platform              │
│                                                      │
│    Weddings • Crusades • Festivals • Burials        │
│                                                      │
│  [Browse Events]  [Create Event]  [Learn More]      │
│                                                      │
├─────────────────────────────────────────────────────┤
│  Featured Events (3-4 cards)                        │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐           │
│  │Event │  │Event │  │Event │  │Event │           │
│  └──────┘  └──────┘  └──────┘  └──────┘           │
├─────────────────────────────────────────────────────┤
│  Why Choose Grooovy?                                  │
│  ✓ Offline Access  ✓ USSD Support  ✓ Group Buy    │
├─────────────────────────────────────────────────────┤
│  Footer: About | Contact | Help | Terms            │
└─────────────────────────────────────────────────────┘
```

**Components**:
- Hero section with value proposition
- User type selector (Browse vs Create)
- Featured events carousel
- Trust indicators (users, events, etc.)
- Footer with links

---

## 2. Registration/Login Page

### URL: `/auth`

**User Type Selection First**:
```
┌─────────────────────────────────────────────────────┐
│                  Welcome to Grooovy                    │
│                                                      │
│              I want to...                           │
│                                                      │
│  ┌──────────────────┐  ┌──────────────────┐        │
│  │   🎫 Attend      │  │   📋 Organize    │        │
│  │   Events         │  │   Events         │        │
│  │                  │  │                  │        │
│  │  Browse & buy    │  │  Create & manage │        │
│  │  tickets         │  │  your events     │        │
│  │                  │  │                  │        │
│  │  [Get Started]   │  │  [Get Started]   │        │
│  └──────────────────┘  └──────────────────┘        │
│                                                      │
│  Already have an account? [Login]                   │
└─────────────────────────────────────────────────────┘
```

### Registration Flow

#### Step 1: User Type Selection (shown above)

#### Step 2: Phone Number Entry
```
┌─────────────────────────────────────────────────────┐
│  ← Back                                             │
│                                                      │
│  Register as [Attendee/Organizer]                   │
│                                                      │
│  Enter your phone number                            │
│  ┌─────────────────────────────────────────┐       │
│  │ +234 |___________________________|       │       │
│  └─────────────────────────────────────────┘       │
│                                                      │
│  We'll send you a verification code                 │
│                                                      │
│  [Continue]                                         │
│                                                      │
│  By continuing, you agree to our Terms & Privacy    │
└─────────────────────────────────────────────────────┘
```

#### Step 3: OTP Verification
```
┌─────────────────────────────────────────────────────┐
│  ← Back                                             │
│                                                      │
│  Verify your number                                 │
│                                                      │
│  Enter the 6-digit code sent to                     │
│  +234 XXX XXX 1234                                  │
│                                                      │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐             │
│  │ _ │ │ _ │ │ _ │ │ _ │ │ _ │ │ _ │             │
│  └───┘ └───┘ └───┘ └───┘ └───┘ └───┘             │
│                                                      │
│  Didn't receive code? [Resend] (30s)               │
│                                                      │
│  [Verify]                                           │
└─────────────────────────────────────────────────────┘
```

#### Step 4: Basic Profile
```
┌─────────────────────────────────────────────────────┐
│  Complete your profile                              │
│                                                      │
│  First Name                                         │
│  ┌─────────────────────────────────────────┐       │
│  │                                          │       │
│  └─────────────────────────────────────────┘       │
│                                                      │
│  Last Name                                          │
│  ┌─────────────────────────────────────────┐       │
│  │                                          │       │
│  └─────────────────────────────────────────┘       │
│                                                      │
│  Email (optional)                                   │
│  ┌─────────────────────────────────────────┐       │
│  │                                          │       │
│  └─────────────────────────────────────────┘       │
│                                                      │
│  [Continue]                                         │
└─────────────────────────────────────────────────────┘
```

### Login Flow
```
┌─────────────────────────────────────────────────────┐
│  ← Back                                             │
│                                                      │
│  Welcome back!                                      │
│                                                      │
│  Phone Number                                       │
│  ┌─────────────────────────────────────────┐       │
│  │ +234 |___________________________|       │       │
│  └─────────────────────────────────────────┘       │
│                                                      │
│  [Send OTP]                                         │
│                                                      │
│  Don't have an account? [Sign Up]                   │
└─────────────────────────────────────────────────────┘
```

Then OTP verification (same as registration Step 3)

---

## 3. Onboarding Flows

### Attendee Onboarding

#### Step 1: Language Selection
```
┌─────────────────────────────────────────────────────┐
│  Welcome, [Name]! 👋                                │
│                                                      │
│  Choose your preferred language                     │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │ English  │  │  Hausa   │  │  Igbo    │         │
│  └──────────┘  └──────────┘  └──────────┘         │
│                                                      │
│  ┌──────────┐  ┌──────────┐                        │
│  │ Yoruba   │  │  Pidgin  │                        │
│  └──────────┘  └──────────┘                        │
│                                                      │
│  [Continue]                                         │
│  Step 1 of 3                                        │
└─────────────────────────────────────────────────────┘
```

#### Step 2: Location Selection
```
┌─────────────────────────────────────────────────────┐
│  Where are you located?                             │
│                                                      │
│  State                                              │
│  ┌─────────────────────────────────────────┐       │
│  │ Select state ▼                           │       │
│  └─────────────────────────────────────────┘       │
│                                                      │
│  Local Government Area (Optional)                   │
│  ┌─────────────────────────────────────────┐       │
│  │ Select LGA ▼                             │       │
│  └─────────────────────────────────────────┘       │
│                                                      │
│  This helps us show you nearby events               │
│                                                      │
│  [Continue]                                         │
│  Step 2 of 3                                        │
└─────────────────────────────────────────────────────┘
```

#### Step 3: Interests (Optional)
```
┌─────────────────────────────────────────────────────┐
│  What events interest you?                          │
│                                                      │
│  Select all that apply:                             │
│                                                      │
│  ☐ Weddings        ☐ Crusades                      │
│  ☐ Festivals       ☐ Concerts                      │
│  ☐ Burials         ☐ Conferences                   │
│  ☐ Sports          ☐ Parties                       │
│                                                      │
│  [Skip]  [Finish]                                   │
│  Step 3 of 3                                        │
└─────────────────────────────────────────────────────┘
```

### Organizer Onboarding

#### Step 1: Language Selection (same as attendee)

#### Step 2: Organization Details
```
┌─────────────────────────────────────────────────────┐
│  Tell us about your organization                    │
│                                                      │
│  Organization Name (Optional)                       │
│  ┌─────────────────────────────────────────┐       │
│  │ e.g., ABC Events, Victory Church        │       │
│  └─────────────────────────────────────────┘       │
│                                                      │
│  Organization Type                                  │
│  ┌─────────────────────────────────────────┐       │
│  │ Select type ▼                            │       │
│  └─────────────────────────────────────────┘       │
│  • Individual                                       │
│  • Event Planning Company                           │
│  • Religious Organization                           │
│  • Corporate                                        │
│  • Other                                            │
│                                                      │
│  [Continue]                                         │
│  Step 1 of 3                                        │
└─────────────────────────────────────────────────────┘
```

#### Step 3: Location & Event Types
```
┌─────────────────────────────────────────────────────┐
│  Where do you organize events?                      │
│                                                      │
│  Primary State                                      │
│  ┌─────────────────────────────────────────┐       │
│  │ Select state ▼                           │       │
│  └─────────────────────────────────────────┘       │
│                                                      │
│  What type of events do you organize?               │
│  ☐ Weddings        ☐ Crusades                      │
│  ☐ Festivals       ☐ Concerts                      │
│  ☐ Burials         ☐ Conferences                   │
│  ☐ Corporate       ☐ Other                         │
│                                                      │
│  [Continue]                                         │
│  Step 2 of 3                                        │
└─────────────────────────────────────────────────────┘
```

#### Step 4: Payment Setup
```
┌─────────────────────────────────────────────────────┐
│  Setup payment account                              │
│                                                      │
│  To receive payments, add your bank details         │
│                                                      │
│  Bank Name                                          │
│  ┌─────────────────────────────────────────┐       │
│  │ Select bank ▼                            │       │
│  └─────────────────────────────────────────┘       │
│                                                      │
│  Account Number                                     │
│  ┌─────────────────────────────────────────┐       │
│  │                                          │       │
│  └─────────────────────────────────────────┘       │
│                                                      │
│  Account Name: [Auto-filled after validation]      │
│                                                      │
│  [Skip for now]  [Continue]                         │
│  Step 3 of 3                                        │
└─────────────────────────────────────────────────────┘
```

---

## 4. Role-Based Access Control (RBAC)

### Database Schema Addition
```prisma
model User {
  // ... existing fields
  role              String    @default("attendee")
  // Possible values: "attendee", "organizer", "admin"
  
  organizationName  String?
  organizationType  String?
  bankDetails       Json?
  isVerified        Boolean   @default(false)
  verifiedAt        DateTime?
}
```

### Permission Matrix

| Feature | Attendee | Organizer | Admin |
|---------|----------|-----------|-------|
| Browse Events | ✅ | ✅ | ✅ |
| Purchase Tickets | ✅ | ✅ | ✅ |
| Create Events | ❌ | ✅ | ✅ |
| Manage Own Events | ❌ | ✅ | ✅ |
| View All Events | ❌ | ❌ | ✅ |
| User Management | ❌ | ❌ | ✅ |
| Platform Analytics | ❌ | ❌ | ✅ |
| Financial Reports | ❌ | Own Only | ✅ All |
| Content Moderation | ❌ | ❌ | ✅ |
| System Settings | ❌ | ❌ | ✅ |

---

## 5. Authentication State Management

### JWT Token Structure
```json
{
  "userId": "user_123",
  "phoneNumber": "+2348012345678",
  "role": "attendee|organizer|admin",
  "firstName": "John",
  "lastName": "Doe",
  "state": "Lagos",
  "language": "en",
  "iat": 1234567890,
  "exp": 1234654290
}
```

### Protected Routes
```typescript
// Route protection by role
const routes = {
  // Public
  '/': 'public',
  '/events': 'public',
  '/events/:id': 'public',
  
  // Authenticated
  '/dashboard': 'authenticated',
  '/profile': 'authenticated',
  '/wallet': 'authenticated',
  
  // Attendee
  '/tickets': 'attendee',
  '/referrals': 'attendee',
  
  // Organizer
  '/organizer/dashboard': 'organizer',
  '/organizer/events': 'organizer',
  '/organizer/create': 'organizer',
  '/organizer/analytics': 'organizer',
  
  // Admin
  '/admin/dashboard': 'admin',
  '/admin/users': 'admin',
  '/admin/events': 'admin',
  '/admin/analytics': 'admin',
  '/admin/settings': 'admin'
}
```

---

## 6. Session Management

### Login Session
- JWT access token (24 hours)
- Refresh token (30 days)
- Stored in httpOnly cookies
- Auto-refresh before expiration

### Logout
- Clear tokens
- Redirect to landing page
- Optional: Logout from all devices

### Security Features
- Rate limiting (100 req/min)
- OTP expiration (5 minutes)
- Failed login attempts (5 max, then lockout)
- Session timeout (24 hours inactive)
- Device tracking
- Suspicious activity alerts

---

This completes the authentication design. Next, I'll create the dashboard designs for each user type.
