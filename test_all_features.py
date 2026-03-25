#!/usr/bin/env python3
"""
Comprehensive Test Suite for All 8 Features
Tests all endpoints and functionality
"""

import requests
import json
from datetime import datetime, timedelta

# Configuration
BASE_URL = "http://localhost:8000/api"
TEST_USERS = {
    "admin": {
        "phone_number": "+2349012345678",
        "password": "password123",
        "role": "admin"
    },
    "organizer": {
        "phone_number": "+2349087654321",
        "password": "password123",
        "role": "organizer"
    },
    "attendee": {
        "phone_number": "+2349011111111",
        "password": "password123",
        "role": "attendee"
    }
}

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

def print_test(name):
    print(f"\n{Colors.BLUE}{'='*60}{Colors.END}")
    print(f"{Colors.BLUE}Testing: {name}{Colors.END}")
    print(f"{Colors.BLUE}{'='*60}{Colors.END}")

def print_success(message):
    print(f"{Colors.GREEN}✓ {message}{Colors.END}")

def print_error(message):
    print(f"{Colors.RED}✗ {message}{Colors.END}")

def print_info(message):
    print(f"{Colors.YELLOW}ℹ {message}{Colors.END}")

def login_user(user_type):
    """Login and return access token"""
    user = TEST_USERS[user_type]
    response = requests.post(
        f"{BASE_URL}/auth/login",
        json=user
    )
    if response.status_code == 200:
        data = response.json()
        if data.get("success"):
            token = data["data"]["access_token"]
            print_success(f"Logged in as {user_type}")
            return token
    print_error(f"Failed to login as {user_type}")
    return None

def get_headers(token):
    """Get headers with auth token"""
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

# ============================================================================
# FEATURE 1: WALLET SYSTEM
# ============================================================================

def test_wallet_system():
    print_test("Feature 1: Wallet System")
    
    token = login_user("attendee")
    if not token:
        return False
    
    headers = get_headers(token)
    
    # Test 1: Get wallet balance
    print_info("Test 1.1: Get wallet balance")
    response = requests.get(f"{BASE_URL}/payments/wallet/balance", headers=headers)
    if response.status_code == 200:
        data = response.json()
        if data.get("success"):
            balance = data["data"]["balance"]
            print_success(f"Wallet balance: ₦{balance:,.2f}")
        else:
            print_error("Failed to get wallet balance")
            return False
    else:
        print_error(f"API error: {response.status_code}")
        return False
    
    # Test 2: Top up wallet
    print_info("Test 1.2: Top up wallet")
    response = requests.post(
        f"{BASE_URL}/payments/wallet/topup",
        headers=headers,
        json={"amount": 10000, "payment_method": "card"}
    )
    if response.status_code == 200:
        data = response.json()
        if data.get("success"):
            new_balance = data["data"]["new_balance"]
            print_success(f"Topped up ₦10,000. New balance: ₦{new_balance:,.2f}")
        else:
            print_error("Failed to top up wallet")
            return False
    else:
        print_error(f"API error: {response.status_code}")
        return False
    
    # Test 3: Get transaction history
    print_info("Test 1.3: Get transaction history")
    response = requests.get(f"{BASE_URL}/payments/wallet/transactions", headers=headers)
    if response.status_code == 200:
        data = response.json()
        if data.get("success"):
            transactions = data["data"]["transactions"]
            print_success(f"Found {len(transactions)} transactions")
        else:
            print_error("Failed to get transactions")
            return False
    else:
        print_error(f"API error: {response.status_code}")
        return False
    
    print_success("Wallet system tests passed!")
    return True

# ============================================================================
# FEATURE 3: TICKET PURCHASE & DISPLAY
# ============================================================================

