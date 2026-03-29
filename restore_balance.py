"""
Restore user balance after accidental withdrawal deduction
"""
from supabase import create_client

# Get Supabase credentials
url = 'https://hwwzbsppzwcyvambeade.supabase.co'
# Using service role key to bypass RLS
service_key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3d3pic3BwendjeXZhbWJlYWRlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTM3NTU0NywiZXhwIjoyMDUwOTUxNTQ3fQ.gCEv3dGVOM_3d_zYkjy-TYVwLEi-Aq-6LlLPKrBvGhI'

supabase = create_client(url, service_key)

# Get user by email
user_email = 'sc@gmail.com'
result = supabase.table('users').select('id, wallet_balance, email').eq('email', user_email).execute()

if result.data:
    user = result.data[0]
    print(f'Current balance for {user["email"]}: ₦{user["wallet_balance"]}')
    
    # Restore balance to 200 (original amount before withdrawal)
    new_balance = 200.0
    update_result = supabase.table('users').update({
        'wallet_balance': new_balance
    }).eq('id', user['id']).execute()
    
    print(f'✅ Balance restored to: ₦{new_balance}')
else:
    print('User not found')
