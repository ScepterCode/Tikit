"""
Complete Mismatch Analysis Report
"""
import os
import re
from pathlib import Path
from collections import defaultdict
from dotenv import load_dotenv
from supabase import create_client

load_dotenv('apps/backend-fastapi/.env')

url = os.getenv('SUPABASE_URL')
key = os.getenv('SUPABASE_SERVICE_KEY')

supabase = create_client(url, key)

print("=" * 100)
print("COMPLETE MISMATCH ANALYSIS REPORT")
print("=" * 100)

# ============================================================================
# PART 1: Database Tables Analysis
# ============================================================================
print("\n" + "=" * 100)
print("PART 1: DATABASE TABLES")
print("=" * 100)

# Check all possible tables
all_possible_tables = [
    'users', 'events', 'tickets', 'bookings', 'payments',
    'event_preferences', 'user_preferences', 'notifications',
    'realtime_notifications', 'spray_money', 'referrals',
    'memberships', 'secret_events', 'secret_event_invites',
    'anonymous_chat_messages', 'event_analytics', 'ticket_tiers',
    'bulk_purchases', 'bank_accounts', 'withdrawals',
    'event_capacity', 'group_buy_status', 'spray_money_leaderboard',
    'ticket_scans', 'wallet_transactions', 'savings_goals',
    'auto_save_rules', 'spray_competitions', 'multi_wallets',
    'transaction_history', 'event_organizers', 'sponsorships',
    'conversations', 'message_logs', 'scan_history'
]

existing_tables = {}
missing_tables = []

for table in sorted(all_possible_tables):
    try:
        result = supabase.table(table).select('*').limit(1).execute()
        if result.data:
            cols = list(result.data[0].keys())
            existing_tables[table] = cols
        else:
            existing_tables[table] = []
    except Exception as e:
        error_str = str(e).lower()
        if 'could not find' in error_str or 'does not exist' in error_str:
            missing_tables.append(table)

print(f"\nEXISTING TABLES ({len(existing_tables)}):")
for table in sorted(existing_tables.keys()):
    cols = existing_tables[table]
    print(f"   • {table}: {len(cols)} columns")
    if cols:
        print(f"     └─ {', '.join(cols)}")

print(f"\n❌ MISSING TABLES ({len(missing_tables)}):")
for table in sorted(missing_tables):
    print(f"   • {table}")

# ============================================================================
# PART 2: Backend Table References
# ============================================================================
print("\n" + "=" * 100)
print("PART 2: BACKEND TABLE REFERENCES")
print("=" * 100)

backend_tables = defaultdict(set)
backend_path = Path('apps/backend-fastapi')

# Scan all Python files
for py_file in backend_path.rglob('*.py'):
    if 'node_modules' in str(py_file) or '__pycache__' in str(py_file):
        continue
    
    try:
        content = py_file.read_text(encoding='utf-8')
        
        # Find table references
        patterns = [
            r'\.table\(["\']([^"\']+)["\']',
            r'\.from\(["\']([^"\']+)["\']',
            r'supabase\.table\(["\']([^"\']+)["\']',
        ]
        
        for pattern in patterns:
            tables = re.findall(pattern, content)
            for table in tables:
                backend_tables[table].add(py_file.name)
    except:
        pass

print(f"\n✅ Backend references {len(backend_tables)} tables:")
for table in sorted(backend_tables.keys()):
    files = ', '.join(sorted(backend_tables[table])[:3])
    if len(backend_tables[table]) > 3:
        files += f" +{len(backend_tables[table]) - 3} more"
    
    status = "✅" if table in existing_tables else "❌ MISSING"
    print(f"   {status} {table}")
    print(f"      └─ Used in: {files}")

# ============================================================================
# PART 3: Frontend Table References
# ============================================================================
print("\n" + "=" * 100)
print("PART 3: FRONTEND TABLE REFERENCES")
print("=" * 100)

frontend_tables = defaultdict(set)
frontend_path = Path('apps/frontend/src')

for file_ext in ['*.tsx', '*.ts']:
    for frontend_file in frontend_path.rglob(file_ext):
        try:
            content = frontend_file.read_text(encoding='utf-8')
            rel_path = str(frontend_file.relative_to(frontend_path))
            
            # Find Supabase table references
            patterns = [
                r'supabase\.from\([`"\']([^`"\']+)[`"\']',
                r'\.from\([`"\']([^`"\']+)[`"\']',
            ]
            
            for pattern in patterns:
                tables = re.findall(pattern, content)
                for table in tables:
                    frontend_tables[table].add(rel_path)
        except:
            pass

print(f"\n✅ Frontend references {len(frontend_tables)} tables:")
for table in sorted(frontend_tables.keys()):
    files = list(frontend_tables[table])[:2]
    files_str = ', '.join(files)
    if len(frontend_tables[table]) > 2:
        files_str += f" +{len(frontend_tables[table]) - 2} more"
    
    status = "✅" if table in existing_tables else "❌ MISSING"
    print(f"   {status} {table}")
    print(f"      └─ Used in: {files_str}")

# ============================================================================
# PART 4: Backend API Endpoints
# ============================================================================
print("\n" + "=" * 100)
print("PART 4: BACKEND API ENDPOINTS")
print("=" * 100)

backend_endpoints = {}
routers_path = Path('apps/backend-fastapi/routers')

