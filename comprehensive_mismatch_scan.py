"""
Comprehensive Deep Scan: Frontend-Backend-Database Mismatch Analysis
Identifies all endpoint mismatches, missing tables, and column mismatches
"""
import os
import re
from pathlib import Path
from collections import defaultdict
from supabase import create_client
from dotenv import load_dotenv

# Load environment variables
load_dotenv('apps/backend-fastapi/.env')

url = os.getenv('SUPABASE_URL')
key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

print("=" * 100)
print("COMPREHENSIVE DEEP SCAN: Frontend-Backend-Database Mismatch Analysis")
print("=" * 100)

# Initialize Supabase
try:
    supabase = create_client(url, key)
    print("✅ Connected to Supabase\n")
except Exception as e:
    print(f"❌ Failed to connect to Supabase: {e}\n")
    supabase = None

# ============================================================================
# PART 1: Get Database Schema
# ============================================================================
print("=" * 100)
print("PART 1: DATABASE SCHEMA ANALYSIS")
print("=" * 100)

db_tables = {}
known_tables = [
    'users', 'events', 'tickets', 'bookings', 'payments',
    'event_preferences', 'user_preferences', 'notifications',
    'realtime_notifications', 'spray_money', 'referrals',
    'memberships', 'secret_events', 'secret_event_invites',
    'anonymous_chat_messages', 'event_analytics', 'ticket_tiers',
    'bulk_purchases', 'bank_accounts', 'withdrawals', 'wallet_transactions',
    'savings_goals', 'auto_save_rules', 'spray_competitions',
    'multi_wallets', 'transaction_history'
]

if supabase:
    for table in known_tables:
        try:
            result = supabase.table(table).select('*').limit(1).execute()
            if result.data and len(result.data) > 0:
                db_tables[table] = list(result.data[0].keys())
            else:
                # Table exists but empty
                db_tables[table] = []
        except Exception as e:
            error_msg = str(e).lower()
            if 'does not exist' in error_msg or 'not found' in error_msg:
                pass  # Table doesn't exist
            else:
                print(f"⚠️  Error accessing '{table}': {e}")

print(f"\n✅ Found {len(db_tables)} tables in Supabase:")
for table in sorted(db_tables.keys()):
    cols = db_tables[table]
    print(f"   • {table}: {len(cols)} columns")
    if cols:
        print(f"     Columns: {', '.join(cols[:10])}{' ...' if len(cols) > 10 else ''}")

# ============================================================================
# PART 2: Scan Backend API Endpoints
# ============================================================================
print("\n" + "=" * 100)
print("PART 2: BACKEND API ENDPOINTS ANALYSIS")
print("=" * 100)

backend_endpoints = {}
backend_tables_used = defaultdict(set)
backend_path = Path('apps/backend-fastapi/routers')

for router_file in backend_path.glob('*.py'):
    try:
        content = router_file.read_text(encoding='utf-8')
        
        # Find route decorators with various patterns
        patterns = [
            r'@router\.(get|post|put|patch|delete)\(["\']([^"\']+)["\']',
            r'@app\.(get|post|put|patch|delete)\(["\']([^"\']+)["\']',
        ]
        
        for pattern in patterns:
            routes = re.findall(pattern, content)
            for method, path in routes:
                # Clean up path
                path = path.split('?')[0]  # Remove query params
                endpoint_key = f"{method.upper()} {path}"
                
                if endpoint_key not in backend_endpoints:
                    backend_endpoints[endpoint_key] = {
                        'file': router_file.name,
                        'tables': set(),
                        'line': 0
                    }
        
        # Find table references
        table_refs = re.findall(r'\.table\(["\']([^"\']+)["\']', content)
        table_refs += re.findall(r'\.from\(["\']([^"\']+)["\']', content)
        
        for table in table_refs:
            backend_tables_used[table].add(router_file.name)
            # Associate with endpoints in this file
            for endpoint_key in backend_endpoints:
                if backend_endpoints[endpoint_key]['file'] == router_file.name:
                    backend_endpoints[endpoint_key]['tables'].add(table)
                    
    except Exception as e:
        print(f"⚠️  Error reading {router_file.name}: {e}")

