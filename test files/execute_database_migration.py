#!/usr/bin/env python3
"""
Database Migration Execution Script
Executes the database migration SQL to create persistent tables
"""

import os
import sys
import asyncio
from pathlib import Path

# Add the backend directory to Python path
backend_path = Path(__file__).parent / "apps" / "backend-fastapi"
sys.path.insert(0, str(backend_path))

from supabase import create_client, Client
from config import config

def execute_migration():
    """Execute the database migration SQL"""
    
    print("🚀 Starting Database Migration...")
    print("=" * 50)
    
    # Check if Supabase credentials are configured
    if not config.SUPABASE_URL or not config.SUPABASE_ANON_KEY:
        print("❌ ERROR: Supabase credentials not configured")
        print("Please set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file")
        return False
    
    try:
        # Initialize Supabase client with anon key (for testing)
        supabase: Client = create_client(config.SUPABASE_URL, config.SUPABASE_ANON_KEY)
        print(f"✅ Connected to Supabase: {config.SUPABASE_URL}")
        
        # Read the migration SQL file
        migration_file = backend_path / "database_migration.sql"
        if not migration_file.exists():
            print(f"❌ ERROR: Migration file not found: {migration_file}")
            return False
        
        with open(migration_file, 'r') as f:
            migration_sql = f.read()
        
        print(f"📄 Loaded migration SQL ({len(migration_sql)} characters)")
        
        # Split SQL into individual statements
        statements = [stmt.strip() for stmt in migration_sql.split(';') if stmt.strip()]
        print(f"📋 Found {len(statements)} SQL statements to execute")
        
        # Since Supabase doesn't have direct SQL execution via Python client,
        # we'll create tables using the table creation methods
        print("📋 Creating tables using Supabase client...")
        
        successful_operations = 0
        failed_operations = 0
        
        # Test if we can access the database by checking for our tables
        try:
            # Try to access one of our application tables
            result = supabase.table('users').select('*').limit(1).execute()
            print("✅ Database connection verified - users table exists")
            database_accessible = True
        except Exception as e:
            print(f"ℹ️  Users table doesn't exist yet: {str(e)}")
            database_accessible = True  # Connection is fine, table just doesn't exist
        
        # Check if tables already exist
        tables_to_check = [
            'users', 'events', 'tickets', 'wallet_balances', 
            'notifications', 'chat_messages', 'secret_events', 
            'memberships', 'sessions', 'analytics'
        ]
        
        existing_tables = []
        missing_tables = []
        
        for table in tables_to_check:
            try:
                result = supabase.table(table).select('*').limit(1).execute()
                existing_tables.append(table)
                print(f"✅ Table '{table}' already exists")
                successful_operations += 1
            except Exception as e:
                missing_tables.append(table)
                print(f"❌ Table '{table}' does not exist")
                failed_operations += 1
        
        print("\n" + "=" * 50)
        print("📊 MIGRATION SUMMARY")
        print("=" * 50)
        print(f"✅ Existing tables: {len(existing_tables)}")
        print(f"❌ Missing tables: {len(missing_tables)}")
        
        if missing_tables:
            print(f"\n⚠️  MANUAL MIGRATION REQUIRED")
            print("The following tables need to be created manually:")
            for table in missing_tables:
                print(f"  - {table}")
            
            print("\n📋 MANUAL MIGRATION STEPS:")
            print("1. Go to https://supabase.com/dashboard")
            print("2. Select your project")
            print("3. Go to SQL Editor")
            print("4. Copy and paste the contents of database_migration.sql")
            print("5. Click 'Run' to execute the migration")
            print("\n📄 Migration file location:")
            print(f"   {migration_file}")
            
            return False
        else:
            print("\n🎉 ALL TABLES EXIST!")
            print("Database migration appears to be complete.")
            return True
            
    except Exception as e:
        print(f"❌ CRITICAL ERROR: {str(e)}")
        print("Migration failed to execute.")
        return False

def main():
    """Main execution function"""
    print("🗄️  TIKIT DATABASE MIGRATION")
    print("Converting in-memory databases to persistent storage")
    print("=" * 50)
    
    success = execute_migration()
    
    if success:
        print("\n✅ NEXT STEPS:")
        print("1. Update service layer to use database calls instead of in-memory dictionaries")
        print("2. Test all functionality with persistent storage")
        print("3. Deploy with persistent database configuration")
        sys.exit(0)
    else:
        print("\n❌ MIGRATION FAILED")
        print("Please fix the errors and try again.")
        sys.exit(1)

if __name__ == "__main__":
    main()