"""
Test events API endpoint
"""
import requests

API_URL = "http://localhost:8000"

def test_events():
    """Test events endpoint"""
    print("\n🎉 Testing Events API")
    print("=" * 60)
    
    # Test without auth (should still work for public events)
    print("\n1️⃣ Testing GET /api/events/")
    response = requests.get(f"{API_URL}/api/events/")
    
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    
    data = response.json()
    if data.get('success'):
        events = data.get('data', {}).get('events', [])
        print(f"\n✅ Found {len(events)} events")
        if events:
            print(f"\nFirst event:")
            print(f"  - ID: {events[0].get('id')}")
            print(f"  - Title: {events[0].get('title')}")
            print(f"  - Date: {events[0].get('event_date')}")
            print(f"  - Price: {events[0].get('ticket_price')}")
    else:
        print(f"\n❌ API returned success=False")

if __name__ == "__main__":
    test_events()
