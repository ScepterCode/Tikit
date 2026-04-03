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

    // Get Resend API key
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured in Supabase secrets')
    }

    console.log('📧 Starting email queue processing with Resend...')

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

        // Send via Resend API
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
          console.error(`❌ Resend API error:`, resendData)
          throw new Error(`Resend API error: ${JSON.stringify(resendData)}`)
        }

        console.log(`✅ Resend response:`, resendData)

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
          status: 'sent',
          resend_id: resendData.id
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
