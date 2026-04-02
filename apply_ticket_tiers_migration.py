"""
Apply ticket_tiers column migration to events table
"""
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'apps', 'backend-fastapi'))

from services.supabase_client import get_supabase_client
from config import config

def apply_migration():
    """Apply the ticket_tiers column migration"""
    try:
        supabase = get_supabase_client()
        
        # Read the SQL migration file
        with open('add_ticket_tiers_column.sql', 'r') as f:
            sql = f.read()
        
        print("🔄 Applying ticket_tiers column migration...")
        print(f"SQL:\n{sql}\n")
        
        # Execute the migration using Supabase RPC
        # Note: Supabase doesn't directly support DDL, so we'll use the REST API
        # to check and update data instead
        
        print("⚠️  Note: Column addition must be done via Supabase Dashboard SQL Editor")
        print("📋 Steps:")
        print("1. Go to Supabase Dashboard > SQL Editor")
        print("2. Run the SQL from add_ticket_tiers_column.sql")
        print("3. Or use the Supabase CLI: supabase db push")
        
        # Check current events without ticket_tiers
        result = supabase.table('events').select('id, title, ticket_price, capacity, tickets_sold').limit(5).execute()
        
        if result.data:
            print(f"\n📊 Sample events that need ticket_tiers:")
            for event in result.data:
                print(f"  - {event['title']}: price={event.get('ticket_price')}, capacity={event.get('capacity')}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

if __name__ == "__main__":
    apply_migration()