for router_file in routers_path.glob('*.py'):
    try:
        content = router_file.read_text(encoding='utf-8')
        
        # Find route decorators
        patterns = [
            r'@router\.(get|post|put|patch|delete)\(["\']([^"\']+)["\']',
            r'@app\.(get|post|put|patch|delete)\(["\']([^"\']+)["\']',
        ]
        
        for pattern in patterns:
            routes = re.findall(pattern, content)
            for method, path in routes:
                endpoint_key = f"{method.upper()} {path}"
                backend_endpoints[endpoint_key] = router_file.name
    except:
        pass

print(f"\n✅ Found {len(backend_endpoints)} backend endpoints")
print(f"   (Showing first 20)")
for i, endpoint in enumerate(sorted(backend_endpoints.keys())[:20]):
    file = backend_endpoints[endpoint]
    print(f"   • {endpoint} ({file})")

# ============================================================================
# PART 5: Frontend API Calls
# ============================================================================
print("\n" + "=" * 100)
print("PART 5: FRONTEND API CALLS")
print("=" * 100)

frontend_api_calls = defaultdict(lambda: {'files': set(), 'methods': set()})

for file_ext in ['*.tsx', '*.ts']:
    for frontend_file in frontend_path.rglob(file_ext):
        try:
            content = frontend_file.read_text(encoding='utf-8')
            rel_path = str(frontend_file.relative_to(frontend_path))
            
            # Find API calls
            patterns = [
                (r'fetch\([`"\']([^`"\']+)[`"\']', 'FETCH'),
                (r'axios\.(get|post|put|patch|delete)\([`"\']([^`"\']+)[`"\']', None),
            ]
            
            # Fetch calls
            fetch_calls = re.findall(r'fetch\([`"\']([^`"\']+)[`"\']', content)
            for url in fetch_calls:
                if '/api/' in url:
                    clean_url = url.split('${')[0].split('`')[0].split('?')[0]
                    frontend_api_calls[clean_url]['files'].add(rel_path)
                    frontend_api_calls[clean_url]['methods'].add('FETCH')
            
            # Axios calls
            axios_calls = re.findall(r'(axios|api)\.(get|post|put|patch|delete)\([`"\']([^`"\']+)[`"\']', content)
            for _, method, url in axios_calls:
                if '/api/' in url:
                    clean_url = url.split('${')[0].split('`')[0].split('?')[0]
                    frontend_api_calls[clean_url]['files'].add(rel_path)
                    frontend_api_calls[clean_url]['methods'].add(method.upper())
        except:
            pass

print(f"\n✅ Found {len(frontend_api_calls)} unique frontend API calls")
print(f"   (Showing first 20)")
for i, url in enumerate(sorted(frontend_api_calls.keys())[:20]):
    info = frontend_api_calls[url]
    methods = ', '.join(sorted(info['methods']))
    file_count = len(info['files'])
    print(f"   • {url} [{methods}] ({file_count} file(s))")

# ============================================================================
# CRITICAL ISSUES SUMMARY
# ============================================================================
print("\n" + "=" * 100)
print("CRITICAL ISSUES SUMMARY")
print("=" * 100)

# Issue 1: Backend references missing tables
backend_missing = [t for t in backend_tables.keys() if t not in existing_tables]
if backend_missing:
    print(f"\n❌ ISSUE 1: Backend references {len(backend_missing)} MISSING tables:")
    for table in sorted(backend_missing):
        files = ', '.join(list(backend_tables[table])[:2])
        print(f"   • {table} (in: {files})")
else:
    print(f"\n✅ ISSUE 1: All backend table references exist")

# Issue 2: Frontend references missing tables
frontend_missing = [t for t in frontend_tables.keys() if t not in existing_tables]
if frontend_missing:
    print(f"\n❌ ISSUE 2: Frontend references {len(frontend_missing)} MISSING tables:")
    for table in sorted(frontend_missing):
        file_count = len(frontend_tables[table])
        print(f"   • {table} ({file_count} file(s))")
else:
    print(f"\n✅ ISSUE 2: All frontend table references exist")

# Issue 3: Unused tables
used_tables = set(backend_tables.keys()) | set(frontend_tables.keys())
unused = [t for t in existing_tables.keys() if t not in used_tables]
if unused:
    print(f"\n⚠️  ISSUE 3: {len(unused)} tables exist but are NOT used:")
    for table in sorted(unused):
        print(f"   • {table}")
else:
    print(f"\n✅ ISSUE 3: All database tables are being used")

print("\n" + "=" * 100)
print(f"FINAL STATISTICS")
print("=" * 100)
print(f"""
Database:
  • Existing tables: {len(existing_tables)}
  • Missing tables: {len(missing_tables)}

Backend:
  • API endpoints: {len(backend_endpoints)}
  • Tables referenced: {len(backend_tables)}
  • Missing table refs: {len(backend_missing)}

Frontend:
  • API calls: {len(frontend_api_calls)}
  • Tables referenced: {len(frontend_tables)}
  • Missing table refs: {len(frontend_missing)}

Issues:
  • Backend → Missing tables: {len(backend_missing)}
  • Frontend → Missing tables: {len(frontend_missing)}
  • Unused tables: {len(unused)}
""")

print("=" * 100)
print("SCAN COMPLETE")
print("=" * 100)
