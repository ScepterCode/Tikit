"""
Analyze the 22 API mismatches and categorize them
"""

print("=" * 100)
print("ANALYZING 22 API MISMATCHES")
print("=" * 100)

mismatches = [
    {
        'frontend': 'http://localhost:8001/api/events/:id',
        'file': 'pages/EventDetail.tsx',
        'issue': 'Wrong port (8001 instead of 8000) + wrong path format',
        'backend_has': 'GET /events/{event_id}',
        'fix': 'Change to /api/events/{id} and use port 8000'
    },
    {
        'frontend': 'http://localhost:8001/api/tickets/bulk-purchase/:id',
        'file': 'pages/PaymentSharePage.tsx',
        'issue': 'Wrong port + endpoint may not exist',
        'backend_has': 'Check if bulk-purchase endpoint exists',
        'fix': 'Update to correct port and verify endpoint'
    },
    {
        'frontend': 'http://localhost:8001/api/users/preferences',
        'file': 'pages/PreferencesPage.tsx',
        'issue': 'Wrong port + endpoint missing',
        'backend_has': 'No /users/preferences endpoint',
        'fix': 'Create backend endpoint or use different approach'
    },
    {
        'frontend': ':id/api/organizer/verify-ticket',
        'file': 'pages/organizer/OrganizerScanner.tsx',
        'issue': 'Malformed URL - :id at start',
        'backend_has': 'POST /tickets/verify',
        'fix': 'Change to /api/tickets/verify'
    },
    {
        'frontend': '/api/analytics/secret-event/:id',
        'file': 'components/analytics/SecretEventAnalytics.tsx',
        'issue': 'Path format',
        'backend_has': 'GET /analytics/secret-event/{event_id}',
        'fix': 'Already correct, just needs proper formatting'
    },
    {
        'frontend': '/api/anonymous-chat/*',
        'file': 'Multiple chat components',
        'issue': 'Multiple chat endpoints',
        'backend_has': 'All exist in anonymous_chat.py',
        'fix': 'Verify path formatting'
    },
    {
        'frontend': ':id/api/wallet/balance',
        'file': 'components/payment/*.tsx',
        'issue': 'Malformed URL - :id at start',
        'backend_has': 'GET /wallet/balance',
        'fix': 'Change to /api/wallet/balance'
    },
    {
        'frontend': 'http://localhost:8001/api/payments/*',
        'file': 'components/payment/PaymentModal.tsx',
        'issue': 'Wrong port (8001 instead of 8000)',
        'backend_has': 'All payment endpoints exist on port 8000',
        'fix': 'Change all to port 8000 or use relative URLs'
    },
]

print("\n" + "=" * 100)
print("ISSUE CATEGORIES")
print("=" * 100)

print("\n1. WRONG PORT (8001 instead of 8000) - 8 instances")
print("   Files affected:")
print("   - pages/EventDetail.tsx")
print("   - pages/PaymentSharePage.tsx")
print("   - pages/PreferencesPage.tsx")
print("   - components/payment/PaymentModal.tsx (5 endpoints)")

print("\n2. MALFORMED URLs (:id at start) - 6 instances")
print("   Files affected:")
print("   - pages/organizer/OrganizerScanner.tsx")
print("   - components/payment/PaymentModal.tsx")
print("   - components/payment/SecurePaymentModal.tsx")
print("   - components/tickets/PurchaseButton.tsx")

print("\n3. MISSING BACKEND ENDPOINTS - 2 instances")
print("   - /api/users/preferences")
print("   - /api/csrf-token")

print("\n4. PATH FORMAT ISSUES - 6 instances")
print("   - Anonymous chat endpoints (need verification)")

print("\n" + "=" * 100)
print("ROOT CAUSES")
print("=" * 100)

print("""
1. Hardcoded localhost:8001 instead of using environment variable
2. Template string errors causing :id to appear at start of URL
3. Missing backend endpoints for user preferences and CSRF
4. Inconsistent URL formatting between frontend and backend
""")

print("\n" + "=" * 100)
print("FIXES NEEDED")
print("=" * 100)

print("""
Priority 1: Fix Hardcoded Ports (8 files)
- Replace http://localhost:8001 with environment variable or relative URLs
- Files: EventDetail.tsx, PaymentSharePage.tsx, PreferencesPage.tsx, PaymentModal.tsx

Priority 2: Fix Malformed URLs (4 files)
- Fix template string construction
- Files: OrganizerScanner.tsx, PaymentModal.tsx, SecurePaymentModal.tsx, PurchaseButton.tsx

Priority 3: Create Missing Endpoints (2 endpoints)
- Create /api/users/preferences endpoint
- Create /api/csrf-token endpoint (or remove if not needed)

Priority 4: Verify Anonymous Chat (6 endpoints)
- Check if anonymous chat endpoints match backend
""")

print("\n" + "=" * 100)
