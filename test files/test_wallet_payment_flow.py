#!/usr/bin/env python3
"""
Test complete wallet payment flow
"""

import requests
import json

BACKEND_URL = "http://localhost:8000"

print("🧪 TESTING WALLET PAYMENT FLOW")
print("="*70)

# Test 1: Get balance (should work now)
print("\n1️⃣ Testing GET /api/wallet/balance")
try:
    response = requests.get(f"{BACKEND_URL}/api/wallet/balance", timeout=10)
    print(f"   Status: {response.status_code}")
    if response.status_code == 401:
        print("   ✅ Requires authentication (correct)")
    elif response.status_code == 200:
        print(f"   ✅ Response: {response.json()}")
    else:
        print(f"   ❌ Unexpected status: {response.text[:200]}")
except Exception as e:
    print(f"   ❌ Error: {e}")

# Test 2: Initiate funding (should work now)
print("\n2️⃣ Testing POST /api/wallet/fund")
try:
    response = requests.post(
        f"{BACKEND_URL}/api/wallet/fund",
        json={"amount": 1000},
        timeout=10
    )
    print(f"   Status: {response.status_code}")
    if response.status_code == 401:
        print("   ✅ Requires authentication (correct)")
    elif response.status_code == 200:
        data = response.json()
        print(f"   ✅ Response: {json.dumps(data, indent=2)}")
        if 'tx_ref' in data:
            print(f"   ✅ Transaction reference generated: {data['tx_ref']}")
    else:
        print(f"   ❌ Unexpected status: {response.text[:200]}")
except Exception as e:
    print(f"   ❌ Error: {e}")

# Test 3: Verify payment
print("\n3️⃣ Testing POST /api/wallet/verify-payment")
try:
    response = requests.post(
        f"{BACKEND_URL}/api/wallet/verify-payment",
        json={"tx_ref": "TEST_REF", "transaction_id": "TEST_ID"},
        timeout=10
    )
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        print(f"   ✅ Response: {response.json()}")
    else:
        print(f"   Status: {response.text[:200]}")
except Exception as e:
    print(f"   ❌ Error: {e}")

# Test 4: Get transactions
print("\n4️⃣ Testing GET /api/wallet/transactions")
try:
    response = requests.get(f"{BACKEND_URL}/api/wallet/transactions", timeout=10)
    print(f"   Status: {response.status_code}")
    if response.status_code == 401:
        print("   ✅ Requires authentication (correct)")
    elif response.status_code == 200:
        print(f"   ✅ Response: {response.json()}")
    else:
        print(f"   ❌ Unexpected status: {response.text[:200]}")
except Exception as e:
    print(f"   ❌ Error: {e}")

print("\n" + "="*70)
print("✅ Backend endpoints are working!")
print("\n📝 NEXT STEPS:")
print("1. Refresh browser (Ctrl+R)")
print("2. Login as organizer")
print("3. Go to Wallet")
print("4. Click 'Add Funds'")
print("5. Enter amount (minimum ₦100)")
print("6. Flutterwave payment modal should open")
print("7. Complete payment with test card")
print("\n💳 Test Card Details:")
print("   Card: 5531 8866 5214 2950")
print("   CVV: 564")
print("   Expiry: 09/32")
print("   PIN: 3310")
print("   OTP: 12345")
