# 🚀 Supabase Email Deployment Guide

Complete guide to deploy email functionality using Supabase Edge Functions.

## 📋 Prerequisites

- ✅ Supabase project created
- ✅ Database migration completed (`EMAIL_VERIFICATION_MIGRATION.sql`)
- ✅ Node.js installed (for Supabase CLI)

## 🎯 Quick Start (15 minutes)

### Step 1: Install Supabase CLI (2 minutes)

```bash
# Install globally
npm install -g supabase

# Verify installation
supabase --version
```

### Step 2: Login and Link Project (3 minutes)

```bash
# Login to Supabase
supabase login

# Link to your project
# Get your project ref from: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/general
supabase link --project-ref YOUR_PROJECT_REF
```

### Step 3: Deploy Edge Function (5 minutes)

```bash
# Navigate to your project
cd Tikit

# Deploy the send-emails function
supabase functions deploy send-emails

# Verify deployment
supabase functions list
```

### Step 4: Set Up Cron Job (5 minutes)

#### Option A: Using Supabase Dashboard (Easiest)

1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/database/cron-jobs
2. Click "Create Cron Job"
3. Fill in:
   - **Name**: `process-email-queue`
   - **Schedule**: `*/5 * * * *` (every 5 minutes)
   - **SQL Command**:

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

4. Click "Create"

#### Option B: Using SQL Editor

Run this in Supabase SQL Editor:

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create cron job
SELECT cron.schedule(
  'process-email-queue',
  '*/5 * * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-emails',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      )
    ) as request_id;
  $$
);
```

## 🧪 Testing

### Test 1: Queue an Email

Run the test script:

```bash
cd Tikit
python test_supabase_email.py
```

Enter your email when prompted. This will queue 3 test emails.

### Test 2: Manually Trigger Edge Function

```bash
# Using Supabase CLI
supabase functions invoke send-emails --no-verify-jwt

# Or using curl
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-emails \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

### Test 3: Check Email Queue

```sql
-- Check pending emails
SELECT * FROM email_queue WHERE status = 'pending';

-- Check sent emails
SELECT * FROM email_queue WHERE status = 'sent' ORDER BY sent_at DESC LIMIT 10;

-- Check failed emails
SELECT * FROM email_queue WHERE status = 'failed';
```

### Test 4: Check Function Logs

```bash
# Using CLI
supabase functions logs send-emails --tail

# Or in Dashboard
# Go to: Edge Functions > send-emails > Logs
```

## 📊 Monitoring

### Email Queue Statistics

```sql
-- Email statistics by type and status
SELECT * FROM email_statistics;

-- Pending emails count
SELECT COUNT(*) as pending_count 
FROM email_queue 
WHERE status = 'pending';

-- Success rate (last 24 hours)
SELECT 
  COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
  ROUND(
    COUNT(CASE WHEN status = 'sent' THEN 1 END)::numeric / 
    NULLIF(COUNT(*)::numeric, 0) * 100, 
    2
  ) as success_rate_percent
FROM email_queue
WHERE created_at > NOW() - INTERVAL '24 hours';
```

### Cron Job Status

```sql
-- Check if cron job exists
SELECT * FROM cron.job WHERE jobname = 'process-email-queue';

-- View cron job history
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'process-email-queue')
ORDER BY start_time DESC 
LIMIT 10;
```

## 🔧 Configuration

### Environment Variables

The Edge Function automatically uses these Supabase environment variables:

- `SUPABASE_URL` - Your project URL (auto-set)
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (auto-set)

No additional configuration needed!

### Backend Configuration

Ensure these are set in `apps/backend-fastapi/.env`:

```env
ENABLE_EMAIL_NOTIFICATIONS=true
FRONTEND_URL=http://localhost:3000
EMAIL_FROM=noreply@tikit.app
```

## 🆘 Troubleshooting

### Issue: Emails not sending

**Check 1: Email queue has pending emails**
```sql
SELECT COUNT(*) FROM email_queue WHERE status = 'pending';
```

**Check 2: Edge function is deployed**
```bash
supabase functions list
```

**Check 3: Cron job is running**
```sql
SELECT * FROM cron.job WHERE jobname = 'process-email-queue';
```

**Check 4: Function logs for errors**
```bash
supabase functions logs send-emails --tail
```

### Issue: Edge function deployment fails

**Solution 1: Update Supabase CLI**
```bash
npm update -g supabase
```

**Solution 2: Check project link**
```bash
supabase link --project-ref YOUR_PROJECT_REF
```

**Solution 3: Verify authentication**
```bash
supabase login
```

### Issue: Cron job not triggering

**Solution 1: Verify pg_cron extension**
```sql
SELECT * FROM pg_extension WHERE extname = 'pg_cron';
```

**Solution 2: Check cron job schedule**
```sql
SELECT * FROM cron.job WHERE jobname = 'process-email-queue';
```

**Solution 3: Manually trigger to test**
```bash
supabase functions invoke send-emails --no-verify-jwt
```

### Issue: Emails marked as failed

**Check error messages:**
```sql
SELECT id, to_email, error_message, attempts 
FROM email_queue 
WHERE status = 'failed' 
ORDER BY created_at DESC;
```

**Retry failed emails:**
```sql
UPDATE email_queue 
SET status = 'pending', attempts = 0, error_message = NULL
WHERE status = 'failed';
```

## 🎉 Success Checklist

- [ ] Supabase CLI installed
- [ ] Project linked
- [ ] Edge function deployed
- [ ] Cron job created
- [ ] Test emails queued
- [ ] Test emails sent successfully
- [ ] Function logs show success
- [ ] Email queue processing automatically

## 📞 Next Steps

Once emails are working:

1. **Test user registration** - Register a new user and verify email
2. **Test OTP codes** - Try wallet operations that require OTP
3. **Test ticket emails** - Purchase a ticket and check confirmation email
4. **Monitor for 24 hours** - Ensure cron job runs reliably

## 🔗 Useful Links

- **Supabase Dashboard**: https://supabase.com/dashboard
- **Edge Functions Docs**: https://supabase.com/docs/guides/functions
- **Cron Jobs Docs**: https://supabase.com/docs/guides/database/extensions/pg_cron
- **Email Auth Docs**: https://supabase.com/docs/guides/auth/auth-email

## 💡 Tips

1. **Start with 5-minute intervals** for cron job, adjust based on email volume
2. **Monitor function logs** for the first few hours after deployment
3. **Set up alerts** for failed emails using Supabase webhooks
4. **Keep email templates** updated in the email service
5. **Test thoroughly** before going to production

---

**Deployment Time**: ~15 minutes  
**Configuration**: Zero SMTP credentials needed  
**Status**: Production-ready with Supabase's built-in email service  

🎉 **You're all set!** Emails will now be sent automatically every 5 minutes.
