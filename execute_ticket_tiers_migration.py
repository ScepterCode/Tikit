"""
Execute ticket_tiers column migration using Supabase RPC
"""
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'apps', 'backend-fastapi'))

from services.supabase_client import get_supabase_client
from config import config

def execute_migration():
    """Execute the migration SQL"""
    try:
        supabase = get_supabase_client()
        
        print("🔄 Executing ticket_tiers migration...")
        
        # Step 1: Add the column (using Supabase's postgrest API)
        # We'll use RPC to execute raw SQL
        sql_statements = [
            # Add column
            """
            ALTER TABLE events 
            ADD COLUMN IF NOT EXISTS ticket_tiers JSONB DEFAULT '[]'::jsonb;
            """,
            # Update existing events
            """
            UPDATE events 
            SET ticket_tiers = jsonb_build_array(
              jsonb_build_object(
                'name', 'General Admission',
                'price', COALESCE(ticket_price, 0),
                'quantity', COALESCE(capacity, 0),
                'sold', COALESCE(tickets_sold, 0)
              )
            )
            WHERE ticket_tiers IS NULL OR ticket_tiers = '[]'::jsonb;
            """
        ]
        
        for i, sql in enumerate(sql_statements, 1):
            print(f"\n📝 Executing statement {i}...")
            try:
                # Use Supabase RPC to execute SQL
                result = supabase.rpc('exec_sql', {'query': sql}).execute()
                print(f"✅ Statement {i} executed successfully")
            except Exception as e:
                error_msg = str(e)
                if 'function exec_sql' in error_msg.lower():
                    print(f"⚠️  RPC function not available. Using alternative method...")
                    # Alternative: We'll need to use Supabase Dashboard
                    print("\n" + "="*60)
                    print("MANUAL MIGRATION REQUIRED")
                    print("="*60)
                    print("\nPlease run this SQL in Supabase Dashboard > SQL Editor:")
                    print("\n" + sql)
                    print("\n" + "="*60)
                else:
                    print(f"❌ Error in statement {i}: {error_msg}")
        
        # Verify the migration
        print("\n🔍 Verifying migration...")
        result = supabase.table('events').select('id, title, ticket_tiers').eq('id', '59bf9756-83da-495b-bbef-940f6aa561ed').execute()
        
        if result.data:
            event = result.data[0]
            print(f"\n✅ Event '{event['title']}' ticket_tiers:")
            print(f"   {event.get('ticket_tiers', 'NOT FOUND')}")
        else:
            print("❌ Could not verify migration")
        
        return True
        
    except Exception as e:
        print(f"❌ Migration failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    execute_migration()
