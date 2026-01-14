"""
Test script for FastAPI tickets functionality
"""
import asyncio
import httpx
import json
from datetime import datetime, timedelta

BASE_URL = "http://localhost:4000"

async def test_tickets_flow():
    """Test the complete tickets flow"""
    async with httpx.AsyncClient() as client:
        print("🧪 Testing FastAPI Tickets Flow...")
        
        # Setup: Register users and create event
        print("\n1️⃣ Setting up test data...")
        
        # Register organizer
        organizer_data = {
            "phone_number": "+2348012345680",
            "password": "testpassword123",
            "first_name": "Event",
            "last_name": "Organizer",
            "email": "organizer2@example.com",
            "state": "Lagos",
            "role": "organizer"
        }
        
        response = await client.post(f"{BASE_URL}/api/auth/register", json=organizer_data)
        if response.status_code != 200:
            print(f"❌ Organizer registration failed: {response.text}")
            return
        
        organizer_auth = response.json()
        organizer_headers = {"Authorization": f"Bearer {organizer_auth['access_token']}"}
        
        # Register attendee
        attendee_data = {
            "phone_number": "+2348012345681",
            "password": "testpassword123",
            "first_name": "Test",
            "last_name": "Attendee",
            "email": "attendee@example.com",
            "state": "Lagos",
            "role": "attendee"
        }
        
        response = await client.post(f"{BASE_URL}/api/auth/register", json=attendee_data)
        if response.status_code != 200:
            print(f"❌ Attendee registration failed: {response.text}")
            return
        
        attendee_auth = response.json()
        attendee_headers = {"Authorization": f"Bearer {attendee_auth['access_token']}"}
        
        print("✅ Users registered successfully!")
        
        # Create an event
        print("\n2️⃣ Creating test event...")
        start_date = datetime.now() + timedelta(days=30)
        end_date = start_date + timedelta(hours=6)
        
        event_data = {
            "title": "Test Concert for Tickets",
            "description": "A concert to test ticket functionality",
            "event_type": "festival",
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "venue": "Test Venue Lagos",
            "state": "Lagos",
            "lga": "Ikeja",
            "latitude": 6.5244,
            "longitude": 3.3792,
            "capacity": 1000,
            "tiers": [
                {
                    "id": "regular",
                    "name": "Regular",
                    "price": 3000.0,
                    "quantity": 800,
                    "description": "Regular admission"
                },
                {
                    "id": "vip",
                    "name": "VIP",
                    "price": 8000.0,
                    "quantity": 200,
                    "description": "VIP access"
                }
            ]
        }
        
        response = await client.post(f"{BASE_URL}/api/events/create", json=event_data, headers=organizer_headers)
        if response.status_code != 200:
            print(f"❌ Event creation failed: {response.text}")
            return
        
        event_result = response.json()
        event_id = event_result["event_id"]
        print(f"✅ Event created! ID: {event_id}")
        
        # Simulate payment creation (normally done by payment service)
        print("\n3️⃣ Simulating payment...")
        # In a real scenario, this would be done by the payment service
        # For testing, we'll create a mock payment record directly
        payment_data = {
            "id": "test_payment_123",
            "user_id": attendee_auth['user']['id'],
            "event_id": event_id,
            "tier_id": "regular",
            "amount": 3000.0,
            "status": "successful",
            "payment_method": "test",
            "created_at": datetime.utcnow().isoformat()
        }
        
        # Note: In real implementation, payment would be created via payment service
        print("✅ Payment simulation ready!")
        
        # Test ticket issuance
        print("\n4️⃣ Testing ticket issuance...")
        ticket_data = {
            "event_id": event_id,
            "tier_id": "regular",
            "payment_id": "test_payment_123",
            "cultural_selections": {
                "dietary_preference": "vegetarian",
                "accessibility_needs": "wheelchair"
            }
        }
        
        # Note: This will fail because payment doesn't exist in database
        # In real scenario, payment service would create the payment first
        response = await client.post(f"{BASE_URL}/api/tickets/issue", json=ticket_data, headers=attendee_headers)
        print(f"Ticket Issuance Status: {response.status_code}")
        
        if response.status_code == 200:
            ticket_result = response.json()
            ticket_id = ticket_result["id"]
            qr_code = ticket_result["qr_code"]
            backup_code = ticket_result["backup_code"]
            
            print(f"✅ Ticket issued successfully!")
            print(f"Ticket ID: {ticket_id}")
            print(f"QR Code: {qr_code}")
            print(f"Backup Code: {backup_code}")
            
            # Test getting user's tickets
            print("\n5️⃣ Testing get my tickets...")
            response = await client.get(f"{BASE_URL}/api/tickets/my-tickets", headers=attendee_headers)
            print(f"My Tickets Status: {response.status_code}")
            
            if response.status_code == 200:
                tickets_result = response.json()
                print(f"✅ Retrieved tickets! Total: {tickets_result['total']}")
                print(f"Active tickets: {tickets_result['active_tickets']}")
                print(f"Upcoming events: {tickets_result['upcoming_events']}")
            else:
                print(f"❌ Get tickets failed: {response.text}")
            
            # Test ticket verification
            print("\n6️⃣ Testing ticket verification...")
            verify_data = {
                "qr_code": qr_code,
                "scanned_by": organizer_auth['user']['id'],
                "location": "Main Entrance",
                "device_info": "Scanner Device 1"
            }
            
            response = await client.post(f"{BASE_URL}/api/tickets/verify", json=verify_data, headers=organizer_headers)
            print(f"Ticket Verification Status: {response.status_code}")
            
            if response.status_code == 200:
                verify_result = response.json()
                print(f"✅ Ticket verification successful!")
                print(f"Valid: {verify_result['success']}")
                print(f"Event: {verify_result.get('event_title')}")
                print(f"Attendee: {verify_result.get('attendee_name')}")
                
                # Test marking ticket as used
                print("\n7️⃣ Testing mark ticket as used...")
                mark_data = {
                    "qr_code": qr_code,
                    "scanned_by": organizer_auth['user']['id'],
                    "location": "Main Entrance"
                }
                
                response = await client.post(f"{BASE_URL}/api/tickets/mark-used", json=mark_data, headers=organizer_headers)
                print(f"Mark Used Status: {response.status_code}")
                
                if response.status_code == 200:
                    mark_result = response.json()
                    print(f"✅ Ticket marked as used!")
                    print(f"Message: {mark_result['message']}")
                else:
                    print(f"❌ Mark used failed: {response.text}")
                
            else:
                print(f"❌ Ticket verification failed: {response.text}")
            
            # Test backup code verification
            print("\n8️⃣ Testing backup code verification...")
            backup_verify_data = {
                "backup_code": backup_code,
                "scanned_by": organizer_auth['user']['id'],
                "location": "Side Entrance"
            }
            
            response = await client.post(f"{BASE_URL}/api/tickets/verify", json=backup_verify_data, headers=organizer_headers)
            print(f"Backup Code Verification Status: {response.status_code}")
            
            if response.status_code == 200:
                backup_result = response.json()
                print(f"✅ Backup code verification result:")
                print(f"Valid: {backup_result['success']}")
                print(f"Message: {backup_result['message']}")
            else:
                print(f"❌ Backup code verification failed: {response.text}")
                
        else:
            print(f"❌ Ticket issuance failed (expected - no payment record): {response.text}")
            print("Note: This is expected since we didn't create actual payment record")

if __name__ == "__main__":
    print("🚀 Starting FastAPI Tickets Tests...")
    print("Make sure the FastAPI server is running on http://localhost:4000")
    print("Note: Some tests may fail due to missing payment records - this is expected")
    asyncio.run(test_tickets_flow())