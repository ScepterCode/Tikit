#!/usr/bin/env python3
"""
Debug JWT authentication issue
Test the JWT validation with a real Supabase token
"""

from config import config
import requests
import json
from supabase import create_client, Client

# Supabase configuration
SUPABASE_URL = config.SUPABASE_URL
SUPABASE_ANON_KEY = config.SUPABASE_ANON_KEY

def test_supabase_login():
    """Test Supabase login and get JWT token"""
    print("🔐 Testing Supabase login...")
    
    # Create Supabase client
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    
    # Test login with organizer account
    try:
        response = supabase.auth.sign_in_with_password({
            "email": "organizer@grooovy.netlify.app",
            "password": "password123"
        })
        
        if response.session:
            print("✅ Login successful!")
            print(f"   User ID: {response.user.id}")
            print(f"   Email: {response.user.email}")
            print(f"   Token: {response.session.access_token[:50]}...")
            
            return response.session.access_token
        else:
            print("❌ Login failed - no session")
            return None
            
    except Exception as e:
        print(f"❌ Login error: {e}")
        return None

def test_jwt_validation(token):
    """Test JWT validation with backend"""
    print("\n🔍 Testing JWT validation with backend...")
    
    if not token:
        print("❌ No token to test")
        return
    
    # Test create event endpoint
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    event_data = {
        "title": "Test Event",
        "description": "A test event",
        "venue": "Test Venue",
        "date": "2024-02-01",
        "time": "18:00",
        "category": "conference",
        "ticketTiers": [
            {
                "name": "General Admission",
                "price": 5000,
                "quantity": 100
            }
        ]
    }
    
    try:
        response = requests.post(
            "http://localhost:8000/api/events",
            headers=headers,
            json=event_data,
            timeout=10
        )
        
        print(f"   Status Code: {response.status_code}")
        print(f"   Response: {response.text[:200]}...")
        
        if response.status_code == 200:
            print("✅ JWT validation successful!")
        else:
            print("❌ JWT validation failed")
            
    except Exception as e:
        print(f"❌ Request error: {e}")

def test_jwt_decode(token):
    """Test JWT decoding directly"""
    print("\n🔍 Testing JWT decoding...")
    
    if not token:
        print("❌ No token to decode")
        return
    
    try:
        import jwt
        
        # Decode without verification (for debugging)
        claims = jwt.decode(token, options={"verify_signature": False})
        
        print("✅ JWT decoded successfully!")
        print(f"   Subject: {claims.get('sub')}")
        print(f"   Email: {claims.get('email')}")
        print(f"   Role: {claims.get('user_metadata', {}).get('role')}")
        print(f"   Issuer: {claims.get('iss')}")
        print(f"   Expires: {claims.get('exp')}")
        
        # Check if token is expired
        import time
        if claims.get('exp') and time.time() > claims.get('exp'):
            print("⚠️  Token is expired!")
        else:
            print("✅ Token is valid (not expired)")
            
    except Exception as e:
        print(f"❌ JWT decode error: {e}")

if __name__ == "__main__":
    print("🚀 Starting JWT debug test...\n")
    
    # Step 1: Login and get token
    token = test_supabase_login()
    
    # Step 2: Decode token
    test_jwt_decode(token)
    
    # Step 3: Test with backend
    test_jwt_validation(token)
    
    print("\n✅ Debug test complete!")