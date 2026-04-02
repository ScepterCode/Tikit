"""
Test Supabase database connection
"""
import os
import sys
from dotenv import load_dotenv

sys.path.insert(0, 'apps/backend-fastapi')
load_dotenv('apps/backend-fastapi/.env')

print("=" * 80)
print("TESTING DATABASE CONNECTION")
print("=" * 80)

# Check environment variables
print("\n1. Checking environment variables...")
supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if supabase_url:
    print(f"✅ SUPABASE_URL: {supabase_url[:30]}...")
else:
    print(f"❌ SUPABASE_URL not found")

if supabase_key:
    print(f"✅ SUPABASE_SERVICE_ROLE_KEY: {supabase_key[:30]}...")
else:
    print(f"❌ SUPABASE_SERVICE_ROLE_KEY not found")

# Try to import database module
print("\n2. Testing database module...")
try:
    from database import supabase_client
    print("✅ Database module imported successfully")
    
    supabase = supabase_client.get_service_client()
    
    if supabase:
        print("✅ Supabase client created successfully")
        
        # Test query
        print("\n3. Testing database query...")
        result = supabase.table('users').select('id, email, wallet_balance').limit(3).execute()
        
        if result.data:
            print(f"✅ Query successful! Found {len(result.data)} users:")
            for user in result.data:
                print(f"   - {user['email']}: ₦{float(user['wallet_balance']):,.2f}")
        else:
            print("⚠️  Query returned no data")
    else:
        print("❌ Supabase client is None")
        
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 80)
