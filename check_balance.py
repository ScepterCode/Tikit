from supabase import create_client
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('apps/backend-fastapi/.env')

url = os.getenv('SUPABASE_URL')
key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

supabase = create_client(url, key)

# Get sc@gmail.com user
result = supabase.table('users').select('id, email, wallet_balance').eq('email', 'sc@gmail.com').execute()

if result.data:
    user = result.data[0]
    print(f'User: {user["email"]}')
    print(f'Balance: ₦{user["wallet_balance"]:,.2f}')
    print(f'User ID: {user["id"]}')
else:
    print('User not found')
