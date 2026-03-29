#!/usr/bin/env python3
"""
Simple Secret Events Test
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_endpoints():
    """Test secret events endpoints"""
    print("🔐 TESTING SECRET EVENTS ENDPOINTS")
    print("="*50)
    
    # Test 1: Health check
    print("\n1️⃣ Testing Backend Health")
    print("-" * 30)
    
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            print("✅ Backend is running")
        else:
            print(f"❌ Backend health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Backend connection failed: {e}")
        return False
    
    # Test 2: Test with mock token
    print("\n2️⃣ Testing Secret Events Endpoints")
    print("-" * 30)
    
    # Use mock token
    organizer_token = login_user("+2349087654321", "password123")
    if not organizer_token:
        print("❌ Failed to get organizer token")
        return False
    
    headers = {"Authorization": f"Bearer {organizer_token}"}
    print(f"Using token: {organizer_token[:30]}...")
    
    # Test accessible events endpoint
    try:
        response = requests.get(f"{BASE_URL}/api/secret-events/accessible", headers=headers)
        print(f"Accessible events status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Accessible events endpoint working")
            print(f"   Response: {json.dumps(data, indent=2)}")
        else:
            print(f"❌ Accessible events failed")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"❌ Request failed: {e}")
    
    return True

def login_user(phone_number: str, password: str):
    """Login user and get token"""
    try:
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "phoneNumber": phone_number,
            "password": password
        })
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                return data["data"]["access_token"]
        
        return None
    except Exception as e:
        print(f"Login error: {e}")
        return None

def main():
    """Run the simple test"""
    success = test_endpoints()
    
    print("\n" + "="*50)
    print("🎯 SIMPLE TEST RESULT")
    print("="*50)
    
    if success:
        print("✅ Basic endpoints accessible")
    else:
        print("❌ Issues detected")

if __name__ == "__main__":
    main()