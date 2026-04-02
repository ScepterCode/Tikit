"""
Test the wallet balance endpoint
"""
import requests
import os
from dotenv import load_dotenv

load_dotenv('apps/backend-fastapi/.env')

print("=" * 80)
print("TESTING WALLET BALANCE ENDPOINT")
print("=" * 80)

# First, login to get JWT token
print("\n1. Logging in as sc@gmail.com...")

login_url = "http://localhost:8000/api/auth/login"
login_data = {
    "email": "sc@gmail.com",
    "password": "password123"
}

try:
    login_response = requests.post(login_url, json=login_data, timeout=10)
    
    if login_response.status_code == 200:
        login_result = login_response.json()
        token = login_result.get('access_token')
        print(f"✅ Login successful")
        print(f"   Token: {token[:50]}...")
        
        # Now test wallet balance endpoint
        print(f"\n2. Fetching wallet balance...")
        
        balance_url = "http://localhost:8000/api/wallet/balance"
        headers = {
            "Authorization": f"Bearer {token}"
        }
        
        balance_response = requests.get(balance_url, headers=headers, timeout=10)
        
        print(f"   Status Code: {balance_response.status_code}")
        print(f"   Response: {balance_response.json()}")
        
        if balance_response.status_code == 200:
            balance_data = balance_response.json()
            if balance_data.get('success'):
                print(f"\n✅ Balance endpoint working!")
                print(f"   Balance: {balance_data.get('formatted', 'N/A')}")
            else:
                print(f"\n❌ Balance endpoint returned error")
        else:
            print(f"\n❌ Balance endpoint failed")
            
    else:
        print(f"❌ Login failed: {login_response.status_code}")
        print(f"   Response: {login_response.text}")
        
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 80)
