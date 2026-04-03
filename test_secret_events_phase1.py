"""
Test Secret Events Phase 1 Implementation
Tests all backend endpoints and Supabase integration
"""
import requests
import json
from datetime import datetime, timedelta

# Configuration
BASE_URL = "http://localhost:8000"
API_URL = f"{BASE_URL}/api"

# Test credentials (update with your actual test accounts)
ORGANIZER_EMAIL = "scepterboss@gmail.com"  # Must be organizer role
ORGANIZER_PASSWORD = "your_password"  # Update this

ATTENDEE_EMAIL = "test_attendee@gmail.com"  # Must be attendee role
ATTENDEE_PASSWORD = "your_password"  # Update this

def print_section(title):
    """Print formatted section header"""
    print("\n" + "="*60)
    print(f"  {title}")
    print("="*60)

def print_result(test_name, success, data=None, error=None):
    """Print test result"""
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"\n{status} - {test_name}")
    if data:
        print(f"Data: {json.dumps(data, indent=2)}")
    if error:
        print(f"Error: {error}")

def login(email, password):
    """Login and get JWT token"""
    try:
        response = requests.post(
            f"{API_URL}/auth/login",
            json={"email": email, "password": password}
        )
        if response.status_code == 200:
            data = response.json()
            return data.get("access_token")
        else:
            print(f"Login failed: {response.text}")
            return None
    except Exception as e:
        print(f"Login error: {e}")
        return None

def test_health_check():
    """Test 1: Health check"""
    print_section("TEST 1: Health Check")
    try:
        response = requests.get(f"{BASE_URL}/health")
        success = response.status_code == 200
        data = response.json() if success else None
        print_result("Health Check", success, data)
        return success
    except Exception as e:
        print_result("Health Check", False, error=str(e))
        return False

def test_create_secret_event(token):
    """Test 2: Create secret event"""
    print_section("TEST 2: Create Secret Event")
    
    # Event data
    event_start = datetime.utcnow() + timedelta(days=7)
    event_data = {
        "title": "Secret VIP Party",
        "description": "An exclusive secret event for VIP members only",
        "venue": "123 Secret Street, Victoria Island, Lagos, Nigeria",
        "public_venue": "Lagos Island",
        "start_date": event_start.isoformat(),
        "category": "party",
        "premium_tier_required": "premium",
        "location_reveal_hours": 2,
        "max_attendees": 50,
        "anonymous_purchases_allowed": True,
        "attendee_list_hidden": True,
        "price": 10000,
        "teaser_description": "An exclusive party at a secret location. Only the chosen few will know where..."
    }
    
    try:
        response = requests.post(
            f"{API_URL}/secret-events/create",
            json=event_data,
            headers={"Authorization": f"Bearer {token}"}
        )
        success = response.status_code == 200
        data = response.json() if success else None
        error = response.text if not success else None
        print_result("Create Secret Event", success, data, error)
        
        if success and data.get("success"):
            return data["data"]
        return None
    except Exception as e:
        print_result("Create Secret Event", False, error=str(e))
        return None

def test_get_accessible_events(token, user_type):
    """Test 3: Get accessible secret events"""
    print_section(f"TEST 3: Get Accessible Events ({user_type})")
    
    try:
        response = requests.get(
            f"{API_URL}/secret-events/accessible",
            headers={"Authorization": f"Bearer {token}"}
        )
        success = response.status_code == 200
        data = response.json() if success else None
        error = response.text if not success else None
        print_result(f"Get Accessible Events ({user_type})", success, data, error)
        
        if success and data.get("success"):
            return data["data"]["events"]
        return []
    except Exception as e:
        print_result(f"Get Accessible Events ({user_type})", False, error=str(e))
        return []

def test_discovery_feed(token):
    """Test 4: Get discovery feed"""
    print_section("TEST 4: Discovery Feed")
    
    try:
        response = requests.get(
            f"{API_URL}/secret-events/discovery-feed",
            headers={"Authorization": f"Bearer {token}"}
        )
        success = response.status_code == 200
        data = response.json() if success else None
        error = response.text if not success else None
        print_result("Discovery Feed", success, data, error)
        
        if success and data.get("success"):
            return data["data"]["events"]
        return []
    except Exception as e:
        print_result("Discovery Feed", False, error=str(e))
        return []

