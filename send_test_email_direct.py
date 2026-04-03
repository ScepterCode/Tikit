#!/usr/bin/env python3
"""
Direct test email sender - sends test emails to scepterboss@gmail.com
"""

import os
import sys
import asyncio
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv('apps/backend-fastapi/.env')

async def send_test_emails():
    """Send test emails directly to scepterboss@gmail.com"""
    
    print("=" * 60)
    print("📧 SENDING TEST EMAILS TO scepterboss@gmail.com")
    print("=" * 60)
    print()
    
    # Get Supabase credentials
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_SERVICE_KEY')
    
    if not supabase_url or not supabase_key:
        print("❌ Error: Supabase credentials not found")
        print(f"SUPABASE_URL: {supabase_url}")
        print(f"SUPABASE_SERVICE_KEY: {'Found' if os.getenv('SUPABASE_SERVICE_KEY') else 'Not found'}")
        return False
    
    print("✅ Supabase credentials loaded")
    
    # Create Supabase client
    try:
        supabase: Client = create_client(supabase_url, supabase_key)
        print("✅ Supabase client created")
    except Exception as e:
        print(f"❌ Failed to create Supabase client: {e}")
        return False
    
    print()
    
    # Import email service
    sys.path.insert(0, 'apps/backend-fastapi')
    from services.email_service import email_service
    
    test_email = "scepterboss@gmail.com"
    
    print(f"📤 Queueing test emails for {test_email}...")
    print()
    
    # Test 1: Verification Email
    print("1️⃣ Testing Verification Email...")
    try:
        result = await email_service.send_verification_email(
            email=test_email,
            token="test-token-123456",
            user_name="Test User"
        )
        
        if result['success']:
            print(f"✅ Success: Verification email queued")
        else:
            print(f"❌ Failed: {result.get('error', 'Unknown error')}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    print()
    
    # Test 2: OTP Email
    print("2️⃣ Testing OTP Email...")
    try:
        result = await email_service.send_otp_email(
            email=test_email,
            otp_code="123456",
            purpose="wallet transaction",
            expires_in=300
        )
        
        if result['success']:
            print(f"✅ Success: OTP email queued")
        else:
            print(f"❌ Failed: {result.get('error', 'Unknown error')}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    print()
    
    # Test 3: Ticket Confirmation
    print("3️⃣ Testing Ticket Confirmation Email...")
    try:
        ticket_data = {
            'event_title': 'Test Event',
            'event_date': '2026-05-01 19:00',
            'venue': 'Test Venue, Lagos',
            'tier_name': 'VIP',
            'quantity': 2,
            'amount': 10000.00
        }
        
        result = await email_service.send_ticket_confirmation(
            email=test_email,
            ticket_data=ticket_data
        )
        
        if result['success']:
            print(f"✅ Success: Ticket confirmation queued")
        else:
            print(f"❌ Failed: {result.get('error', 'Unknown error')}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    print()
    print("=" * 60)
    
    # Check email queue
    print("📊 Checking email queue...")
    try:
        result = supabase.table('email_queue').select('*').eq('to_email', test_email).order('created_at', desc=True).limit(5).execute()
        
        if result.data:
            print(f"✅ Found {len(result.data)} emails in queue:")
            print()
            for email in result.data:
                status_icon = "📧" if email['status'] == 'pending' else "✅" if email['status'] == 'sent' else "❌"
                print(f"{status_icon} {email['email_type']}: {email['status']} (ID: {email['id'][:8]}...)")
        else:
            print("⚠️ No emails found in queue")
    except Exception as e:
        print(f"❌ Error checking queue: {e}")
    
    print()
    print("=" * 60)
    print()
    print("📋 Next Steps:")
    print()
    print("1. Emails are now queued in the database")
    print("2. Deploy Edge Function to process them:")
    print("   supabase functions deploy send-emails")
    print()
    print("3. Or manually trigger processing:")
    print("   supabase functions invoke send-emails --no-verify-jwt")
    print()
    print("4. Set up cron job for automatic processing (every 5 min)")
    print()
    print("5. Check your inbox at scepterboss@gmail.com!")
    print()
    print("=" * 60)
    
    return True

if __name__ == "__main__":
    success = asyncio.run(send_test_emails())
    sys.exit(0 if success else 1)
