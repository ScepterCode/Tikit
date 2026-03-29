#!/usr/bin/env python3
"""
Test script to verify role-based routing fix
"""
import requests
import json
import time

API_URL = "http://localhost:8000/api"

def test_registration_and_login():
    """Test registration and login with different roles"""
    
    print("\n" + "="*70)
    print("  TESTING ROLE-BASED ROUTING FIX")
    print("="*70 + "\n")
    
    # Test 1: Register as Admin
    print("TEST 1: Register as Admin")
    print("-" * 70)
    
    admin_data = {
        "phone_number": "+2349012345678",
        "password": "admin123",
        "first_name": "Admin",
        "last_name": "User",
        "email": "admin@tikit.com",
        "state": "Lagos",
        "role": "admin"
    }
    
    try:
        response = requests.post(
            f"{API_URL}/auth/register",
            json=admin_data,
            timeout=5
        )
        
        if response.status_code == 200:
            result = response.json()
            if result.get("success"):
                user = result.get("data", {}).get("user", {})
                print(f"✅ Admin registered successfully")
                print(f"   Phone: {user.get('phone_number')}")
                print(f"   Role: {user.get('role')}")
                print(f"   Expected: admin")
                print(f"   Match: {'✅ YES' if user.get('role') == 'admin' else '❌ NO'}")
            else:
                print(f"❌ Registration failed: {result.get('error', {}).get('message')}")
        else:
            print(f"❌ HTTP Error {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    
    print()
    
    # Test 2: Register as Organizer
    print("TEST 2: Register as Organizer")
    print("-" * 70)
    
    organizer_data = {
        "phone_number": "+2347012345678",
        "password": "organizer123",
        "first_name": "John",
        "last_name": "Organizer",
        "email": "organizer@test.com",
        "state": "Lagos",
        "role": "organizer",
        "organization_name": "Test Events Ltd"
    }
    
    try:
        response = requests.post(
            f"{API_URL}/auth/register",
            json=organizer_data,
            timeout=5
        )
        
        if response.status_code == 200:
            result = response.json()
            if result.get("success"):
                user = result.get("data", {}).get("user", {})
                print(f"✅ Organizer registered successfully")
                print(f"   Phone: {user.get('phone_number')}")
                print(f"   Role: {user.get('role')}")
                print(f"   Expected: organizer")
                print(f"   Match: {'✅ YES' if user.get('role') == 'organizer' else '❌ NO'}")
            else:
                print(f"❌ Registration failed: {result.get('error', {}).get('message')}")
        else:
            print(f"❌ HTTP Error {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    
    print()
    
    # Test 3: Register as Attendee
    print("TEST 3: Register as Attendee")
    print("-" * 70)
    
    attendee_data = {
        "phone_number": "+2348012345678",
        "password": "attendee123",
        "first_name": "Jane",
        "last_name": "Attendee",
        "email": "attendee@test.com",
        "state": "Lagos",
        "role": "attendee"
    }
    
    try:
        response = requests.post(
            f"{API_URL}/auth/register",
            json=attendee_data,
            timeout=5
        )
        
        if response.status_code == 200:
            result = response.json()
            if result.get("success"):
                user = result.get("data", {}).get("user", {})
                print(f"✅ Attendee registered successfully")
                print(f"   Phone: {user.get('phone_number')}")
                print(f"   Role: {user.get('role')}")
                print(f"   Expected: attendee")
                print(f"   Match: {'✅ YES' if user.get('role') == 'attendee' else '❌ NO'}")
            else:
                print(f"❌ Registration failed: {result.get('error', {}).get('message')}")
        else:
            print(f"❌ HTTP Error {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    
    print()
    
    # Test 4: Login as Organizer and verify role
    print("TEST 4: Login as Organizer and Verify Role")
    print("-" * 70)
    
    login_data = {
        "phone_number": "+2347012345678",
        "password": "organizer123"
    }
    
    try:
        response = requests.post(
            f"{API_URL}/auth/login",
            json=login_data,
            timeout=5
        )
        
        if response.status_code == 200:
            result = response.json()
            if result.get("success"):
                user = result.get("data", {}).get("user", {})
                access_token = result.get("data", {}).get("access_token", "")
                
                print(f"✅ Login successful")
                print(f"   Phone: {user.get('phone_number')}")
                print(f"   Role: {user.get('role')}")
                print(f"   Expected: organizer")
                print(f"   Match: {'✅ YES' if user.get('role') == 'organizer' else '❌ NO'}")
                
                # Test 5: Fetch current user with token
                print()
                print("TEST 5: Fetch Current User (Simulating Page Refresh)")
                print("-" * 70)
                
                headers = {
                    "Authorization": f"Bearer {access_token}"
                }
                
                response = requests.get(
                    f"{API_URL}/auth/me",
                    headers=headers,
                    timeout=5
                )
                
                if response.status_code == 200:
                    result = response.json()
                    if result.get("success"):
                        user = result.get("data", {})
                        print(f"✅ Current user fetched successfully")
                        print(f"   Phone: {user.get('phone_number')}")
                        print(f"   Role: {user.get('role')}")
                        print(f"   Expected: organizer")
                        print(f"   Match: {'✅ YES' if user.get('role') == 'organizer' else '❌ NO'}")
                        
                        if user.get('role') == 'organizer':
                            print()
                            print("🎉 ROLE PERSISTENCE TEST PASSED!")
                            print("   User role is correctly preserved after re-login")
                        else:
                            print()
                            print("❌ ROLE PERSISTENCE TEST FAILED!")
                            print("   User role was not preserved")
                    else:
                        print(f"❌ Failed to fetch user: {result.get('error', {}).get('message')}")
                else:
                    print(f"❌ HTTP Error {response.status_code}")
                    
            else:
                print(f"❌ Login failed: {result.get('error', {}).get('message')}")
        else:
            print(f"❌ HTTP Error {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    
    print()
    print("="*70)
    print("  TEST COMPLETE")
    print("="*70 + "\n")

if __name__ == "__main__":
    test_registration_and_login()
