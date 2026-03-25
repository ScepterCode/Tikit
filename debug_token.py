#!/usr/bin/env python3
"""
Debug Supabase JWT token to see its structure
"""

from config import config
import requests
import jwt
import json

SUPABASE_URL = config.SUPABASE_URL
SUPABASE_ANON_KEY = config.SUPABASE_ANON_KEY

def get_token():
    """Get JWT token from Supabase"""
    url = f"{SUPABASE_URL}/auth/v1/token?grant_type=password"
    
    payload = {
        "email": "admin@grooovy.netlify.app",
        "password": "password123"
    }
    
    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Content-Type": "application/json"
    }
    
    response = requests.post(url, json=payload, headers=headers)
    return response.json().get('access_token')

def main():
    print("=" * 70)
    print("SUPABASE JWT TOKEN DEBUG")
    print("=" * 70)
    
    token = get_token()
    print(f"\n✅ Got token: {token[:50]}...\n")
    
    # Decode without verification
    claims = jwt.decode(token, options={"verify_signature": False})
    
    print("Token Claims:")
    print(json.dumps(claims, indent=2))
    
    print("\n" + "=" * 70)
    print("Key fields:")
    print(f"  iss (issuer): {claims.get('iss')}")
    print(f"  sub (user ID): {claims.get('sub')}")
    print(f"  email: {claims.get('email')}")
    print(f"  role: {claims.get('role')}")
    print(f"  user_metadata: {claims.get('user_metadata')}")
    print("=" * 70)

if __name__ == "__main__":
    main()
