"""
Check what event data looks like in Supabase
"""

import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv('apps/backend-fastapi/.env')

supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

supabase = create_client(supabase_url, supabase_key)

# Get one event
result = supabase.table('events').select('*').limit(1).execute()

if result.data:
    event = result.data[0]
    print("Event data structure:")
    print("="*80)
    for key, value in event.items():
        print(f"{key}: {value} ({type(value).__name__})")
    print("="*80)
    
    # Check if tickets exist
    event_id = event['id']
    tickets_result = supabase.table('tickets').select('*').eq('event_id', event_id).execute()
    print(f"\nTickets for this event: {len(tickets_result.data) if tickets_result.data else 0}")
    
    if tickets_result.data:
        print("\nTicket structure:")
        for key, value in tickets_result.data[0].items():
            print(f"{key}: {value}")
else:
    print("No events found")
