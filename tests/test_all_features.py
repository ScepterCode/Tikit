"""
Comprehensive Feature Testing for All Dashboards
Tests Organizer, Attendee, and Admin features with Supabase
"""
import sys
sys.path.insert(0, 'apps/backend-fastapi')

from database import supabase_client
import requests
import json

BASE_URL = "http://localhost:8000"

class FeatureTester:
    def __init__(self):
        self.supabase = supabase_client.get_service_client()
        self.results = {
            "organizer": [],
            "attendee": [],
            "admin": [],
            "shared": []
        }
    
    def test(self, category, name, func):
        """Run a test and record result"""
        try:
            result = func()
            status = "✅" if result else "❌"
            self.results[category].append(f"{status} {name}")
            print(f"{status} {name}")
            return result
        except Exception as e:
            self.results[category].append(f"❌ {name}: {str(e)}")
            print(f"❌ {name}: {str(e)}")
            return False
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 60)
        print("TEST SUMMARY")
        print("=" * 60)
        
        for category, tests in self.results.items():
            if tests:
                passed = sum(1 for t in tests if t.startswith("✅"))
                total = len(tests)
                print(f"\n{category.upper()}: {passed}/{total} passed")
                for test in tests:
                    print(f"  {test}")

def main():
    tester = FeatureTester()
    
    print("=" * 60)
    print("TESTING ALL FEATURES WITH SUPABASE")
    print("=" * 60)
    
    # SHARED FEATURES
    print("\n📊 SHARED FEATURES")
    print("-" * 60)
    
    tester.test("shared", "Database Connection", lambda: tester.supabase is not None)
    
    tester.test("shared", "Users Table Exists", lambda: (
        tester.supabase.table('users').select('id').limit(1).execute().data is not None
    ))
    
    tester.test("shared", "Events Table Exists", lambda: (
        tester.supabase.table('events').select('id').limit(1).execute().data is not None
    ))
    
    tester.test("shared", "Payments Table Exists", lambda: (
        tester.supabase.table('payments').select('id').limit(1).execute().data is not None
    ))
    
    tester.test("shared", "Tickets Table Exists", lambda: (
        tester.supabase.table('tickets').select('id').limit(1).execute().data is not None
    ))
    
    # ORGANIZER FEATURES
    print("\n🎉 ORGANIZER FEATURES")
    print("-" * 60)
    
    # Get organizer user
    organizer = tester.supabase.table('users').select('*').eq('email', 'sc@gmail.com').execute()
    has_organizer = organizer.data and len(organizer.data) > 0
    
    tester.test("organizer", "Organizer User Exists", lambda: has_organizer)
    
    if has_organizer:
        org_id = organizer.data[0]['id']
        
        tester.test("organizer", "Organizer Has Wallet Balance", lambda: (
            organizer.data[0].get('wallet_balance') is not None
        ))
        
        tester.test("organizer", "Can Query Organizer Events", lambda: (
            tester.supabase.table('events').select('*').eq('host_id', org_id).execute().data is not None
        ))
        
        tester.test("organizer", "Organizer Has Events", lambda: (
            len(tester.supabase.table('events').select('*').eq('host_id', org_id).execute().data) > 0
        ))
        
        tester.test("organizer", "Can Query Organizer Payments", lambda: (
            tester.supabase.table('payments').select('*').eq('user_id', org_id).execute().data is not None
        ))
        
        tester.test("organizer", "Organizer Has Transaction History", lambda: (
            len(tester.supabase.table('payments').select('*').eq('user_id', org_id).execute().data) > 0
        ))
    
    # Test API endpoints
    tester.test("organizer", "GET /api/events Endpoint", lambda: (
        requests.get(f"{BASE_URL}/api/events").status_code == 200
    ))
    
    tester.test("organizer", "GET /health Endpoint", lambda: (
        requests.get(f"{BASE_URL}/health").status_code == 200
    ))
    
    # ATTENDEE FEATURES  
    print("\n🎫 ATTENDEE FEATURES")
    print("-" * 60)
    
    tester.test("attendee", "Can View Public Events", lambda: (
        len(tester.supabase.table('events').select('*').eq('status', 'active').execute().data) > 0
    ))
    
    tester.test("attendee", "Events Have Required Fields", lambda: (
        all(
            event.get('title') and event.get('venue_name') and event.get('event_date')
            for event in tester.supabase.table('events').select('*').limit(5).execute().data
        )
    ))
    
    tester.test("attendee", "Can Query Tickets", lambda: (
        tester.supabase.table('tickets').select('*').limit(1).execute().data is not None
    ))
    
    # ADMIN FEATURES
    print("\n👑 ADMIN FEATURES")
    print("-" * 60)
    
    admin_users = tester.supabase.table('users').select('*').eq('role', 'admin').execute()
    tester.test("admin", "Admin Users Exist", lambda: (
        admin_users.data and len(admin_users.data) > 0
    ))
    
    tester.test("admin", "Can Query All Users", lambda: (
        len(tester.supabase.table('users').select('id').execute().data) > 0
    ))
    
    tester.test("admin", "Can Query All Events", lambda: (
        len(tester.supabase.table('events').select('id').execute().data) > 0
    ))
    
    tester.test("admin", "Can Query All Payments", lambda: (
        tester.supabase.table('payments').select('id').limit(1).execute().data is not None
    ))
    
    # WALLET FEATURES
    print("\n💰 WALLET FEATURES")
    print("-" * 60)
    
    if has_organizer:
        org_id = organizer.data[0]['id']
        balance = organizer.data[0].get('wallet_balance', 0)
        
        tester.test("shared", "Wallet Balance is Numeric", lambda: (
            isinstance(balance, (int, float))
        ))
        
        tester.test("shared", "Wallet Balance >= 0", lambda: balance >= 0)
        
        payments = tester.supabase.table('payments').select('*').eq('user_id', org_id).execute()
        tester.test("shared", "Payments Have Amount Field", lambda: (
            all(p.get('amount') is not None for p in payments.data) if payments.data else True
        ))
        
        tester.test("shared", "Payments Have Status Field", lambda: (
            all(p.get('status') in ['pending', 'completed', 'failed'] for p in payments.data) if payments.data else True
        ))
    
    # DATA INTEGRITY
    print("\n🔒 DATA INTEGRITY")
    print("-" * 60)
    
    events = tester.supabase.table('events').select('*').limit(10).execute()
    tester.test("shared", "Events Have Valid IDs", lambda: (
        all(e.get('id') for e in events.data) if events.data else True
    ))
    
    tester.test("shared", "Events Have Host IDs", lambda: (
        all(e.get('host_id') for e in events.data) if events.data else True
    ))
    
    tester.test("shared", "Events Have Timestamps", lambda: (
        all(e.get('created_at') for e in events.data) if events.data else True
    ))
    
    # Print summary
    tester.print_summary()
    
    # Calculate overall pass rate
    all_tests = []
    for tests in tester.results.values():
        all_tests.extend(tests)
    
    passed = sum(1 for t in all_tests if t.startswith("✅"))
    total = len(all_tests)
    pass_rate = (passed / total * 100) if total > 0 else 0
    
    print(f"\n{'=' * 60}")
    print(f"OVERALL: {passed}/{total} tests passed ({pass_rate:.1f}%)")
    print(f"{'=' * 60}")
    
    return pass_rate >= 80  # 80% pass rate required

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
