"""
Check actual users table schema in Supabase
"""
import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv('apps/backend-fastapi/.env')

supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_KEY')
)

print("\n" + "="*60)
print("🔍 CHECKING USERS TABLE SCHEMA")
print("="*60)

# Get a sample user to see the structure
try:
    result = supabase.table('users').select('*').limit(1).execute()
    
    if result.data:
        user = result.data[0]
        print("\n✅ Sample user found. Columns:")
        for key in sorted(user.keys()):
            value = user[key]
            if isinstance(value, str) and len(value) > 50:
                value = value[:50] + "..."
            print(f"   • {key}: {type(value).__name__} = {value}")
    else:
        print("\n⚠️ No users in database")
        print("   Cannot determine schema from data")
        
except Exception as e:
    print(f"\n❌ Error: {e}")

# Check total users
try:
    count_result = supabase.table('users').select('*', count='exact').execute()
    print(f"\n📊 Total users in database: {count_result.count}")
except Exception as e:
    print(f"❌ Error counting users: {e}")
