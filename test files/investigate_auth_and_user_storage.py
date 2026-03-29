#!/usr/bin/env python3
"""
Deep Investigation: Authentication and User Storage
Analyzes how users are being created and stored
"""

import sys
from pathlib import Path

backend_path = Path(__file__).parent / "apps" / "backend-fastapi"
sys.path.insert(0, str(backend_path))

def investigate_auth_system():
    """Investigate the authentication and user storage system"""
    print("=" * 80)
    print("DEEP INVESTIGATION: AUTHENTICATION & USER STORAGE")
    print("=" * 80)
    
    try:
        from config import config
        from database import supabase_client
        
        supabase = supabase_client.get_service_client()
        
        if not supabase:
            print("❌ Could not connect to Supabase")
            return False
        
        print("\n✅ Connected to Supabase")
        
        # Check users in Supabase
        print("\n" + "=" * 80)
        print("1. CHECKING SUPABASE USERS TABLE")
        print("=" * 80)
        
        users_result = supabase.table('users').select('*').execute()
        
        print(f"\n📊 Total users in Supabase 'users' table: {len(users_result.data)}")
        
        if users_result.data:
            print("\nUsers found:")
            print("-" * 80)
            for user in users_result.data:
                print(f"   ID: {user.get('id')}")
                print(f"   Email: {user.get('email')}")
                print(f"   Phone: {user.get('phone')}")
                print(f"   Name: {user.get('first_name')} {user.get('last_name')}")
                print(f"   Wallet Balance: ₦{float(user.get('wallet_balance') or 0):,.2f}")
                print(f"   Created: {user.get('created_at')}")
                print("-" * 80)
        
        # Check Supabase Auth users
        print("\n" + "=" * 80)
        print("2. CHECKING SUPABASE AUTH USERS")
        print("=" * 80)
        
        try:
            # Try to list auth users (requires admin privileges)
            auth_result = supabase.auth.admin.list_users()
            print(f"\n📊 Total users in Supabase Auth: {len(auth_result)}")
            
            if auth_result:
                print("\nAuth users found:")
                print("-" * 80)
                for auth_user in auth_result:
                    print(f"   ID: {auth_user.id}")
                    print(f"   Email: {auth_user.email}")
                    print(f"   Created: {auth_user.created_at}")
                    print(f"   Confirmed: {auth_user.email_confirmed_at is not None}")
                    print("-" * 80)
        except Exception as e:
            print(f"\n⚠️  Could not access Supabase Auth users: {e}")
            print("   This is normal - requires service_role key with admin privileges")
        
        # Check for discrepancies
        print("\n" + "=" * 80)
        print("3. ANALYZING DISCREPANCIES")
        print("=" * 80)
        
        print("\n🔍 Key Questions:")
        print(f"   - Users in 'users' table: {len(users_result.data)}")
        print(f"   - Expected: More users if you've registered several")
        
        if len(users_result.data) < 3:
            print("\n⚠️  WARNING: Very few users in database!")
            print("   This suggests users are NOT being saved to Supabase properly")
        
        return True
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = investigate_auth_system()
    sys.exit(0 if success else 1)
