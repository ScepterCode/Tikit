"""
Check actual frontend API calls vs backend endpoints
"""
import re
from pathlib import Path
from collections import defaultdict

print("=" * 100)
print("FRONTEND TO BACKEND API MISMATCH ANALYSIS")
print("=" * 100)

# ============================================================================
# 1. Scan Backend Endpoints
# ============================================================================
print("\n" + "=" * 100)
print("STEP 1: SCANNING BACKEND ENDPOINTS")
print("=" * 100)

backend_endpoints = {}
backend_path = Path('apps/backend-fastapi/routers')

for router_file in backend_path.glob('*.py'):
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
                # Normalize path
                path = path.strip()
                endpoint_key = f"{method.upper()} {path}"
                backend_endpoints[endpoint_key] = {
                    'file': router_file.name,
                    'method': method.upper(),
                    'path': path
                }
    except Exception as e:
        print(f"Error reading {router_file.name}: {e}")

print(f"\n✅ Found {len(backend_endpoints)} backend endpoints")

# Group by router file
by_file = defaultdict(list)
for endpoint, info in backend_endpoints.items():
    by_file[info['file']].append(f"{info['method']} {info['path']}")

for file, endpoints in sorted(by_file.items()):
    print(f"\n{file}: {len(endpoints)} endpoints")
    for ep in sorted(endpoints)[:5]:
        print(f"  • {ep}")
    if len(endpoints) > 5:
        print(f"  ... and {len(endpoints) - 5} more")

# ============================================================================
# 2. Scan Frontend API Calls
# ============================================================================
print("\n" + "=" * 100)
print("STEP 2: SCANNING FRONTEND API CALLS")
print("=" * 100)

frontend_api_calls = defaultdict(lambda: {'files': set(), 'methods': set()})
frontend_path = Path('apps/frontend/src')

for file_ext in ['*.tsx', '*.ts']:
    for frontend_file in frontend_path.rglob(file_ext):
        try:
            content = frontend_file.read_text(encoding='utf-8')
            rel_path = str(frontend_file.relative_to(frontend_path))
            
            # Find fetch calls
            fetch_patterns = [
                r'fetch\([`"\']([^`"\']+)[`"\']',
                r'fetch\(\s*`([^`]+)`',
            ]
            
            for pattern in fetch_patterns:
                matches = re.findall(pattern, content)
                for url in matches:
                    # Clean URL - remove template variables
                    clean_url = re.sub(r'\$\{[^}]+\}', ':id', url)
                    clean_url = clean_url.split('?')[0]  # Remove query params
                    
                    if '/api/' in clean_url:
                        frontend_api_calls[clean_url]['files'].add(rel_path)
                        frontend_api_calls[clean_url]['methods'].add('FETCH')
            
            # Find axios calls
            axios_pattern = r'axios\.(get|post|put|patch|delete)\([`"\']([^`"\']+)[`"\']'
            axios_matches = re.findall(axios_pattern, content)
            for method, url in axios_matches:
                clean_url = re.sub(r'\$\{[^}]+\}', ':id', url)
                clean_url = clean_url.split('?')[0]
                
                if '/api/' in clean_url:
                    frontend_api_calls[clean_url]['files'].add(rel_path)
                    frontend_api_calls[clean_url]['methods'].add(method.upper())
                    
        except Exception as e:
            pass

print(f"\n✅ Found {len(frontend_api_calls)} unique frontend API calls")

for url in sorted(list(frontend_api_calls.keys())[:20]):
    info = frontend_api_calls[url]
    methods = ', '.join(sorted(info['methods']))
    file_count = len(info['files'])
    print(f"  • {url} [{methods}] ({file_count} file(s))")

if len(frontend_api_calls) > 20:
    print(f"  ... and {len(frontend_api_calls) - 20} more")

# ============================================================================
# 3. Find Mismatches
# ============================================================================
print("\n" + "=" * 100)
print("STEP 3: FINDING MISMATCHES")
print("=" * 100)

def normalize_path(path):
    """Normalize path for comparison"""
    # Replace :id, {id}, ${id} with generic :param
    path = re.sub(r':\w+', ':param', path)
    path = re.sub(r'\{\w+\}', ':param', path)
    path = re.sub(r'\$\{\w+\}', ':param', path)
    # Remove leading/trailing slashes
    path = path.strip('/')
    return path

# Build normalized backend paths
backend_paths = {}
for endpoint, info in backend_endpoints.items():
    normalized = normalize_path(info['path'])
    key = f"{info['method']} /{normalized}"
    backend_paths[key] = info

print(f"\nBackend has {len(backend_paths)} normalized endpoints")

# Check each frontend call
mismatches = []
matches = []

for frontend_url, info in frontend_api_calls.items():
    # Extract path from URL (remove domain if present)
    if 'http' in frontend_url:
        # Extract path from full URL
        path = frontend_url.split('/api/')[-1]
        path = '/api/' + path
    else:
        path = frontend_url
    
    # Remove /api prefix for comparison
    path = path.replace('/api/', '')
    normalized_frontend = normalize_path(path)
    
    # Check if backend has this endpoint
    found = False
    for method in info['methods']:
        if method == 'FETCH':
            # Try GET first for fetch
            check_key = f"GET /{normalized_frontend}"
        else:
            check_key = f"{method} /{normalized_frontend}"
        
        if check_key in backend_paths:
            found = True
            matches.append({
                'frontend': frontend_url,
                'backend': check_key,
                'files': info['files']
            })
            break
    
    if not found:
        mismatches.append({
            'url': frontend_url,
            'methods': info['methods'],
            'files': info['files']
        })

# ============================================================================
# 4. Report Mismatches
# ============================================================================
print("\n" + "=" * 100)
print("MISMATCHES FOUND")
print("=" * 100)

if mismatches:
    print(f"\n❌ Found {len(mismatches)} frontend API calls with NO matching backend endpoint:\n")
    
    for i, mismatch in enumerate(mismatches, 1):
        print(f"{i}. {mismatch['url']}")
        print(f"   Methods: {', '.join(mismatch['methods'])}")
        files = list(mismatch['files'])[:2]
        print(f"   Used in: {', '.join(files)}")
        if len(mismatch['files']) > 2:
            print(f"   ... and {len(mismatch['files']) - 2} more files")
        print()
else:
    print("\n✅ No mismatches found! All frontend API calls have matching backend endpoints.")

print("\n" + "=" * 100)
print("MATCHES FOUND")
print("=" * 100)

print(f"\n✅ Found {len(matches)} frontend API calls that MATCH backend endpoints")

# ============================================================================
# 5. Summary
# ============================================================================
print("\n" + "=" * 100)
print("SUMMARY")
print("=" * 100)

print(f"""
Backend Endpoints: {len(backend_endpoints)}
Frontend API Calls: {len(frontend_api_calls)}
Matches: {len(matches)}
Mismatches: {len(mismatches)}

Status: {'❌ MISMATCHES FOUND' if mismatches else '✅ ALL MATCHED'}
""")

if mismatches:
    print("\n" + "=" * 100)
    print("RECOMMENDED ACTIONS")
    print("=" * 100)
    
    print("\nFor each mismatch, you need to either:")
    print("1. Create the missing backend endpoint")
    print("2. Update the frontend to use the correct endpoint")
    print("3. Remove the frontend code if it's not needed")

print("\n" + "=" * 100)
