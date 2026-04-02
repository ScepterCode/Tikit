"""
Test creating an event directly in Supabase
"""
import os
import sys
from dotenv import load_dotenv
from datetime import datetime, timedelta

sys.path.insert(0, 'apps/backend-fastapi')
load_dotenv('apps/backend-fastapi/.env')

from database import supabase_client

print("=" * 80)
print("TESTING EVENT CREATION")
print("=" * 80)

supabase = supabase_client.get_service_client()

if not supabase:
    print("❌ Could not connect to database")
    sys.exit(1)

# Get sc@gmail.com user
print("\n1. Getting user info...")
user_result = supabase.table('users').select('*').eq('email', 'sc@gmail.com').execute()

if not user_result.data:
    print("❌ User not found")
    sys.exit(1)

user = user_result.data[0]
print(f"✅ User found: {user['email']}")
print(f"   ID: {user['id']}")
print(f"   Role: {user['role']}")

# Try to create an event
print("\n2. Creating test event...")

event_data = {
    "title": "Test Event from Script",
    "description": "This is a test event created directly via Supabase",
    "venue": "Test Venue",
    "start_date": (datetime.now() + timedelta(days=7)).isoformat(),
    "end_date": (datetime.now() + timedelta(days=7, hours=3)).isoformat(),
    "ticket_price": 5000.0,
    "total_tickets": 100,
    "category": "music",
    "host_id": user['id'],
    "tickets_sold": 0,
    "status": "active"
}

try:
    result = supabase.table('events').insert(event_data).execute()
    
    if result.data:
        print(f"✅ Event created successfully!")
        print(f"   Event ID: {result.data[0]['id']}")
        print(f"   Title: {result.data[0]['title']}")
    else:
        print(f"❌ Event creation failed - no data returned")
        
except Exception as e:
    print(f"❌ Error creating event: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 80)
