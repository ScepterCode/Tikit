"""
Check wallet balance and transactions for sc@gmail.com
"""
import os
import sys
from dotenv import load_dotenv

sys.path.insert(0, 'apps/backend-fastapi')
load_dotenv('apps/backend-fastapi/.env')

from database import supabase_client

print("=" * 80)
print("CHECKING WALLET & TRANSACTIONS")
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
print(f"   ID: {user_id}")
print(f"   Balance: ₦{float(user['wallet_balance']):,.2f}")

# Get transactions
print(f"\n2. TRANSACTIONS")
tx_result = supabase.table('payments').select('*').eq('user_id', user_id).order('created_at', desc=True).execute()

if tx_result.data:
    print(f"   Found {len(tx_result.data)} transactions:")
    for i, tx in enumerate(tx_result.data, 1):
        amount = float(tx['amount'])
        status = tx['status']
        tx_type = tx.get('payment_type', 'unknown')
        method = tx.get('payment_method', 'unknown')
        ref = tx.get('transaction_reference', 'N/A')
        created = tx.get('created_at', 'N/A')
        
        print(f"\n   Transaction {i}:")
        print(f"      Type: {tx_type}")
        print(f"      Amount: ₦{amount:,.2f}")
        print(f"      Status: {status}")
        print(f"      Method: {method}")
        print(f"      Reference: {ref}")
        print(f"      Created: {created}")
else:
    print(f"   ⚠️  No transactions found")

# Check if user_id column is TEXT or UUID
print(f"\n3. CHECKING DATA TYPES")
print(f"   User ID type: {type(user_id).__name__}")
print(f"   User ID value: {user_id}")

# Try querying with both formats
print(f"\n4. TESTING QUERY FORMATS")

# As UUID
tx_uuid = supabase.table('payments').select('id').eq('user_id', user_id).execute()
print(f"   Query as UUID: {len(tx_uuid.data) if tx_uuid.data else 0} results")

# As string
tx_str = supabase.table('payments').select('id').eq('user_id', str(user_id)).execute()
print(f"   Query as string: {len(tx_str.data) if tx_str.data else 0} results")

print("\n" + "=" * 80)
