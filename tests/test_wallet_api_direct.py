"""
Test wallet API directly with a real JWT token
"""
import requests
import os
from dotenv import load_dotenv

load_dotenv('apps/backend-fastapi/.env')

print("=" * 80)
print("TESTING WALLET API DIRECTLY")
print("=" * 80)

# You need to get your actual JWT token from the browser
# Open DevTools > Application > Local Storage > look for 'supabase.auth.token'
print("\n⚠️  TO TEST THIS:")
print("1. Open your browser")
print("2. Press F12 (DevTools)")
print("3. Go to Application tab")
print("4. Click Local Storage > http://localhost:3000")
print("5. Find 'sb-[project-id]-auth-token'")
print("6. Copy the 'access_token' value")
print("7. Paste it below when prompted")
print()

token = input("Paste your JWT token here: ").strip()

if not token:
    print("❌ No token provided")
    exit(1)

print(f"\n✅ Token received (length: {len(token)})")

# Test the API
print(f"\n1. Testing /api/wallet/balance endpoint...")

headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

try:
    response = requests.get("http://localhost:8000/api/wallet/balance", headers=headers, timeout=10)
    
    print(f"   Status Code: {response.status_code}")
    print(f"   Response: {response.text}")
    
    if response.status_code == 200:
        data = response.json()
        if data.get('success'):
            print(f"\n✅ API WORKING!")
            print(f"   Balance: {data.get('formatted', 'N/A')}")
        else:
            print(f"\n❌ API returned error")
    else:
        print(f"\n❌ API failed with status {response.status_code}")
        
except Exception as e:
    print(f"\n❌ Error: {e}")

print("\n" + "=" * 80)
