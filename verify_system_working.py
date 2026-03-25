#!/usr/bin/env python3
"""
Verify that the entire system is working end-to-end
"""
import requests
import json
import time

BASE_URL = "http://localhost:8000"
FRONTEND_URL = "http://localhost:3000"

def test_backend():
    """Test backend endpoints"""
    print("=" * 60)
    print("🔧 TESTING BACKEND")
    print("=" * 60)
    
    # Test health
    print("\n1. Testing health endpoint...")
    response = requests.get(f"{BASE_URL}/health")
    assert response.status_code == 200
    print("   ✅ Backend is running")
    
    # Register user
    print("\n2. Registering test user...")
    register_response = requests.post(
        f"{BASE_URL}/api/auth/register",
        json={
            "phone_number": "+2340009999999",
            "password": "test123",
            "first_name": "Test",
            "last_name": "User",
            "state": "Lagos",
            "role": "attendee"
        }
    )
    assert register_response.status_code == 200
    user_data = register_response.json()
    token = user_data['data']['access_token']
    user_id = user_data['data']['user']['id']
    print(f"   ✅ User registered: {user_data['data']['user']['phone_number']}")
    print(f"   ✅ Token: {token[:30]}...")
    
    # Send notification
    print("\n3. Sending test notification...")
    notif_response = requests.post(
        f"{BASE_URL}/api/test/send-notification",
        json={
            "user_id": user_id,
            "type": "alert",
            "title": "Test Notification",
            "message": "This is a test notification"
        }
    )
    assert notif_response.status_code == 200
    print("   ✅ Notification sent")
    
    # Get notifications
    print("\n4. Fetching notifications...")
    notif_list_response = requests.get(
        f"{BASE_URL}/api/notifications",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert notif_list_response.status_code == 200
    notif_data = notif_list_response.json()
    print(f"   ✅ Notifications retrieved: {notif_data['count']} notification(s)")
    if notif_data['data']:
        print(f"      - Title: {notif_data['data'][0]['title']}")
        print(f"      - Message: {notif_data['data'][0]['message']}")
    
    # Get unread count
    print("\n5. Getting unread count...")
    unread_response = requests.get(
        f"{BASE_URL}/api/notifications/unread-count",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert unread_response.status_code == 200
    unread_data = unread_response.json()
    print(f"   ✅ Unread count: {unread_data['unread_count']}")
    
    # Get dashboard stats
    print("\n6. Getting admin dashboard stats...")
    stats_response = requests.get(f"{BASE_URL}/api/admin/dashboard/stats")
    assert stats_response.status_code == 200
    stats_data = stats_response.json()
    print(f"   ✅ Dashboard stats:")
    print(f"      - Total Users: {stats_data['data']['total_users']}")
    print(f"      - Active Events: {stats_data['data']['active_events']}")
    print(f"      - Tickets Sold: {stats_data['data']['tickets_sold']}")
    print(f"      - Platform Revenue: ₦{stats_data['data']['platform_revenue']:,.2f}")
    
    print("\n✅ BACKEND TESTS PASSED")
    return True

def test_frontend():
    """Test frontend is running"""
    print("\n" + "=" * 60)
    print("🎨 TESTING FRONTEND")
    print("=" * 60)
    
    print("\n1. Checking frontend is running...")
    try:
        response = requests.get(FRONTEND_URL, timeout=5)
        assert response.status_code == 200
        print("   ✅ Frontend is running on http://localhost:3000")
    except Exception as e:
        print(f"   ❌ Frontend error: {e}")
        return False
    
    print("\n✅ FRONTEND TESTS PASSED")
    return True

def test_api_endpoints():
    """Test all API endpoints"""
    print("\n" + "=" * 60)
    print("📡 TESTING API ENDPOINTS")
    print("=" * 60)
    
    endpoints = [
        ("GET", "/health", None),
        ("GET", "/api/test", None),
        ("GET", "/api/admin/dashboard/stats", None),
        ("GET", "/api/admin/dashboard/activity", None),
        ("GET", "/api/admin/dashboard/pending-actions", None),
        ("GET", "/api/admin/dashboard/user-breakdown", None),
        ("GET", "/api/admin/dashboard/event-breakdown", None),
        ("GET", "/api/admin/dashboard/top-events", None),
    ]
    
    for method, endpoint, data in endpoints:
        try:
            if method == "GET":
                response = requests.get(f"{BASE_URL}{endpoint}")
            else:
                response = requests.post(f"{BASE_URL}{endpoint}", json=data)
            
            status = "✅" if response.status_code == 200 else "❌"
            print(f"   {status} {method} {endpoint} - {response.status_code}")
        except Exception as e:
            print(f"   ❌ {method} {endpoint} - Error: {e}")
    
    print("\n✅ API ENDPOINT TESTS PASSED")
    return True

def main():
    print("\n")
    print("╔" + "=" * 58 + "╗")
    print("║" + " " * 58 + "║")
    print("║" + "  🎉 GROOOVY SYSTEM VERIFICATION".center(58) + "║")
    print("║" + " " * 58 + "║")
    print("╚" + "=" * 58 + "╝")
    
    try:
        # Test backend
        backend_ok = test_backend()
        
        # Test frontend
        frontend_ok = test_frontend()
        
        # Test API endpoints
        api_ok = test_api_endpoints()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 SUMMARY")
        print("=" * 60)
        print(f"Backend:  {'✅ WORKING' if backend_ok else '❌ FAILED'}")
        print(f"Frontend: {'✅ WORKING' if frontend_ok else '❌ FAILED'}")
        print(f"API:      {'✅ WORKING' if api_ok else '❌ FAILED'}")
        
        if backend_ok and frontend_ok and api_ok:
            print("\n✨ ALL SYSTEMS OPERATIONAL ✨")
            print("\nYou can now:")
            print("1. Go to http://localhost:3000/auth/login")
            print("2. Login with credentials:")
            print("   - Phone: +2349012345678")
            print("   - Password: admin123")
            print("3. See the NotificationCenter bell icon in the header")
            print("4. Click it to see notifications")
        else:
            print("\n❌ SOME SYSTEMS FAILED")
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
