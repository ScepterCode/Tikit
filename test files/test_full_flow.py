#!/usr/bin/env python3
"""
Test the full flow: register users, create events, send notifications
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def register_user(phone, password, first_name, last_name, state, role, organization_name=None):
    """Register a new user"""
    data = {
        "phone_number": phone,
        "password": password,
        "first_name": first_name,
        "last_name": last_name,
        "state": state,
        "role": role
    }
    if organization_name:
        data["organization_name"] = organization_name
    
    response = requests.post(f"{BASE_URL}/api/auth/register", json=data)
    return response.json()

def login_user(phone, password):
    """Login a user"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"phone_number": phone, "password": password}
    )
    return response.json()

def get_current_user(access_token):
    """Get current user"""
    response = requests.get(
        f"{BASE_URL}/api/auth/me",
        headers={"Authorization": f"Bearer {access_token}"}
    )
    return response.json()

def get_notifications(access_token):
    """Get user notifications"""
    response = requests.get(
        f"{BASE_URL}/api/notifications",
        headers={"Authorization": f"Bearer {access_token}"}
    )
    return response.json()

def send_broadcast(access_token, title, message, target_roles=None):
    """Send a broadcast (admin only)"""
    response = requests.post(
        f"{BASE_URL}/api/notifications/broadcast",
        json={
            "title": title,
            "message": message,
            "target_roles": target_roles
        },
        headers={"Authorization": f"Bearer {access_token}"}
    )
    return response.json()

def main():
    print("🚀 Testing full flow...\n")
    
    # Register users
    print("👤 Registering users...")
    
    admin_response = register_user(
        "+2349012345678",
        "admin123",
        "Admin",
        "User",
        "Lagos",
        "admin"
    )
    print(f"✅ Admin registered: {admin_response['data']['user']['phone_number']}")
    admin_token = admin_response['data']['access_token']
    admin_id = admin_response['data']['user']['id']
    
    organizer_response = register_user(
        "+2347012345678",
        "organizer123",
        "John",
        "Organizer",
        "Lagos",
        "organizer",
        "Tech Events Inc"
    )
    print(f"✅ Organizer registered: {organizer_response['data']['user']['phone_number']}")
    organizer_token = organizer_response['data']['access_token']
    organizer_id = organizer_response['data']['user']['id']
    
    attendee_response = register_user(
        "+2348012345678",
        "attendee123",
        "Jane",
        "Attendee",
        "Lagos",
        "attendee"
    )
    print(f"✅ Attendee registered: {attendee_response['data']['user']['phone_number']}")
    attendee_token = attendee_response['data']['access_token']
    attendee_id = attendee_response['data']['user']['id']
    
    # Verify roles
    print("\n🔐 Verifying roles...")
    
    admin_user = get_current_user(admin_token)
    print(f"✅ Admin role: {admin_user['data']['role']}")
    
    organizer_user = get_current_user(organizer_token)
    print(f"✅ Organizer role: {organizer_user['data']['role']}")
    
    attendee_user = get_current_user(attendee_token)
    print(f"✅ Attendee role: {attendee_user['data']['role']}")
    
    # Send broadcast
    print("\n📢 Sending broadcast...")
    broadcast_response = send_broadcast(
        admin_token,
        "Welcome to Grooovy!",
        "Check out our amazing events this month",
        target_roles=["attendee", "organizer"]
    )
    print(f"✅ Broadcast sent: {broadcast_response['message']}")
    
    # Check notifications
    print("\n📬 Checking notifications...")
    
    attendee_notifs = get_notifications(attendee_token)
    print(f"✅ Attendee notifications: {attendee_notifs['count']}")
    if attendee_notifs['data']:
        for notif in attendee_notifs['data'][:2]:
            print(f"   - {notif['title']}: {notif['message']}")
    
    organizer_notifs = get_notifications(organizer_token)
    print(f"✅ Organizer notifications: {organizer_notifs['count']}")
    if organizer_notifs['data']:
        for notif in organizer_notifs['data'][:2]:
            print(f"   - {notif['title']}: {notif['message']}")
    
    # Test logout and login again
    print("\n🔄 Testing logout and login again...")
    
    login_response = login_user("+2347012345678", "organizer123")
    print(f"✅ Organizer logged in again")
    
    organizer_user_after_login = get_current_user(login_response['data']['access_token'])
    print(f"✅ Organizer role after re-login: {organizer_user_after_login['data']['role']}")
    
    if organizer_user_after_login['data']['role'] == 'organizer':
        print("✨ Role persistence verified!")
    else:
        print("❌ Role persistence failed!")
    
    print("\n✨ Full flow test complete!")

if __name__ == "__main__":
    main()
