#!/usr/bin/env python3
"""
Test Supabase authentication
"""

from config import config
import requests
import json

SUPABASE_URL = config.SUPABASE_URL
SUPABASE_ANON_KEY = config.SUPABASE_ANON_KEY

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

def test_login(email, password):
    """Test login with Supabase"""
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
        
        print(f"\n🔐 Testing login for: {email}")
        response = requests.post(url, json=payload, headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Login successful")
            print(f"   Access Token: {data.get('access_token', 'N/A')[:50]}...")
            print(f"   User ID: {data.get('user', {}).get('id')}")
            print(f"   Email: {data.get('user', {}).get('email')}")
            return True
        else:
            print(f"❌ Login failed")
            print(f"   Status: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

def main():
    print("=" * 60)
    print("SUPABASE AUTHENTICATION TEST")
    print("=" * 60)
    
    success_count = 0
    for user in TEST_USERS:
        if test_login(user["email"], user["password"]):
            success_count += 1
    
    print("\n" + "=" * 60)
    print(f"RESULTS: {success_count}/{len(TEST_USERS)} logins successful")
    print("=" * 60)

if __name__ == "__main__":
    main()
