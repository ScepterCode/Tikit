#!/usr/bin/env python3
"""
Test authentication fix for notification endpoints
"""

import requests
import json

def test_auth_endpoints():
    """Test authentication endpoints"""
    
    print("🔐 Testing Authentication Fix...")
    print("=" * 50)
    
    backend_url = "http://localhost:8000"
    
    # Test endpoints without authentication (should return 401)
    endpoints_to_test = [
        "/api/notifications",
        "/api/notifications/unread-count",
        "/api/admin/dashboard/stats"
    ]
    
    for endpoint in endpoints_to_test:
        print(f"\n🔄 Testing {endpoint}")
        try:
            # Test without auth (should be 401)
            response = requests.get(f"{backend_url}{endpoint}", timeout=5)
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 401:
                print("   ✅ Correctly requires authentication")
            elif response.status_code == 403:
                print("   ✅ Authentication working (forbidden due to role)")
            elif response.status_code == 404:
                print("   ❌ Endpoint not found")
            else:
                print(f"   ⚠️  Unexpected status: {response.status_code}")
                
        except Exception as e:
            print(f"   ❌ Error: {e}")
    
    # Test with invalid token
    print(f"\n🔄 Testing with invalid token")
    try:
        headers = {"Authorization": "Bearer invalid-token"}
        response = requests.get(f"{backend_url}/api/notifications", headers=headers, timeout=5)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 401:
            print("   ✅ Correctly rejects invalid token")
        else:
            print(f"   ⚠️  Unexpected status: {response.status_code}")
            
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    print("\n" + "=" * 50)
    print("🎯 Authentication test completed!")
    print("\nNext steps:")
    print("1. Check browser console for updated error messages")
    print("2. Verify Supabase token format in frontend")
    print("3. Test with actual Supabase token from browser")

if __name__ == "__main__":
    test_auth_endpoints()