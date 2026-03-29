#!/usr/bin/env python3
"""
Check Supabase Schema
Inspects the users table to see what columns exist
"""

import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent / "apps" / "backend-fastapi"
sys.path.insert(0, str(backend_path))

def check_schema():
    """Check Supabase users table schema"""
    print("=" * 80)
    print("CHECKING SUPABASE SCHEMA")
    print("=" * 80)
    
    try:
        from config import config
        from database import supabase_client
        
        supabase = supabase_client.get_service_client()
        
        if not supabase:
            print("❌ Could not create Supabase client")
            return False
        
        print("\n✅ Connected to Supabase")
        
        # Get all columns from users table
        print("\n🔍 Querying users table to see available columns...")
        result = supabase.table('users').select('*').limit(1).execute()
        
        if not result.data:
            print("\n⚠️  No users found in database")
            print("   Creating a test user to see the schema...")
            
            # Try to get schema from empty table
            print("\n   Available tables:")
            tables_result = supabase.table('users').select('*').limit(0).execute()
            print(f"   Response: {tables_result}")
            return False
        
        print(f"\n✅ Found user data")
        print("\nAvailable columns in 'users' table:")
        print("-" * 80)
        
        user = result.data[0]
        for key in sorted(user.keys()):
            value = user[key]
            value_type = type(value).__name__
            print(f"   {key:30s} = {value_type:15s} (example: {str(value)[:50]})")
        
        print("-" * 80)
        
        # Check if wallet_balance exists
        if 'wallet_balance' in user:
            print("\n✅ wallet_balance column EXISTS")
        else:
            print("\n❌ wallet_balance column DOES NOT EXIST")
            print("\n   Need to add wallet_balance column to users table")
            print("   You can do this in Supabase dashboard:")
            print("   1. Go to Table Editor")
            print("   2. Select 'users' table")
            print("   3. Add new column: wallet_balance (type: float8 or numeric)")
            print("   4. Set default value: 0")
        
        return True
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = check_schema()
    sys.exit(0 if success else 1)
