"""
Check events table schema
"""
import os
import sys
from dotenv import load_dotenv

sys.path.insert(0, 'apps/backend-fastapi')
load_dotenv('apps/backend-fastapi/.env')

from database import supabase_client

print("=" * 80)
print("CHECKING EVENTS TABLE SCHEMA")
print("=" * 80)

supabase = supabase_client.get_service_client()

if not supabase:
    print("❌ Could not connect to database")
    sys.exit(1)

# Get one event to see the schema
print("\n1. Fetching sample event...")
result = supabase.table('events').select('*').limit(1).execute()

if result.data:
    print(f"✅ Found event. Columns:")
    for key in result.data[0].keys():
        print(f"   - {key}: {type(result.data[0][key]).__name__}")
else:
    print("⚠️  No events found. Let me try to insert a minimal event...")
    
    # Try minimal insert
    minimal_event = {
        "title": "Test Event",
        "host_id": "b9d3197e-2db2-4c8c-a943-5c9685c6d8df"
    }
    
    try:
        result = supabase.table('events').insert(minimal_event).execute()
        if result.data:
            print(f"✅ Created minimal event. Columns:")
            for key in result.data[0].keys():
                print(f"   - {key}: {type(result.data[0][key]).__name__}")
        else:
            print("❌ Failed to create event")
    except Exception as e:
        print(f"❌ Error: {e}")

print("\n" + "=" * 80)
