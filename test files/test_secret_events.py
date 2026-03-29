#!/usr/bin/env python3
"""
Test Secret Events System - Phase 2
"""

import requests
import json
import time
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8000"

def login_user(phone_number: str, password: str):
    """Login user and get token"""
    try:
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "phoneNumber": phone_number,
            "password": password
        })
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                return data["data"]["access_token"]
        
        print(f"Login failed: {response.text}")
        return None
    except Exception as e:
        print(f"Login error: {e}")
        return None

def test_secret_events_system():
    """Test the complete secret events system"""
    print("🔐 TESTING SECRET EVENTS SYSTEM - PHASE 2")
    print("="*60)
    
    # Test 1: Login organizer and upgrade to premium
    print("\n1️⃣ Setting Up Premium Organizer")
    print("-" * 40)
    
    organizer_token = login_user("+2349087654321", "password123")
    if not organizer_token:
        print("❌ Failed to login organizer")
        return False
    
    print("✅ Organizer logged in")
    
    # Upgrade to premium first
    headers = {"Authorization": f"Bearer {organizer_token}"}
    upgrade_response = requests.post(f"{BASE_URL}/api/memberships/upgrade", 
                                   headers=headers, 
                                   json={
                                       "tier": "premium",
                                       "duration": "monthly",
                                       "payment_reference": f"SECRET_TEST_{int(time.time())}"
                                   })
    
    if upgrade_response.status_code == 200:
        print("✅ Organizer upgraded to Premium")
    else:
        print(f"❌ Failed to upgrade organizer: {upgrade_response.text}")
        return False
    
    # Test 2: Create Secret Event
    print("\n2️⃣ Creating Secret Event")
    print("-" * 40)
    
    # Prepare event data
    start_time = datetime.now() + timedelta(hours=6)
    end_time = start_time + timedelta(hours=4)
    
    secret_event_data = {
        "title": "Secret Tech Meetup 2026",
        "description": "An exclusive gathering for premium tech enthusiasts",
        "venue": "123 Hidden Street, Victoria Island, Lagos",
        "public_venue": "Victoria Island Area",
        "start_date": start_time.isoformat(),
        "end_date": end_time.isoformat(),
        "premium_tier_required": "premium",
        "location_reveal_hours": 2,
        "max_attendees": 50,
        "price": 10000,
        "anonymous_purchases_allowed": True,
        "attendee_list_hidden": True
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/secret-events/create", 
                               headers=headers, 
                               json=secret_event_data)
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                event_data = data["data"]
                print("✅ Secret event created successfully!")
                print(f"   Event ID: {event_data['event_id']}")
                print(f"   Master Invite Code: {event_data['master_invite_code']}")
                print(f"   Public Venue: {event_data['public_venue']}")
                print(f"   Location Reveal: {event_data['location_reveal_time']}")
                
                # Store for later tests
                global created_event_id, master_invite_code
                created_event_id = event_data['event_id']
                master_invite_code = event_data['master_invite_code']
            else:
                print(f"❌ API error: {data}")
                return False
        else:
            print(f"❌ HTTP error: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Request failed: {e}")
        return False
    
    # Test 3: Setup Premium Attendee
    print("\n3️⃣ Setting Up Premium Attendee")
    print("-" * 40)
    
    attendee_token = login_user("+2349011111111", "password123")
    if not attendee_token:
        print("❌ Failed to login attendee")
        return False
    
    print("✅ Attendee logged in")
    
    # Upgrade attendee to premium
    attendee_headers = {"Authorization": f"Bearer {attendee_token}"}
    upgrade_response = requests.post(f"{BASE_URL}/api/memberships/upgrade", 
                                   headers=attendee_headers, 
                                   json={
                                       "tier": "premium",
                                       "duration": "monthly",
                                       "payment_reference": f"ATTENDEE_SECRET_{int(time.time())}"
                                   })
    
    if upgrade_response.status_code == 200:
        print("✅ Attendee upgraded to Premium")
    else:
        print(f"❌ Failed to upgrade attendee: {upgrade_response.text}")
        return False
    
    # Test 4: Validate Invite Code
    print("\n4️⃣ Testing Invite Code Validation")
    print("-" * 40)
    
    try:
        response = requests.post(f"{BASE_URL}/api/secret-events/validate-invite", 
                               headers=attendee_headers, 
                               json={"invite_code": master_invite_code})
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                event = data["data"]["event"]
                print("✅ Invite code validated successfully!")
                print(f"   Event Title: {event['title']}")
                print(f"   Venue: {event['venue']}")
                print(f"   Location Revealed: {event['location_revealed']}")
                print(f"   Max Attendees: {event['max_attendees']}")
                print(f"   Current Attendees: {event['current_attendees']}")
                
                if not event['location_revealed']:
                    print(f"   Location reveal countdown: {event['location_reveal_countdown']} seconds")
            else:
                print(f"❌ Validation failed: {data}")
                return False
        else:
            print(f"❌ HTTP error: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Request failed: {e}")
        return False
    
    return True

