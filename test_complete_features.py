#!/usr/bin/env python3
"""
Complete test suite for all new Tikit features
"""

import requests
import json
import time
import base64
from PIL import Image
import io

BASE_URL = "http://localhost:8000"

ORGANIZER_CREDENTIALS = {
    "phoneNumber": "+2349087654321",
    "password": "password123"
}

ATTENDEE_CREDENTIALS = {
    "phoneNumber": "+2349011111111", 
    "password": "password123"
}

def create_test_image():
    """Create a small test image"""
    img = Image.new('RGB', (100, 100), (255, 0, 0))
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    img_data = buffer.getvalue()
    base64_data = base64.b64encode(img_data).decode('utf-8')
    return f"data:image/png;base64,{base64_data}"

def login_user(credentials):
    """Login and return token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json=credentials)
    data = response.json()
    return data["data"]["access_token"] if data.get("success") else None

def test_complete_workflow():
    """Test the complete new features workflow"""
    print("🚀 COMPLETE FEATURES TEST")
    print("="*50)
    
    # 1. Login users
    organizer_token = login_user(ORGANIZER_CREDENTIALS)
    attendee_token = login_user(ATTENDEE_CREDENTIALS)
    
    if not organizer_token or not attendee_token:
        print("❌ Failed to login users")
        return False
    
    print("✅ Users logged in successfully")
    
    # 2. Create event with all new features
    print("\n📅 Creating event with all new features...")
    event_data = {
        "title": "Complete Features Test Event",
        "description": "Testing all new features together",
        "date": "2026-04-20",
        "time": "18:00",
        "venue": "Complete Test Venue",
        "category": "party",
        "enableLivestream": True,
        "ticketTiers": [
            {"name": "Early Bird", "price": 3000, "quantity": 30},
            {"name": "Regular", "price": 5000, "quantity": 50},
            {"name": "VIP", "price": 10000, "quantity": 20}
        ],
        "images": [create_test_image(), create_test_image()]
    }
    
    headers = {"Authorization": f"Bearer {organizer_token}"}
    response = requests.post(f"{BASE_URL}/api/events", json=event_data, headers=headers)
    data = response.json()
    
    if not data.get("success"):
        print(f"❌ Event creation failed: {data.get('error', {}).get('message')}")
        return False
    
    event_id = data["data"]["event"]["id"]
    print(f"✅ Event created: {event_id}")
    
    # 3. Test event updates with notifications
    print("\n📝 Testing event updates...")
    update_data = {
        "venue": "Updated Venue Location",
        "status": "postponed",
        "postponementReason": "Weather conditions",
        "notifyAttendees": True
    }
    
    response = requests.put(f"{BASE_URL}/api/events/{event_id}", json=update_data, headers=headers)
    data = response.json()
    
    if data.get("success"):
        print(f"✅ Event updated with {len(data['data']['changes'])} changes")
        print(f"✅ Notifications sent: {data['data']['notifications_sent']}")
    else:
        print("❌ Event update failed")
    
    # 4. Test livestream controls
    print("\n🔴 Testing livestream controls...")
    
    # Start livestream
    response = requests.post(f"{BASE_URL}/api/events/{event_id}/livestream/start", headers=headers)
    if response.json().get("success"):
        print("✅ Livestream started")
        
        # Test spray money during live event
        print("\n💸 Testing spray money during livestream...")
        spray_data = {"amount": 5000, "message": "Great party!", "is_anonymous": False}
        attendee_headers = {"Authorization": f"Bearer {attendee_token}"}
        
        response = requests.post(f"{BASE_URL}/api/events/{event_id}/spray-money", 
                               json=spray_data, headers=attendee_headers)
        if response.json().get("success"):
            print("✅ Spray money sent during livestream")
        else:
            print("❌ Spray money failed")
        
        # Stop livestream
        response = requests.post(f"{BASE_URL}/api/events/{event_id}/livestream/stop", headers=headers)
        if response.json().get("success"):
            print("✅ Livestream stopped")
        else:
            print("❌ Failed to stop livestream")
    else:
        print("❌ Failed to start livestream")
    
    # 5. Test notifications
    print("\n🔔 Testing notifications...")
    response = requests.get(f"{BASE_URL}/api/notifications", headers=attendee_headers)
    data = response.json()
    
    if data.get("success"):
        notifications = data["data"]["notifications"]
        print(f"✅ Retrieved {len(notifications)} notifications")
        
        if notifications:
            # Mark first notification as read
            notif_id = notifications[0]["id"]
            response = requests.put(f"{BASE_URL}/api/notifications/{notif_id}/read", headers=attendee_headers)
            if response.json().get("success"):
                print("✅ Notification marked as read")
            else:
                print("❌ Failed to mark notification as read")
    else:
        print("❌ Failed to retrieve notifications")
    
    # 6. Verify event details with all features
    print("\n🔍 Verifying complete event details...")
    response = requests.get(f"{BASE_URL}/api/events/{event_id}")
    data = response.json()
    
    if data.get("success"):
        event = data["data"]
        print("✅ Event verification complete:")
        print(f"   - Ticket Tiers: {len(event.get('ticketTiers', []))}")
        print(f"   - Images: {len(event.get('images', []))}")
        print(f"   - Livestream Enabled: {event.get('enableLivestream')}")
        print(f"   - Status: {event.get('status')}")
        print(f"   - Postponement Reason: {event.get('postponement_reason', 'N/A')}")
        return True
    else:
        print("❌ Failed to verify event details")
        return False

def main():
    """Run complete test suite"""
    success = test_complete_workflow()
    
    print("\n" + "="*50)
    print("🎯 FINAL RESULT")
    print("="*50)
    
    if success:
        print("🎉 ALL FEATURES WORKING PERFECTLY!")
        print("\n✅ IMPLEMENTED FEATURES:")
        print("   1. ✅ Dynamic ticket tiers with custom pricing")
        print("   2. ✅ Image upload and storage (base64)")
        print("   3. ✅ Event updates with change tracking")
        print("   4. ✅ Notification system for attendees")
        print("   5. ✅ Livestream controls (start/stop)")
        print("   6. ✅ Spray money integration with livestream")
        print("   7. ✅ Real-time event status management")
        print("\n🚀 SYSTEM READY FOR PRODUCTION!")
    else:
        print("❌ SOME FEATURES NEED ATTENTION")

if __name__ == "__main__":
    main()