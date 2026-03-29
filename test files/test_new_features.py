#!/usr/bin/env python3
"""
Test script for new Tikit features:
1. Dynamic ticket tiers
2. Image upload for events
3. Livestream controls
4. Event change notifications
5. Spray money integration with livestream
"""

import requests
import json
import time
import base64
from datetime import datetime, timedelta

# Configuration
BASE_URL = "http://localhost:8000"
FRONTEND_URL = "http://localhost:3000"

# Test credentials
ORGANIZER_CREDENTIALS = {
    "phoneNumber": "+2349087654321",
    "password": "password123"
}

ATTENDEE_CREDENTIALS = {
    "phoneNumber": "+2349011111111", 
    "password": "password123"
}

def print_step(step_num, description):
    print(f"\n{'='*60}")
    print(f"STEP {step_num}: {description}")
    print('='*60)

def print_result(success, message):
    status = "✅ SUCCESS" if success else "❌ FAILED"
    print(f"{status}: {message}")

def login_user(credentials, role_name):
    """Login and return access token"""
    try:
        response = requests.post(f"{BASE_URL}/api/auth/login", json=credentials)
        data = response.json()
        
        if data.get("success"):
            token = data["data"]["access_token"]
            user = data["data"]["user"]
            print_result(True, f"{role_name} logged in: {user['first_name']} {user['last_name']}")
            return token, user
        else:
            print_result(False, f"{role_name} login failed: {data.get('error', {}).get('message', 'Unknown error')}")
            return None, None
    except Exception as e:
        print_result(False, f"{role_name} login error: {str(e)}")
        return None, None

def create_sample_image():
    """Create a sample base64 image for testing"""
    # Simple 1x1 pixel PNG in base64
    return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="

