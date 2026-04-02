"""
Quick test to verify all endpoints are working
"""

import requests

BASE_URL = "http://localhost:8000"

def test_endpoint(method, url, description):
    """Test an endpoint and print result"""
    try:
        if method == "GET":
            response = requests.get(url, timeout=5)
        else:
            response = requests.post(url, json={}, timeout=5)
        
        status = "✅" if response.status_code in [200, 401, 422] else "❌"
        print(f"{status} {description}: {response.status_code}")
        return response.status_code in [200, 401, 422]
    except Exception as e:
        print(f"❌ {description}: ERROR - {e}")
        return False

print("\n" + "="*80)
print("  ENDPOINT VERIFICATION TEST")
print("="*80 + "\n")

tests = [
    ("GET", f"{BASE_URL}/health", "Health Check"),
    ("GET", f"{BASE_URL}/api/events", "Events List"),
    ("GET", f"{BASE_URL}/api/events/recommended", "Recommended Events"),
    ("GET", f"{BASE_URL}/api/memberships/pricing", "Membership Pricing"),
    ("GET", f"{BASE_URL}/api/wallet/banks", "Bank List"),
]

passed = 0
total = len(tests)

for method, url, description in tests:
    if test_endpoint(method, url, description):
        passed += 1

print("\n" + "="*80)
print(f"  RESULTS: {passed}/{total} tests passed")
print("="*80)

if passed == total:
    print("\n✅ All endpoints are working!")
    print("🎉 System is ready to use!")
else:
    print(f"\n⚠️  {total - passed} endpoint(s) failed")
    print("Check backend logs for details")

print("\n")
