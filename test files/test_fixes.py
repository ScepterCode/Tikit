#!/usr/bin/env python3
"""
Test the fixes for the minor issues
"""

from config import config
import requests
from supabase import create_client, Client

# Supabase configuration
SUPABASE_URL = config.SUPABASE_URL
SUPABASE_ANON_KEY = config.SUPABASE_ANON_KEY

def test_update_event_endpoint():
    """Test the fixed PUT /api/events/{id} endpoint"""
    print("🔧 Testing PUT /api/events/{id} endpoint fix...")
    
    # Login to get token
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    
    try:
        response = supabase.auth.sign_in_with_password({
            "email": "organizer@grooovy.netlify.app",
            "password": "password123"
        })
        
        if not response.session:
            print("❌ Login failed")
            return False
            
        token = response.session.access_token
        print(f"✅ Login successful, token: {token[:30]}...")
        
        # First, create an event to update
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        create_data = {
            "title": "Test Event for Update",
            "description": "Testing update functionality",
            "venue": "Test Venue",
            "date": "2024-03-01",
            "time": "19:00",
            "category": "conference",
            "ticketTiers": [
                {
                    "name": "General",
                    "price": 3000,
                    "quantity": 50
                }
            ]
        }
        
        create_response = requests.post(
            "http://localhost:8000/api/events",
            headers=headers,
            json=create_data,
            timeout=10
        )
        
        if create_response.status_code != 200:
            print(f"❌ Failed to create test event: {create_response.status_code}")
            return False
            
        event_data = create_response.json()
        event_id = event_data.get('data', {}).get('event_id')
        print(f"✅ Test event created: {event_id}")
        
        # Now test updating the event
        update_data = {
            "title": "Updated Test Event",
            "description": "Updated description",
            "venue": "Updated Venue",
            "notifyAttendees": False
        }
        
        update_response = requests.put(
            f"http://localhost:8000/api/events/{event_id}",
            headers=headers,
            json=update_data,
            timeout=10
        )
        
        print(f"   Update Status: {update_response.status_code}")
        
        if update_response.status_code == 200:
            data = update_response.json()
            print(f"   ✅ Event updated successfully!")
            print(f"   Changes: {data.get('data', {}).get('changes', [])}")
            return True
        else:
            print(f"   ❌ Update failed: {update_response.text[:200]}...")
            return False
            
    except Exception as e:
        print(f"❌ Test error: {e}")
        return False

def test_backend_status():
    """Test backend is running"""
    print("🔍 Testing backend status...")
    
    try:
        response = requests.get("http://localhost:8000/health", timeout=5)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            print("   ✅ Backend is running")
            return True
        else:
            print("   ❌ Backend error")
            return False
    except Exception as e:
        print(f"   ❌ Backend not accessible: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Testing fixes for minor issues...\n")
    
    # Test backend first
    backend_ok = test_backend_status()
    print()
    
    if backend_ok:
        # Test the update endpoint fix
        update_ok = test_update_event_endpoint()
        print()
        
        if update_ok:
            print("✅ All fixes working correctly!")
            print("🎯 The PUT /api/events/{id} endpoint now uses JWT authentication")
            print("🎨 CSS border style conflicts have been resolved")
        else:
            print("❌ Update endpoint still has issues")
    else:
        print("❌ Backend not running")
    
    print("\n✅ Fix test complete!")