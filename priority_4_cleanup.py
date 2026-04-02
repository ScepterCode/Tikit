"""
Priority 4: Cleanup and Optimization
- Delete legacy/unused service files
- Remove unused database tables
- Generate summary report
"""
import os
import shutil
from pathlib import Path

print("=" * 80)
print("PRIORITY 4: CLEANUP AND OPTIMIZATION")
print("=" * 80)

# ============================================================================
# 1. Delete Legacy Wallet Service Files
# ============================================================================
print("\n" + "=" * 80)
print("1. DELETING LEGACY WALLET SERVICE FILES")
print("=" * 80)

legacy_files = [
    'apps/backend-fastapi/services/production_wallet_service.py',
    'apps/backend-fastapi/services/wallet_balance_service.py',
]

deleted_files = []
for file_path in legacy_files:
    full_path = Path(file_path)
    if full_path.exists():
        try:
            # Backup first
            backup_path = Path(f"{file_path}.backup")
            shutil.copy2(full_path, backup_path)
            
            # Delete original
            full_path.unlink()
            deleted_files.append(file_path)
            print(f"✅ Deleted: {file_path}")
            print(f"   Backup: {backup_path}")
        except Exception as e:
            print(f"❌ Error deleting {file_path}: {e}")
    else:
        print(f"⚠️  Not found: {file_path}")

# ============================================================================
# 2. Generate SQL for Removing Unused Tables
# ============================================================================
print("\n" + "=" * 80)
print("2. GENERATING SQL TO REMOVE UNUSED TABLES")
print("=" * 80)

unused_tables = [
    'conversations',
    'event_organizers',
    'referrals',
    'sponsorships'
]

sql_cleanup = """-- ============================================================================
-- CLEANUP: Remove Unused Tables (OPTIONAL)
-- ============================================================================
-- WARNING: Only run this if you're sure these tables are not needed
-- This will permanently delete the tables and all their data

"""

for table in unused_tables:
    sql_cleanup += f"""
-- Drop {table} table
DROP TABLE IF EXISTS {table} CASCADE;
"""

sql_cleanup += """
-- ============================================================================
-- SUMMARY
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'UNUSED TABLES REMOVED';
  RAISE NOTICE '============================================================================';
"""

for table in unused_tables:
    sql_cleanup += f"  RAISE NOTICE 'Removed: {table}';\n"

sql_cleanup += """  RAISE NOTICE '============================================================================';
END $$;
"""

# Save cleanup SQL
with open('cleanup_unused_tables.sql', 'w') as f:
    f.write(sql_cleanup)

print(f"\n✅ Generated SQL script: cleanup_unused_tables.sql")
print(f"   Tables to remove: {', '.join(unused_tables)}")
print(f"   ⚠️  WARNING: This will permanently delete these tables!")

# ============================================================================
# 3. Update simple_main.py to use notifications table
# ============================================================================
print("\n" + "=" * 80)
print("3. CHECKING simple_main.py FOR UPDATES NEEDED")
print("=" * 80)

simple_main_path = Path('apps/backend-fastapi/simple_main.py')
if simple_main_path.exists():
    content = simple_main_path.read_text(encoding='utf-8', errors='ignore')
    
    if 'notification_preferences' in content:
        print("⚠️  simple_main.py references 'notification_preferences' table")
        print("   Action: Update to use 'notifications' table after SQL execution")
    else:
        print("✅ simple_main.py does not reference notification_preferences")
    
    if '.table(\'notifications\')' in content:
        print("✅ simple_main.py already uses 'notifications' table")
    else:
        print("⚠️  simple_main.py may need updates for notifications table")
else:
    print("⚠️  simple_main.py not found")

# ============================================================================
# 4. Check analytics_service.py for interaction_logs
# ============================================================================
print("\n" + "=" * 80)
print("4. CHECKING analytics_service.py FOR UPDATES NEEDED")
print("=" * 80)

analytics_path = Path('apps/backend-fastapi/services/analytics_service.py')
if analytics_path.exists():
    content = analytics_path.read_text(encoding='utf-8', errors='ignore')
    
    if 'interaction_logs' in content:
        print("✅ analytics_service.py references 'interaction_logs' table")
        print("   Table will be created by SQL script")
    else:
        print("⚠️  analytics_service.py does not reference interaction_logs")
else:
    print("⚠️  analytics_service.py not found")

# ============================================================================
# SUMMARY
# ============================================================================
print("\n" + "=" * 80)
print("PRIORITY 4 SUMMARY")
print("=" * 80)

print(f"""
✅ Completed Actions:
   • Deleted {len(deleted_files)} legacy wallet service files
   • Generated cleanup SQL for unused tables
   • Checked service files for required updates

📝 Files Created:
   • cleanup_unused_tables.sql - SQL to remove unused tables

⚠️  Manual Actions Required:
   1. Execute fix_all_mismatches.sql in Supabase SQL Editor
   2. Verify all 4 tables were created successfully
   3. (Optional) Execute cleanup_unused_tables.sql to remove unused tables
   4. Test ticket scanning feature
   5. Test spray money feature
   6. Test notifications
   7. Test analytics

🎯 Next Steps:
   1. Go to Supabase Dashboard → SQL Editor
   2. Copy and run fix_all_mismatches.sql
   3. Verify tables: ticket_scans, spray_money, interaction_logs, notifications
   4. Test the application
""")

print("=" * 80)
print("PRIORITY 4 CLEANUP COMPLETE")
print("=" * 80)