def test_ticket_system():
    print_test("Feature 3: Ticket Purchase & Display")
    
    organizer_token = login_user("organizer")
    attendee_token = login_user("attendee")
    
    if not organizer_token or not attendee_token:
        return False
    
    # Test 1: Create an event first
    print_info("Test 3.1: Create test event")
    event_data = {
        "title": "Test Concert for Tickets",
        "description": "Testing ticket purchase",
        "date": (datetime.now() + timedelta(days=30)).isoformat(),
        "time": "19:00",
        "venue": "Test Venue",
        "state": "Lagos",
        "lga": "Ikeja",
        "category": "concert",
        "price": 5000,
        "capacity": 100,
        "status": "published"
    }
    
    response = requests.post(
        f"{BASE_URL}/events",
        headers=get_headers(organizer_token),
        json=event_data
    )
    
    if response.status_code != 200:
        print_error("Failed to create test event")
        return False
    
    event_id = response.json()["data"]["event"]["id"]
    print_success(f"Created event: {event_id}")
    
    # Test 2: Purchase ticket
    print_info("Test 3.2: Purchase ticket")
    purchase_data = {
        "event_id": event_id,
        "quantity": 2,
        "payment_method": "wallet"
    }
    
    response = requests.post(
        f"{BASE_URL}/tickets/purchase",
        headers=get_headers(attendee_token),
        json=purchase_data
    )
    
    if response.status_code == 200:
        data = response.json()
        if data.get("success"):
            tickets = data["data"]["tickets"]
            print_success(f"Purchased {len(tickets)} tickets")
        else:
            print_error("Failed to purchase tickets")
            return False
    else:
        print_error(f"API error: {response.status_code}")
        return False
    
    # Test 3: Get my tickets
    print_info("Test 3.3: Get my tickets")
    response = requests.get(
        f"{BASE_URL}/tickets/my-tickets",
        headers=get_headers(attendee_token)
    )
    
    if response.status_code == 200:
        data = response.json()
        if data.get("success"):
            my_tickets = data["data"]["tickets"]
            print_success(f"Found {len(my_tickets)} tickets in My Tickets")
        else:
            print_error("Failed to get my tickets")
            return False
    else:
        print_error(f"API error: {response.status_code}")
        return False
    
    print_success("Ticket system tests passed!")
    return True

# ============================================================================
# FEATURE 4: SECRET INVITES
# ============================================================================

def test_secret_invites():
    print_test("Feature 4: Secret Invites")
    
    organizer_token = login_user("organizer")
    attendee_token = login_user("attendee")
    
    if not organizer_token or not attendee_token:
        return False
    
    # Test 1: Create event with access code
    print_info("Test 4.1: Create event with access code")
    event_data = {
        "title": "Secret VIP Party",
        "description": "Exclusive event with access code",
        "date": (datetime.now() + timedelta(days=15)).isoformat(),
        "time": "21:00",
        "venue": "Secret Location",
        "state": "Lagos",
        "lga": "Victoria Island",
        "category": "party",
        "price": 15000,
        "capacity": 50,
        "status": "published",
        "access_code": "1234"
    }
    
    response = requests.post(
        f"{BASE_URL}/events",
        headers=get_headers(organizer_token),
        json=event_data
    )
    
    if response.status_code != 200:
        print_error("Failed to create secret event")
        return False
    
    event_id = response.json()["data"]["event"]["id"]
    print_success(f"Created secret event: {event_id}")
    
    # Test 2: Validate correct access code
    print_info("Test 4.2: Validate correct access code")
    response = requests.post(
        f"{BASE_URL}/events/validate-access-code",
        headers=get_headers(attendee_token),
        json={"access_code": "1234"}
    )
    
    if response.status_code == 200:
        data = response.json()
        if data.get("success"):
            unlocked_event = data["data"]["event"]
            print_success(f"Unlocked event: {unlocked_event['title']}")
        else:
            print_error("Failed to validate access code")
            return False
    else:
        print_error(f"API error: {response.status_code}")
        return False
    
    # Test 3: Validate incorrect access code
    print_info("Test 4.3: Validate incorrect access code")
    response = requests.post(
        f"{BASE_URL}/events/validate-access-code",
        headers=get_headers(attendee_token),
        json={"access_code": "9999"}
    )
    
    if response.status_code == 404:
        print_success("Correctly rejected invalid access code")
    else:
        print_error("Should have rejected invalid code")
        return False
    
    print_success("Secret invites tests passed!")
    return True

