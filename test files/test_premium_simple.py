#!/usr/bin/env python3
"""
Simple Premium Membership Test
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_endpoints():
    """Test premium membership endpoints"""
    print("🚀 TESTING PREMIUM MEMBERSHIP ENDPOINTS")
    print("="*50)
    
    # Test 1: Health check
    print("\n1️⃣ Testing Backend Health")
    print("-" * 30)
    
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            print("✅ Backend is running")
            print(f"   Response: {response.json()}")
        else:
            print(f"❌ Backend health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Backend connection failed: {e}")
        return False
    
    # Test 2: Pricing endpoint (no auth required)
    print("\n2️⃣ Testing Pricing Endpoint")
    print("-" * 30)
    
    try:
        response = requests.get(f"{BASE_URL}/api/memberships/pricing")
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Pricing endpoint working")
            print(f"   Response: {json.dumps(data, indent=2)}")
        else:
            print(f"❌ Pricing endpoint failed")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"❌ Pricing request failed: {e}")
    
    # Test 3: Test with mock token
    print("\n3️⃣ Testing with Mock Token")
    print("-" * 30)
    
    # Use the mock token format that the backend expects
    mock_token = "mock_access_token_test_organizer"
    headers = {"Authorization": f"Bearer {mock_token}"}
    
    try:
        response = requests.get(f"{BASE_URL}/api/memberships/status", headers=headers)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Membership status endpoint working")
            print(f"   Response: {json.dumps(data, indent=2)}")
        else:
            print(f"❌ Membership status failed")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"❌ Membership status request failed: {e}")
    
    return True

def main():
    """Run the simple test"""
    success = test_endpoints()
    
    print("\n" + "="*50)
    print("🎯 SIMPLE TEST RESULT")
    print("="*50)
    
    if success:
        print("✅ Basic connectivity working")
        print("🔧 Next: Fix authentication integration")
    else:
        print("❌ Basic connectivity issues")

if __name__ == "__main__":
    main()