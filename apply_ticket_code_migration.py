"""
Apply ticket_code column migration to Supabase
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'apps', 'backend-fastapi'))

from services.supabase_client import get_supabase_client
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def apply_migration():
    """Apply ticket_code column migration"""
    
    print("\n" + "="*60)
    print("APPLYING TICKET_CODE COLUMN MIGRATION")
    print("="*60 + "\n")
    
    supabase = get_supabase_client()
    
    if not supabase:
        print("❌ Supabase client not available")
        print("\nPlease run this SQL in Supabase SQL Editor:")
        print("-" * 60)
        with open('add_ticket_code_column.sql', 'r') as f:
            print(f.read())
        print("-" * 60)
        return False
    
    # Read SQL file
    with open('add_ticket_code_column.sql', 'r') as f:
        sql = f.read()
    
    print("SQL to execute:")
    print("-" * 60)
    print(sql)
    print("-" * 60)
    
    try:
        # Execute SQL using Supabase RPC or direct SQL execution
        # Note: Supabase Python client doesn't support direct SQL execution
        # You need to run this in Supabase SQL Editor
        
        print("\n⚠️  Supabase Python client doesn't support direct SQL execution")
        print("\nPlease follow these steps:")
        print("1. Go to Supabase Dashboard: https://supabase.com/dashboard")
        print("2. Select your project")
        print("3. Go to SQL Editor")
        print("4. Copy and paste the SQL above")
        print("5. Click 'Run' to execute")
        print("\nAfter running the SQL, you can test the ticket purchase flow.")
        
        return True
        
    except Exception as e:
        logger.error(f"Error: {e}")
        return False

if __name__ == "__main__":
    success = apply_migration()
    sys.exit(0 if success else 1)