# ============================================================================
# FEATURE 5: EVENT UPDATES
# ============================================================================

def test_event_updates():
    print_test("Feature 5: Event Updates (Edit/Delete)")
    
    organizer_token = login_user("organizer")
    
    if not organizer_token:
        return False
    
    headers = get_headers(organizer_token)
    
    # Test 1: Create event
    print_info("Test 5.1: Create event to edit")
    event_data = {
        "title": "Original Event Title",
        "description": "Original description",
        "date": (datetime.now() + timedelta(days=20)).isoformat(),
        "time": "18:00",
        "venue": "Original Venue",
        "state": "Lagos",
        "lga": "Lekki",
        "category": "conference",
        "price": 8000,
        "capacity": 200,
        "status": "published"
    }
    
    response = requests.post(f"{BASE_URL}/events", headers=headers, json=event_data)
    if response.status_code != 200:
        print_error("Failed to create event")
        return False
    
    event_id = response.json()["data"]["event"]["id"]
    print_success(f"Created event: {event_id}")
    
    # Test 2: Edit event
    print_info("Test 5.2: Edit event")
    update_data = {
        "title": "Updated Event Title",
        "description": "Updated description",
        "venue": "New Venue Location",
        "price": 10000
    }
    
    response = requests.put(
        f"{BASE_URL}/events/{event_id}",
        headers=headers,
        json=update_data
    )
    
    if response.status_code == 200:
        data = response.json()
        if data.get("success"):
            updated_event = data["data"]["event"]
            print_success(f"Updated event: {updated_event['title']}")
        else:
            print_error("Failed to update event")
            return False
    else:
        print_error(f"API error: {response.status_code}")
        return False
    
    # Test 3: Delete event
    print_info("Test 5.3: Delete event")
    response = requests.delete(f"{BASE_URL}/events/{event_id}", headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        if data.get("success"):
            print_success("Deleted event successfully")
        else:
            print_error("Failed to delete event")
            return False
    else:
        print_error(f"API error: {response.status_code}")
        return False
    
    print_success("Event updates tests passed!")
    return True

# ============================================================================
# FEATURE 6: SPRAY MONEY
# ============================================================================

def test_spray_money():
    print_test("Feature 6: Spray Money (Livestream Tipping)")
    
    organizer_token = login_user("organizer")
    attendee_token = login_user("attendee")
    
    if not organizer_token or not attendee_token:
        return False
    
    # Test 1: Create wedding event
    print_info("Test 6.1: Create wedding event")
    event_data = {
        "title": "Beautiful Wedding Ceremony",
        "description": "Join us in celebrating love",
        "date": (datetime.now() + timedelta(days=10)).isoformat(),
        "time": "14:00",
        "venue": "Grand Ballroom",
        "state": "Lagos",
        "lga": "Ikeja",
        "category": "wedding",
        "price": 0,
        "capacity": 500,
        "status": "published"
    }
    
    response = requests.post(
        f"{BASE_URL}/events",
        headers=get_headers(organizer_token),
        json=event_data
    )
    
    if response.status_code != 200:
        print_error("Failed to create wedding event")
        return False
    
    event_id = response.json()["data"]["event"]["id"]
    print_success(f"Created wedding event: {event_id}")
    
    # Test 2: Spray money
    print_info("Test 6.2: Spray money")
    spray_data = {
        "amount": 5000,
        "message": "Congratulations! Wishing you both happiness!",
        "is_anonymous": False
    }
    
    response = requests.post(
        f"{BASE_URL}/events/{event_id}/spray-money",
        headers=get_headers(attendee_token),
        json=spray_data
    )
    
    if response.status_code == 200:
        data = response.json()
        if data.get("success"):
            new_balance = data["data"]["new_balance"]
            print_success(f"Sprayed ₦5,000. New balance: ₦{new_balance:,.2f}")
        else:
            print_error("Failed to spray money")
            return False
    else:
        print_error(f"API error: {response.status_code}")
        return False
    
    # Test 3: Get leaderboard
    print_info("Test 6.3: Get spray money leaderboard")
    response = requests.get(
        f"{BASE_URL}/events/{event_id}/spray-money-leaderboard",
        headers=get_headers(attendee_token)
    )
    
    if response.status_code == 200:
        data = response.json()
        if data.get("success"):
            leaderboard = data["data"]["leaderboard"]
            total_sprayed = data["data"]["total_sprayed"]
            print_success(f"Leaderboard has {len(leaderboard)} entries. Total: ₦{total_sprayed:,.2f}")
        else:
            print_error("Failed to get leaderboard")
            return False
    else:
        print_error(f"API error: {response.status_code}")
        return False
    
    # Test 4: Get spray feed
    print_info("Test 6.4: Get spray money feed")
    response = requests.get(
        f"{BASE_URL}/events/{event_id}/spray-money-feed",
        headers=get_headers(attendee_token)
    )
    
    if response.status_code == 200:
        data = response.json()
        if data.get("success"):
            sprays = data["data"]["sprays"]
            print_success(f"Feed has {len(sprays)} spray transactions")
        else:
            print_error("Failed to get spray feed")
            return False
    else:
        print_error(f"API error: {response.status_code}")
        return False
    
    print_success("Spray money tests passed!")
    return True

# ============================================================================
# FEATURE 7: GROUP BUY
# ============================================================================

def test_group_buy():
    print_test("Feature 7: Group Buy (Bulk Purchase)")
    
    organizer_token = login_user("organizer")
    attendee_token = login_user("attendee")
    
    if not organizer_token or not attendee_token:
        return False
    
    # Test 1: Create event
    print_info("Test 7.1: Create event for group buy")
    event_data = {
        "title": "Tech Conference 2024",
        "description": "Annual tech conference",
        "date": (datetime.now() + timedelta(days=45)).isoformat(),
        "time": "09:00",
        "venue": "Convention Center",
        "state": "Lagos",
        "lga": "Victoria Island",
        "category": "conference",
        "price": 20000,
        "capacity": 1000,
        "status": "published"
    }
    
    response = requests.post(
        f"{BASE_URL}/events",
        headers=get_headers(organizer_token),
        json=event_data
    )
    
    if response.status_code != 200:
        print_error("Failed to create event")
        return False
    
    event_id = response.json()["data"]["event"]["id"]
    print_success(f"Created event: {event_id}")
    
    # Test 2: Create bulk purchase
    print_info("Test 7.2: Create bulk purchase (15 tickets)")
    bulk_data = {
        "event_id": event_id,
        "quantity": 15,
        "buyer_type": "organization",
        "buyer_name": "Tech Hub Lagos",
        "split_payment": True,
        "payment_method": "wallet"
    }
    
    response = requests.post(
        f"{BASE_URL}/tickets/bulk-purchase",
        headers=get_headers(attendee_token),
        json=bulk_data
    )
    
    if response.status_code == 200:
        data = response.json()
        if data.get("success"):
            purchase = data["data"]["purchase"]
            discount = data["data"]["discount_percentage"]
            print_success(f"Created bulk purchase with {discount}% discount")
            purchase_id = purchase["id"]
        else:
            print_error("Failed to create bulk purchase")
            return False
    else:
        print_error(f"API error: {response.status_code}")
        return False
    
    # Test 3: Get purchase status
    print_info("Test 7.3: Get bulk purchase status")
    response = requests.get(
        f"{BASE_URL}/tickets/bulk-purchase/{purchase_id}/status",
        headers=get_headers(attendee_token)
    )
    
    if response.status_code == 200:
        data = response.json()
        if data.get("success"):
            status = data["data"]
            print_success(f"Purchase status: {status['paid_shares']}/{status['total_shares']} paid")
        else:
            print_error("Failed to get purchase status")
            return False
    else:
        print_error(f"API error: {response.status_code}")
        return False
    
    print_success("Group buy tests passed!")
    return True

# ============================================================================
# FEATURE 8: ONBOARDING PREFERENCES
# ============================================================================

def test_onboarding_preferences():
    print_test("Feature 8: Onboarding Preferences")
    
    attendee_token = login_user("attendee")
    
    if not attendee_token:
        return False
    
    headers = get_headers(attendee_token)
    
    # Test 1: Save preferences
    print_info("Test 8.1: Save event preferences")
    preferences_data = {
        "preferences": ["concerts", "festivals", "parties", "sports"]
    }
    
    response = requests.post(
        f"{BASE_URL}/users/preferences",
        headers=headers,
        json=preferences_data
    )
    
    if response.status_code == 200:
        data = response.json()
        if data.get("success"):
            saved_prefs = data["data"]["preferences"]
            print_success(f"Saved {len(saved_prefs)} preferences")
        else:
            print_error("Failed to save preferences")
            return False
    else:
        print_error(f"API error: {response.status_code}")
        return False
    
    # Test 2: Get preferences
    print_info("Test 8.2: Get saved preferences")
    response = requests.get(f"{BASE_URL}/users/preferences", headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        if data.get("success"):
            prefs = data["data"]["preferences"]
            print_success(f"Retrieved {len(prefs)} preferences")
        else:
            print_error("Failed to get preferences")
            return False
    else:
        print_error(f"API error: {response.status_code}")
        return False
    
    # Test 3: Get recommended events
    print_info("Test 8.3: Get recommended events")
    response = requests.get(f"{BASE_URL}/events/recommended", headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        if data.get("success"):
            events = data["data"]["events"]
            print_success(f"Found {len(events)} recommended events")
        else:
            print_error("Failed to get recommended events")
            return False
    else:
        print_error(f"API error: {response.status_code}")
        return False
    
    print_success("Onboarding preferences tests passed!")
    return True

# ============================================================================
# MAIN TEST RUNNER
# ============================================================================

def main():
    print(f"\n{Colors.BLUE}{'='*60}{Colors.END}")
    print(f"{Colors.BLUE}TIKIT - COMPREHENSIVE FEATURE TEST SUITE{Colors.END}")
    print(f"{Colors.BLUE}{'='*60}{Colors.END}")
    print(f"{Colors.YELLOW}Testing all 8 features...{Colors.END}\n")
    
    results = {}
    
    # Run all tests
    results["Feature 1: Wallet System"] = test_wallet_system()
    results["Feature 3: Ticket Purchase"] = test_ticket_system()
    results["Feature 4: Secret Invites"] = test_secret_invites()
    results["Feature 5: Event Updates"] = test_event_updates()
    results["Feature 6: Spray Money"] = test_spray_money()
    results["Feature 7: Group Buy"] = test_group_buy()
    results["Feature 8: Onboarding Preferences"] = test_onboarding_preferences()
    
    # Print summary
    print(f"\n{Colors.BLUE}{'='*60}{Colors.END}")
    print(f"{Colors.BLUE}TEST SUMMARY{Colors.END}")
    print(f"{Colors.BLUE}{'='*60}{Colors.END}\n")
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for feature, result in results.items():
        status = f"{Colors.GREEN}✓ PASSED{Colors.END}" if result else f"{Colors.RED}✗ FAILED{Colors.END}"
        print(f"{feature}: {status}")
    
    print(f"\n{Colors.BLUE}{'='*60}{Colors.END}")
    print(f"{Colors.YELLOW}Total: {passed}/{total} features passed{Colors.END}")
    
    if passed == total:
        print(f"{Colors.GREEN}🎉 ALL TESTS PASSED! 🎉{Colors.END}")
    else:
        print(f"{Colors.RED}⚠️  SOME TESTS FAILED{Colors.END}")
    
    print(f"{Colors.BLUE}{'='*60}{Colors.END}\n")
    
    return passed == total

if __name__ == "__main__":
    try:
        success = main()
        exit(0 if success else 1)
    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}Tests interrupted by user{Colors.END}")
        exit(1)
    except Exception as e:
        print(f"\n{Colors.RED}Test suite error: {e}{Colors.END}")
        import traceback
        traceback.print_exc()
        exit(1)
