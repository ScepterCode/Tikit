"""
Deep trace of all frontend API calls to backend endpoints
Reads actual file content and extracts real API calls
"""
import re
import ast
from pathlib import Path
from collections import defaultdict

print("=" * 100)
print("DEEP TRACE: Frontend API Calls to Backend Endpoints")
print("=" * 100)

# ============================================================================
# STEP 1: Build complete backend endpoint map
# ============================================================================
print("\n" + "=" * 100)
print("STEP 1: Building Backend Endpoint Map")
print("=" * 100)

backend_endpoints = {}
backend_path = Path('apps/backend-fastapi/routers')

for router_file in backend_path.glob('*.py'):
    try:
        content = router_file.read_text(encoding='utf-8')
        
        # Extract router prefix if any
        router_prefix_match = re.search(r'router\s*=\s*APIRouter\([^)]*prefix=["\']([^"\']+)["\']', content)
        router_prefix = router_prefix_match.group(1) if router_prefix_match else ''
        
        # Find all route decorators
        route_pattern = r'@router\.(get|post|put|patch|delete)\(["\']([^"\']+)["\']'
        routes = re.findall(route_pattern, content)
        
        for method, path in routes:
            full_path = router_prefix + path if router_prefix else path
            full_path = full_path.strip('/')
            
            endpoint_key = f"{method.upper()} /{full_path}"
            backend_endpoints[endpoint_key] = {
                'file': router_file.name,
                'method': method.upper(),
                'path': f'/{full_path}',
                'router_prefix': router_prefix
            }
    except Exception as e:
        print(f"Error reading {router_file.name}: {e}")

print(f"\n✅ Mapped {len(backend_endpoints)} backend endpoints")

# Show sample
print("\nSample endpoints:")
for i, (key, info) in enumerate(list(backend_endpoints.items())[:10]):
    print(f"  {key} ({info['file']})")

# ============================================================================
# STEP 2: Extract ALL API calls from frontend
# ============================================================================
print("\n" + "=" * 100)
print("STEP 2: Extracting Frontend API Calls")
print("=" * 100)

frontend_calls = []
frontend_path = Path('apps/frontend/src')

# Patterns to match API calls
patterns = {
    'fetch': r'fetch\s*\(\s*[`"\']([^`"\']+)[`"\']',
    'fetch_template': r'fetch\s*\(\s*`([^`]+)`',
    'axios_get': r'axios\.get\s*\(\s*[`"\']([^`"\']+)[`"\']',
    'axios_post': r'axios\.post\s*\(\s*[`"\']([^`"\']+)[`"\']',
    'axios_put': r'axios\.put\s*\(\s*[`"\']([^`"\']+)[`"\']',
    'axios_delete': r'axios\.delete\s*\(\s*[`"\']([^`"\']+)[`"\']',
}

for tsx_file in frontend_path.rglob('*.tsx'):
    try:
        content = tsx_file.read_text(encoding='utf-8')
        rel_path = str(tsx_file.relative_to(frontend_path))
        
        # Extract all API calls
        for pattern_name, pattern in patterns.items():
            matches = re.findall(pattern, content)
            for url in matches:
                # Only process if it looks like an API call
                if '/api/' in url or url.startswith('/'):
                    frontend_calls.append({
                        'file': rel_path,
                        'url': url,
                        'pattern': pattern_name,
                        'line_context': None  # We'll add this if needed
                    })
    except Exception as e:
        pass

print(f"\n✅ Found {len(frontend_calls)} API call instances")

# ============================================================================
# STEP 3: Normalize and deduplicate
# ============================================================================
print("\n" + "=" * 100)
print("STEP 3: Normalizing API Calls")
print("=" * 100)

def normalize_url(url):
    """Normalize URL for comparison"""
    # Remove protocol and domain
    if 'http' in url:
        url = '/' + url.split('/api/')[-1] if '/api/' in url else url
    
    # Replace template variables
    url = re.sub(r'\$\{[^}]+\}', '{id}', url)
    url = re.sub(r':\w+', '{id}', url)
    
    # Remove query params
    url = url.split('?')[0]
    
    # Ensure starts with /
    if not url.startswith('/'):
        url = '/' + url
    
    # Remove /api prefix for comparison
    if url.startswith('/api/'):
        url = url[4:]  # Remove '/api'
    
    return url.strip('/')

