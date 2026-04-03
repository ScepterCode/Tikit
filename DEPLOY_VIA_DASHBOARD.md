# 🚀 Deploy Email Function via Supabase Dashboard

Since CLI installation can be tricky on Windows, here's how to deploy the Edge Function directly through the Supabase Dashboard (easier and faster!).

---

## 📋 Step-by-Step Guide (10 minutes)

### Step 1: Open Supabase Dashboard (1 min)

1. Go to: https://supabase.com/dashboard
2. Login to your account
3. Select your project: **hwwzbsppzwcyvambeade**

### Step 2: Create Edge Function (3 min)

1. In the left sidebar, click **Edge Functions**
2. Click the **Create a new function** button
3. Fill in the details:
   - **Function name**: `send-emails`
   - **Template**: Choose "Blank function" or "HTTP Request"

### Step 3: Copy Function Code (2 min)

1. Delete any template code in the editor
2. Open the file: `Tikit/supabase/functions/send-emails/index.ts`
3. Copy ALL the code from that file
4. Paste it into the Supabase Dashboard editor

**The code to copy:**

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    console.log('📧 Starting email queue processing...')

    // Get pending emails from queue (limit to 10 per run)
    const { data: emails, error: fetchError } = await supabaseClient
      .from('email_queue')
      .select('*')
      .eq('status', 'pending')
      .lt('attempts', 3)
      .order('created_at', { ascending: true })
      .limit(10)

    if (fetchError) {
      console.error('❌ Error fetching emails:', fetchError)
      throw fetchError
    }

    console.log(`📬 Found ${emails?.length || 0} pending emails`)

    let sent = 0
    let failed = 0
    const results = []

    // Process each email
    for (const email of emails || []) {
      try {
        console.log(`📤 Sending email to ${email.to_email}: ${email.subject}`)

        // Use Supabase Auth's admin API to send email
        // This uses Supabase's built-in email service
        const { data: authData, error: sendError } = await supabaseClient.auth.admin.inviteUserByEmail(
          email.to_email,
          {
            data: {
              email_subject: email.subject,
              email_html: email.html_body,
              email_text: email.text_body || '',
              email_type: email.email_type
            },
            redirectTo: email.html_body.includes('verify-email') 
              ? email.html_body.match(/href="([^"]*verify-email[^"]*)"/)?.[1] 
              : undefined
          }
        )

        if (sendError) {
          console.error(`❌ Error sending to ${email.to_email}:`, sendError)
          throw sendError
        }

        // Mark as sent
        const { error: updateError } = await supabaseClient
          .from('email_queue')
          .update({ 
            status: 'sent', 
            sent_at: new Date().toISOString(),
            attempts: email.attempts + 1
          })
          .eq('id', email.id)

        if (updateError) {
          console.error(`⚠️ Error updating status for ${email.id}:`, updateError)
        }

        console.log(`✅ Email sent to ${email.to_email}`)
        sent++
        results.push({
          id: email.id,
          to: email.to_email,
          status: 'sent'
        })

      } catch (err) {
        console.error(`❌ Failed to send email ${email.id}:`, err)
        
        // Mark as failed or retry
        const newStatus = email.attempts >= 2 ? 'failed' : 'pending'
        const { error: updateError } = await supabaseClient
          .from('email_queue')
          .update({ 
            status: newStatus,
            attempts: email.attempts + 1,
            error_message: err.message || String(err)
          })
          .eq('id', email.id)

        if (updateError) {
          console.error(`⚠️ Error updating failed status for ${email.id}:`, updateError)
        }

        failed++
        results.push({
          id: email.id,
          to: email.to_email,
          status: 'failed',
          error: err.message || String(err)
        })
      }
    }

    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        total: emails?.length || 0,
        sent,
        failed
      },
      results
    }

    console.log('📊 Processing complete:', response.summary)

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('💥 Fatal error:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || String(error),
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
```

### Step 4: Deploy Function (1 min)

1. Click the **Deploy** button (bottom right)
2. Wait for deployment to complete (usually 10-30 seconds)
3. You should see a success message

### Step 5: Test the Function (2 min)

1. In the Edge Functions page, find your `send-emails` function
2. Click on it to open details
3. Click the **Invoke** button
4. You should see a response showing emails processed

**Or test via Python:**

```bash
cd Tikit
python test_edge_function.py
```

### Step 6: Set Up Cron Job (3 min)

Now that the function is deployed, set up automatic processing:

1. In Supabase Dashboard, go to **Database** → **Cron Jobs**
2. Click **Create a new cron job**
3. Fill in:
   - **Name**: `process-email-queue`
   - **Schedule**: `*/5 * * * *` (every 5 minutes)
   - **SQL Command**:

```sql
SELECT
  net.http_post(
    url := 'https://hwwzbsppzwcyvambeade.supabase.co/functions/v1/send-emails',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    )
  ) as request_id;
```

4. Click **Create**

---

## ✅ Verification

### Check if Function is Working

1. **View Function Logs:**
   - Go to Edge Functions → send-emails → Logs
   - You should see processing logs

2. **Check Email Queue:**
   - Go to Database → SQL Editor
   - Run:
   ```sql
   SELECT * FROM email_queue 
   WHERE to_email = 'scepterboss@gmail.com' 
   ORDER BY created_at DESC;
   ```
   - Status should change from 'pending' to 'sent'

3. **Check Your Inbox:**
   - Check scepterboss@gmail.com
   - You should receive 3 test emails within 5 minutes

---

## 🆘 Troubleshooting

### Function Not Deploying

- Check for syntax errors in the code
- Make sure you copied ALL the code
- Try refreshing the page and deploying again

### Emails Not Sending

1. **Check function logs** for errors
2. **Manually invoke** the function to test
3. **Check email queue** status in database
4. **Verify cron job** is created and running

### Cron Job Not Running

```sql
-- Check if cron job exists
SELECT * FROM cron.job WHERE jobname = 'process-email-queue';

-- Check cron job history
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'process-email-queue')
ORDER BY start_time DESC 
LIMIT 10;
```

---

## 🎉 Success!

Once deployed, your email system will:

- ✅ Process emails every 5 minutes automatically
- ✅ Send queued emails to recipients
- ✅ Retry failed emails up to 3 times
- ✅ Log all activity for monitoring

**Your 5 test emails for scepterboss@gmail.com will be sent within 5 minutes!**

---

## 📞 Next Steps

1. ✅ Function deployed
2. ✅ Cron job created
3. ⏳ Wait 5 minutes for emails to send
4. ✅ Check your inbox!
5. ✅ Monitor function logs

**No CLI installation needed!** 🎊
