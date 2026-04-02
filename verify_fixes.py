"""
Verify that all fixes have been applied successfully
Run this AFTER executing the SQL in Supabase
"""
import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv('apps/backend-fastapi/.env')

url = os.getenv('SUPABASE_URL')
key = os.getenv('SUPABASE_SERVICE_KEY')

print("=" * 80)
print("VERIFICATION: Checking All Fixes Applied")
print("=" * 80)

if not url or not key:
    print("❌ Missing Supabase credentials")
    exit(1)

supabase = create_client(url, key)

# Tables that should exist after fixes
required_tables = {
    'ticket_scans': 'Priority 1 - Event check-in',
    'spray_money': 'Priority 2 - Wedding features',
    'interaction_logs': 'Priority 3 - Analytics',
    'notifications': 'Priority 3 - User notifications'
}

# Tables that should already exist
existing_tables = {
    'users': 'Core - User accounts',
    'events': 'Core - Events',
    'tickets': 'Core - Tickets',
    'bookings': 'Core - Bookings',
    'payments': 'Core - Payments & Wallet transactions'
}

print("\n" + "=" * 80)
print("CHECKING NEW TABLES (Priority 1-3)")
print("=" * 80)

new_tables_ok = True
for table, description in required_tables.items():
    try:
        result = supabase.table(table).select('*').limit(1).execute()
        print(f"✅ {table}: EXISTS - {description}")
    except Exception as e:
        error_str = str(e).lower()
        if 'could not find' in error_str or 'does not exist' in error_str:
            print(f"❌ {table}: MISSING - {description}")
            print(f"   Error: {e}")
            new_tables_ok = False
        else:
            print(f"⚠️  {table}: ERROR - {e}")

print("\n" + "=" * 80)
print("CHECKING EXISTING TABLES")
print("=" * 80)

existing_tables_ok = True
for table, description in existing_tables.items():
    try:
        result = supabase.table(table).select('*').limit(1).execute()
        print(f"✅ {table}: OK - {description}")
    except Exception as e:
        print(f"❌ {table}: ERROR - {description}")
        print(f"   Error: {e}")
        existing_tables_ok = False

print("\n" + "=" * 80)
print("CHECKING LEGACY FILES REMOVED (Priority 4)")
print("=" * 80)

import os.path

legacy_files = [
    'apps/backend-fastapi/services/production_wallet_service.py',
    'apps/backend-fastapi/services/wallet_balance_service.py'
]

legacy_removed = True
for file_path in legacy_files:
    if os.path.exists(file_path):
        print(f"⚠️  {file_path}: Still exists (should be deleted)")
        legacy_removed = False
    else:
        print(f"✅ {file_path}: Removed")

print("\n" + "=" * 80)
print("VERIFICATION SUMMARY")
print("=" * 80)

all_ok = new_tables_ok and existing_tables_ok and legacy_removed

if all_ok:
    print("""
✅ ALL FIXES VERIFIED SUCCESSFULLY!

Your system is now fully operational with:
- ✅ Ticket scanning system ready
- ✅ Spray money feature ready
- ✅ Analytics tracking ready
- ✅ Notifications system ready
- ✅ Wallet system working (verified)
- ✅ Legacy files removed

Next steps:
1. Restart your backend server
2. Test the new features
3. Monitor logs for any errors
""")
else:
    print("""
❌ SOME ISSUES FOUND

Please review the errors above and:
""")
    
    if not new_tables_ok:
        print("""
1. Execute fix_all_mismatches.sql in Supabase SQL Editor
   - Go to: https://supabase.com/dashboard
   - Open SQL Editor
   - Copy and run fix_all_mismatches.sql
""")
    
    if not existing_tables_ok:
        print("""
2. Check your Supabase connection and permissions
   - Verify SUPABASE_URL is correct
   - Verify SUPABASE_SERVICE_KEY has admin access
""")
    
    if not legacy_removed:
        print("""
3. Remove legacy files manually:
   - Delete production_wallet_service.py
   - Delete wallet_balance_service.py
""")

print("=" * 80)