print(f"\n✅ Found {len(backend_endpoints)} backend endpoints:")
for endpoint in sorted(backend_endpoints.keys())[:30]:
    info = backend_endpoints[endpoint]
    tables_str = f" → {', '.join(sorted(info['tables']))}" if info['tables'] else ""
    print(f"   • {endpoint} ({info['file']}){tables_str}")

if len(backend_endpoints) > 30:
    print(f"   ... and {len(backend_endpoints) - 30} more endpoints")

print(f"\n✅ Backend uses {len(backend_tables_used)} tables:")
for table in sorted(backend_tables_used.keys()):
    files = ', '.join(sorted(backend_tables_used[table]))
    print(f"   • {table} (used in: {files})")

# ============================================================================
# PART 3: Scan Frontend API Calls
# ============================================================================
print("\n" + "=" * 100)
print("PART 3: FRONTEND API CALLS ANALYSIS")
print("=" * 100)

frontend_api_calls = defaultdict(lambda: {'files': set(), 'methods': set()})
frontend_supabase_tables = defaultdict(set)
frontend_path = Path('apps/frontend/src')

for file_ext in ['*.tsx', '*.ts', '*.jsx', '*.js']:
    for frontend_file in frontend_path.rglob(file_ext):
        try:
            content = frontend_file.read_text(encoding='utf-8')
            rel_path = str(frontend_file.relative_to(frontend_path))
            
            # Find fetch calls to backend
            fetch_patterns = [
                r'fetch\([`"\']([^`"\']+)[`"\']',
                r'axios\.(get|post|put|patch|delete)\([`"\']([^`"\']+)[`"\']',
                r'api\.(get|post|put|patch|delete)\([`"\']([^`"\']+)[`"\']',
            ]
            
            for pattern in fetch_patterns:
                matches = re.findall(pattern, content)
                for match in matches:
                    if isinstance(match, tuple):
                        if len(match) == 2:
                            method, url = match
                            method = method.upper()
                        else:
                            url = match[0]
                            method = 'GET'
                    else:
                        url = match
                        method = 'FETCH'
                    
                    # Filter for API calls
                    if '/api/' in url or url.startswith('/'):
                        # Clean URL
                        url = url.split('?')[0].split('${')[0].split('`')[0]
                        frontend_api_calls[url]['files'].add(rel_path)
                        frontend_api_calls[url]['methods'].add(method)
            
            # Find direct Supabase table calls
            supabase_patterns = [
                r'supabase\.from\([`"\']([^`"\']+)[`"\']',
                r'\.from\([`"\']([^`"\']+)[`"\']',
            ]
            
            for pattern in supabase_patterns:
                tables = re.findall(pattern, content)
                for table in tables:
                    frontend_supabase_tables[table].add(rel_path)
                    
        except Exception as e:
            pass

print(f"\n✅ Found {len(frontend_api_calls)} unique frontend API calls:")
for url in sorted(list(frontend_api_calls.keys())[:30]):
    info = frontend_api_calls[url]
    methods = ', '.join(sorted(info['methods']))
    file_count = len(info['files'])
    print(f"   • {url} [{methods}] (used in {file_count} file(s))")

if len(frontend_api_calls) > 30:
    print(f"   ... and {len(frontend_api_calls) - 30} more API calls")

print(f"\n✅ Frontend directly accesses {len(frontend_supabase_tables)} Supabase tables:")
for table in sorted(frontend_supabase_tables.keys()):
    file_count = len(frontend_supabase_tables[table])
    print(f"   • {table} (used in {file_count} file(s))")

# ============================================================================
# PART 4: MISMATCH ANALYSIS
# ============================================================================
print("\n" + "=" * 100)
print("PART 4: MISMATCH ANALYSIS")
print("=" * 100)

# 4.1: Frontend calls to non-existent backend endpoints
print("\n📊 4.1: Frontend API calls with NO matching backend endpoint:")
print("-" * 100)

