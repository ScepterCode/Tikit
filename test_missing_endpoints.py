#!/usr/bin/env python3
"""
Test the missing endpoints that were showing 404 in browser
"""

import requests

def test_missing_endpoints():
    """Test endpoints that were returning 404"""
    
    print("🔍 Testing Previously Missing Endpoints...")
    print("=" * 50)
    
    backend_url = "http://localhost:8000"
    
    # Test endpoints that were showing 404 in browser
    endpoints_to_test = [
        "/api/memberships/status",
        "/api/memberships/pricing", 
        "/api/events",
        "/api/csrf-token"
    ]
    
    for endpoint in endpoints_to_test:
        print(f"\n🔄 Testing {endpoint}")
        try:
            response = requests.get(f"{backend_url}{endpoint}", timeout=5)
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 404:
                print("   ❌ Still not found")
            elif response.status_code in [200, 401, 403, 405]:
                print("   ✅ Endpoint exists and working")
            else:
                print(f"   ⚠️  Status: {response.status_code}")
                
        except Exception as e:
            print(f"   ❌ Error: {e}")
    
    print("\n" + "=" * 50)
    print("🎯 Endpoint test completed!")

if __name__ == "__main__":
    test_missing_endpoints()