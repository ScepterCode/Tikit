#!/usr/bin/env python3
"""
Create test data for the Grooovy API
"""
import requests
import json
import time

BASE_URL = "http://localhost:8000"

def create_event(title, description, venue, start_date, organizer_id):
    """Create a test event"""
    response = requests.post(
        f"{BASE_URL}/api/test/create-event",
        json={
            "title": title,
            "description": description,
            "venue": venue,
            "start_date": start_date,
            "organizer_id": organizer_id
        }
    )
    return response.json()

def create_ticket(event_id, user_id, quantity, amount):
    """Create a test ticket"""
    response = requests.post(
        f"{BASE_URL}/api/test/create-ticket",
        json={
            "event_id": event_id,
            "user_id": user_id,
            "quantity": quantity,
            "amount": amount
        }
    )
    return response.json()

def send_notification(user_id, notification_type, title, message, data=None):
    """Send a test notification"""
    response = requests.post(
        f"{BASE_URL}/api/test/send-notification",
        json={
            "user_id": user_id,
            "type": notification_type,
            "title": title,
            "message": message,
            "data": data or {}
        }
    )
    return response.json()

def main():
    print("🚀 Creating test data for Grooovy API...\n")
    
    # Create test events
    print("📝 Creating test events...")
    event1 = create_event(
        title="Tech Conference 2024",
        description="Annual tech conference with industry leaders",
        venue="Lagos Convention Center",
        start_date="2024-03-15T09:00:00Z",
        organizer_id="test-org-1"
    )
    print(f"✅ Event 1 created: {event1['data']['id']}")
    event1_id = event1['data']['id']
    
    event2 = create_event(
        title="Music Festival 2024",
        description="Annual music festival featuring top artists",
        venue="Lekki Coliseum",
        start_date="2024-04-20T18:00:00Z",
        organizer_id="test-org-2"
    )
    print(f"✅ Event 2 created: {event2['data']['id']}")
    event2_id = event2['data']['id']
    
    event3 = create_event(
        title="Wedding Expo 2024",
        description="Wedding planning and vendor showcase",
        venue="Ikeja Hotel",
        start_date="2024-05-10T10:00:00Z",
        organizer_id="test-org-3"
    )
    print(f"✅ Event 3 created: {event3['data']['id']}")
    event3_id = event3['data']['id']
    
    # Create test tickets
    print("\n🎫 Creating test tickets...")
    ticket1 = create_ticket(event1_id, "user-1", 2, 10000.0)
    print(f"✅ Ticket 1 created: {ticket1['data']['id']}")
    
    ticket2 = create_ticket(event1_id, "user-2", 1, 5000.0)
    print(f"✅ Ticket 2 created: {ticket2['data']['id']}")
    
    ticket3 = create_ticket(event2_id, "user-3", 3, 15000.0)
    print(f"✅ Ticket 3 created: {ticket3['data']['id']}")
    
    ticket4 = create_ticket(event3_id, "user-1", 1, 8000.0)
    print(f"✅ Ticket 4 created: {ticket4['data']['id']}")
    
    # Send test notifications
    print("\n📢 Sending test notifications...")
    notif1 = send_notification(
        "user-1",
        "broadcast",
        "Welcome to Grooovy!",
        "Welcome to our event platform. Discover amazing events near you.",
        {"event_count": 3}
    )
    print(f"✅ Notification 1 sent to user-1")
    
    notif2 = send_notification(
        "test-org-1",
        "ticket_sale",
        "Ticket Sale - Tech Conference 2024",
        "2 tickets sold for ₦10,000.00",
        {"event_id": event1_id, "ticket_count": 2, "amount": 10000}
    )
    print(f"✅ Notification 2 sent to organizer")
    
    # Get dashboard stats
    print("\n📊 Fetching dashboard stats...")
    stats_response = requests.get(f"{BASE_URL}/api/admin/dashboard/stats")
    stats = stats_response.json()
    print(f"✅ Dashboard stats:")
    print(f"   - Total Users: {stats['data']['total_users']}")
    print(f"   - Active Events: {stats['data']['active_events']}")
    print(f"   - Tickets Sold: {stats['data']['tickets_sold']}")
    print(f"   - Platform Revenue: ₦{stats['data']['platform_revenue']:,.2f}")
    
    # Get recent activity
    print("\n📈 Fetching recent activity...")
    activity_response = requests.get(f"{BASE_URL}/api/admin/dashboard/activity?limit=10")
    activity = activity_response.json()
    print(f"✅ Recent activity ({activity['count']} items):")
    for item in activity['data'][:3]:
        print(f"   - {item['icon']} {item['title']}: {item['description']}")
    
    print("\n✨ Test data creation complete!")

if __name__ == "__main__":
    main()
