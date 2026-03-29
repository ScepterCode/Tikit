#!/usr/bin/env python3
"""
Add wallet_balance Column to Supabase Users Table
This script adds the wallet_balance column to the users table
"""

import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent / "apps" / "backend-fastapi"
sys.path.insert(0, str(backend_path))

def add_wallet_balance_column():
    """Add wallet_balance column to users table"""
    print("=" * 80)
    print("ADDING WALLET_BALANCE COLUMN TO USERS TABLE")
    print("=" * 80)
    
    try:
        from config import config
        from database import supabase_client
        
        supabase = supabase_client.get_service_client()
        
        if not supabase:
            print("❌ Could not create Supabase client")
            return False
        
        print("\n✅ Connected to Supabase")
        
        # Execute SQL to add wallet_balance column
        print("\n🔍 Adding wallet_balance column...")
        
        sql = """
        -- Add wallet_balance column if it doesn't exist
        DO $$ 
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = 'wallet_balance'
            ) THEN
                ALTER TABLE users ADD COLUMN wallet_balance NUMERIC(10, 2) DEFAULT 0.00;
                COMMENT ON COLUMN users.wallet_balance IS 'User wallet balance in Naira';
            END IF;
        END $$;
        """
        
        # Execute using RPC or direct SQL
        try:
            # Try using the SQL editor endpoint
            result = supabase.rpc('exec_sql', {'sql': sql}).execute()
            print("✅ Column added successfully using RPC")
        except Exception as e:
            print(f"⚠️  RPC method failed: {e}")
            print("\n📝 Please run this SQL manually in Supabase SQL Editor:")
            print("-" * 80)
            print(sql)
            print("-" * 80)
            print("\nSteps:")
            print("1. Go to your Supabase dashboard")
            print("2. Click on 'SQL Editor' in the left sidebar")
            print("3. Click 'New Query'")
            print("4. Copy and paste the SQL above")
            print("5. Click 'Run' or press Ctrl+Enter")
            print("\nAlternatively, you can add the column via Table Editor:")
            print("1. Go to 'Table Editor' in Supabase dashboard")
            print("2. Select 'users' table")
            print("3. Click 'Add Column' button")
            print("4. Column name: wallet_balance")
            print("5. Type: numeric or float8")
            print("6. Default value: 0")
            print("7. Click 'Save'")
            return False
        
        # Verify the column was added
        print("\n🔍 Verifying column was added...")
        result = supabase.table('users').select('id, email, wallet_balance').limit(1).execute()
        
        if result.data:
            print("✅ wallet_balance column verified!")
            user = result.data[0]
            print(f"   Example: {user.get('email')} has balance: ₦{user.get('wallet_balance', 0):,.2f}")
        
        print("\n" + "=" * 80)
        print("✅ MIGRATION COMPLETE")
        print("=" * 80)
        return True
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        
        print("\n" + "=" * 80)
        print("MANUAL MIGRATION REQUIRED")
        print("=" * 80)
        print("\nPlease add the wallet_balance column manually:")
        print("\nOption 1 - SQL Editor:")
        print("-" * 80)
        print("""
ALTER TABLE users ADD COLUMN IF NOT EXISTS wallet_balance NUMERIC(10, 2) DEFAULT 0.00;
COMMENT ON COLUMN users.wallet_balance IS 'User wallet balance in Naira';
        """)
        print("-" * 80)
        
        print("\nOption 2 - Table Editor:")
        print("1. Go to Supabase Dashboard > Table Editor")
        print("2. Select 'users' table")
        print("3. Click 'Add Column'")
        print("4. Name: wallet_balance")
        print("5. Type: numeric (or float8)")
        print("6. Default: 0")
        print("7. Click 'Save'")
        
        return False

if __name__ == "__main__":
    success = add_wallet_balance_column()
    sys.exit(0 if success else 1)