mismatches_found = False
for frontend_url in sorted(frontend_api_calls.keys()):
    # Normalize URL for comparison
    normalized_url = frontend_url.replace('${', '').replace('}', '').replace('`', '')
    normalized_url = re.sub(r'/\d+', '/:id', normalized_url)  # Replace IDs with :id
    normalized_url = re.sub(r'/[a-f0-9-]{36}', '/:id', normalized_url)  # Replace UUIDs
    
    # Check if any backend endpoint matches
    found_match = False
    for backend_endpoint in backend_endpoints.keys():
        backend_path = backend_endpoint.split(' ', 1)[1]
        backend_path_normalized = re.sub(r'\{[^}]+\}', ':id', backend_path)
        
        if normalized_url in backend_path or backend_path_normalized in normalized_url:
            found_match = True
            break
    
    if not found_match and '/api/' in frontend_url:
        mismatches_found = True
        info = frontend_api_calls[frontend_url]
        methods = ', '.join(sorted(info['methods']))
        files = list(info['files'])[:3]
        print(f"❌ {frontend_url} [{methods}]")
        print(f"   Used in: {', '.join(files)}{' ...' if len(info['files']) > 3 else ''}")

if not mismatches_found:
    print("✅ No mismatches found - all frontend API calls have backend endpoints")

# 4.2: Backend uses non-existent database tables
print("\n📊 4.2: Backend references to NON-EXISTENT database tables:")
print("-" * 100)

missing_tables = []
for table in sorted(backend_tables_used.keys()):
    if table not in db_tables:
        missing_tables.append(table)
        files = ', '.join(sorted(backend_tables_used[table]))
        print(f"❌ Table '{table}' does NOT exist in database")
        print(f"   Referenced in: {files}")

if not missing_tables:
    print("✅ No missing tables - all backend table references exist in database")

# 4.3: Frontend directly accesses non-existent tables
print("\n📊 4.3: Frontend Supabase calls to NON-EXISTENT tables:")
print("-" * 100)

frontend_missing_tables = []
for table in sorted(frontend_supabase_tables.keys()):
    if table not in db_tables:
        frontend_missing_tables.append(table)
        file_count = len(frontend_supabase_tables[table])
        files = list(frontend_supabase_tables[table])[:3]
        print(f"❌ Table '{table}' does NOT exist in database")
        print(f"   Used in {file_count} file(s): {', '.join(files)}{' ...' if file_count > 3 else ''}")

if not frontend_missing_tables:
    print("✅ No missing tables - all frontend Supabase calls reference existing tables")

# 4.4: Unused backend endpoints
print("\n📊 4.4: Backend endpoints NOT called by frontend:")
print("-" * 100)

unused_endpoints = []
for backend_endpoint in sorted(backend_endpoints.keys()):
    method, path = backend_endpoint.split(' ', 1)
    
    # Check if frontend calls this endpoint
    found_in_frontend = False
    for frontend_url in frontend_api_calls.keys():
        # Normalize for comparison
        if path.replace('{', '').replace('}', '') in frontend_url or \
           frontend_url.replace('${', '').replace('}', '') in path:
            found_in_frontend = True
            break
    
    if not found_in_frontend:
        unused_endpoints.append(backend_endpoint)
        info = backend_endpoints[backend_endpoint]
        print(f"⚠️  {backend_endpoint} ({info['file']})")

if len(unused_endpoints) > 20:
    print(f"   ... showing first 20 of {len(unused_endpoints)} unused endpoints")

# 4.5: Database tables not used anywhere
print("\n📊 4.5: Database tables NOT used by backend or frontend:")
print("-" * 100)

unused_tables = []
for table in sorted(db_tables.keys()):
    if table not in backend_tables_used and table not in frontend_supabase_tables:
        unused_tables.append(table)
        print(f"⚠️  Table '{table}' exists but is not referenced anywhere")

if not unused_tables:
    print("✅ All database tables are being used")

# ============================================================================
# SUMMARY
# ============================================================================
print("\n" + "=" * 100)
print("SUMMARY")
print("=" * 100)

print(f"""
📊 Statistics:
   • Database Tables: {len(db_tables)}
   • Backend Endpoints: {len(backend_endpoints)}
   • Frontend API Calls: {len(frontend_api_calls)}
   • Backend Table References: {len(backend_tables_used)}
   • Frontend Supabase Tables: {len(frontend_supabase_tables)}

❌ Issues Found:
   • Frontend calls to missing backend endpoints: {sum(1 for url in frontend_api_calls if '/api/' in url and not any(url in be for be in backend_endpoints))}
   • Backend references to missing tables: {len(missing_tables)}
   • Frontend references to missing tables: {len(frontend_missing_tables)}
   • Unused backend endpoints: {len(unused_endpoints)}
   • Unused database tables: {len(unused_tables)}
""")

print("=" * 100)
print("SCAN COMPLETE")
print("=" * 100)
