#!/usr/bin/env python3
"""
Test JWT validation integration with FastAPI backend
"""

from config import config
import requests
import json

SUPABASE_URL = config.SUPABASE_URL
SUPABASE_ANON_KEY = config.SUPABASE_ANON_KEY

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

def get_supabase_token(email: str, password: str) -> str:
    """Get JWT token from Supabase"""
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
            return response.json().get('access_token')
        else:
            print(f"❌ Failed to get token: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return None

def test_backend_with_jwt(token: str, user_email: str):
    """Test backend /api/auth/me endpoint with JWT token"""
    try:
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        response = requests.get(
            f"{BACKEND_URL}/api/auth/me",
            headers=headers,
            timeout=5
        )
        
        if response.status_code == 200:
            data = response.json()
            user_data = data.get("data", {})
            print(f"✅ Backend validated JWT for: {user_email}")
            print(f"   User ID: {user_data.get('id')}")
            print(f"   Role: {user_data.get('role')}")
            print(f"   Email: {user_data.get('email')}")
            return True
        else:
            print(f"❌ Backend rejected JWT: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

def main():
    print("=" * 70)
    print("JWT VALIDATION INTEGRATION TEST")
    print("=" * 70)
    
    # Check backend
    print("\n📡 Checking backend...")
    try:
        response = requests.get(f"{BACKEND_URL}/health", timeout=5)
        if response.status_code == 200:
            print("✅ Backend is running")
        else:
            print("❌ Backend returned error")
            return
    except:
        print("❌ Backend is not running")
        print("   Start it with: uvicorn simple_main:app --reload")
        return
    
    # Test JWT validation
    print("\n🔐 Testing JWT validation...")
    print("-" * 70)
    
    success_count = 0
    for user in TEST_USERS:
        print(f"\nTesting: {user['email']}")
        
        # Get token from Supabase
        token = get_supabase_token(user['email'], user['password'])
        if not token:
            print(f"  ❌ Failed to get token from Supabase")
            continue
        
        print(f"  ✅ Got JWT token from Supabase")
        print(f"     Token: {token[:50]}...")
        
        # Test backend with JWT
        if test_backend_with_jwt(token, user['email']):
            success_count += 1
    
    print("\n" + "=" * 70)
    print(f"RESULTS: {success_count}/{len(TEST_USERS)} JWT validations successful")
    print("=" * 70)
    
    if success_count == len(TEST_USERS):
        print("\n✅ JWT validation integration complete!")
        print("\nThe backend can now:")
        print("  - Validate Supabase JWT tokens")
        print("  - Extract user information from tokens")
        print("  - Authenticate requests from the frontend")
    else:
        print("\n❌ Some JWT validations failed")
        print("\nTroubleshooting:")
        print("  1. Check that PyJWT is installed: pip install PyJWT")
        print("  2. Check backend logs for errors")
        print("  3. Verify Supabase credentials are correct")

if __name__ == "__main__":
    main()
