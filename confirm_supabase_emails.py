#!/usr/bin/env python3
"""
Confirm Supabase user emails using admin API
This requires the service role key (admin access)
"""

from config import config
import requests
import json

# Supabase credentials
SUPABASE_URL = config.SUPABASE_URL
# Note: You need to get the SERVICE_ROLE_KEY from Supabase dashboard
# For now, we'll try with the anon key and see if we can use the REST API

SUPABASE_ANON_KEY = config.SUPABASE_ANON_KEY

TEST_USERS = [
    {
        "email": "admin@grooovy.netlify.app",
        "password": "password123",
    },
    {
        "email": "organizer@grooovy.netlify.app",
        "password": "password123",
    },
    {
        "email": "attendee@grooovy.netlify.app",
        "password": "password123",
    }
]

def confirm_email_via_signup(email, password):
    """
    Confirm email by signing up with email_confirm_token bypass
    This is a workaround - in production, users would click email confirmation link
    """
    try:
        # Try to sign up again with the same email - this might auto-confirm
        url = f"{SUPABASE_URL}/auth/v1/signup"
        
        payload = {
            "email": email,
            "password": password,
        }
        
        headers = {
            "apikey": SUPABASE_ANON_KEY,
            "Content-Type": "application/json"
        }
        
        print(f"Attempting to confirm: {email}")
        response = requests.post(url, json=payload, headers=headers)
        
        if response.status_code in [200, 201]:
            print(f"✅ User already exists or confirmed")
            return True
        else:
            print(f"Response: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"Error: {str(e)}")
        return False

def main():
    print("=" * 60)
    print("EMAIL CONFIRMATION HELPER")
    print("=" * 60)
    print("\nNote: To fully confirm emails, you need to:")
    print("1. Go to Supabase Dashboard")
    print("2. Navigate to Authentication > Users")
    print("3. For each test user, click the menu and select 'Confirm email'")
    print("\nAlternatively, disable email confirmation in Supabase settings:")
    print("1. Go to Authentication > Providers > Email")
    print("2. Disable 'Confirm email'")
    print("\n" + "=" * 60)
    
    print("\nTest users created:")
    for user in TEST_USERS:
        print(f"  Email: {user['email']}")
        print(f"  Password: {user['password']}\n")

if __name__ == "__main__":
    main()
