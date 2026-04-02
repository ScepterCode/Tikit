"""
Restore user balance after accidental withdrawal deduction
"""
import sys
sys.path.insert(0, '.')

from database import supabase_client

# Get Supabase service client
supabase = supabase_client.get_service_client()

if not supabase:
    print("❌ Supabase not configured")
    sys.exit(1)

# Get user by email
user_email = 'sc@gmail.com'
result = supabase.table('users').select('id, wallet_balance, email').eq('email', user_email).execute()

if result.data:
    user = result.data[0]
    current_balance = user['wallet_balance']
    print(f'Current balance for {user["email"]}: ₦{current_balance}')
    
    # Restore balance to 200 (original amount before withdrawal)
    new_balance = 200.0
    update_result = supabase.table('users').update({
        'wallet_balance': new_balance
    }).eq('id', user['id']).execute()
    
    print(f'✅ Balance restored from ₦{current_balance} to ₦{new_balance}')
    print(f'   Amount refunded: ₦{new_balance - current_balance}')
else:
    print('❌ User not found')
