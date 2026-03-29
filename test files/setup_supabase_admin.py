#!/usr/bin/env python3
"""
Setup Supabase test users using Admin API
This script creates test users directly in Supabase Auth
"""

from config import config
import requests
import json

# Supabase credentials
SUPABASE_URL = config.SUPABASE_URL
SUPABASE_ANON_KEY = config.SUPABASE_ANON_KEY

# Test users to create
TEST_USERS = [
    {
        "email": "admin@grooovy.netlify.app",
        "password": "password123",
        "phone": "+2349012345678",
        "user_metadata": {
            "first_name": "Admin",
            "last_name": "User",
            "role": "admin",
            "state": "Lagos"
        }
    },
    {
        "email": "organizer@grooovy.netlify.app",
        "password": "password123",
        "phone": "+2349087654321",
        "user_metadata": {
            "first_name": "Organizer",
            "last_name": "User",
            "role": "organizer",
            "state": "Lagos",
            "organization_name": "Test Events Co",
            "organization_type": "Event Management"
        }
    },
    {
        "email": "attendee@grooovy.netlify.app",
        "password": "password123",
        "phone": "+2349011111111",
        "user_metadata": {
            "first_name": "Attendee",
            "last_name": "User",
            "role": "attendee",
            "state": "Lagos"
        }
    }
]

def create_user_via_api(user_data):
    """Create user via Supabase REST API"""
    try:
        # Sign up endpoint
        url = f"{SUPABASE_URL}/auth/v1/signup"
        
        payload = {
            "email": user_data["email"],
            "password": user_data["password"],
            "data": user_data["user_metadata"]
        }
        
        headers = {
            "apikey": SUPABASE_ANON_KEY,
            "Content-Type": "application/json"
        }
        
        print(f"Creating user: {user_data['email']}")
        response = requests.post(url, json=payload, headers=headers)
        
        if response.status_code in [200, 201]:
            user = response.json()
            print(f"✅ User created: {user_data['email']}")
            print(f"   User ID: {user.get('id')}")
            print(f"   Role: {user_data['user_metadata'].get('role')}\n")
            return True
        else:
            print(f"❌ Failed to create user: {user_data['email']}")
            print(f"   Status: {response.status_code}")
            print(f"   Response: {response.text}\n")
            return False
            
    except Exception as e:
        print(f"❌ Error creating user {user_data['email']}: {str(e)}\n")
        return False

def setup_users():
    """Create all test users"""
    print("=" * 60)
    print("SUPABASE USER SETUP")
    print("=" * 60 + "\n")
    
    success_count = 0
    for user in TEST_USERS:
        if create_user_via_api(user):
            success_count += 1
    
    print("=" * 60)
    print(f"SETUP COMPLETE: {success_count}/{len(TEST_USERS)} users created")
    print("=" * 60)
    print("\nTest credentials:")
    for user in TEST_USERS:
        print(f"  Email: {user['email']}")
        print(f"  Password: {user['password']}")
        print(f"  Role: {user['user_metadata'].get('role')}\n")

if __name__ == "__main__":
    setup_users()