unique_calls = {}
for call in frontend_calls:
    normalized = normalize_url(call['url'])
    if normalized not in unique_calls:
        unique_calls[normalized] = {
            'original_urls': [],
            'files': set(),
            'patterns': set()
        }
    unique_calls[normalized]['original_urls'].append(call['url'])
    unique_calls[normalized]['files'].add(call['file'])
    unique_calls[normalized]['patterns'].add(call['pattern'])

print(f"\n✅ Normalized to {len(unique_calls)} unique API calls")

# ============================================================================
# STEP 4: Match frontend calls to backend endpoints
# ============================================================================
print("\n" + "=" * 100)
print("STEP 4: Matching Frontend → Backend")
print("=" * 100)

def paths_match(frontend_path, backend_path):
    """Check if paths match (accounting for parameters)"""
    # Normalize both
    f_parts = frontend_path.strip('/').split('/')
    b_parts = backend_path.strip('/').split('/')
    
    if len(f_parts) != len(b_parts):
        return False
    
    for f, b in zip(f_parts, b_parts):
        # If backend has {param} or frontend has {id}, they match
        if '{' in f or '{' in b:
            continue
        if f != b:
            return False
    
    return True

matched = []
unmatched = []

for frontend_url, info in unique_calls.items():
    # Try to find matching backend endpoint
    found = False
    
    # Try GET first (most common)
    for method in ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']:
        for backend_key, backend_info in backend_endpoints.items():
            if backend_info['method'] == method:
                backend_path = backend_info['path'].strip('/')
                if paths_match(frontend_url, backend_path):
                    matched.append({
                        'frontend': frontend_url,
                        'backend': backend_key,
                        'files': info['files']
                    })
                    found = True
                    break
        if found:
            break
    
    if not found:
        unmatched.append({
            'frontend': frontend_url,
            'original_urls': info['original_urls'][:3],
            'files': list(info['files'])[:3],
            'patterns': info['patterns']
        })

print(f"\n✅ Matched: {len(matched)}")
print(f"❌ Unmatched: {len(unmatched)}")

# ============================================================================
# STEP 5: Report unmatched calls
# ============================================================================
print("\n" + "=" * 100)
print("UNMATCHED API CALLS (Frontend calls with NO backend endpoint)")
print("=" * 100)

if unmatched:
    print(f"\n❌ Found {len(unmatched)} frontend API calls with NO matching backend:\n")
    
    for i, call in enumerate(unmatched, 1):
        print(f"{i}. Frontend calls: /{call['frontend']}")
        print(f"   Original URLs: {call['original_urls']}")
        print(f"   Files: {', '.join(call['files'])}")
        print(f"   Patterns: {', '.join(call['patterns'])}")
        
        # Try to suggest closest match
        frontend_parts = call['frontend'].split('/')
        suggestions = []
        for backend_key, backend_info in backend_endpoints.items():
            backend_parts = backend_info['path'].strip('/').split('/')
            if len(backend_parts) == len(frontend_parts):
                # Count matching parts
                matches = sum(1 for f, b in zip(frontend_parts, backend_parts) 
                             if f == b or '{' in f or '{' in b)
                if matches >= len(frontend_parts) - 1:  # Allow 1 difference
                    suggestions.append(backend_key)
        
        if suggestions:
            print(f"   💡 Possible matches: {suggestions[:2]}")
        print()
else:
    print("\n✅ All frontend API calls have matching backend endpoints!")

# ============================================================================
# STEP 6: Show matched calls (sample)
# ============================================================================
print("\n" + "=" * 100)
print("MATCHED API CALLS (Sample)")
print("=" * 100)

print(f"\n✅ Showing first 20 of {len(matched)} matched calls:\n")
for i, match in enumerate(matched[:20], 1):
    files_str = ', '.join(list(match['files'])[:2])
    if len(match['files']) > 2:
        files_str += f" +{len(match['files'])-2} more"
    print(f"{i}. /{match['frontend']}")
    print(f"   -> {match['backend']}")
    print(f"   Files: {files_str}")
    print()

# ============================================================================
# SUMMARY
# ============================================================================
print("=" * 100)
print("SUMMARY")
print("=" * 100)

print(f"""
Backend Endpoints: {len(backend_endpoints)}
Frontend API Calls (total): {len(frontend_calls)}
Frontend API Calls (unique): {len(unique_calls)}
Matched: {len(matched)}
Unmatched: {len(unmatched)}

Match Rate: {len(matched)/(len(matched)+len(unmatched))*100:.1f}%

Status: {'❌ MISMATCHES FOUND - NEED FIXING' if unmatched else '✅ ALL API CALLS MATCHED'}
""")

print("=" * 100)
