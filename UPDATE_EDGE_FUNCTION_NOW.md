# 🚀 Update Edge Function with Resend (2 minutes)

You've added the RESEND_API_KEY to Supabase secrets. Great! Now just update the Edge Function code.

---

## 📋 Steps to Update

### Step 1: Open Supabase Dashboard (30 seconds)

1. Go to: https://supabase.com/dashboard
2. Select your project
3. Click **Edge Functions** in sidebar
4. Click on **send-emails** function

### Step 2: Replace Code (1 minute)

1. **Delete** all existing code in the editor
2. **Open** the file: `Tikit/supabase/functions/send-emails/index-resend.ts`
3. **Copy** ALL the code from that file
4. **Paste** into the Supabase editor

**Or copy this code directly:**

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

    console.log('📧 Starting email queue processing with Resend...')

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

        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'Tikit <noreply@tikit.app>',
            to: [email.to_email],
            subject: email.subject,
            html: email.html_body,
            text: email.text_body || ''
          })
        })

        const resendData = await resendResponse.json()

        if (!resendResponse.ok) {
          throw new Error(`Resend API error: ${JSON.stringify(resendData)}`)
        }

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
          status: 'sent',
          resend_id: resendData.id
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

### Step 3: Deploy (30 seconds)

1. Click the **Deploy** button (bottom right)
2. Wait for deployment to complete
3. You should see "Deployment successful"

---

## 🧪 Test It!

Run this command to send your emails:

```bash
cd Tikit
python trigger_email_function.py
```

You should see:
- ✅ Emails sent successfully
- ✅ No more "user already registered" errors
- ✅ Emails delivered to scepterboss@gmail.com

---

## 📧 Check Your Inbox!

Within 1-2 minutes, check scepterboss@gmail.com for:
1. Verification email
2. OTP email
3. Ticket confirmation email

---

## 🎉 That's It!

Your email system is now fully operational with Resend!

**Total time**: 2 minutes
**Status**: Ready to send emails! 🚀
