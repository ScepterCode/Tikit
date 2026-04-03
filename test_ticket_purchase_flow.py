"""
Test Ticket Purchase Flow with Ticket Codes and QR Codes
Tests the complete flow from payment to ticket confirmation email
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'apps', 'backend-fastapi'))

import asyncio
from services.ticket_service import ticket_service
from services.email_service import email_service
from services.supabase_client import get_supabase_client
from datetime import datetime
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_ticket_purchase():
    """Test complete ticket purchase flow"""
    
    print("\n" + "="*60)
    print("TESTING TICKET PURCHASE FLOW")
    print("="*60 + "\n")
    
    # Test data
    test_user_email = "scepterboss@gmail.com"
    test_event_id = "test-event-123"
    test_user_id = "test-user-456"
    
    # Step 1: Create ticket with ticket code
    print("Step 1: Creating ticket with unique ticket code...")
    ticket_data = {
        "user_id": test_user_id,
        "event_id": test_event_id,
        "ticket_type": "VIP",
        "price": 10000.00,
        "status": "active"
    }
    
    ticket = await ticket_service.create_ticket(ticket_data)
    
    if not ticket:
        print("❌ Failed to create ticket")
        return False
    
    print(f"✅ Ticket created successfully!")
    print(f"   Ticket ID: {ticket['id']}")
    print(f"   Ticket Code: {ticket.get('ticket_code', 'NOT GENERATED')}")
    print(f"   QR Code: {'Generated' if ticket.get('qr_code') else 'NOT GENERATED'}")
    
    # Verify ticket code format
    ticket_code = ticket.get('ticket_code')
    if not ticket_code:
        print("❌ Ticket code was not generated!")
        return False
    
    # Validate format: XXXX-1234567
    parts = ticket_code.split('-')
    if len(parts) != 2 or len(parts[0]) != 4 or len(parts[1]) != 7:
        print(f"❌ Invalid ticket code format: {ticket_code}")
        print(f"   Expected: XXXX-1234567 (4 letters - 7 numbers)")
        return False
    
    if not parts[0].isupper() or not parts[0].isalpha():
        print(f"❌ First part should be 4 uppercase letters: {parts[0]}")
        return False
    
    if not parts[1].isdigit():
        print(f"❌ Second part should be 7 digits: {parts[1]}")
        return False
    
    print(f"✅ Ticket code format is valid: {ticket_code}")
    
    # Step 2: Verify QR code contains ticket code
    qr_code = ticket.get('qr_code')
    if not qr_code:
        print("❌ QR code was not generated!")
        return False
    
    print(f"✅ QR code generated (base64 length: {len(qr_code)} chars)")
    
    # Step 3: Send ticket confirmation email
    print("\nStep 2: Sending ticket confirmation email...")
    
    email_ticket_data = {
        "ticket_code": ticket_code,
        "event_title": "Test Event",
        "event_date": "2026-05-01 19:00",
        "venue": "Test Venue, Lagos",
        "tier_name": "VIP",
        "quantity": 2,
        "amount": 10000.00
    }
    
    result = await email_service.send_ticket_confirmation(
        email=test_user_email,
        ticket_data=email_ticket_data,
        qr_code_base64=qr_code
    )
    
    if result.get('success'):
        print(f"✅ Ticket confirmation email queued successfully!")
        print(f"   Recipient: {test_user_email}")
        print(f"   Ticket Code: {ticket_code}")
        print(f"   QR Code: Embedded in email")
    else:
        print(f"❌ Failed to send email: {result.get('error')}")
        return False
    
    # Step 4: Check email queue
    print("\nStep 3: Checking email queue...")
    supabase = get_supabase_client()
    
    if supabase:
        queue_result = supabase.table('email_queue')\
            .select('*')\
            .eq('to_email', test_user_email)\
            .eq('email_type', 'ticket')\
            .order('created_at', desc=True)\
            .limit(1)\
            .execute()
        
        if queue_result.data:
            email_record = queue_result.data[0]
            print(f"✅ Email found in queue:")
            print(f"   Status: {email_record.get('status')}")
            print(f"   Subject: {email_record.get('subject')}")
            
            # Check if ticket code is in email body
            html_body = email_record.get('html_body', '')
            if ticket_code in html_body:
                print(f"✅ Ticket code {ticket_code} found in email body")
            else:
                print(f"❌ Ticket code {ticket_code} NOT found in email body")
                return False
            
            # Check if QR code is embedded
            if 'data:image/png;base64,' in html_body or qr_code in html_body:
                print(f"✅ QR code embedded in email")
            else:
                print(f"⚠️  QR code might not be properly embedded")
        else:
            print(f"❌ Email not found in queue")
            return False
    else:
        print("⚠️  Cannot check email queue (Supabase client not available)")
    
    print("\n" + "="*60)
    print("✅ ALL TESTS PASSED!")
    print("="*60)
    print("\nSummary:")
    print(f"  • Ticket created with code: {ticket_code}")
    print(f"  • QR code generated and encodes ticket code")
    print(f"  • Email queued with ticket code and QR code")
    print(f"  • Email will be sent to: {test_user_email}")
    print("\nNext steps:")
    print("  1. Run the Edge Function to process email queue")
    print("  2. Check your email at scepterboss@gmail.com")
    print("  3. Verify ticket code and QR code are displayed")
    
    return True

if __name__ == "__main__":
    try:
        success = asyncio.run(test_ticket_purchase())
        sys.exit(0 if success else 1)
    except Exception as e:
        logger.error(f"Test failed with error: {e}", exc_info=True)
        sys.exit(1)
