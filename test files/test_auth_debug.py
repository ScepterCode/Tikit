#!/usr/bin/env python3
"""
Debug Authentication Issues
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_auth_debug():
    """Debug authentication issues"""
    print("🔍 DEBUGGING AUTHENTICATION")
    print("="*50)
    
    # Test 1: Login and get actual token
    print("\n1️⃣ Testing Login")
    print("-" * 30)
    
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "phoneNumber": "+2349087654321",
        "password": "password123"
    })
    
    if response.status_code == 200:
        data = response.json()
        if data.get("success"):
            token = data["data"]["access_token"]
            print(f"✅ Login successful")
            print(f"   Token: {token}")
            
            # Test 2: Use token with membership endpoint
            print("\n2️⃣ Testing Membership Endpoint")
            print("-" * 30)
            
            headers = {"Authorization": f"Bearer {token}"}
            
            response = requests.get(f"{BASE_URL}/api/memberships/status", headers=headers)
            print(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Membership endpoint working")
                print(f"   Response: {json.dumps(data, indent=2)}")
            else:
                print(f"❌ Membership endpoint failed")
                print(f"   Response: {response.text}")
            
            # Test 3: Test secret events endpoint
            print("\n3️⃣ Testing Secret Events Endpoint")
            print("-" * 30)
            
            response = requests.get(f"{BASE_URL}/api/secret-events/accessible", headers=headers)
            print(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Secret events endpoint working")
                print(f"   Response: {json.dumps(data, indent=2)}")
            else:
                print(f"❌ Secret events endpoint failed")
                print(f"   Response: {response.text}")
        else:
            print(f"❌ Login failed: {data}")
    else:
        print(f"❌ Login HTTP error: {response.status_code}")

def main():
    test_auth_debug()

if __name__ == "__main__":
    main()