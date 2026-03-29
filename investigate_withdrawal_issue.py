"""
Deep Investigation: Why did the withdrawal fail but balance was deducted?
"""
import os
import requests
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables
load_dotenv('apps/backend-fastapi/.env')

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY')
FLUTTERWAVE_SECRET_KEY = (
    os.getenv('FLUTTERWAVE_LIVE_SECRET_KEY') or
    os.getenv('FLUTTERWAVE_SECRET_KEY') or 
    os.getenv('FLUTTERWAVE_CLIENT_SECRET_KEY')
)

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

print("=" * 80)
print("DEEP INVESTIGATION: WITHDRAWAL FAILURE")
print("=" * 80)

# User ID for sc@gmail.com
user_id = 'b9d3197e-2db2-4c8c-a943-5c9685c6d8df'
user_email = 'sc@gmail.com'

print(f"\n1. CHECKING USER ACCOUNT")
print("-" * 80)
user_result = supabase.table('users').select('*').eq('id', user_id).execute()
if user_result.data:
    user = user_result.data[0]
    print(f"   User: {user['email']}")
    print(f"   Balance: ₦{user['wallet_balance']:,.2f}")
    print(f"   Role: {user['role']}")
else:
    print("   ❌ User not found")

print(f"\n2. CHECKING RECENT PAYMENT TRANSACTIONS")
print("-" * 80)
payments_result = supabase.table('payments').select('*').eq('user_id', user_id).order('created_at', desc=True).limit(10).execute()
if payments_result.data:
    print(f"   Found {len(payments_result.data)} recent transactions:")
    for payment in payments_result.data:
        amount = payment.get('amount', 0)
        status = payment.get('status', 'unknown')
        payment_type = payment.get('payment_type', 'unknown')
        ref = payment.get('transaction_reference', 'N/A')
        created = payment.get('created_at', 0)
        print(f"   - ₦{amount:,.2f} | {payment_type} | {status} | {ref}")
else:
    print("   No transactions found")

print(f"\n3. CHECKING FLUTTERWAVE API KEY")
print("-" * 80)
if FLUTTERWAVE_SECRET_KEY:
    print(f"   Key found: {FLUTTERWAVE_SECRET_KEY[:15]}...{FLUTTERWAVE_SECRET_KEY[-4:]}")
    print(f"   Key length: {len(FLUTTERWAVE_SECRET_KEY)} characters")
    
    # Check if it's a valid v3 key format
    if FLUTTERWAVE_SECRET_KEY.startswith('FLWSECK-'):
        print(f"   ✅ Valid v3 secret key format")
    else:
        print(f"   ⚠️  Key doesn't start with 'FLWSECK-' (might be invalid)")
else:
    print("   ❌ No Flutterwave key found")

