# 📧 Email Sending Solution

## 🔍 Current Situation

The Edge Function is deployed and working, but we discovered an issue:

**Problem**: Supabase Auth's `inviteUserByEmail` method only works for new users who haven't registered yet. It fails with "A user with this email address has already been registered" for existing users.

**Result**: 
- ✅ 3 emails sent successfully to fasthands0015@gmail.com (not registered)
- ❌ 6 emails failed for scepterboss@gmail.com (already registered)

## 💡 Solution Options

### Option 1: Use Resend (Recommended) ⭐

Resend is the easiest and most reliable email service for Supabase Edge Functions.

**Setup (5 minutes):**

1. **Sign up for Resend**: https://resend.com/signup
   - Free tier: 100 emails/day, 3,000/month
   - Perfect for development and testing

2. **Get API Key**:
   - Go to: https://resend.com/api-keys
   - Create new API key
   - Copy the key

3. **Add to Supabase**:
   - Go to Supabase Dashboard → Project Settings → Edge Functions
   - Add secret: `RESEND_API_KEY` = your-api-key

4. **Update Edge Function**:
   Replace the current code with this:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
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

    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured')
    }

    console.log('📧 Starting email queue processing...')

    const { data: emails, error: fetchError } = await supabaseClient
      .from('email_queue')
      .select('*')
      .eq('status', 'pending')
      .lt('attempts', 3)
      .order('created_at', { ascending: true })
      .limit(10)

    if (fetchError) throw fetchError

    console.log(`📬 Found ${emails?.length || 0} pending emails`)

    let sent = 0
    let failed = 0
    const results = []

    for (const email of emails || []) {
      try {
        console.log(`📤 Sending email to ${email.to_email}: ${email.subject}`)

        // Send via Resend
        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'Tikit <noreply@tikit.app>',
            to: email.to_email,
            subject: email.subject,
            html: email.html_body,
            text: email.text_body || ''
          })
        })

        if (!resendResponse.ok) {
          const error = await resendResponse.text()
          throw new Error(`Resend API error: ${error}`)
        }

        // Mark as sent
        await supabaseClient
          .from('email_queue')
          .update({ 
            status: 'sent', 
            sent_at: new Date().toISOString(),
            attempts: email.attempts + 1
          })
          .eq('id', email.id)

        console.log(`✅ Email sent to ${email.to_email}`)
        sent++
        results.push({
          id: email.id,
          to: email.to_email,
          status: 'sent'
        })

      } catch (err) {
        console.error(`❌ Failed to send email ${email.id}:`, err)
        
        const newStatus = email.attempts >= 2 ? 'failed' : 'pending'
        await supabaseClient
          .from('email_queue')
          .update({ 
            status: newStatus,
            attempts: email.attempts + 1,
            error_message: err.message || String(err)
          })
          .eq('id', email.id)

        failed++
        results.push({
          id: email.id,
          to: email.to_email,
          status: 'failed',
          error: err.message || String(err)
        })
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        summary: { total: emails?.length || 0, sent, failed },
        results
      }),
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

5. **Test**:
```bash
python trigger_email_function.py
```

---

### Option 2: Use SendGrid

Similar to Resend but requires more setup.

1. Sign up: https://sendgrid.com
2. Get API key
3. Add to Supabase secrets: `SENDGRID_API_KEY`
4. Update Edge Function to use SendGrid API

---

### Option 3: Temporary Testing Solution

For immediate testing without external services, I've created `index-v2.ts` that marks emails as "sent" without actually sending them. This lets you:

- ✅ Test the queue processing
- ✅ Verify the cron job works
- ✅ See emails marked as sent in database
- ❌ But emails won't actually be delivered

**Use this only for testing the system flow!**

---

## 🎯 Recommended Next Steps

### For Production (Use Resend):

1. **Sign up for Resend** (5 min)
   - https://resend.com/signup
   - Free tier is generous

2. **Get API key** (1 min)
   - https://resend.com/api-keys

3. **Add to Supabase** (2 min)
   - Dashboard → Settings → Edge Functions → Secrets
   - Add: `RESEND_API_KEY`

4. **Update Edge Function** (2 min)
   - Copy the Resend code above
   - Paste in Supabase Dashboard
   - Deploy

5. **Test** (1 min)
   ```bash
   python trigger_email_function.py
   ```

**Total time: 11 minutes**

---

### For Testing Only (Temporary):

1. **Update Edge Function**:
   - Copy code from `index-v2.ts`
   - Paste in Supabase Dashboard
   - Deploy

2. **Test**:
   ```bash
   python trigger_email_function.py
   ```

3. **Check database**:
   ```sql
   SELECT * FROM email_queue 
   WHERE to_email = 'scepterboss@gmail.com' 
   ORDER BY created_at DESC;
   ```
   - Status should be 'sent'
   - But no actual email delivered

---

## 📊 Current Status

✅ **Working**:
- Email queueing system
- Edge Function deployment
- Queue processing logic
- Database updates
- Error handling

⏳ **Needs Setup**:
- Actual email delivery service (Resend recommended)

---

## 💰 Cost Comparison

| Service | Free Tier | Paid Plans | Best For |
|---------|-----------|------------|----------|
| **Resend** | 100/day, 3,000/month | $20/month for 50k | Development & Production |
| **SendGrid** | 100/day | $15/month for 40k | Enterprise |
| **Mailgun** | 5,000/month | $35/month for 50k | High volume |
| **AWS SES** | 62,000/month (if on EC2) | $0.10 per 1,000 | AWS users |

**Recommendation**: Start with Resend's free tier (perfect for your needs!)

---

## 🎉 Summary

Your email system is 95% complete! Just need to:

1. Sign up for Resend (free)
2. Add API key to Supabase
3. Update Edge Function with Resend code
4. Test and you're done!

**Estimated time to complete: 11 minutes**

Then your emails will actually be delivered to scepterboss@gmail.com! 📧
