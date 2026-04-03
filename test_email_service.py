#!/usr/bin/env python3
"""
Test Email Service
Tests SMTP configuration and email sending functionality
"""
import asyncio
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'apps', 'backend-fastapi'))

from services.email_service import email_service
from config import config

async def test_email_service():
    """Test email service configuration and sending"""
    
    print("=" * 60)
    print("🧪 EMAIL SERVICE TEST")
    print("=" * 60)
    
    # Check configuration
    print("\n📋 Configuration Check:")
    print(f"  SMTP Host: {config.SMTP_HOST}")
    print(f"  SMTP Port: {config.SMTP_PORT}")
    print(f"  SMTP Username: {config.SMTP_USERNAME}")
    print(f"  SMTP Password: {'*' * len(config.SMTP_PASSWORD) if config.SMTP_PASSWORD else 'NOT SET'}")
    print(f"  Email From: {config.EMAIL_FROM}")
    print(f"  Email Enabled: {config.ENABLE_EMAIL_NOTIFICATIONS}")
    
    if not email_service.enabled:
        print("\n❌ Email service is not configured!")
        print("\nTo configure:")
        print("1. Edit apps/backend-fastapi/.env")
        print("2. Add SMTP credentials (see QUICK_SETUP_GUIDE.md)")
        print("3. Set ENABLE_EMAIL_NOTIFICATIONS=true")
        return False
    
    # Test email address
    test_email = input("\n📧 Enter test email address: ").strip()
    
    if not test_email:
        print("❌ No email provided")
        return False
    
    print(f"\n📤 Sending test email to {test_email}...")
    
    # Test 1: Verification Email
    print("\n1️⃣ Testing Verification Email...")
    result = await email_service.send_verification_email(
        email=test_email,
        token="test-token-12345",
        user_name="Test User"
    )
    
    if result['success']:
        print("   ✅ Verification email sent successfully!")
    else:
        print(f"   ❌ Failed: {result.get('error', 'Unknown error')}")
        return False
    
    # Test 2: OTP Email
    print("\n2️⃣ Testing OTP Email...")
    result = await email_service.send_otp_email(
        email=test_email,
        otp_code="123456",
        purpose="transaction verification",
        expires_in=300
    )
    
    if result['success']:
        print("   ✅ OTP email sent successfully!")
    else:
        print(f"   ❌ Failed: {result.get('error', 'Unknown error')}")
        return False
    
    # Test 3: Ticket Confirmation
    print("\n3️⃣ Testing Ticket Confirmation Email...")
    result = await email_service.send_ticket_confirmation(
        email=test_email,
        ticket_data={
            'event_title': 'Test Concert 2026',
            'event_date': 'April 15, 2026',
            'venue': 'Eko Convention Center',
            'tier_name': 'VIP',
            'quantity': 2,
            'amount': 25000.00
        }
    )
    
    if result['success']:
        print("   ✅ Ticket confirmation email sent successfully!")
    else:
        print(f"   ❌ Failed: {result.get('error', 'Unknown error')}")
        return False
    
    print("\n" + "=" * 60)
    print("✅ ALL EMAIL TESTS PASSED!")
    print("=" * 60)
    print(f"\n📬 Check {test_email} for 3 test emails:")
    print("   1. Email verification")
    print("   2. OTP code")
    print("   3. Ticket confirmation")
    print("\n💡 If emails not received, check:")
    print("   - Spam/junk folder")
    print("   - SMTP credentials")
    print("   - Firewall settings")
    
    return True

if __name__ == "__main__":
    try:
        success = asyncio.run(test_email_service())
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n⚠️ Test cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
