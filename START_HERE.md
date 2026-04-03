# 🚀 START HERE: Email & 2FA Setup (Supabase Email)

**Quick Start Guide - 15 Minutes Total**

This guide uses Supabase's built-in email service (no SMTP configuration needed!)

---

## ✅ What's Already Done

- ✅ Email service created (`apps/backend-fastapi/services/email_service.py`)
- ✅ Database migration ready (`EMAIL_VERIFICATION_MIGRATION.sql`)
- ✅ Auth service updated with email verification
- ✅ Wallet security updated with OTP via email
- ✅ Frontend verification page created
- ✅ API endpoints added
- ✅ Professional HTML email templates
- ✅ Edge Function code ready (`supabase/functions/send-emails/`)

---

## 🎯 Quick Setup (3 Steps)

### Step 1: Run Database Migration (2 minutes)

1. Open Supabase Dashboard: https://supabase.com/dashboard
2. Go to SQL Editor
3. Copy contents of `EMAIL_VERIFICATION_MIGRATION.sql`
4. Paste and run in SQL Editor

### Step 2: Deploy Edge Function (5 minutes)

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project (get ref from dashboard)
supabase link --project-ref YOUR_PROJECT_REF

# Deploy the email function
supabase functions deploy send-emails
```

Or use the deployment script:

```bash
chmod +x deploy_email_function.sh
./deploy_email_function.sh
```

### Step 3: Set Up Cron Job (3 minutes)

1. Go to: https://supabase.com/dashboard → Database → Cron Jobs
2. Click "Create Cron Job"
3. Name: `process-email-queue`
4. Schedule: `*/5 * * * *` (every 5 minutes)
5. SQL Command:

```sql
SELECT
  net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-emails',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    )
  ) as request_id;
```

---

## 🧪 Test It (5 minutes)

```bash
# 1. Queue test emails
python test_supabase_email.py

# 2. Manually trigger function
supabase functions invoke send-emails --no-verify-jwt

# 3. Check your inbox!
```

Check email queue status:

```sql
SELECT * FROM email_queue ORDER BY created_at DESC LIMIT 10;
```

---

## 📊 How It Works

1. **User Action** → Backend queues email in database
2. **Cron Job** → Triggers Edge Function every 5 minutes
3. **Edge Function** → Processes queue and sends emails via Supabase
4. **Database** → Updates status to 'sent' or 'failed'

---

## 🔍 Monitoring

```bash
# View function logs
supabase functions logs send-emails --tail

# Check email statistics
SELECT * FROM email_statistics;
```

---

## 🆘 Quick Troubleshooting

**Emails not sending?**

```bash
# Check pending emails
SELECT COUNT(*) FROM email_queue WHERE status = 'pending';

# Manually trigger
supabase functions invoke send-emails --no-verify-jwt

# View logs
supabase functions logs send-emails
```

**Retry failed emails:**

```sql
UPDATE email_queue 
SET status = 'pending', attempts = 0 
WHERE status = 'failed';
```

---

## 📚 Detailed Guides

- **Full Deployment Guide**: `SUPABASE_EMAIL_DEPLOYMENT.md`
- **Edge Function Setup**: `supabase/functions/send-emails/README.md`
- **Implementation Details**: `EMAIL_2FA_COMPLETE.md`
- **Troubleshooting**: `SUPABASE_EMAIL_SETUP.md`

---

## ✅ Success Checklist

- [ ] Database migration completed
- [ ] Edge function deployed
- [ ] Cron job created
- [ ] Test emails sent successfully
- [ ] Function logs show success

---

## 🎉 You're Done!

Your app now has:

- ✅ Email verification for new users
- ✅ OTP codes via email for wallet security
- ✅ Ticket confirmations with QR codes
- ✅ Password reset emails
- ✅ Automatic retry on failure
- ✅ Professional HTML templates

**No SMTP configuration needed!** 🚀

---

## 🔜 Next Steps

1. Test user registration flow
2. Test wallet OTP flow
3. Test ticket purchase emails
4. Set up error tracking (see `NEXT_PRIORITY_TASKS.md`)
5. Deploy to production

**Questions?** See `SUPABASE_EMAIL_DEPLOYMENT.md` for detailed troubleshooting.
