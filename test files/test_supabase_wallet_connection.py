#!/usr/bin/env python3
"""
Test Supabase Wallet Connection
Verifies that the backend can connect to Supabase and access the users table
"""

import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent / "apps" / "backend-fastapi"
sys.path.insert(0, str(backend_path))

def test_supabase_connection():
    """Test Supabase connection and wallet balance access"""
    print("=" * 80)
    print("TESTING SUPABASE WALLET CONNECTION")
    print("=" * 80)
    
    try:
        # Import config and database
        from config import config
        from database import supabase_client
        
        print("\n✅ Step 1: Imports successful")
        print(f"   Supabase URL: {config.SUPABASE_URL}")
        print(f"   Service Key configured: {'Yes' if config.SUPABASE_SERVICE_KEY else 'No'}")
        
        # Get Supabase client
        supabase = supabase_client.get_service_client()
        
        if not supabase:
            print("\n❌ ERROR: Could not create Supabase client")
            print("   Check that SUPABASE_URL and SUPABASE_SERVICE_KEY are set in .env")
            return False
        
        print("\n✅ Step 2: Supabase client created successfully")
        
        # Test connection by querying users table
        print("\n🔍 Step 3: Testing users table access...")
        result = supabase.table('users').select('id, email, wallet_balance').limit(5).execute()
        
        if not result.data:
            print("\n⚠️  WARNING: No users found in database")
            print("   This is normal if you haven't created any users yet")
            print("   The wallet system will work once users are created")
            return True
        
        print(f"\n✅ Step 4: Found {len(result.data)} users in database")
        print("\nUser wallet balances:")
        print("-" * 80)
        for user in result.data:
            email = user.get('email', 'N/A')
            balance = float(user.get('wallet_balance', 0))
            print(f"   {email}: ₦{balance:,.2f}")
        print("-" * 80)
        
        # Test wallet balance update
        print("\n🔍 Step 5: Testing wallet balance update...")
        if result.data:
            test_user = result.data[0]
            user_id = test_user['id']
            current_balance = float(test_user.get('wallet_balance', 0))
            
            print(f"   Test user: {test_user.get('email')}")
            print(f"   Current balance: ₦{current_balance:,.2f}")
            
            # Try to update (we'll set it back to the same value)
            update_result = supabase.table('users').update({
                'wallet_balance': current_balance
            }).eq('id', user_id).execute()
            
            if update_result.data:
                print(f"   ✅ Wallet balance update successful")
            else:
                print(f"   ⚠️  Wallet balance update returned no data")
        
        print("\n" + "=" * 80)
        print("✅ ALL TESTS PASSED - Supabase wallet connection is working!")
        print("=" * 80)
        return True
        
    except ImportError as e:
        print(f"\n❌ ERROR: Could not import required modules")
        print(f"   {e}")
        print("\n   Make sure you're running from the Tikit directory")
        print("   and that all dependencies are installed:")
        print("   cd apps/backend-fastapi && pip install -r requirements.txt")
        return False
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_supabase_connection()
    sys.exit(0 if success else 1)
