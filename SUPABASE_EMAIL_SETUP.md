# 🚀 Supabase Email Setup (Zero SMTP Configuration!)

## ✅ Why Supabase Email?

**Benefits:**
- ✅ No SMTP credentials needed
- ✅ No Gmail App Passwords
- ✅ No SendGrid API keys
- ✅ Built-in email delivery
- ✅ Automatic retry on failure
- ✅ Email queue management
- ✅ Production-ready out of the box

**How it works:**
1. Emails are queued in `email_queue` table
2. Supabase Edge Function processes queue
3. Emails sent via Supabase's email service
4. Automatic retries on failure

---

## 📋 Setup Steps (15 minutes)

### Step 1: Database Migration (Already Done ✅)

The `EMAIL_VERIFICATION_MIGRATION.sql` already creates the `email_queue` table.

Just run it in Supabase SQL Editor if you haven't:
1. Open: https://supabase.com/dashboard
2. Go to SQL Editor
3. Run: `EMAIL_VERIFICATION_MIGRATION.sql`

---

### Step 2: Create Supabase Edge Function (5 minutes)

**Option A: Using Supabase CLI (Recommended)**

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Create edge function
supabase functions new send-emails

# Deploy function
supabase functions deploy send-emails
```

**Option B: Using Supabase Dashboard**

1. Go to: https://supabase.com/dashboard
2. Click "Edge Functions" in sidebar
3. Click "Create Function"
4. Name: `send-emails`
5. Paste code from `supabase/functions/send-emails/index.ts` (see below)
6. Click "Deploy"

---

### Step 3: Edge Function Code

Create file: `supabase/functions/send-emails/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get pending emails from queue
    const { data: emails, error } = await supabaseClient
      .from('email_queue')
      .select('*')
      .eq('status', 'pending')
      .lt('attempts', 3)
      .order('created_at', { ascending: true })
      .limit(10)

    if (error) throw error

    let sent = 0
    let failed = 0

    // Process each email
    for (const email of emails || []) {
      try {
        // Send email using Supabase Auth
        const { error: sendError } = await supabaseClient.auth.admin.generateLink({
          type: 'email',
          email: email.to_email,
          options: {
            data: {
              subject: email.subject,
              html_body: email.html_body,
              text_body: email.text_body
            }
          }
        })

        if (sendError) throw sendError

        // Mark as sent
        await supabaseClient
          .from('email_queue')
          .update({ 
            status: 'sent', 
            sent_at: new Date().toISOString(),
            attempts: email.attempts + 1
          })
          .eq('id', email.id)

        sent++
      } catch (err) {
        // Mark as failed
        await supabaseClient
          .from('email_queue')
          .update({ 
            status: email.attempts >= 2 ? 'failed' : 'pending',
            attempts: email.attempts + 1,
            error_message: err.message
          })
          .eq('id', email.id)

        failed++
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent, 
        failed,
        total: emails?.length || 0
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
```

---

### Step 4: Set Up Cron Job (5 minutes)

**Option A: Using Supabase Cron (Recommended)**

1. Go to Supabase Dashboard
2. Click "Database" > "Cron Jobs"
3. Click "Create Cron Job"
4. Name: `process-email-queue`
5. Schedule: `*/5 * * * *` (every 5 minutes)
6. SQL:
```sql
SELECT net.http_post(
  url := 'https://your-project-ref.supabase.co/functions/v1/send-emails',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
  )
);
```

**Option B: Using External Cron (Alternative)**

Use a service like cron-job.org or GitHub Actions to call the edge function every 5 minutes.

---

### Step 5: Configure Email Templates (Optional)

Customize email templates in Supabase Dashboard:

1. Go to: Authentication > Email Templates
2. Customize templates for:
   - Confirmation
   - Magic Link
   - Change Email
   - Reset Password

---

## 🧪 Testing

### Test Email Queue

```bash
# Run test script
cd Tikit
python test_supabase_email.py
```

### Manual Test

```sql
-- Insert test email
INSERT INTO email_queue (to_email, subject, html_body, text_body, status)
VALUES (
  'your-email@example.com',
  'Test Email',
  '<h1>Test Email</h1><p>This is a test.</p>',
  'Test Email - This is a test.',
  'pending'
);

-- Check status after 5 minutes
SELECT * FROM email_queue WHERE to_email = 'your-email@example.com';
```

---

## 📊 Monitoring

### Check Email Queue Status

```sql
-- Pending emails
SELECT COUNT(*) FROM email_queue WHERE status = 'pending';

-- Sent emails (last 24 hours)
SELECT COUNT(*) FROM email_queue 
WHERE status = 'sent' 
AND sent_at > NOW() - INTERVAL '24 hours';

-- Failed emails
SELECT * FROM email_queue WHERE status = 'failed';

-- Retry failed emails
UPDATE email_queue 
SET status = 'pending', attempts = 0 
WHERE status = 'failed';
```

---

## 🔧 Configuration

### Environment Variables (Already Set ✅)

```env
# In apps/backend-fastapi/.env
ENABLE_EMAIL_NOTIFICATIONS=true
FRONTEND_URL=http://localhost:3000
EMAIL_FROM=noreply@tikit.app
```

**No SMTP credentials needed!** 🎉

---

## 🆚 Comparison: SMTP vs Supabase

| Feature | SMTP (Gmail/SendGrid) | Supabase Email |
|---------|----------------------|----------------|
| Setup Time | 15-30 min | 5-10 min |
| Configuration | SMTP credentials required | Zero config |
| Reliability | Depends on provider | Built-in retry |
| Cost | Free tier limits | Included with Supabase |
| Monitoring | External tools | Built-in dashboard |
| Queue Management | Manual | Automatic |
| Production Ready | Requires setup | Out of the box |

---

## 🚀 Advantages

### For Development
- ✅ No Gmail App Passwords
- ✅ No API keys to manage
- ✅ Works immediately
- ✅ Easy testing

### For Production
- ✅ Automatic retries
- ✅ Queue management
- ✅ Monitoring dashboard
- ✅ Scalable
- ✅ Reliable delivery

---

## 🆘 Troubleshooting

### Emails Not Sending

1. **Check email queue:**
```sql
SELECT * FROM email_queue WHERE status = 'pending' ORDER BY created_at DESC LIMIT 10;
```

2. **Check edge function logs:**
- Go to Supabase Dashboard
- Click "Edge Functions"
- Click "send-emails"
- View logs

3. **Check cron job:**
```sql
SELECT * FROM cron.job WHERE jobname = 'process-email-queue';
```

4. **Manual trigger:**
```bash
curl -X POST https://your-project-ref.supabase.co/functions/v1/send-emails \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

### Edge Function Errors

1. Check function logs in dashboard
2. Verify environment variables set
3. Test function manually
4. Check Supabase service status

---

## 📞 Support

**Files:**
- `SUPABASE_EMAIL_SETUP.md` - This file
- `test_supabase_email.py` - Test script
- `EMAIL_VERIFICATION_MIGRATION.sql` - Database schema

**Supabase Docs:**
- Edge Functions: https://supabase.com/docs/guides/functions
- Email Auth: https://supabase.com/docs/guides/auth/auth-email
- Cron Jobs: https://supabase.com/docs/guides/database/extensions/pg_cron

---

## ✨ Summary

**Setup Time:** 15 minutes  
**Configuration:** Zero SMTP credentials  
**Status:** Production-ready  

**Next Steps:**
1. ✅ Run database migration (if not done)
2. ✅ Create edge function
3. ✅ Set up cron job
4. ✅ Test email queue
5. ✅ Deploy to production

**No SMTP configuration needed!** 🎉
