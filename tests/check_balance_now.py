"""
Check wallet balance for sc@gmail.com
"""
import os
import sys
from dotenv import load_dotenv

sys.path.insert(0, 'apps/backend-fastapi')
load_dotenv('apps/backend-fastapi/.env')

from database import supabase_client

print("=" * 80)
print("CHECKING WALLET BALANCE")
print("=" * 80)

supabase = supabase_client.get_service_client()

if not supabase:
    print("❌ Could not connect to database")
    sys.exit(1)

# Check sc@gmail.com balance
result = supabase.table('users').select('id, email, wallet_balance').eq('email', 'sc@gmail.com').execute()

if result.data:
    user = result.data[0]
    print(f"\n✅ User found: {user['email']}")
    print(f"   User ID: {user['id']}")
    print(f"   Wallet Balance: ₦{float(user['wallet_balance']):,.2f}")
    
    # Check recent transactions
    print(f"\n📊 Recent transactions:")
    tx_result = supabase.table('payments').select('*').eq('user_id', user['id']).order('created_at', desc=True).limit(5).execute()
    
    if tx_result.data:
        for tx in tx_result.data:
            amount = float(tx['amount'])
            status = tx['status']
            tx_type = tx.get('payment_type', 'unknown')
            print(f"   {tx_type}: ₦{amount:,.2f} - {status}")
    else:
        print(f"   No transactions found")
else:
    print(f"\n❌ User not found: sc@gmail.com")

print("\n" + "=" * 80)
