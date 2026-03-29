#!/usr/bin/env python3
"""
Test frontend login flow with Supabase
This simulates what the frontend does when a user logs in
"""

from config import config
import requests
import json
import time

SUPABASE_URL = config.SUPABASE_URL
SUPABASE_ANON_KEY = config.SUPABASE_ANON_KEY

FRONTEND_URL = "http://localhost:3000"
BACKEND_URL = "http://localhost:8000"

TEST_USERS = [
    {
        "email": "admin@grooovy.netlify.app",
        "password": "password123",
        "role": "admin"
    },
    {
        "email": "organizer@grooovy.netlify.app",
        "password": "password123",
        "role": "organizer"
    },
    {
        "email": "attendee@grooovy.netlify.app",
        "password": "password123",
        "role": "attendee"
    }
]

def test_supabase_login(email, password):
    """Test Supabase login"""
    try:
        url = f"{SUPABASE_URL}/auth/v1/token?grant_type=password"
        
        payload = {
            "email": email,
            "password": password
        }
        
        headers = {
            "apikey": SUPABASE_ANON_KEY,
            "Content-Type": "application/json"
        }
        
        response = requests.post(url, json=payload, headers=headers, timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            return {
                "success": True,
                "access_token": data.get('access_token'),
                "user_id": data.get('user', {}).get('id'),
                "email": data.get('user', {}).get('email')
            }
        else:
            return {
                "success": False,
                "error": response.text
            }
            
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

def test_backend_health():
    """Test if backend is running"""
    try:
        response = requests.get(f"{BACKEND_URL}/health", timeout=5)
        return response.status_code == 200
    except:
        return False

def test_frontend_health():
    """Test if frontend is running"""
    try:
        response = requests.get(FRONTEND_URL, timeout=5)
        return response.status_code == 200
    except:
        return False

def main():
    print("=" * 70)
    print("FRONTEND LOGIN FLOW TEST")
    print("=" * 70)
    
    # Check servers
    print("\n📡 Checking servers...")
    backend_ok = test_backend_health()
    frontend_ok = test_frontend_health()
    
    print(f"  Backend (http://localhost:8000): {'✅ Running' if backend_ok else '❌ Not running'}")
    print(f"  Frontend (http://localhost:3000): {'✅ Running' if frontend_ok else '❌ Not running'}")
    
    if not frontend_ok:
        print("\n⚠️  Frontend not running. Start it with: npm run dev (in apps/frontend)")
        return
    
    # Test Supabase logins
    print("\n🔐 Testing Supabase authentication...")
    print("-" * 70)
    
    success_count = 0
    for user in TEST_USERS:
        print(f"\nTesting: {user['email']}")
        result = test_supabase_login(user['email'], user['password'])
        
        if result['success']:
            print(f"  ✅ Login successful")
            print(f"  User ID: {result['user_id']}")
            print(f"  Email: {result['email']}")
            print(f"  Token: {result['access_token'][:50]}...")
            success_count += 1
        else:
            print(f"  ❌ Login failed")
            print(f"  Error: {result['error']}")
    
    print("\n" + "=" * 70)
    print(f"RESULTS: {success_count}/{len(TEST_USERS)} logins successful")
    print("=" * 70)
    
    if success_count == len(TEST_USERS):
        print("\n✅ All tests passed!")
        print("\nYou can now test the frontend login:")
        print(f"  1. Go to: {FRONTEND_URL}/auth/login")
        print(f"  2. Enter email: admin@grooovy.netlify.app")
        print(f"  3. Enter password: password123")
        print(f"  4. Click 'Sign In'")
        print(f"\nOther test users:")
        for user in TEST_USERS[1:]:
            print(f"  - {user['email']} / {user['password']}")
    else:
        print("\n❌ Some tests failed. Check the errors above.")

if __name__ == "__main__":
    main()
