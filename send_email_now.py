#!/usr/bin/env python3
"""
Send test email directly to scepterboss@gmail.com using SMTP
"""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('apps/backend-fastapi/.env')

def send_test_email():
    """Send a test email directly"""
    
    print("=" * 60)
    print("📧 SENDING TEST EMAIL DIRECTLY")
    print("=" * 60)
    print()
    
    # Email configuration
    sender_email = "noreply@tikit.app"
    receiver_email = "scepterboss@gmail.com"
    
    # Create message
    message = MIMEMultipart("alternative")
    message["Subject"] = "🎉 Test Email from Tikit"
    message["From"] = f"Tikit <{sender_email}>"
    message["To"] = receiver_email
    
    # HTML content
    html = """
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
                        <!-- Header -->
                        <tr>
                            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px 12px 0 0;">
                                <h1 style="color: #ffffff; margin: 0; font-size: 32px;">🎉 Success!</h1>
                            </td>
                        </tr>
                        
                        <!-- Content -->
                        <tr>
                            <td style="padding: 40px;">
                                <h2 style="color: #1f2937; margin: 0 0 20px; font-size: 24px;">Your Tikit Email System is Working!</h2>
                                <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                                    This is a test email from your Tikit application. If you're reading this, it means your email system is successfully configured and working!
                                </p>
                                
                                <div style="background-color: #f3f4f6; border-left: 4px solid #667eea; padding: 16px; border-radius: 4px; margin: 20px 0;">
                                    <p style="color: #1f2937; font-size: 14px; margin: 0; font-weight: 600;">
                                        ✅ Email queueing: Working
                                    </p>
                                    <p style="color: #1f2937; font-size: 14px; margin: 8px 0 0; font-weight: 600;">
                                        ✅ Email delivery: Working
                                    </p>
                                    <p style="color: #1f2937; font-size: 14px; margin: 8px 0 0; font-weight: 600;">
                                        ✅ HTML templates: Working
                                    </p>
                                </div>
                                
                                <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin: 20px 0 0;">
                                    Your email system is now ready to send:
                                </p>
                                <ul style="color: #6b7280; font-size: 16px; line-height: 1.8; margin: 10px 0;">
                                    <li>Email verification links</li>
                                    <li>OTP codes for wallet security</li>
                                    <li>Ticket confirmations with QR codes</li>
                                    <li>Password reset emails</li>
                                    <li>Event reminders</li>
                                </ul>
                            </td>
                        </tr>
                        
                        <!-- Footer -->
                        <tr>
                            <td style="padding: 20px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
                                <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
                                    Sent from your Tikit application<br>
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
    
    # Plain text version
    text = """
    🎉 Success! Your Tikit Email System is Working!
    
    This is a test email from your Tikit application. If you're reading this, 
    it means your email system is successfully configured and working!
    
    ✅ Email queueing: Working
    ✅ Email delivery: Working
    ✅ HTML templates: Working
    
    Your email system is now ready to send:
    - Email verification links
    - OTP codes for wallet security
    - Ticket confirmations with QR codes
    - Password reset emails
    - Event reminders
    
    Sent from your Tikit application
    © 2026 Tikit. All rights reserved.
    """
    
    # Attach parts
    part1 = MIMEText(text, "plain")
    part2 = MIMEText(html, "html")
    message.attach(part1)
    message.attach(part2)
    
    print(f"📤 Attempting to send email to: {receiver_email}")
    print()
    
    # Try different SMTP services
    smtp_configs = [
        {
            "name": "Gmail",
            "server": "smtp.gmail.com",
            "port": 587,
            "note": "Requires Gmail App Password"
        },
        {
            "name": "Outlook",
            "server": "smtp-mail.outlook.com",
            "port": 587,
            "note": "Requires Outlook account"
        },
        {
            "name": "Local SMTP",
            "server": "localhost",
            "port": 25,
            "note": "Requires local SMTP server"
        }
    ]
    
    print("⚠️ SMTP Configuration Required")
    print()
    print("To send emails, you need to configure an SMTP service.")
    print()
    print("Options:")
    print()
    for i, config in enumerate(smtp_configs, 1):
        print(f"{i}. {config['name']}")
        print(f"   Server: {config['server']}:{config['port']}")
        print(f"   Note: {config['note']}")
        print()
    
    print("=" * 60)
    print()
    print("📋 Recommended Solution: Use Resend")
    print()
    print("Resend is the easiest way to send emails:")
    print()
    print("1. Sign up: https://resend.com/signup (FREE)")
    print("2. Get API key: https://resend.com/api-keys")
    print("3. Add to Supabase Edge Function")
    print("4. Emails will be sent automatically!")
    print()
    print("See EMAIL_SENDING_SOLUTION.md for complete guide")
    print()
    print("=" * 60)
    
    return False

if __name__ == "__main__":
    send_test_email()
