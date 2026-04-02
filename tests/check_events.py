"""Check events in database"""
import sys
sys.path.insert(0, 'apps/backend-fastapi')

from database import supabase_client

supabase = supabase_client.get_service_client()

print("Checking events in database...")
print("=" * 60)

# Get all events
result = supabase.table('events').select('*').execute()

if result.data:
    print(f"Found {len(result.data)} events:\n")
    for event in result.data:
        print(f"Event: {event.get('title')}")
        print(f"  ID: {event.get('id')}")
        print(f"  Host ID: {event.get('host_id')}")
        print(f"  Status: {event.get('status')}")
        print(f"  Created: {event.get('created_at')}")
        print()
else:
    print("No events found")

# Check for user's events specifically
print("\nChecking events for user sc@gmail.com...")
user_result = supabase.table('users').select('id').eq('email', 'sc@gmail.com').execute()
if user_result.data:
    user_id = user_result.data[0]['id']
    print(f"User ID: {user_id}")
    
    user_events = supabase.table('events').select('*').eq('host_id', user_id).execute()
    print(f"User's events: {len(user_events.data) if user_events.data else 0}")
    
    if user_events.data:
        for event in user_events.data:
            print(f"  - {event.get('title')} (Status: {event.get('status')})")
