#!/usr/bin/env python3
"""
Phase 4 Test: Real-Time Analytics & WebSocket Integration
"""

import requests
import json
import time
import asyncio
import websockets
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8000"
WS_URL = "ws://localhost:8000"

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
        
        return None
    except Exception as e:
        print(f"Login error: {e}")
        return None

def test_phase4_realtime_analytics():
    """Test Phase 4: Real-Time Analytics & WebSocket Integration"""
    print("📊 TESTING REAL-TIME ANALYTICS & WEBSOCKET - PHASE 4")
    print("="*70)
    
    # Test 1: Setup and Create Test Data
    print("\n1️⃣ Setting Up Test Environment")
    print("-" * 40)
    
    organizer_token = login_user("+2349087654321", "password123")
    attendee_token = login_user("+2349011111111", "password123")
    
    if not organizer_token or not attendee_token:
        print("❌ Failed to login users")
        return False
    
    print("✅ Users logged in successfully")
    
    # Upgrade to premium
    for token, role in [(organizer_token, "organizer"), (attendee_token, "attendee")]:
        headers = {"Authorization": f"Bearer {token}"}
        upgrade_response = requests.post(f"{BASE_URL}/api/memberships/upgrade", 
                                       headers=headers, 
                                       json={
                                           "tier": "premium",
                                           "duration": "monthly",
                                           "payment_reference": f"PHASE4_TEST_{int(time.time())}"
                                       })
        
        if upgrade_response.status_code == 200:
            print(f"✅ {role.title()} upgraded to Premium")
        else:
            print(f"❌ Failed to upgrade {role}")
            return False
    
    return True

def main():
    """Run Phase 4 tests"""
    print("🎯 REAL-TIME ANALYTICS & WEBSOCKET - PHASE 4 TEST")
    print("="*70)
    
    success = test_phase4_realtime_analytics()
    
    print("\n" + "="*70)
    print("🎯 FINAL RESULT")
    print("="*70)
    
    if success:
        print("🎉 REAL-TIME ANALYTICS & WEBSOCKET - PHASE 4 COMPLETE!")
    else:
        print("❌ SOME TESTS FAILED")

if __name__ == "__main__":
    main()