"""Check the actual schema of the payments table"""
import sys
sys.path.insert(0, 'apps/backend-fastapi')

from database import supabase_client

supabase = supabase_client.get_service_client()

# Try to get one payment record to see the schema
result = supabase.table('payments').select('*').limit(1).execute()

print("Payments table schema:")
print("=" * 60)
if result.data:
    print("Columns found:")
    for key in result.data[0].keys():
        print(f"  - {key}")
else:
    print("No records found in payments table")
    print("\nLet's check if there are any records at all...")
    count_result = supabase.table('payments').select('*', count='exact').execute()
    print(f"Total records: {count_result.count}")