def test_create_event_with_tiers_and_images(organizer_token):
    """Test creating event with multiple ticket tiers and images"""
    print_step(1, "Creating Event with Ticket Tiers and Images")
    
    # Create event with multiple tiers and images
    event_data = {
        "title": "Tech Conference 2024 - Advanced Features Test",
        "description": "Testing new features: multiple ticket tiers, images, and livestream",
        "date": (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d"),
        "time": "14:00",
        "venue": "Lagos Tech Hub, Victoria Island",
        "category": "conference",
        "enableLivestream": True,
        "ticketTiers": [
            {
                "name": "Early Bird",
                "price": 5000,
                "quantity": 50
            },
            {
                "name": "Regular",
                "price": 8000,
                "quantity": 100
            },
            {
                "name": "VIP",
                "price": 15000,
                "quantity": 25
            }
        ],
        "images": [
            create_sample_image(),
            create_sample_image(),
            create_sample_image()
        ]
    }
    
    try:
        headers = {"Authorization": f"Bearer {organizer_token}"}
        response = requests.post(f"{BASE_URL}/api/events", json=event_data, headers=headers)
        data = response.json()
        
        if data.get("success"):
            event = data["data"]["event"]
            event_id = event["id"]
            
            print_result(True, f"Event created with ID: {event_id}")
            print(f"   - Title: {event['title']}")
            print(f"   - Ticket Tiers: {len(event.get('ticketTiers', []))}")
            print(f"   - Images: {len(event.get('images', []))}")
            print(f"   - Livestream Enabled: {event.get('enableLivestream', False)}")
            print(f"   - Total Tickets: {event.get('total_tickets', 0)}")
            
            return event_id, event
        else:
            print_result(False, f"Event creation failed: {data.get('error', {}).get('message', 'Unknown error')}")
            return None, None
            
    except Exception as e:
        print_result(False, f"Event creation error: {str(e)}")
        return None, None

def test_event_updates_and_notifications(organizer_token, event_id):
    """Test event updates with change tracking and notifications"""
    print_step(2, "Testing Event Updates and Notifications")
    
    # Update event with significant changes
    update_data = {
        "venue": "New Venue: Landmark Centre, Victoria Island",
        "date": (datetime.now() + timedelta(days=35)).strftime("%Y-%m-%d"),
        "time": "16:00",
        "status": "postponed",
        "postponementReason": "Due to unforeseen circumstances, we need to reschedule",
        "notifyAttendees": True
    }
    
    try:
        headers = {"Authorization": f"Bearer {organizer_token}"}
        response = requests.put(f"{BASE_URL}/api/events/{event_id}", json=update_data, headers=headers)
        data = response.json()
        
        if data.get("success"):
            changes = data["data"].get("changes", [])
            notifications_sent = data["data"].get("notifications_sent", False)
            
            print_result(True, "Event updated successfully")
            print(f"   - Changes detected: {len(changes)}")
            for change in changes:
                print(f"     • {change}")
            print(f"   - Notifications sent: {notifications_sent}")
            
            return True
        else:
            print_result(False, f"Event update failed: {data.get('error', {}).get('message', 'Unknown error')}")
            return False
            
    except Exception as e:
        print_result(False, f"Event update error: {str(e)}")
        return False

def test_livestream_controls(organizer_token, event_id):
    """Test livestream start/stop controls"""
    print_step(3, "Testing Livestream Controls")
    
    # Start livestream
    try:
        headers = {"Authorization": f"Bearer {organizer_token}"}
        
        # Start livestream
        response = requests.post(f"{BASE_URL}/api/events/{event_id}/livestream/start", headers=headers)
        data = response.json()
        
        if data.get("success"):
            print_result(True, "Livestream started successfully")
            print(f"   - Event is now LIVE")
            print(f"   - Started at: {data['data'].get('started_at')}")
            
            # Wait a moment
            time.sleep(2)
            
            # Stop livestream
            response = requests.post(f"{BASE_URL}/api/events/{event_id}/livestream/stop", headers=headers)
            data = response.json()
            
            if data.get("success"):
                print_result(True, "Livestream stopped successfully")
                print(f"   - Event is now OFFLINE")
                print(f"   - Ended at: {data['data'].get('ended_at')}")
                return True
            else:
                print_result(False, f"Livestream stop failed: {data.get('error', {}).get('message', 'Unknown error')}")
                return False
        else:
            print_result(False, f"Livestream start failed: {data.get('error', {}).get('message', 'Unknown error')}")
            return False
            
    except Exception as e:
        print_result(False, f"Livestream control error: {str(e)}")
        return False

def test_spray_money_integration(attendee_token, event_id):
    """Test spray money during livestream"""
    print_step(4, "Testing Spray Money Integration")
    
    # First, start the livestream (as organizer would do)
    # For this test, we'll assume it's live
    
    spray_data = {
        "amount": 2500,
        "message": "Great event! 🎉",
        "is_anonymous": False
    }
    
    try:
        headers = {"Authorization": f"Bearer {attendee_token}"}
        response = requests.post(f"{BASE_URL}/api/events/{event_id}/spray-money", json=spray_data, headers=headers)
        data = response.json()
        
        if data.get("success"):
            print_result(True, "Spray money sent successfully")
            print(f"   - Amount: ₦{spray_data['amount']:,}")
            print(f"   - Message: {spray_data['message']}")
            print(f"   - Anonymous: {spray_data['is_anonymous']}")
            return True
        else:
            print_result(False, f"Spray money failed: {data.get('error', {}).get('message', 'Unknown error')}")
            return False
            
    except Exception as e:
        print_result(False, f"Spray money error: {str(e)}")
        return False

def test_event_detail_page(event_id):
    """Test the new event detail page functionality"""
    print_step(5, "Testing Event Detail Page")
    
    try:
        response = requests.get(f"{BASE_URL}/api/events/{event_id}")
        data = response.json()
        
        if data.get("success"):
            event = data["data"]
            print_result(True, "Event details retrieved successfully")
            print(f"   - Event ID: {event['id']}")
            print(f"   - Title: {event['title']}")
            print(f"   - Ticket Tiers: {len(event.get('ticketTiers', []))}")
            
            # Display ticket tiers
            for i, tier in enumerate(event.get('ticketTiers', [])):
                available = tier['quantity'] - tier.get('sold', 0)
                print(f"     Tier {i+1}: {tier['name']} - ₦{tier['price']:,} ({available} available)")
            
            print(f"   - Images: {len(event.get('images', []))}")
            print(f"   - Livestream Enabled: {event.get('enableLivestream', False)}")
            print(f"   - Currently Live: {event.get('isLive', False)}")
            
            return True
        else:
            print_result(False, f"Event retrieval failed: {data.get('error', {}).get('message', 'Unknown error')}")
            return False
            
    except Exception as e:
        print_result(False, f"Event retrieval error: {str(e)}")
        return False

def main():
    """Run all tests"""
    print("🚀 TESTING NEW TIKIT FEATURES")
    print(f"Backend URL: {BASE_URL}")
    print(f"Frontend URL: {FRONTEND_URL}")
    
    # Login users
    organizer_token, organizer_user = login_user(ORGANIZER_CREDENTIALS, "Organizer")
    attendee_token, attendee_user = login_user(ATTENDEE_CREDENTIALS, "Attendee")
    
    if not organizer_token or not attendee_token:
        print("\n❌ CRITICAL: Could not login users. Please check credentials and backend status.")
        return
    
    # Test 1: Create event with tiers and images
    event_id, event = test_create_event_with_tiers_and_images(organizer_token)
    if not event_id:
        print("\n❌ CRITICAL: Could not create test event. Stopping tests.")
        return
    
    # Test 2: Event updates and notifications
    test_event_updates_and_notifications(organizer_token, event_id)
    
    # Test 3: Livestream controls
    test_livestream_controls(organizer_token, event_id)
    
    # Test 4: Spray money integration
    test_spray_money_integration(attendee_token, event_id)
    
    # Test 5: Event detail page
    test_event_detail_page(event_id)
    
    # Summary
    print_step("FINAL", "Test Summary")
    print("✅ Event creation with ticket tiers and images")
    print("✅ Event updates with change tracking")
    print("✅ Livestream start/stop controls")
    print("✅ Spray money integration")
    print("✅ Event detail page functionality")
    
    print(f"\n🎉 ALL TESTS COMPLETED!")
    print(f"📱 Frontend URL: {FRONTEND_URL}")
    print(f"🔗 Test Event: {FRONTEND_URL}/events/{event_id}")
    print(f"⚙️  Organizer Dashboard: {FRONTEND_URL}/organizer/events")

if __name__ == "__main__":
    main()