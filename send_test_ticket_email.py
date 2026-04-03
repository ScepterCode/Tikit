"""
Send test ticket confirmation email with ticket code and QR code
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'apps', 'backend-fastapi'))

import asyncio
from services.email_service import email_service
from services.ticket_code_generator import ticket_code_generator
import qrcode
import io
import base64

async def send_test_email():
    """Send test ticket confirmation email"""
    
    print("\n" + "="*60)
    print("SENDING TEST TICKET CONFIRMATION EMAIL")
    print("="*60 + "\n")
    
    # Generate test ticket code
    ticket_code = ticket_code_generator.generate_code()
    print(f"Generated ticket code: {ticket_code}")
    
    # Generate QR code
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(ticket_code)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    qr_code_base64 = base64.b64encode(buffer.getvalue()).decode()
    
    print(f"Generated QR code (base64 length: {len(qr_code_base64)} chars)")
    
    # Ticket data
    ticket_data = {
        "ticket_code": ticket_code,
        "event_title": "Test Event - Ticket Code Demo",
        "event_date": "2026-05-01 19:00",
        "venue": "Test Venue, Lagos",
        "tier_name": "VIP",
        "quantity": 2,
        "amount": 10000.00
    }

    
    # Send email
    print(f"\nSending email to: scepterboss@gmail.com")
    result = await email_service.send_ticket_confirmation(
        email="scepterboss@gmail.com",
        ticket_data=ticket_data,
        qr_code_base64=qr_code_base64
    )
    
    if result.get('success'):
        print(f"✅ Email queued successfully!")
        print(f"\nTicket Details:")
        print(f"  • Ticket Code: {ticket_code}")
        print(f"  • Event: {ticket_data['event_title']}")
        print(f"  • Date: {ticket_data['event_date']}")
        print(f"  • Venue: {ticket_data['venue']}")
        print(f"  • Type: {ticket_data['tier_name']}")
        print(f"  • Quantity: {ticket_data['quantity']}")
        print(f"  • Amount: ₦{ticket_data['amount']:,.2f}")
        print(f"\nNext: Trigger Edge Function to send the email")
        return True
    else:
        print(f"❌ Failed to send email: {result.get('error')}")
        return False

if __name__ == "__main__":
    try:
        success = asyncio.run(send_test_email())
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
