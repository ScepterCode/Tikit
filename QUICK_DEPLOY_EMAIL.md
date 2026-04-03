# ⚡ Quick Deploy: Email System (5 Commands)

## 🎯 Goal
Deploy Supabase email system in 15 minutes

---

## 📋 Prerequisites
- Supabase project created
- Node.js installed

---

## 🚀 Deployment (Copy & Paste)

### 1. Install Supabase CLI
```bash
npm install -g supabase
```

### 2. Login & Link
```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```
*Get YOUR_PROJECT_REF from: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/general*

### 3. Run Database Migration
1. Go to: https://supabase.com/dashboard
2. Click: SQL Editor
3. Copy all from: `EMAIL_VERIFICATION_MIGRATION.sql`
4. Paste & Run

### 4. Deploy Edge Function
```bash
cd Tikit
supabase functions deploy send-emails
```

### 5. Create Cron Job
1. Go to: https://supabase.com/dashboard → Database → Cron Jobs
2. Click: "Create Cron Job"
3. Name: `process-email-queue`
4. Schedule: `*/5 * * * *`
5. SQL:
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

## 🧪 Test (3 Commands)

```bash
# 1. Queue test emails
python test_supabase_email.py

# 2. Test Edge Function
python test_edge_function.py

# 3. Check logs
supabase functions logs send-emails --tail
```

---

## ✅ Verify

```sql
-- Check email queue
SELECT * FROM email_queue ORDER BY created_at DESC LIMIT 5;

-- Check sent emails
SELECT COUNT(*) FROM email_queue WHERE status = 'sent';
```

---

## 🆘 Troubleshooting

**Emails not sending?**
```bash
# Manually trigger
supabase functions invoke send-emails --no-verify-jwt

# Check logs
supabase functions logs send-emails
```

**Retry failed emails:**
```sql
UPDATE email_queue SET status = 'pending', attempts = 0 WHERE status = 'failed';
```

---

## 📚 Full Docs

- **Detailed Guide**: `SUPABASE_EMAIL_DEPLOYMENT.md`
- **Complete Setup**: `EMAIL_SETUP_COMPLETE.md`
- **Quick Start**: `START_HERE.md`

---

## ⏱️ Time Breakdown

- Install CLI: 1 min
- Login & Link: 2 min
- Database Migration: 2 min
- Deploy Function: 5 min
- Create Cron Job: 3 min
- Test: 2 min

**Total: 15 minutes**

---

## 🎉 Done!

Your email system is now:
- ✅ Deployed
- ✅ Processing queue every 5 minutes
- ✅ Sending emails via Supabase
- ✅ Ready for production

**No SMTP configuration needed!** 🚀
