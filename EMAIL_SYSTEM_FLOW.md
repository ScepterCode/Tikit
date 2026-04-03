# 📧 Email System Flow Diagram

## 🎯 Complete Email System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER ACTIONS                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │  1. Register Account                     │
        │  2. Request Wallet OTP                   │
        │  3. Purchase Ticket                      │
        │  4. Reset Password                       │
        └─────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND SERVICES                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │  Auth Service    │  │ Wallet Security  │  │ Event Service│ │
│  │                  │  │                  │  │              │ │
│  │ • register_user()│  │ • generate_otp() │  │ • purchase() │ │
│  │ • verify_email() │  │ • verify_otp()   │  │ • send_ticket│ │
│  └──────────────────┘  └──────────────────┘  └──────────────┘ │
│           │                     │                     │         │
│           └─────────────────────┼─────────────────────┘         │
│                                 ▼                                │
│                    ┌─────────────────────────┐                  │
│                    │   Email Service         │                  │
│                    │                         │                  │
│                    │ • send_verification()   │                  │
│                    │ • send_otp()            │                  │
│                    │ • send_ticket()         │                  │
│                    │ • send_password_reset() │                  │
│                    └─────────────────────────┘                  │
│                                 │                                │
└─────────────────────────────────┼────────────────────────────────┘
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SUPABASE DATABASE                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              email_queue TABLE                             │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │ id          │ UUID                                         │ │
│  │ to_email    │ user@example.com                            │ │
│  │ subject     │ "Verify Your Tikit Account"                 │ │
│  │ html_body   │ <html>...</html>                            │ │
│  │ text_body   │ Plain text version                          │ │
│  │ email_type  │ verification / otp / ticket / etc.          │ │
│  │ status      │ pending / sent / failed                     │ │
│  │ attempts    │ 0 / 1 / 2 / 3                               │ │
│  │ created_at  │ 2026-04-02 17:30:00                         │ │
│  │ sent_at     │ 2026-04-02 17:35:00                         │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CRON JOB (Every 5 minutes)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  SELECT net.http_post(                                          │
│    url := 'https://xxx.supabase.co/functions/v1/send-emails',  │
│    headers := jsonb_build_object(...)                           │
│  );                                                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│              SUPABASE EDGE FUNCTION (send-emails)                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Fetch pending emails (status = 'pending', attempts < 3)     │
│  2. Process up to 10 emails per run                             │
│  3. For each email:                                             │
│     ┌─────────────────────────────────────────────────────┐    │
│     │ a. Send via Supabase Auth API                       │    │
│     │ b. If success: Update status = 'sent'               │    │
│     │ c. If failure: Increment attempts, retry later      │    │
│     │ d. If attempts >= 3: Mark as 'failed'               │    │
│     └─────────────────────────────────────────────────────┘    │
│  4. Return summary: {sent: X, failed: Y, total: Z}              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                  SUPABASE AUTH EMAIL SERVICE                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  • Built-in email delivery                                      │
│  • No SMTP configuration needed                                 │
│  • Automatic retry on failure                                   │
│  • Professional email templates                                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                        USER'S INBOX                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  📧 Email Received!                                             │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ From: Tikit <noreply@tikit.app>                           │ │
│  │ Subject: Verify Your Tikit Account                         │ │
│  │                                                            │ │
│  │ [Beautiful HTML Email with Button]                         │ │
│  │                                                            │ │
│  │ ┌──────────────────────────────────────┐                 │ │
│  │ │   [Verify Email Address]             │                 │ │
│  │ └──────────────────────────────────────┘                 │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    USER CLICKS LINK                              │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│              FRONTEND (VerifyEmail.tsx)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Extract token from URL: /verify-email?token=xxx             │
│  2. Call API: POST /auth/verify-email?token=xxx                 │
│  3. Show loading state                                          │
│  4. On success: Show success message, redirect to login         │
│  5. On error: Show error message (expired/invalid)              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│              BACKEND (auth.py)                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  POST /auth/verify-email?token=xxx                              │
│                                                                  │
│  1. Find user with token                                        │
│  2. Check token expiry (24 hours)                               │
│  3. Update: email_verified = true                               │
│  4. Clear: verification_token = null                            │
│  5. Return: {success: true, message: "Email verified"}          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ✅ EMAIL VERIFIED!                            │
│                    User can now login                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Email Types Flow

### 1. Verification Email Flow
```
User Registers
    ↓
Auth Service generates token
    ↓
Email Service queues verification email
    ↓
Cron triggers Edge Function
    ↓
Email sent to user
    ↓
User clicks verification link
    ↓
Frontend calls verify endpoint
    ↓
Backend validates token
    ↓
Email marked as verified
```

### 2. OTP Email Flow
```
User initiates wallet transaction
    ↓
Wallet Security generates OTP
    ↓
Email Service queues OTP email
    ↓
Cron triggers Edge Function
    ↓
Email sent with OTP code
    ↓
User enters OTP in app
    ↓
Backend validates OTP
    ↓
Transaction approved
```

