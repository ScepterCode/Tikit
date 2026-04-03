#!/usr/bin/env python3
"""
Test Supabase Email Service
Tests email queueing and delivery via Supabase
"""
import asyncio
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'apps', 'backend-fastapi'))

from services.email_service import email_service
from services.supabase_client import get_supabase_client

async def test_supabase_email():
    """Test Supabase email service"""
    
    print("=" * 60)
    print("🧪 SUPABASE EMAIL SERVICE TEST")
    print("=" * 60)
    
    # Check Supabase connection
    print("\n📋 Supabase Connection Check:")
    supabase = get_supabase_client()
    
    if not supabase:
        print("❌ Supabase client not initialized!")
        print("\nTo configure:")
        print("1. Check SUPABASE_URL in .env")
        print("2. Check SUPABASE_ANON_KEY in .env")
        return False
    
    print("✅ Supabase connected")
    
    # Check email_queue table exists
    print("\n📊 Checking email_queue table...")
    try:
        result = supabase.table('email_queue').select('count').limit(1).execute()
        print("✅ email_queue table exists")
    except Exception as e:
        print(f"❌ email_queue table not found: {e}")
        print("\nRun EMAIL_VERIFICATION_MIGRATION.sql in Supabase SQL Editor")
        return False
    
    # Test email address
    test_email = input("\n📧 Enter test email address: ").strip()
    
    if not test_email:
        print("❌ No email provided")
        return False
    
    print(f"\n📤 Queueing test emails for {test_email}...")
    
    # Test 1: Verification Email
    print("\n1️⃣ Testing Verification Email...")
    result = await email_service.send_verification_email(
        email=test_email,
        token="test-token-12345",
        user_name="Test User"
    )
    
    if result['success']:
        print("   ✅ Verification email queued successfully!")
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
        print("   ✅ OTP email queued successfully!")
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
        print("   ✅ Ticket confirmation email queued successfully!")
    else:
        print(f"   ❌ Failed: {result.get('error', 'Unknown error')}")
        return False
    
    # Check queue
    print("\n📊 Checking email queue...")
    try:
        queue_result = supabase.table('email_queue')\
            .select('*')\
            .eq('to_email', test_email)\
            .eq('status', 'pending')\
            .execute()
        
        pending_count = len(queue_result.data) if queue_result.data else 0
        print(f"✅ {pending_count} emails in queue for {test_email}")
        
        if pending_count > 0:
            print("\n📋 Queued emails:")
            for email in queue_result.data:
                print(f"   - {email['subject']} (ID: {email['id']})")
    except Exception as e:
        print(f"⚠️ Could not check queue: {e}")
    
    print("\n" + "=" * 60)
    print("✅ ALL EMAILS QUEUED SUCCESSFULLY!")
    print("=" * 60)
    
    print(f"\n📬 Next steps:")
    print("   1. Set up Supabase Edge Function (see SUPABASE_EMAIL_SETUP.md)")
    print("   2. Configure cron job to process queue every 5 minutes")
    print("   3. Emails will be sent automatically")
    
    print(f"\n💡 Check email queue status:")
    print("   SELECT * FROM email_queue WHERE to_email = '{test_email}';")
    
    print(f"\n🔍 Monitor delivery:")
    print("   - Pending: status = 'pending'")
    print("   - Sent: status = 'sent'")
    print("   - Failed: status = 'failed'")
    
    return True

if __name__ == "__main__":
    try:
        success = asyncio.run(test_supabase_email())
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n⚠️ Test cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
