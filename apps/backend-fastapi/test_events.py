"""
Test script for FastAPI events functionality
"""
import asyncio
import httpx
import json
from datetime import datetime, timedelta

BASE_URL = "http://localhost:4000"

async def test_events_flow():
    """Test the complete events flow"""
    async with httpx.AsyncClient() as client:
        print("🧪 Testing FastAPI Events Flow...")
        
        # First, register and login to get access token
        print("\n1️⃣ Setting up authentication...")
        register_data = {
            "phone_number": "+2348012345679",
            "password": "testpassword123",
            "first_name": "Event",
            "last_name": "Organizer",
            "email": "organizer@example.com",
            "state": "Lagos",
            "role": "organizer"
        }
        
        response = await client.post(f"{BASE_URL}/api/auth/register", json=register_data)
        if response.status_code != 200:
            print(f"❌ Registration failed: {response.text}")
            return
        
        auth_result = response.json()
        access_token = auth_result["access_token"]
        headers = {"Authorization": f"Bearer {access_token}"}
        print("✅ Authentication successful!")
        
        # Test events feed (public access)
        print("\n2️⃣ Testing events feed...")
        response = await client.get(f"{BASE_URL}/api/events/feed?page=1&limit=10")
        print(f"Events Feed Status: {response.status_code}")
        
        if response.status_code == 200:
            feed_result = response.json()
            print(f"✅ Events feed successful! Found {len(feed_result['events'])} events")
            print(f"Total events: {feed_result['total']}")
        else:
            print(f"❌ Events feed failed: {response.text}")
        
        # Test creating a public event
        print("\n3️⃣ Testing event creation...")
        start_date = datetime.now() + timedelta(days=30)
        end_date = start_date + timedelta(hours=6)
        
        event_data = {
            "title": "Test Music Festival",
            "description": "A fantastic music festival with great artists",
            "event_type": "festival",
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "venue": "National Stadium Lagos",
            "state": "Lagos",
            "lga": "Surulere",
            "latitude": 6.5244,
            "longitude": 3.3792,
            "capacity": 5000,
            "tiers": [
                {
                    "id": "regular",
                    "name": "Regular",
                    "price": 5000.0,
                    "quantity": 3000,
                    "description": "Regular admission"
                },
                {
                    "id": "vip",
                    "name": "VIP",
                    "price": 15000.0,
                    "quantity": 500,
                    "description": "VIP access with premium benefits"
                }
            ],
            "images": ["https://example.com/festival1.jpg"],
            "is_hidden": False
        }
        
        response = await client.post(f"{BASE_URL}/api/events/create", json=event_data, headers=headers)
        print(f"Event Creation Status: {response.status_code}")
        
        if response.status_code == 200:
            create_result = response.json()
            event_id = create_result["event_id"]
            print(f"✅ Event created successfully! ID: {event_id}")
            
            # Test getting the created event
            print("\n4️⃣ Testing get event by ID...")
            response = await client.get(f"{BASE_URL}/api/events/{event_id}")
            print(f"Get Event Status: {response.status_code}")
            
            if response.status_code == 200:
                event_details = response.json()
                print("✅ Get event successful!")
                print(f"Event: {event_details['title']}")
                print(f"Venue: {event_details['venue']}")
                print(f"Capacity: {event_details['capacity']}")
                print(f"Tiers: {len(event_details['tiers'])}")
            else:
                print(f"❌ Get event failed: {response.text}")
                
        else:
            print(f"❌ Event creation failed: {response.text}")
        
        # Test creating a hidden event
        print("\n5️⃣ Testing hidden event creation...")
        hidden_event_data = {
            **event_data,
            "title": "Private Wedding Ceremony",
            "event_type": "wedding",
            "is_hidden": True,
            "access_code": "1234"
        }
        
        response = await client.post(f"{BASE_URL}/api/events/create-hidden", json=hidden_event_data, headers=headers)
        print(f"Hidden Event Creation Status: {response.status_code}")
        
        if response.status_code == 200:
            hidden_result = response.json()
            print(f"✅ Hidden event created! Access code: {hidden_result['access_code']}")
            
            # Test access code validation
            print("\n6️⃣ Testing access code validation...")
            access_code_data = {"access_code": hidden_result['access_code']}
            response = await client.post(f"{BASE_URL}/api/events/validate-access-code", json=access_code_data)
            print(f"Access Code Validation Status: {response.status_code}")
            
            if response.status_code == 200:
                validation_result = response.json()
                print(f"✅ Access code valid! Event: {validation_result['event_title']}")
            else:
                print(f"❌ Access code validation failed: {response.text}")
                
        else:
            print(f"❌ Hidden event creation failed: {response.text}")
        
        # Test wedding event creation
        print("\n7️⃣ Testing wedding event creation...")
        wedding_data = {
            "title": "John & Jane Wedding",
            "description": "Join us for our special day",
            "event_type": "wedding",
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "venue": "Grand Ballroom Hotel",
            "state": "Lagos",
            "lga": "Victoria Island",
            "latitude": 6.4281,
            "longitude": 3.4219,
            "capacity": 200,
            "bride_name": "Jane Doe",
            "groom_name": "John Smith",
            "wedding_date": start_date.isoformat(),
            "reception_venue": "Same venue",
            "dress_code": "Formal",
            "tiers": [
                {
                    "id": "guest",
                    "name": "Guest",
                    "price": 0.0,
                    "quantity": 200,
                    "description": "Wedding guest invitation"
                }
            ]
        }
        
        response = await client.post(f"{BASE_URL}/api/events/create-wedding", json=wedding_data, headers=headers)
        print(f"Wedding Event Creation Status: {response.status_code}")
        
        if response.status_code == 200:
            wedding_result = response.json()
            print(f"✅ Wedding event created! ID: {wedding_result['event_id']}")
        else:
            print(f"❌ Wedding event creation failed: {response.text}")

if __name__ == "__main__":
    print("🚀 Starting FastAPI Events Tests...")
    print("Make sure the FastAPI server is running on http://localhost:4000")
    asyncio.run(test_events_flow())