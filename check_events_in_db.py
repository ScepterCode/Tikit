"""
Check if there are events in the Supabase database
"""
import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv('apps/backend-fastapi/.env')

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY')

print(f"URL: {SUPABASE_URL}")
print(f"Key exists: {bool(SUPABASE_SERVICE_KEY)}")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("❌ Missing Supabase credentials!")
    exit(1)

def check_events():
    """Check events in database"""
    print("\n🔍 Checking Events in Database")
    print("=" * 60)
    
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    # Get all events
    result = supabase.table('events').select('id, title, event_date, ticket_price, category, status').execute()
    
    print(f"\n📊 Total events in database: {len(result.data)}")
    
    if result.data:
        print("\nEvents found:")
        for i, event in enumerate(result.data[:10], 1):  # Show first 10
            print(f"\n{i}. {event.get('title')}")
            print(f"   ID: {event.get('id')}")
            print(f"   Date: {event.get('event_date')}")
            print(f"   Price: ₦{event.get('ticket_price', 0)}")
            print(f"   Category: {event.get('category')}")
            print(f"   Status: {event.get('status')}")
    else:
        print("\n❌ No events found in database!")
        print("\nPossible reasons:")
        print("1. Events table is empty")
        print("2. Events were deleted")
        print("3. Database connection issue")

if __name__ == "__main__":
    check_events()
