# 🚀 Quick Setup Guide - Email & 2FA

## ⏱️ Total Time: 4-6 hours

---

## ✅ Step 1: Configure SMTP (15 minutes) - MANUAL

### Option A: Gmail (Easiest)

1. **Enable 2-Step Verification**:
   - Go to: https://myaccount.google.com/security
   - Enable 2-Step Verification

2. **Generate App Password**:
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Name it "Tikit"
   - Copy the 16-character password

3. **Update `.env` file**:
```env
# In apps/backend-fastapi/.env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=xxxx-xxxx-xxxx-xxxx  # 16-char app password
EMAIL_FROM=noreply@tikit.app
ENABLE_EMAIL_NOTIFICATIONS=true
```

### Option B: SendGrid (Production Recommended)

1. Sign up at https://sendgrid.com
2. Create API key
3. Update `.env`:
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USERNAME=apikey
SMTP_PASSWORD=your-sendgrid-api-key
EMAIL_FROM=noreply@tikit.app
ENABLE_EMAIL_NOTIFICATIONS=true
```

---

## ✅ Step 2: Run Database Migrations (5 minutes) - MANUAL

1. Open Supabase Dashboard: https://supabase.com/dashboard
2. Go to your project
3. Click "SQL Editor" in left sidebar
4. Click "New Query"
5. Copy entire contents of `EMAIL_VERIFICATION_MIGRATION.sql`
6. Paste and click "Run"
7. Verify success messages appear

**Expected Output**:
```
✅ Email verification & 2FA migrations completed successfully!
📊 Tables ready: users (updated), email_queue, otp_codes, password_reset_tokens
```

---

## ✅ Step 3: Update Auth Service (30 minutes) - AUTOMATED BELOW

Files to update:
- `apps/backend-fastapi/services/auth_service.py`
- Add email verification methods

---

## ✅ Step 4: Update Wallet Security (15 minutes) - AUTOMATED BELOW

Files to update:
- `apps/backend-fastapi/services/wallet_security_service.py`
- Send OTP via email instead of returning in response

---

## ✅ Step 5: Add API Endpoints (15 minutes) - AUTOMATED BELOW

Files to update:
- `apps/backend-fastapi/routers/auth.py`
- Add `/verify-email` and `/resend-verification` endpoints

---

## ✅ Step 6: Create Frontend Components (1 hour) - AUTOMATED BELOW

Files to create:
- `apps/frontend/src/pages/VerifyEmail.tsx`
- Update registration flow

---

## ✅ Step 7: Test (1 hour) - MANUAL

### Test Checklist:
- [ ] Email service connects to SMTP
- [ ] Verification email sent on registration
- [ ] Verification link works
- [ ] OTP sent via email (not in API response)
- [ ] Ticket confirmation email sent
- [ ] Password reset email sent

### Test Commands:
```bash
# Test email service
cd Tikit
python test_email_service.py

# Test registration flow
# 1. Register new user
# 2. Check email for verification link
# 3. Click link
# 4. Verify account is verified

# Test OTP flow
# 1. Try to withdraw from wallet
# 2. Check email for OTP
# 3. Enter OTP
# 4. Verify withdrawal works
```

---

## 🎯 Success Criteria

After completing all steps:
- ✅ Users receive verification emails
- ✅ Email verification works
- ✅ OTP sent via email (secure)
- ✅ Tickets sent via email
- ✅ Professional email templates
- ✅ No errors in logs

---

## 🆘 Troubleshooting

### Email not sending?
1. Check SMTP credentials
2. Check firewall/antivirus
3. Try different SMTP port (465 for SSL)
4. Check email service logs

### Verification link not working?
1. Check token in database
2. Verify token not expired
3. Check frontend URL in config

### OTP not received?
1. Check spam folder
2. Verify email in user profile
3. Check email service logs
4. Try resending OTP

---

## 📞 Need Help?

Check these files:
- `WEEK1_EMAIL_2FA_IMPLEMENTATION.md` - Detailed guide
- `EMAIL_AND_2FA_AUDIT.md` - Security analysis
- `email_service.py` - Email service code

---

**Ready to proceed with automated steps!** 🚀

