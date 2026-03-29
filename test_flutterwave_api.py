"""
Test Flutterwave API directly to diagnose authentication issue
"""
import os
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv('apps/backend-fastapi/.env')

# Get Flutterwave credentials
secret_key = os.getenv('FLUTTERWAVE_LIVE_SECRET_KEY')
public_key = os.getenv('FLUTTERWAVE_LIVE_PUBLIC_KEY')

print("=" * 80)
print("FLUTTERWAVE API TEST")
print("=" * 80)
print(f"Secret Key: {secret_key[:20]}..." if secret_key else "Secret Key: NOT FOUND")
print(f"Public Key: {public_key[:20]}..." if public_key else "Public Key: NOT FOUND")
print("=" * 80)

if not secret_key:
    print("❌ ERROR: FLUTTERWAVE_LIVE_SECRET_KEY not found in .env file")
    exit(1)

# Test 1: Get Nigerian Banks
print("\n📋 TEST 1: Fetching Nigerian Banks...")
print("-" * 80)

headers = {
    'Authorization': f'Bearer {secret_key}',
    'Content-Type': 'application/json'
}

try:
    response = requests.get(
        'https://api.flutterwave.com/v3/banks/NG',
        headers=headers,
        timeout=30
    )
    
    print(f"Status Code: {response.status_code}")
    print(f"Response Headers: {dict(response.headers)}")
    print(f"\nResponse Body:")
    print(response.text[:500])  # First 500 chars
    
    if response.status_code == 200:
        data = response.json()
        if data.get('status') == 'success':
            banks = data.get('data', [])
            print(f"\n✅ SUCCESS: Retrieved {len(banks)} banks")
            print(f"Sample banks: {[b['name'] for b in banks[:3]]}")
        else:
            print(f"\n❌ API returned non-success status: {data}")
    else:
        print(f"\n❌ FAILED: HTTP {response.status_code}")
        print(f"Error: {response.text}")
        
except Exception as e:
    print(f"\n❌ EXCEPTION: {e}")
    import traceback
    traceback.print_exc()

# Test 2: Verify Account (using a known test account)
print("\n\n🔍 TEST 2: Verifying Bank Account...")
print("-" * 80)

test_account = {
    "account_number": "0690000031",  # Flutterwave test account
    "account_bank": "044"  # Access Bank
}

try:
    response = requests.post(
        'https://api.flutterwave.com/v3/accounts/resolve',
        json=test_account,
        headers=headers,
        timeout=30
    )
    
    print(f"Status Code: {response.status_code}")
    print(f"\nResponse Body:")
    print(response.text[:500])
    
    if response.status_code == 200:
        data = response.json()
        if data.get('status') == 'success':
            account_data = data.get('data', {})
            print(f"\n✅ SUCCESS: Account verified")
            print(f"Account Name: {account_data.get('account_name')}")
            print(f"Account Number: {account_data.get('account_number')}")
        else:
            print(f"\n❌ API returned non-success status: {data}")
    else:
        print(f"\n❌ FAILED: HTTP {response.status_code}")
        print(f"Error: {response.text}")
        
except Exception as e:
    print(f"\n❌ EXCEPTION: {e}")
    import traceback
    traceback.print_exc()

# Test 3: Check if using test vs live keys correctly
print("\n\n🔑 TEST 3: Key Type Analysis...")
print("-" * 80)

if secret_key:
    if secret_key.startswith('FLWSECK_TEST'):
        print("⚠️  You are using a TEST secret key")
        print("   Test keys work with: https://api.flutterwave.com/v3")
        print("   Test keys have limited functionality")
    elif secret_key.startswith('FLWSECK-'):
        print("✅ You are using a LIVE secret key")
        print("   Live keys work with: https://api.flutterwave.com/v3")
        print("   Live keys have full functionality")
    else:
        print(f"⚠️  Unusual key format: {secret_key[:10]}...")
        print("   Expected format: FLWSECK_TEST... or FLWSECK-...")

print("\n" + "=" * 80)
print("TEST COMPLETE")
print("=" * 80)