### 3. Ticket Email Flow
```
User purchases ticket
    ↓
Event Service processes payment
    ↓
Email Service queues ticket email
    ↓
Cron triggers Edge Function
    ↓
Email sent with QR code
    ↓
User receives ticket
    ↓
User shows QR at event
```

---

## 📊 Data Flow

### Email Queue Record Lifecycle
```
1. CREATED
   status: 'pending'
   attempts: 0
   created_at: timestamp
   
2. PROCESSING
   Edge Function picks up email
   attempts: 1
   
3. SENT (Success)
   status: 'sent'
   sent_at: timestamp
   
   OR
   
3. RETRY (Failure)
   status: 'pending'
   attempts: 2
   error_message: "..."
   
4. FAILED (After 3 attempts)
   status: 'failed'
   attempts: 3
   error_message: "..."
```

---

## 🔍 Monitoring Points

```
┌─────────────────────────────────────────────────────────────────┐
│                    MONITORING DASHBOARD                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  📊 Email Statistics                                            │
│  ├─ Pending: 5 emails                                           │
│  ├─ Sent (24h): 127 emails                                      │
│  ├─ Failed: 3 emails                                            │
│  └─ Success Rate: 97.7%                                         │
│                                                                  │
│  📈 By Type                                                     │
│  ├─ Verification: 45 emails                                     │
│  ├─ OTP: 67 emails                                              │
│  ├─ Ticket: 12 emails                                           │
│  └─ Password Reset: 3 emails                                    │
│                                                                  │
│  ⚡ Edge Function                                               │
│  ├─ Last Run: 2 minutes ago                                     │
│  ├─ Status: Success                                             │
│  ├─ Processed: 8 emails                                         │
│  └─ Duration: 2.3 seconds                                       │
│                                                                  │
│  🔄 Cron Job                                                    │
│  ├─ Schedule: */5 * * * *                                       │
│  ├─ Next Run: 3 minutes                                         │
│  └─ Last 10 Runs: All successful                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Troubleshooting Flow

```
Email Not Received?
    │
    ├─→ Check email_queue table
    │   ├─ Status = 'pending'? → Wait for cron job
    │   ├─ Status = 'sent'? → Check spam folder
    │   └─ Status = 'failed'? → Check error_message
    │
    ├─→ Check Edge Function logs
    │   ├─ Function deployed? → Deploy if missing
    │   ├─ Errors in logs? → Fix and retry
    │   └─ Not running? → Check cron job
    │
    └─→ Check Cron Job
        ├─ Job exists? → Create if missing
        ├─ Job running? → Check schedule
        └─ Job failing? → Check permissions
```

---

## 🎯 Success Indicators

```
✅ Email System Working When:

1. Email Queue
   ├─ Emails being queued (status = 'pending')
   └─ Emails being sent (status = 'sent')

2. Edge Function
   ├─ Function deployed
   ├─ Logs show successful runs
   └─ Processing emails every 5 minutes

3. Cron Job
   ├─ Job exists in database
   ├─ Running on schedule
   └─ Triggering Edge Function

4. User Experience
   ├─ Emails received within 5 minutes
   ├─ Verification links work
   ├─ OTP codes received
   └─ Ticket emails with QR codes
```

---

## 📈 Performance Metrics

```
Target Metrics:

Email Delivery Time:     < 5 minutes
Success Rate:            > 95%
Retry Success Rate:      > 80%
Edge Function Duration:  < 5 seconds
Queue Processing:        Every 5 minutes
Max Queue Size:          < 50 emails
```

---

## 🔐 Security Checkpoints

```
Security Measures:

1. OTP Codes
   ├─ Never in API responses ✅
   ├─ Stored in database only ✅
   ├─ Automatic expiry ✅
   └─ Attempt tracking ✅

2. Verification Tokens
   ├─ Cryptographically secure ✅
   ├─ 24-hour expiry ✅
   ├─ One-time use ✅
   └─ Cleared after use ✅

3. Email Sending
   ├─ Service role key only ✅
   ├─ CORS protection ✅
   ├─ Rate limiting ready ✅
   └─ Error logging ✅
```

---

## 🚀 Deployment Checklist

```
Pre-Deployment:
├─ [x] Code implemented
├─ [x] Tests created
├─ [x] Documentation written
└─ [x] Edge Function ready

Deployment:
├─ [ ] Run database migration
├─ [ ] Deploy Edge Function
├─ [ ] Create cron job
└─ [ ] Test email flow

Post-Deployment:
├─ [ ] Monitor for 24 hours
├─ [ ] Check success rate
├─ [ ] Verify user experience
└─ [ ] Set up alerts
```

---

**This flow diagram shows the complete email system architecture from user action to email delivery and verification.**
