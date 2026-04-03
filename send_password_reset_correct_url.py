"""
Send Password Reset Email with Correct Frontend URL
"""
import os
from dotenv import load_dotenv
from supabase import create_client
from datetime import datetime, timedelta
import secrets
import requests

load_dotenv('apps/backend-fastapi/.env')

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY')
ANON_KEY = os.getenv('SUPABASE_ANON_KEY')
FRONTEND_URL = os.getenv('FRONTEND_URL')  # Now points to :5173

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

YOUR_EMAIL = "scepterboss@gmail.com"

print("\n" + "="*60)
print("🔐 SENDING PASSWORD RESET EMAIL")
print("="*60)
print(f"Frontend URL: {FRONTEND_URL}")
print(f"Sending to: {YOUR_EMAIL}")

# Get user
user_result = supabase.table('users').select('*').eq('email', 'fasthands0015@gmail.com').execute()
user = user_result.data[0]

# Create token
reset_token = secrets.token_urlsafe(32)
reset_expires = (datetime.utcnow() + timedelta(hours=1)).isoformat()

token_result = supabase.table('password_reset_tokens').insert({
    'user_id': user['id'],
    'token': reset_token,
    'expires_at': reset_expires,
    'used': False,
    'created_at': datetime.utcnow().isoformat()
}).execute()

print(f"\n✅ Token created: {reset_token[:30]}...")

# Queue email with CORRECT URL
reset_url = f"{FRONTEND_URL}/reset-password?token={reset_token}"

email_html = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9fafb;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 0;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <tr>
                        <td style="padding: 40px 40px 20px; text-align: center;">
                            <h1 style="color: #667eea; margin: 0; font-size: 32px;">🔐 Tikit</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 0 40px 40px;">
                            <h2 style="color: #1f2937; margin: 0 0 20px; font-size: 24px;">Reset Your Password</h2>
                            <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                                Click the button below to reset your Tikit password:
                            </p>
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 0 0 30px;">
                                        <a href="{reset_url}" style="background-color: #667eea; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; display: inline-block;">
                                            Reset My Password
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            <p style="color: #9ca3af; font-size: 14px; margin: 0 0 10px;">
                                Or copy this link:
                            </p>
                            <p style="color: #667eea; font-size: 14px; word-break: break-all; margin: 0 0 20px;">
                                {reset_url}
                            </p>
                            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 4px; margin: 20px 0;">
                                <p style="color: #92400e; font-size: 14px; margin: 0; font-weight: 600;">
                                    ⏰ Expires in 1 hour
                                </p>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 20px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
                            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
                                © 2026 Tikit. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
"""

email_data = {
    'to_email': YOUR_EMAIL,
    'subject': 'Reset Your Tikit Password',
    'html_body': email_html,
    'text_body': f'Reset your Tikit password: {reset_url}\n\nThis link expires in 1 hour.',
    'email_type': 'password_reset',
    'status': 'pending',
    'created_at': datetime.utcnow().isoformat(),
    'attempts': 0
}

email_result = supabase.table('email_queue').insert(email_data).execute()
print(f"✅ Email queued")

# Trigger Edge Function
print(f"\n📤 Sending email...")
edge_url = f"{SUPABASE_URL}/functions/v1/send-emails"

response = requests.post(
    edge_url,
    headers={
        'Authorization': f'Bearer {ANON_KEY}',
        'Content-Type': 'application/json'
    }
)

if response.status_code == 200:
    result = response.json()
    if result['summary']['sent'] > 0:
        print(f"✅ Email sent to {YOUR_EMAIL}!")
        print(f"\n🔗 Reset link:")
        print(f"   {reset_url}")
        print(f"\n📧 Check your email and click the link")
        print(f"   (Make sure your frontend is running on port 5173)")
    else:
        print(f"❌ Failed to send")
        if result.get('results'):
            for r in result['results']:
                if r.get('error'):
                    print(f"   Error: {r['error']}")