def test_request_invite(token, secret_event_id):
    """Test 5: Request invite to secret event"""
    print_section("TEST 5: Request Invite")
    
    try:
        response = requests.post(
            f"{API_URL}/secret-events/request-invite",
            json={
                "secret_event_id": secret_event_id,
                "message": "I would love to attend this exclusive event!"
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        success = response.status_code == 200
        data = response.json() if success else None
        error = response.text if not success else None
        print_result("Request Invite", success, data, error)
        
        if success and data.get("success"):
            return data["data"]
        return None
    except Exception as e:
        print_result("Request Invite", False, error=str(e))
        return None

def test_get_invite_requests(token, secret_event_id):
    """Test 6: Get invite requests (organizer)"""
    print_section("TEST 6: Get Invite Requests")
    
    try:
        response = requests.get(
            f"{API_URL}/secret-events/invite-requests/{secret_event_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        success = response.status_code == 200
        data = response.json() if success else None
        error = response.text if not success else None
        print_result("Get Invite Requests", success, data, error)
        
        if success and data.get("success"):
            return data["data"]["requests"]
        return []
    except Exception as e:
        print_result("Get Invite Requests", False, error=str(e))
        return []

def test_location_hint(token, secret_event_id):
    """Test 7: Get location hint"""
    print_section("TEST 7: Get Location Hint")
    
    try:
        response = requests.get(
            f"{API_URL}/secret-events/location-hint/{secret_event_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        success = response.status_code == 200
        data = response.json() if success else None
        error = response.text if not success else None
        print_result("Get Location Hint", success, data, error)
        
        if success and data.get("success"):
            return data["data"]
        return None
    except Exception as e:
        print_result("Get Location Hint", False, error=str(e))
        return None

def run_all_tests():
    """Run all Phase 1 tests"""
    print("\n" + "🚀"*30)
    print("SECRET EVENTS PHASE 1 - BACKEND TESTING")
    print("🚀"*30)
    
    # Test 1: Health check
    if not test_health_check():
        print("\n❌ Backend is not running. Please start the server first.")
        return
    
    # Login as organizer
    print_section("ORGANIZER LOGIN")
    organizer_token = login(ORGANIZER_EMAIL, ORGANIZER_PASSWORD)
    if not organizer_token:
        print("❌ Organizer login failed. Please update credentials in script.")
        return
    print("✅ Organizer logged in successfully")
    
    # Test 2: Create secret event
    event_data = test_create_secret_event(organizer_token)
    if not event_data:
        print("\n❌ Failed to create secret event. Check if:")
        print("   - User has organizer role")
        print("   - User has premium membership")
        print("   - Database migration was run")
        return
    
    secret_event_id = event_data.get("secret_event_id")
    master_invite_code = event_data.get("master_invite_code")
    
    print(f"\n✅ Secret Event Created!")
    print(f"   Event ID: {secret_event_id}")
    print(f"   Master Invite Code: {master_invite_code}")
    
    # Test 3: Get accessible events (organizer)
    organizer_events = test_get_accessible_events(organizer_token, "Organizer")
    
    # Test 4: Get discovery feed (organizer)
    discovery_events = test_discovery_feed(organizer_token)
    
    # Test 7: Get location hint (organizer)
    location_hint = test_location_hint(organizer_token, secret_event_id)
    
    # Login as attendee (if credentials provided)
    if ATTENDEE_EMAIL and ATTENDEE_PASSWORD:
        print_section("ATTENDEE LOGIN")
        attendee_token = login(ATTENDEE_EMAIL, ATTENDEE_PASSWORD)
        if attendee_token:
            print("✅ Attendee logged in successfully")
            
            # Test 3: Get accessible events (attendee)
            attendee_events = test_get_accessible_events(attendee_token, "Attendee")
            
            # Test 4: Get discovery feed (attendee)
            discovery_events_attendee = test_discovery_feed(attendee_token)
            
            # Test 5: Request invite
            if discovery_events_attendee:
                invite_request = test_request_invite(attendee_token, secret_event_id)
            
            # Test 7: Get location hint (attendee)
            location_hint_attendee = test_location_hint(attendee_token, secret_event_id)
        else:
            print("⚠️  Attendee login failed. Skipping attendee tests.")
    
    # Test 6: Get invite requests (organizer)
    invite_requests = test_get_invite_requests(organizer_token, secret_event_id)
    
    # Summary
    print_section("TEST SUMMARY")
    print("\n✅ Phase 1 Backend Testing Complete!")
    print("\nNext Steps:")
    print("1. Run database migration in Supabase SQL Editor")
    print("2. Verify all tables were created")
    print("3. Test with real user accounts")
    print("4. Proceed to Phase 2: Frontend Implementation")
    print("\nDatabase Migration File: SECRET_EVENTS_MIGRATION.sql")

if __name__ == "__main__":
    print("\n⚠️  IMPORTANT: Update test credentials in this script before running!")
    print("   - ORGANIZER_EMAIL and ORGANIZER_PASSWORD")
    print("   - ATTENDEE_EMAIL and ATTENDEE_PASSWORD (optional)")
    print("\nPress Enter to continue or Ctrl+C to cancel...")
    input()
    
    run_all_tests()
