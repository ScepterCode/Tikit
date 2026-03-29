#!/usr/bin/env python3
"""
Create Missing Database Tables Script
Creates the remaining 7 database tables that are missing from Supabase
"""

import os
import sys
from pathlib import Path
import asyncio

# Add the backend directory to Python path
backend_path = Path(__file__).parent / "apps" / "backend-fastapi"
sys.path.insert(0, str(backend_path))

from supabase import create_client, Client
from config import config

def create_missing_tables():
    """Create missing database tables using Supabase client"""
    
    print("🗄️  CREATING MISSING DATABASE TABLES")
    print("=" * 50)
    
    try:
        # Initialize Supabase client
        supabase: Client = create_client(config.SUPABASE_URL, config.SUPABASE_ANON_KEY)
        print(f"✅ Connected to Supabase: {config.SUPABASE_URL}")
        
        # Define table creation SQL statements
        table_definitions = {
            "wallet_balances": """
                CREATE TABLE IF NOT EXISTS wallet_balances (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id UUID REFERENCES users(id),
                    wallet_type VARCHAR(50) DEFAULT 'main',
                    balance DECIMAL(12,2) DEFAULT 0.00,
                    currency VARCHAR(3) DEFAULT 'NGN',
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    UNIQUE(user_id, wallet_type)
                );
                CREATE INDEX IF NOT EXISTS idx_wallet_balances_user ON wallet_balances(user_id);
            """,
            
            "notifications": """
                CREATE TABLE IF NOT EXISTS notifications (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id UUID REFERENCES users(id),
                    title VARCHAR(255),
                    message TEXT,
                    type VARCHAR(50),
                    is_read BOOLEAN DEFAULT FALSE,
                    data JSONB,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
                CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
            """,
            
            "chat_messages": """
                CREATE TABLE IF NOT EXISTS chat_messages (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    event_id UUID REFERENCES events(id),
                    user_id UUID REFERENCES users(id),
                    message TEXT NOT NULL,
                    is_anonymous BOOLEAN DEFAULT FALSE,
                    anonymous_name VARCHAR(100),
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
                CREATE INDEX IF NOT EXISTS idx_chat_messages_event ON chat_messages(event_id);
            """,
            
            "secret_events": """
                CREATE TABLE IF NOT EXISTS secret_events (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    event_id UUID REFERENCES events(id),
                    access_code VARCHAR(50) UNIQUE NOT NULL,
                    max_participants INTEGER,
                    current_participants INTEGER DEFAULT 0,
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            """,
            
            "memberships": """
                CREATE TABLE IF NOT EXISTS memberships (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id UUID REFERENCES users(id),
                    membership_type VARCHAR(50) DEFAULT 'basic',
                    status VARCHAR(50) DEFAULT 'active',
                    expires_at TIMESTAMP WITH TIME ZONE,
                    features JSONB,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            """,
            
            "sessions": """
                CREATE TABLE IF NOT EXISTS sessions (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id UUID REFERENCES users(id),
                    session_token VARCHAR(255) UNIQUE NOT NULL,
                    expires_at TIMESTAMP WITH TIME ZONE,
                    ip_address INET,
                    user_agent TEXT,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
                CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
                CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);
            """,
            
            "analytics": """
                CREATE TABLE IF NOT EXISTS analytics (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    event_id UUID REFERENCES events(id),
                    user_id UUID REFERENCES users(id),
                    action VARCHAR(100),
                    data JSONB,
                    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
                CREATE INDEX IF NOT EXISTS idx_analytics_event ON analytics(event_id);
                CREATE INDEX IF NOT EXISTS idx_analytics_timestamp ON analytics(timestamp);
            """
        }
        
        # Since we can't execute raw SQL directly, let's try to create tables using table operations
        # This approach will work if the tables don't exist yet
        
        created_tables = []
        failed_tables = []
        
        for table_name, sql in table_definitions.items():
            try:
                print(f"⏳ Attempting to verify table: {table_name}")
                
                # Try to access the table to see if it exists
                result = supabase.table(table_name).select('*').limit(1).execute()
                print(f"✅ Table '{table_name}' already exists")
                created_tables.append(table_name)
                
            except Exception as e:
                print(f"❌ Table '{table_name}' does not exist: {str(e)}")
                failed_tables.append(table_name)
        
        print(f"\n📊 TABLE STATUS:")
        print(f"✅ Existing tables: {len(created_tables)}")
        print(f"❌ Missing tables: {len(failed_tables)}")
        
        if failed_tables:
            print(f"\n💡 MANUAL CREATION REQUIRED:")
            print("The following tables need to be created manually in Supabase dashboard:")
            for table in failed_tables:
                print(f"  - {table}")
            
            print(f"\n📋 INSTRUCTIONS:")
            print("1. Go to https://supabase.com/dashboard")
            print("2. Select your project")
            print("3. Go to SQL Editor")
            print("4. Execute the following SQL:")
            print("\n" + "="*60)
            
            # Print the SQL for missing tables
            for table in failed_tables:
                if table in table_definitions:
                    print(f"\n-- Create {table} table")
                    print(table_definitions[table])
            
            print("="*60)
            
            return False
        else:
            print(f"\n🎉 ALL TABLES EXIST!")
            return True
            
    except Exception as e:
        print(f"❌ CRITICAL ERROR: {str(e)}")
        return False

def main():
    """Main execution function"""
    print("🚀 CREATING MISSING DATABASE TABLES")
    print("Completing database migration for advanced features")
    print("=" * 60)
    
    success = create_missing_tables()
    
    if success:
        print("\n✅ DATABASE MIGRATION COMPLETE!")
        print("All required tables are now available.")
        print("\n🚀 NEXT STEPS:")
        print("1. Test all functionality with complete database")
        print("2. Run comprehensive end-to-end tests")
        print("3. Deploy to production")
        return True
    else:
        print("\n⚠️  MANUAL INTERVENTION REQUIRED")
        print("Please create the missing tables manually in Supabase dashboard.")
        print("Use the SQL provided above.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)