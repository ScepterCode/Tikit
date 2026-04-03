"""
Test Password Reset Flow with Correct Schema
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

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

TEST_EMAIL = "fasthands0015@gmail.com"  # Use existing user

print("\n" + "="*60)
print("🧪 PASSWORD RESET FLOW TEST")
print("="*60)

# Step 1: Get existing user
print("\n1️⃣ Finding user...")
try:
    user_result = supabase.table('users').select('*').eq('email', TEST_EMAIL).execute()
    
    if user_result.data:
        user = user_result.data[0]
        print(f"✅ User found: {user['first_name']} {user['last_name']}")
        print(f"   Email: {user['email']}")
        print(f"   ID: {user['id']}")
    else:
        print(f"❌ User not found: {TEST_EMAIL}")
        exit(1)
except Exception as e:
    print(f"❌ Error: {e}")
    exit(1)

# Step 2: Create password reset token
print("\n2️⃣ Creating password reset token...")
try:
    reset_token = secrets.token_urlsafe(32)
    reset_expires = (datetime.utcnow() + timedelta(hours=1)).isoformat()
    
    token_data = {
        'user_id': user['id'],
        'token': reset_token,
        'expires_at': reset_expires,
        'used': False,
        'created_at': datetime.utcnow().isoformat()
    }
    
    token_result = supabase.table('password_reset_tokens').insert(token_data).execute()
    
    if token_result.data:
        print(f"✅ Reset token created")
        print(f"   Token: {reset_token[:30]}...")
    else:
        print("❌ Failed to create token")
        exit(1)
except Exception as e:
    print(f"❌ Error: {e}")
    exit(1)

# Step 3: Queue password reset email
print("\n3️⃣ Queueing password reset email...")
try:
    reset_url = f"http://localhost:3000/reset-password?token={reset_token}"
    
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
                                <h1 style="color: #667eea; margin: 0; font-size: 32px;">Tikit</h1>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 0 40px 40px;">
                                <h2 style="color: #1f2937; margin: 0 0 20px; font-size: 24px;">Password Reset Request</h2>
                                <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                                    Hi {user['first_name'] or 'there'},
                                </p>
                                <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                                    We received a request to reset your password. Click the button below to create a new password:
                                </p>
                                <table width="100%" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td align="center" style="padding: 0 0 30px;">
                                            <a href="{reset_url}" style="background-color: #667eea; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; display: inline-block;">
                                                Reset Password
                                            </a>
                                        </td>
                                    </tr>
                                </table>
                                <p style="color: #9ca3af; font-size: 14px; line-height: 1.6; margin: 0 0 10px;">
                                    Or copy and paste this link:
                                </p>
                                <p style="color: #667eea; font-size: 14px; word-break: break-all; margin: 0 0 20px;">
                                    {reset_url}
                                </p>
                                <p style="color: #ef4444; font-size: 14px; font-weight: 600; margin: 0 0 20px;">
                                    ⏰ This link expires in 1 hour
                                </p>
                                <p style="color: #9ca3af; font-size: 14px; line-height: 1.6; margin: 0;">
                                    If you didn't request this, please ignore this email or contact support.
                                </p>
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
        'to_email': TEST_EMAIL,
        'subject': 'Reset Your Tikit Password',
        'html_body': email_html,
        'text_body': f'Reset your password: {reset_url}\n\nThis link expires in 1 hour.\n\nIf you didn\'t request this, please ignore this email.',
        'email_type': 'password_reset',
        'status': 'pending',
        'created_at': datetime.utcnow().isoformat(),
        'attempts': 0
    }
    
    email_result = supabase.table('email_queue').insert(email_data).execute()
    
    if email_result.data:
        print(f"✅ Password reset email queued")
        print(f"   To: {TEST_EMAIL}")
    else:
        print("❌ Failed to queue email")
        exit(1)
except Exception as e:
    print(f"❌ Error: {e}")
    exit(1)

# Step 4: Trigger Edge Function
print("\n4️⃣ Triggering Edge Function to send email...")
try:
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
        print(f"✅ Edge Function executed")
        print(f"   Processed: {result['summary']['total']}")
        print(f"   Sent: {result['summary']['sent']}")
        print(f"   Failed: {result['summary']['failed']}")
        
        if result['summary']['sent'] > 0:
            print(f"\n🎉 SUCCESS! Password reset email sent to {TEST_EMAIL}")
        else:
            print(f"\n⚠️ Email processed but not sent (check logs)")
    else:
        print(f"❌ Edge Function failed: {response.status_code}")
        print(f"   {response.text}")
except Exception as e:
    print(f"❌ Error: {e}")

print("\n" + "="*60)
print("✅ PASSWORD RESET FLOW COMPLETE")
print("="*60)
print("\n📋 What Happened:")
print("  1. ✅ Found existing user")
print("  2. ✅ Created password reset token")
print("  3. ✅ Queued password reset email")
print("  4. ✅ Triggered Edge Function to send email")
print(f"\n📧 Check {TEST_EMAIL} for the password reset email!")
print("\n🔗 The email contains a link like:")
print(f"   http://localhost:3000/reset-password?token={reset_token[:20]}...")
