"""
Create missing transaction records for sc@gmail.com
This will add 2 payment records of ₦100 each to match the ₦200 balance
"""
import os
import sys
from dotenv import load_dotenv
import time

sys.path.insert(0, 'apps/backend-fastapi')
load_dotenv('apps/backend-fastapi/.env')

from database import supabase_client

print("=" * 80)
print("CREATING MISSING TRANSACTION RECORDS")
print("=" * 80)

supabase = supabase_client.get_service_client()

if not supabase:
    print("❌ Could not connect to database")
    sys.exit(1)

# Get user
user_result = supabase.table('users').select('id, email, wallet_balance').eq('email', 'sc@gmail.com').execute()

if not user_result.data:
    print("❌ User not found")
    sys.exit(1)

user = user_result.data[0]
user_id = user['id']

print(f"\n1. USER INFO")
print(f"   Email: {user['email']}")
print(f"   Current Balance: ₦{float(user['wallet_balance']):,.2f}")

# Check existing transactions
existing_tx = supabase.table('payments').select('id').eq('user_id', user_id).execute()
print(f"   Existing Transactions: {len(existing_tx.data) if existing_tx.data else 0}")

# Create 2 payment records for ₦100 each
print(f"\n2. CREATING TRANSACTION RECORDS")

current_time = time.time()

import uuid
from datetime import datetime, timedelta

# Create timestamps in ISO format
now = datetime.now()
two_days_ago = (now - timedelta(days=2)).isoformat()
one_day_ago = (now - timedelta(days=1)).isoformat()

transactions = [
    {
        'id': str(uuid.uuid4()),
        'user_id': user_id,
        'amount': 10000,  # Amount in kobo (₦100.00)
        'currency': 'NGN',
        'method': 'wallet',
        'status': 'completed',
        'provider': 'manual',
        'reference': f'FUND_HISTORICAL_1_{int(current_time)}',
        'metadata': '{"type": "wallet_funding", "description": "Historical funding"}',
        'created_at': two_days_ago
    },
    {
        'id': str(uuid.uuid4()),
        'user_id': user_id,
        'amount': 10000,  # Amount in kobo (₦100.00)
        'currency': 'NGN',
        'method': 'wallet',
        'status': 'completed',
        'provider': 'manual',
        'reference': f'FUND_HISTORICAL_2_{int(current_time)}',
        'metadata': '{"type": "wallet_funding", "description": "Historical funding"}',
        'created_at': one_day_ago
    }
]

for i, tx in enumerate(transactions, 1):
    try:
        result = supabase.table('payments').insert(tx).execute()
        if result.data:
            print(f"   ✅ Transaction {i}: ₦{tx['amount']:,.2f} - {tx['transaction_reference']}")
        else:
            print(f"   ❌ Failed to create transaction {i}")
    except Exception as e:
        print(f"   ❌ Error creating transaction {i}: {e}")

# Verify
print(f"\n3. VERIFICATION")
final_tx = supabase.table('payments').select('*').eq('user_id', user_id).order('created_at', desc=True).execute()

if final_tx.data:
    print(f"   ✅ Total transactions now: {len(final_tx.data)}")
    print(f"\n   Recent transactions:")
    for tx in final_tx.data[:5]:
        amount = float(tx['amount'])
        tx_type = tx.get('payment_type', 'unknown')
        status = tx['status']
        print(f"      - {tx_type}: ₦{amount:,.2f} ({status})")
else:
    print(f"   ⚠️  No transactions found")

print("\n" + "=" * 80)
print("DONE! Your transaction history should now show in the wallet.")
print("Refresh your browser to see the changes.")
print("=" * 80)