print(f"\n4. TESTING FLUTTERWAVE API CONNECTION")
print("-" * 80)
try:
    headers = {
        'Authorization': f'Bearer {FLUTTERWAVE_SECRET_KEY}',
        'Content-Type': 'application/json'
    }
    
    # Test 1: Get banks
    print("   Test 1: Fetching Nigerian banks...")
    response = requests.get(
        'https://api.flutterwave.com/v3/banks/NG',
        headers=headers,
        timeout=30
    )
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        if data.get('status') == 'success':
            banks = data.get('data', [])
            print(f"   ✅ Successfully fetched {len(banks)} banks")
        else:
            print(f"   ❌ API returned error: {data}")
    else:
        print(f"   ❌ HTTP Error: {response.text}")
    
    # Test 2: Verify a test account
    print("\n   Test 2: Testing account verification...")
    test_payload = {
        "account_number": "0690000031",  # Flutterwave test account
        "account_bank": "044"  # Access Bank
    }
    response = requests.post(
        'https://api.flutterwave.com/v3/accounts/resolve',
        json=test_payload,
        headers=headers,
        timeout=30
    )
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        if data.get('status') == 'success':
            account_data = data.get('data', {})
            print(f"   ✅ Account verified: {account_data.get('account_name')}")
        else:
            print(f"   ❌ Verification failed: {data}")
    else:
        print(f"   ❌ HTTP Error: {response.text}")
    
    # Test 3: Check transfer fee
    print("\n   Test 3: Checking transfer fee...")
    response = requests.get(
        'https://api.flutterwave.com/v3/transfers/fee?amount=100&currency=NGN',
        headers=headers,
        timeout=30
    )
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        if data.get('status') == 'success':
            fee_data = data.get('data', [])
            if fee_data:
                print(f"   ✅ Transfer fee: ₦{fee_data[0].get('fee', 0)}")
        else:
            print(f"   ❌ Fee check failed: {data}")
    else:
        print(f"   ❌ HTTP Error: {response.text}")
    
    # Test 4: Attempt a test transfer (will fail but shows error)
    print("\n   Test 4: Testing transfer API (will fail - test account)...")
    transfer_payload = {
        "account_bank": "044",
        "account_number": "0690000031",
        "amount": 100,
        "narration": "Test Transfer",
        "currency": "NGN",
        "reference": "TEST_" + str(int(os.urandom(4).hex(), 16)),
        "debit_currency": "NGN"
    }
    response = requests.post(
        'https://api.flutterwave.com/v3/transfers',
        json=transfer_payload,
        headers=headers,
        timeout=30
    )
    print(f"   Status: {response.status_code}")
    data = response.json()
    print(f"   Response: {data}")
    
    if response.status_code == 200:
        if data.get('status') == 'success':
            transfer_info = data.get('data', {})
            print(f"   ✅ Transfer API working!")
            print(f"      Transfer ID: {transfer_info.get('id')}")
            print(f"      Status: {transfer_info.get('status')}")
            print(f"      Message: {transfer_info.get('complete_message', 'N/A')}")
        else:
            print(f"   ⚠️  Transfer failed (expected): {data.get('message')}")
    else:
        print(f"   ❌ HTTP Error: {response.text}")
        
except Exception as e:
    print(f"   ❌ Exception: {e}")
    import traceback
    traceback.print_exc()

print(f"\n5. CHECKING IP WHITELISTING")
print("-" * 80)
try:
    # Get current public IP
    ip_response = requests.get('https://api.ipify.org?format=json', timeout=10)
    current_ip = ip_response.json()['ip']
    print(f"   Current public IP: {current_ip}")
    print(f"   This is the IP that Flutterwave sees")
    print(f"   Make sure this IP is whitelisted on Flutterwave dashboard")
except Exception as e:
    print(f"   ❌ Could not get IP: {e}")

print(f"\n6. DIAGNOSIS")
print("-" * 80)
print("""
Based on the investigation above, the issue could be:

1. IP NOT WHITELISTED:
   - Even if you whitelisted an IP, it might be the wrong one
   - Your IP might have changed
   - Check the IP shown above matches what's whitelisted

2. INSUFFICIENT FLUTTERWAVE BALANCE:
   - Check your Flutterwave dashboard
   - Do you have enough balance to process withdrawals?
   - Transfers require funds in your Flutterwave account

3. ACCOUNT VERIFICATION ISSUES:
   - The bank account might not exist
   - Account number might be wrong
   - Bank code might be incorrect

4. API KEY ISSUES:
   - Using test key instead of live key
   - Key doesn't have transfer permissions
   - Key is expired or revoked

5. TRANSFER STATUS CONFUSION:
   - Flutterwave returns 'success' even when transfer is queued
   - Status 'NEW' means queued, not processed
   - Status 'PENDING' means processing
   - Status 'SUCCESSFUL' means completed

NEXT STEPS:
1. Check Flutterwave dashboard for any failed transfers
2. Verify the IP shown above is whitelisted
3. Check Flutterwave account balance
4. Review transfer permissions on API key
""")

print("\n" + "=" * 80)
