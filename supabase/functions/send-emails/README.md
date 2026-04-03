# Send Emails Edge Function

This Supabase Edge Function processes the email queue and sends emails using Supabase's built-in email service.

## Features

- ✅ Processes up to 10 emails per run
- ✅ Automatic retry on failure (up to 3 attempts)
- ✅ Uses Supabase Auth's email service (no SMTP needed)
- ✅ Detailed logging and error tracking
- ✅ CORS support for manual triggers

## Deployment

### Using Supabase CLI

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy the function
supabase functions deploy send-emails

# Set environment variables (if needed)
supabase secrets set SUPABASE_URL=your-url
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-key
```

### Using Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click "Edge Functions" in the sidebar
4. Click "Create Function"
5. Name: `send-emails`
6. Copy the code from `index.ts`
7. Click "Deploy"

## Setup Cron Job

To automatically process emails every 5 minutes:

### Option 1: Supabase Cron (Recommended)

1. Go to Supabase Dashboard > Database > Cron Jobs
2. Click "Create Cron Job"
3. Name: `process-email-queue`
4. Schedule: `*/5 * * * *` (every 5 minutes)
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

### Option 2: External Cron Service

Use a service like cron-job.org or GitHub Actions to call:

```bash
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-emails \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```

## Manual Testing

Test the function manually:

```bash
# Using curl
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-emails \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"

# Using Supabase CLI
supabase functions invoke send-emails --no-verify-jwt
```

## Monitoring

Check function logs:

```bash
# Using Supabase CLI
supabase functions logs send-emails

# Or in Supabase Dashboard
# Edge Functions > send-emails > Logs
```

Check email queue status:

```sql
-- Pending emails
SELECT COUNT(*) FROM email_queue WHERE status = 'pending';

-- Recently sent
SELECT * FROM email_queue 
WHERE status = 'sent' 
AND sent_at > NOW() - INTERVAL '1 hour'
ORDER BY sent_at DESC;

-- Failed emails
SELECT * FROM email_queue 
WHERE status = 'failed'
ORDER BY created_at DESC;
```

## Troubleshooting

### Emails not sending

1. Check function logs for errors
2. Verify environment variables are set
3. Check email queue for pending emails
4. Ensure cron job is running

### Function errors

1. Check Supabase service status
2. Verify service role key has correct permissions
3. Check function logs for detailed error messages
4. Test function manually to isolate issues

## Response Format

Success response:

```json
{
  "success": true,
  "timestamp": "2026-04-02T17:30:00.000Z",
  "summary": {
    "total": 3,
    "sent": 3,
    "failed": 0
  },
  "results": [
    {
      "id": "uuid",
      "to": "user@example.com",
      "status": "sent"
    }
  ]
}
```

Error response:

```json
{
  "success": false,
  "error": "Error message",
  "timestamp": "2026-04-02T17:30:00.000Z"
}
```
