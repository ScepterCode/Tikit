#!/usr/bin/env python3
"""
Test the complete frontend authentication flow
"""

from config import config
import requests
import json
from supabase import create_client, Client

# Supabase configuration
SUPABASE_URL = config.SUPABASE_URL
SUPABASE_ANON_KEY = config.SUPABASE_ANON_KEY

def test_complete_flow():
    """Test the complete authentication flow"""
    print("🚀 Testing complete authentication flow...\n")
    
    # Step 1: Login with Supabase
    print("1️⃣ Logging in with Supabase...")
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    
    try:
        response = supabase.auth.sign_in_with_password({
            "email": "organizer@grooovy.netlify.app",
            "password": "password123"
        })
        
        if not response.session:
            print("❌ Login failed")
            return
            
        token = response.session.access_token
        user = response.user
        
        print(f"✅ Login successful!")
        print(f"   User ID: {user.id}")
        print(f"   Email: {user.email}")
        print(f"   Role: {user.user_metadata.get('role', 'N/A')}")
        print(f"   Token: {token[:30]}...")
        
    except Exception as e:
        print(f"❌ Login error: {e}")
        return
    
    # Step 2: Test current user endpoint
    print("\n2️⃣ Testing current user endpoint...")
    try:
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        response = requests.get("http://localhost:8000/api/current-user", headers=headers, timeout=10)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Current user: {data.get('data', {}).get('email', 'N/A')}")
        else:
            print(f"   ❌ Error: {response.text[:100]}...")
            
    except Exception as e:
        print(f"   ❌ Request error: {e}")
    
    # Step 3: Test create event endpoint
    print("\n3️⃣ Testing create event endpoint...")
    try:
        event_data = {
            "title": "Auth Test Event",
            "description": "Testing authentication flow",
            "venue": "Test Venue",
            "date": "2024-02-15",
            "time": "19:00",
            "category": "conference",
            "ticketTiers": [
                {
                    "name": "General Admission",
                    "price": 5000,
                    "quantity": 100
                }
            ]
        }
        
        response = requests.post(
            "http://localhost:8000/api/events",
            headers=headers,
            json=event_data,
            timeout=10
        )
        
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Event created: {data.get('data', {}).get('event_id', 'N/A')}")
        else:
            print(f"   ❌ Error: {response.text[:200]}...")
            
    except Exception as e:
        print(f"   ❌ Request error: {e}")
    
    # Step 4: Test token validation directly
    print("\n4️⃣ Testing JWT validation directly...")
    try:
        import jwt
        
        # Decode token to see claims
        claims = jwt.decode(token, options={"verify_signature": False})
        
        print(f"   ✅ Token decoded successfully")
        print(f"   Subject: {claims.get('sub')}")
        print(f"   Email: {claims.get('email')}")
        print(f"   Role: {claims.get('user_metadata', {}).get('role')}")
        print(f"   Issuer: {claims.get('iss')}")
        
        # Check expiration
        import time
        exp = claims.get('exp')
        if exp:
            remaining = exp - time.time()
            print(f"   Expires in: {remaining/3600:.1f} hours")
        
    except Exception as e:
        print(f"   ❌ JWT decode error: {e}")

if __name__ == "__main__":
    test_complete_flow()
    print("\n✅ Test complete!")