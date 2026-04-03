#!/usr/bin/env python3
"""
Direct Email Sender - Send test email immediately via Gmail SMTP
This bypasses the queue and sends directly for testing
"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

def send_test_email():
    """Send a test email directly via Gmail SMTP"""
    
    print("=" * 60)
    print("📧 DIRECT EMAIL SENDER")
    print("=" * 60)
    
    # Email configuration
    to_email = "scepterboss@gmail.com"
    
    # Get Gmail credentials
    print("\n🔐 Gmail SMTP Configuration:")
    print("To send emails, you need:")
    print("1. Your Gmail address")
    print("2. Gmail App Password (NOT your regular password)")
    print("\nHow to get App Password:")
    print("1. Go to: https://myaccount.google.com/apppasswords")
    print("2. Select 'Mail' and 'Other (Custom name)'")
    print("3. Name it 'Tikit Test'")
    print("4. Copy the 16-character password")
    print()
    
    from_email = input("Enter your Gmail address: ").strip()
    app_password = input("Enter your Gmail App Password (16 chars): ").strip().replace(" ", "")
    
    if not from_email or not app_password:
        print("❌ Email and password required!")
        return False
    
    # Create email
    msg = MIMEMultipart('alternative')
    msg['From'] = from_email
    msg['To'] = to_email
    msg['Subject'] = "🎉 Test Email from Tikit"
    msg['Date'] = datetime.utcnow().strftime('%a, %d %b %Y %H:%M:%S +0000')
    
    # HTML body
    html_body = """
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9fafb;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 0;">
            <tr>
                <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                        <!-- Header -->
                        <tr>
                            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px 12px 0 0;">
                                <h1 style="color: #ffffff; margin: 0; font-size: 32px;">🎉 Tikit Email Test</h1>
                            </td>
                        </tr>
                        
                        <!-- Content -->
                        <tr>
                            <td style="padding: 40px;">
                                <h2 style="color: #1f2937; margin: 0 0 20px; font-size: 24px;">Success!</h2>
                                <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                                    Your Tikit email system is working perfectly! 🚀
                                </p>
                                
                                <div style="background-color: #f3f4f6; border-left: 4px solid #667eea; padding: 16px; border-radius: 4px; margin: 20px 0;">
                                    <p style="color: #1f2937; font-size: 14px; margin: 0; font-weight: 600;">
                                        ✅ Email service configured
                                    </p>
                                    <p style="color: #6b7280; font-size: 14px; margin: 8px 0 0;">
                                        You can now send verification emails, OTP codes, and ticket confirmations!
                                    </p>
                                </div>
                                
                                <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin: 20px 0 0;">
                                    This is a test of your email delivery system. If you're reading this, everything is working great!
                                </p>
                            </td>
                        </tr>
                        
                        <!-- Footer -->
                        <tr>
                            <td style="padding: 20px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
                                <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
                                    Sent at: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}<br>
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
    text_body = f"""
    🎉 Tikit Email Test
    
    Success! Your Tikit email system is working perfectly!
    
    ✅ Email service configured
    
    You can now send verification emails, OTP codes, and ticket confirmations!
    
    This is a test of your email delivery system. If you're reading this, everything is working great!
    
    Sent at: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}
    © 2026 Tikit. All rights reserved.
    """
    
    msg.attach(MIMEText(text_body, 'plain', 'utf-8'))
    msg.attach(MIMEText(html_body, 'html', 'utf-8'))
    
    # Send email
    print(f"\n📤 Sending test email to {to_email}...")
    
    try:
        with smtplib.SMTP('smtp.gmail.com', 587, timeout=10) as server:
            server.starttls()
            server.login(from_email, app_password)
            server.send_message(msg)
        
        print("\n" + "=" * 60)
        print("✅ EMAIL SENT SUCCESSFULLY!")
        print("=" * 60)
        print(f"\n📬 Check your inbox: {to_email}")
        print("💡 If not in inbox, check spam/junk folder")
        print("\n🎉 Your email system is working!")
        
        return True
        
    except smtplib.SMTPAuthenticationError:
        print("\n❌ Authentication failed!")
        print("Please check:")
        print("1. Email address is correct")
        print("2. Using App Password (not regular password)")
        print("3. 2-Step Verification is enabled")
        return False
        
    except Exception as e:
        print(f"\n❌ Failed to send email: {e}")
        print("\nTroubleshooting:")
        print("1. Check your internet connection")
        print("2. Verify Gmail App Password is correct")
        print("3. Check firewall/antivirus settings")
        return False

if __name__ == "__main__":
    try:
        send_test_email()
    except KeyboardInterrupt:
        print("\n\n⚠️ Cancelled by user")
    except Exception as e:
        print(f"\n\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