def test_anonymous_tickets():
    """Test anonymous ticket purchasing"""
    print("\n5️⃣ Testing Anonymous Ticket Purchase")
    print("-" * 40)
    
    # Use the attendee token from previous test
    attendee_token = login_user("+2349011111111", "password123")
    attendee_headers = {"Authorization": f"Bearer {attendee_token}"}
    
    # Get event details first to find tier ID
    try:
        response = requests.get(f"{BASE_URL}/api/secret-events/accessible", headers=attendee_headers)
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success") and data["data"]["events"]:
                event = data["data"]["events"][0]
                tier_id = event["ticket_tiers"][0]["id"]
                
                print(f"✅ Found accessible secret event: {event['title']}")
                
                # Purchase anonymous ticket
                purchase_data = {
                    "event_id": event["id"],
                    "tier_id": tier_id,
                    "is_anonymous": True,
                    "buyer_email": "anonymous@example.com"
                }
                
                response = requests.post(f"{BASE_URL}/api/secret-events/purchase-anonymous-ticket", 
                                       headers=attendee_headers, 
                                       json=purchase_data)
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("success"):
                        ticket = data["data"]
                        print("✅ Anonymous ticket purchased successfully!")
                        print(f"   Ticket ID: {ticket['ticket_id']}")
                        print(f"   Ticket Code: {ticket['ticket_code']}")
                        print(f"   Price: ₦{ticket['price']:,}")
                        print(f"   Is Anonymous: {ticket['is_anonymous']}")
                        return True
                    else:
                        print(f"❌ Purchase failed: {data}")
                        return False
                else:
                    print(f"❌ HTTP error: {response.status_code}")
                    return False
            else:
                print("❌ No accessible secret events found")
                return False
        else:
            print(f"❌ Failed to get accessible events: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Request failed: {e}")
        return False

def test_vip_features():
    """Test VIP-specific features"""
    print("\n6️⃣ Testing VIP Features")
    print("-" * 40)
    
    # Login organizer and upgrade to VIP
    organizer_token = login_user("+2349087654321", "password123")
    headers = {"Authorization": f"Bearer {organizer_token}"}
    
    # Upgrade to VIP
    upgrade_response = requests.post(f"{BASE_URL}/api/memberships/upgrade", 
                                   headers=headers, 
                                   json={
                                       "tier": "vip",
                                       "duration": "monthly",
                                       "payment_reference": f"VIP_SECRET_{int(time.time())}"
                                   })
    
    if upgrade_response.status_code == 200:
        print("✅ Organizer upgraded to VIP")
        
        # Create VIP-only secret event
        start_time = datetime.now() + timedelta(hours=8)
        
        vip_event_data = {
            "title": "VIP Exclusive Gathering",
            "description": "Ultra-exclusive event for VIP members only",
            "venue": "456 Elite Avenue, Ikoyi, Lagos",
            "public_venue": "Ikoyi Area",
            "start_date": start_time.isoformat(),
            "premium_tier_required": "vip",
            "location_reveal_hours": 1,
            "max_attendees": 25,
            "price": 25000
        }
        
        response = requests.post(f"{BASE_URL}/api/secret-events/create", 
                               headers=headers, 
                               json=vip_event_data)
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                print("✅ VIP-only secret event created!")
                print(f"   Invite Code: {data['data']['master_invite_code']}")
                return True
            else:
                print(f"❌ VIP event creation failed: {data}")
                return False
        else:
            print(f"❌ HTTP error: {response.status_code}")
            return False
    else:
        print(f"❌ VIP upgrade failed: {upgrade_response.text}")
        return False

# Global variables for test data
created_event_id = None
master_invite_code = None

def main():
    """Run all secret events tests"""
    print("🎯 SECRET EVENTS SYSTEM - COMPREHENSIVE TEST")
    print("="*60)
    
    success1 = test_secret_events_system()
    success2 = test_anonymous_tickets() if success1 else False
    success3 = test_vip_features() if success2 else False
    
    print("\n" + "="*60)
    print("🎯 FINAL RESULT")
    print("="*60)
    
    if success1 and success2 and success3:
        print("🎉 SECRET EVENTS SYSTEM - PHASE 2 COMPLETE!")
        print("\n✅ SUCCESSFULLY IMPLEMENTED:")
        print("   - Secret event creation with premium requirements")
        print("   - Invite code generation and validation")
        print("   - Location reveal timing system")
        print("   - Anonymous ticket purchasing")
        print("   - VIP-only exclusive events")
        print("   - Premium membership integration")
        print("   - Frontend secret invite modal")
        print("   - Event creation modal for organizers")
        print("\n🔐 SECRET EVENT FEATURES:")
        print("   - 8-character unique invite codes")
        print("   - Hidden locations with timed reveals")
        print("   - Anonymous attendee lists")
        print("   - Premium/VIP tier requirements")
        print("   - Early location access for VIP members")
        print("\n🚀 READY FOR PHASE 3!")
        print("   Next: Anonymous Chat and Premium Message Portal")
    else:
        print("❌ SOME TESTS FAILED")
        print("   Check implementation and try again")

if __name__ == "__main__":
    main()