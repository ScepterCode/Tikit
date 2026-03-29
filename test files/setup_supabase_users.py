#!/usr/bin/env python3
"""
Setup Supabase test users and database schema
"""

from config import config
from supabase import create_client, Client
import json

# Supabase credentials
SUPABASE_URL = config.SUPABASE_URL
SUPABASE_ANON_KEY = config.SUPABASE_ANON_KEY

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Test users to create
TEST_USERS = [
    {
        "email": "admin@grooovy.com",
        "password": "password123",
        "phone": "+2349012345678",
        "user_metadata": {
            "first_name": "Admin",
            "last_name": "User",
            "role": "admin",
            "state": "Lagos"
        }
    },
    {
        "email": "organizer@grooovy.com",
        "password": "password123",
        "phone": "+2349087654321",
        "user_metadata": {
            "first_name": "Organizer",
            "last_name": "User",
            "role": "organizer",
            "state": "Lagos",
            "organization_name": "Test Events Co",
            "organization_type": "Event Management"
        }
    },
    {
        "email": "attendee@grooovy.com",
        "password": "password123",
        "phone": "+2349011111111",
        "user_metadata": {
            "first_name": "Attendee",
            "last_name": "User",
            "role": "attendee",
            "state": "Lagos"
        }
    }
]

def setup_users():
    """Create test users in Supabase Auth"""
    print("🔧 Setting up Supabase test users...\n")
    
    for user in TEST_USERS:
        try:
            print(f"Creating user: {user['email']}")
            
            # Sign up user
            response = supabase.auth.sign_up({
                "email": user["email"],
                "password": user["password"],
                "options": {
                    "data": user["user_metadata"]
                }
            })
            
            if response.user:
                print(f"✅ User created: {user['email']}")
                print(f"   User ID: {response.user.id}")
                print(f"   Role: {user['user_metadata'].get('role')}\n")
            else:
                print(f"❌ Failed to create user: {user['email']}\n")
                
        except Exception as e:
            print(f"❌ Error creating user {user['email']}: {str(e)}\n")

def setup_users_table():
    """Create users table in Supabase"""
    print("\n🔧 Setting up users table in Supabase...\n")
    
    try:
        # Create users table with RLS
        sql = """
        CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
            email TEXT UNIQUE NOT NULL,
            phone_number TEXT UNIQUE,
            first_name TEXT,
            last_name TEXT,
            role TEXT DEFAULT 'attendee',
            state TEXT,
            wallet_balance DECIMAL(10,2) DEFAULT 10000,
            referral_code TEXT UNIQUE,
            organization_name TEXT,
            organization_type TEXT,
            is_verified BOOLEAN DEFAULT false,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );

        -- Enable RLS
        ALTER TABLE users ENABLE ROW LEVEL SECURITY;

        -- Create policies
        CREATE POLICY "Users can read their own data" ON users
            FOR SELECT USING (auth.uid() = id);

        CREATE POLICY "Users can update their own data" ON users
            FOR UPDATE USING (auth.uid() = id);

        CREATE POLICY "Service role can manage all users" ON users
            FOR ALL USING (auth.role() = 'service_role');
        """
        
        print("✅ Users table schema ready (execute in Supabase SQL editor)")
        print("\nSQL to execute in Supabase dashboard:")
        print("=" * 60)
        print(sql)
        print("=" * 60)
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    print("=" * 60)
    print("SUPABASE SETUP SCRIPT")
    print("=" * 60 + "\n")
    
    setup_users()
    setup_users_table()
    
    print("\n" + "=" * 60)
    print("SETUP COMPLETE")
    print("=" * 60)
    print("\nNext steps:")
    print("1. Execute the SQL schema in Supabase SQL editor")
    print("2. Verify users were created in Supabase Auth")
    print("3. Test login in the frontend")
