"""
Run Secret Events Database Migration
Execute this to create all necessary tables in Supabase
"""
import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv('apps/backend-fastapi/.env')

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY')

def run_migration():
    """Run the secret events migration"""
    print("\n🔐 Secret Events Database Migration")
    print("=" * 60)
    
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("❌ Missing Supabase credentials!")
        return False
    
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    # Read the migration SQL
    with open('SECRET_EVENTS_MIGRATION.sql', 'r') as f:
        sql = f.read()
    
    print("\n📝 Executing migration SQL...")
    print(f"SQL length: {len(sql)} characters")
    
    try:
        # Note: Supabase Python client doesn't support raw SQL execution
        # You need to run this in Supabase SQL Editor
        print("\n⚠️  IMPORTANT: This script cannot execute raw SQL via Python client")
        print("\n📋 Please follow these steps:")
        print("1. Go to your Supabase Dashboard")
        print("2. Navigate to SQL Editor")
        print("3. Copy the contents of SECRET_EVENTS_MIGRATION.sql")
        print("4. Paste and run in SQL Editor")
        print("\n✅ After running the SQL, verify tables were created:")
        print("   - secret_events")
        print("   - secret_event_invites")
        print("   - anonymous_tickets")
        print("   - secret_event_invite_requests")
        print("   - secret_event_notifications")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        return False

if __name__ == "__main__":
    run_migration()
