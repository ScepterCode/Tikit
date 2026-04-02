import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv('apps/backend-fastapi/.env')

url = os.getenv('SUPABASE_URL')
key = os.getenv('SUPABASE_SERVICE_KEY')

print(f'URL exists: {bool(url)}')
print(f'Key exists: {bool(key)}')

if url and key:
    supabase = create_client(url, key)
    
    # Get all tables
    tables = ['users', 'events', 'tickets', 'bookings', 'payments', 
              'event_preferences', 'user_preferences', 'notifications',
              'realtime_notifications', 'spray_money', 'referrals',
              'memberships', 'secret_events', 'secret_event_invites',
              'anonymous_chat_messages', 'event_analytics', 'ticket_tiers',
              'bulk_purchases', 'bank_accounts', 'withdrawals', 
              'event_capacity', 'group_buy_status', 'spray_money_leaderboard',
              'ticket_scans', 'wallet_transactions', 'savings_goals',
              'auto_save_rules', 'spray_competitions', 'multi_wallets',
              'transaction_history']
    
    existing_tables = {}
    missing_tables = []
    
    for table in tables:
        try:
            result = supabase.table(table).select('*').limit(1).execute()
            if result.data:
                cols = list(result.data[0].keys())
                existing_tables[table] = cols
                print(f'✅ {table}: {len(cols)} columns')
                print(f'   Columns: {", ".join(cols[:10])}{" ..." if len(cols) > 10 else ""}')
            else:
                existing_tables[table] = []
                print(f'✅ {table}: exists (empty)')
        except Exception as e:
            error_str = str(e).lower()
            if 'does not exist' in error_str or 'not found' in error_str or 'relation' in error_str:
                missing_tables.append(table)
                print(f'❌ {table}: DOES NOT EXIST')
            else:
                print(f'⚠️  {table}: {e}')
    
    print(f'\n{"=" * 80}')
    print(f'SUMMARY:')
    print(f'{"=" * 80}')
    print(f'Existing tables: {len(existing_tables)}')
    print(f'Missing tables: {len(missing_tables)}')
    if missing_tables:
        print(f'\nMissing tables:')
        for t in missing_tables:
            print(f'  • {t}')
else:
    print('❌ Missing Supabase credentials')
