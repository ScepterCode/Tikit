#!/usr/bin/env python3
"""
Complete authentication test
Test the full flow from login to API calls
"""

from config import config
import requests
import json
from supabase import create_client, Client

# Supabase configuration
SUPABASE_URL = config.SUPABASE_URL
SUPABASE_ANON_KEY = config.SUPABASE_ANON_KEY

def test_all_users():
    """Test authentication for all user types"""
    print("🚀 Testing authentication for all user types...\n")
    
    users = [
        ("admin@grooovy.netlify.app", "password123", "admin"),
        ("organizer@grooovy.netlify.app", "password123", "organizer"),
        ("attendee@grooovy.netlify.app", "password123", "attendee")
    ]
    
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    
    for email, password, expected_role in users:
        print(f"🔐 Testing {expected_role}: {email}")
        
        try:
            # Login
            response = supabase.auth.sign_in_with_password({
                "email": email,
                "password": password
            })
            
            if not response.session:
                print(f"   ❌ Login failed")
                continue
                
            token = response.session.access_token
            user = response.user
            actual_role = user.user_metadata.get('role', 'N/A')
            
            print(f"   ✅ Login successful")
            print(f"   📧 Email: {user.email}")
            print(f"   👤 Role: {actual_role}")
            print(f"   🎫 Token: {token[:30]}...")
            
            # Test API calls
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
            
            # Test health endpoint
            try:
                health_response = requests.get("http://localhost:8000/health", timeout=5)
                print(f"   🏥 Health check: {health_response.status_code}")
            except Exception as e:
                print(f"   ❌ Health check failed: {e}")
            
            # Test create event (only for organizers and admins)
            if actual_role in ["organizer", "admin"]:
                try:
                    event_data = {
                        "title": f"Test Event by {actual_role}",
                        "description": "Testing authentication",
                        "venue": "Test Venue",
                        "date": "2024-02-25",
                        "time": "20:00",
                        "category": "conference",
                        "ticketTiers": [
                            {
                                "name": "General",
                                "price": 2000,
                                "quantity": 100
                            }
                        ]
                    }
                    
                    create_response = requests.post(
                        "http://localhost:8000/api/events",
                        headers=headers,
                        json=event_data,
                        timeout=10
                    )
                    
                    print(f"   🎉 Create event: {create_response.status_code}")
                    
                    if create_response.status_code == 200:
                        data = create_response.json()
                        event_id = data.get('data', {}).get('event_id', 'N/A')
                        print(f"   📝 Event ID: {event_id}")
                    else:
                        print(f"   ❌ Error: {create_response.text[:100]}...")
                        
                except Exception as e:
                    print(f"   ❌ Create event failed: {e}")
            else:
                print(f"   ⏭️  Skipping create event (not organizer/admin)")
            
            # Logout
            supabase.auth.sign_out()
            print(f"   🚪 Logged out\n")
            
        except Exception as e:
            print(f"   ❌ Test failed: {e}\n")

def test_backend_status():
    """Test backend status"""
    print("🔍 Testing backend status...")
    
    try:
        response = requests.get("http://localhost:8000/health", timeout=5)
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text}")
    except Exception as e:
        print(f"   ❌ Backend not accessible: {e}")

if __name__ == "__main__":
    print("🚀 Starting complete authentication test...\n")
    
    # Test backend first
    test_backend_status()
    print()
    
    # Test all users
    test_all_users()
    
    print("✅ Complete authentication test finished!")