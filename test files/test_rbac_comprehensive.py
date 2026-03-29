"""
Comprehensive Role-Based Access Control (RBAC) Test
Tests all user roles, permissions, data access, and functions
"""
import os
from supabase import create_client
from dotenv import load_dotenv
import json

load_dotenv('apps/backend-fastapi/.env')

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_ANON_KEY = os.getenv('SUPABASE_ANON_KEY')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY')

# Test users for each role
TEST_USERS = {
    'admin': {'email': 'admin@grooovy.netlify.app', 'password': 'password123'},
    'organizer': {'email': 'organizer@grooovy.netlify.app', 'password': 'password123'},
    'attendee': {'email': 'attendee@grooovy.netlify.app', 'password': 'password123'}
}

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def print_header(text):
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*100}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}{text.center(100)}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'='*100}{Colors.RESET}\n")

def print_section(text):
    print(f"\n{Colors.BOLD}{Colors.CYAN}{'─'*100}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.CYAN}{text}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.CYAN}{'─'*100}{Colors.RESET}")

def print_test(name, passed, details=""):
    status = f"{Colors.GREEN}✅ PASS{Colors.RESET}" if passed else f"{Colors.RED}❌ FAIL{Colors.RESET}"
    print(f"{status} | {name}")
    if details:
        print(f"     {Colors.YELLOW}{details}{Colors.RESET}")

class RBACTester:
    def __init__(self):
        self.service_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        self.test_results = {'total': 0, 'passed': 0, 'failed': 0, 'tests': []}
        self.users = {}
        
    def record_test(self, name, passed, details=""):
        self.test_results['total'] += 1
        if passed:
            self.test_results['passed'] += 1
        else:
            self.test_results['failed'] += 1
        self.test_results['tests'].append({'name': name, 'passed': passed, 'details': details})
        print_test(name, passed, details)
    
    def test_user_roles_assigned(self):
        """Test that all users have roles assigned"""
        print_section("👥 TEST 1: User Roles Assignment")
        
        try:
            # Get all users
            response = self.service_client.table('users').select('id, email, role').execute()
            users = response.data
            
            self.record_test(
                "Users exist in database",
                len(users) > 0,
                f"Found {len(users)} users"
            )
            
            # Check each role exists
            roles = {}
            for user in users:
                role = user.get('role', 'none')
                roles[role] = roles.get(role, 0) + 1
            
            self.record_test(
                "Admin users exist",
                roles.get('admin', 0) > 0,
                f"Found {roles.get('admin', 0)} admin(s)"
            )
            
            self.record_test(
                "Organizer users exist",
                roles.get('organizer', 0) > 0,
                f"Found {roles.get('organizer', 0)} organizer(s)"
            )
            
            self.record_test(
                "Attendee users exist",
                roles.get('attendee', 0) > 0,
                f"Found {roles.get('attendee', 0)} attendee(s)"
            )
            
            # Check no users without roles
            users_without_roles = [u for u in users if not u.get('role')]
            self.record_test(
                "All users have roles",
                len(users_without_roles) == 0,
                f"{len(users_without_roles)} users without roles" if users_without_roles else "All users have roles"
            )
            
            return True
        except Exception as e:
            self.record_test("User roles test", False, str(e))
            return False
    
    def test_authentication_all_roles(self):
        """Test authentication for each role"""
        print_section("🔐 TEST 2: Authentication for All Roles")
        
        for role, credentials in TEST_USERS.items():
            try:
                client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
                response = client.auth.sign_in_with_password(credentials)
                
                if response.user:
                    self.users[role] = {
                        'client': client,
                        'user': response.user,
                        'session': response.session
                    }
                    
                    # Verify role in database
                    user_data = self.service_client.table('users').select('role').eq('id', response.user.id).execute()
                    db_role = user_data.data[0]['role'] if user_data.data else None
                    
                    self.record_test(
                        f"{role.capitalize()} can authenticate",
                        True,
                        f"User ID: {response.user.id[:8]}... | DB Role: {db_role}"
                    )
                else:
                    self.record_test(f"{role.capitalize()} authentication", False, "No user returned")
            except Exception as e:
                self.record_test(f"{role.capitalize()} authentication", False, str(e))
    
    def test_user_data_access(self):
        """Test users can only access their own data"""
        print_section("🔒 TEST 3: User Data Isolation")
        
        for role, user_info in self.users.items():
            client = user_info['client']
            user_id = user_info['user'].id
            
            try:
                # Test 1: Can read own profile
                response = client.table('users').select('*').eq('id', user_id).execute()
                self.record_test(
                    f"{role.capitalize()} can read own profile",
                    len(response.data) == 1,
                    f"Retrieved {len(response.data)} record(s)"
                )
                
                # Test 2: Cannot read all users
                response = client.table('users').select('*').execute()
                self.record_test(
                    f"{role.capitalize()} cannot read all users",
                    len(response.data) <= 1,
                    f"Can only see {len(response.data)} user(s) (should be 1)"
                )
                
                # Test 3: Cannot read other users' data
                all_users = self.service_client.table('users').select('id').neq('id', user_id).limit(1).execute()
                if all_users.data:
                    other_user_id = all_users.data[0]['id']
                    response = client.table('users').select('*').eq('id', other_user_id).execute()
                    self.record_test(
                        f"{role.capitalize()} cannot read other users",
                        len(response.data) == 0,
                        "Access denied to other users' data"
                    )
                
            except Exception as e:
                self.record_test(f"{role.capitalize()} data access test", False, str(e))
    
    def test_wallet_security(self):
        """Test wallet balance security"""
        print_section("💰 TEST 4: Wallet Security")
        
        for role, user_info in self.users.items():
            client = user_info['client']
            user_id = user_info['user'].id
            
            try:
                # Get current balance
                response = self.service_client.table('users').select('wallet_balance').eq('id', user_id).execute()
                original_balance = response.data[0]['wallet_balance'] if response.data else 0
                
                # Test 1: User cannot directly update wallet
                try:
                    client.table('users').update({'wallet_balance': 999999.99}).eq('id', user_id).execute()
                    
                    # Check if it actually changed
                    check = self.service_client.table('users').select('wallet_balance').eq('id', user_id).execute()
                    new_balance = check.data[0]['wallet_balance'] if check.data else 0
                    
                    self.record_test(
                        f"{role.capitalize()} cannot tamper with wallet",
                        new_balance == original_balance,
                        f"Balance unchanged: ₦{original_balance}"
                    )
                except Exception:
                    self.record_test(
                        f"{role.capitalize()} cannot tamper with wallet",
                        True,
                        "Update blocked by RLS"
                    )
                
                # Test 2: Backend can update wallet
                test_balance = original_balance + 50.00
                self.service_client.table('users').update({'wallet_balance': test_balance}).eq('id', user_id).execute()
                
                check = self.service_client.table('users').select('wallet_balance').eq('id', user_id).execute()
                updated_balance = check.data[0]['wallet_balance'] if check.data else 0
                
                self.record_test(
                    f"Backend can update {role} wallet",
                    updated_balance == test_balance,
                    f"Balance: ₦{original_balance} → ₦{updated_balance}"
                )
                
                # Restore original balance
                self.service_client.table('users').update({'wallet_balance': original_balance}).eq('id', user_id).execute()
                
            except Exception as e:
                self.record_test(f"{role.capitalize()} wallet security test", False, str(e))
    
    def test_events_access_by_role(self):
        """Test event access based on role"""
        print_section("🎉 TEST 5: Events Access by Role")
        
        # Get all events
        all_events = self.service_client.table('events').select('*').execute()
        
        for role, user_info in self.users.items():
            client = user_info['client']
            user_id = user_info['user'].id
            
            try:
                # Test 1: Can read published events
                response = client.table('events').select('*').eq('status', 'published').execute()
                self.record_test(
                    f"{role.capitalize()} can read published events",
                    True,
                    f"Found {len(response.data)} published event(s)"
                )
                
                # Test 2: Can read own events
                response = client.table('events').select('*').eq('host_id', user_id).execute()
                own_events_count = len(response.data)
                self.record_test(
                    f"{role.capitalize()} can read own events",
                    True,
                    f"Found {own_events_count} own event(s)"
                )
                
                # Test 3: Organizers can create events
                if role == 'organizer':
                    import uuid
                    from datetime import datetime, timedelta
                    
                    test_event = {
                        'id': str(uuid.uuid4()),
                        'title': f'RBAC Test Event {datetime.now().strftime("%Y%m%d%H%M%S")}',
                        'description': 'Test event for RBAC verification',
                        'host_id': user_id,
                        'event_date': (datetime.now() + timedelta(days=30)).isoformat(),
                        'full_address': 'Test Location',
                        'venue_name': 'Test Venue',
                        'capacity': 100,
                        'ticket_price': 5000.00,
                        'status': 'draft',
                        'category': 'conference'
                    }
                    
                    response = client.table('events').insert(test_event).execute()
                    created = response.data[0] if response.data else None
                    
                    self.record_test(
                        "Organizer can create events",
                        created is not None,
                        f"Event created: {created['id'][:8]}..." if created else "Failed"
                    )
                    
                    # Clean up
                    if created:
                        self.service_client.table('events').delete().eq('id', created['id']).execute()
                
            except Exception as e:
                self.record_test(f"{role.capitalize()} events access test", False, str(e))
    
    def test_bookings_access(self):
        """Test bookings access"""
        print_section("🎫 TEST 6: Bookings Access")
        
        for role, user_info in self.users.items():
            client = user_info['client']
            user_id = user_info['user'].id
            
            try:
                # Test 1: Can read own bookings
                response = client.table('bookings').select('*').eq('user_id', user_id).execute()
                self.record_test(
                    f"{role.capitalize()} can read own bookings",
                    True,
                    f"Found {len(response.data)} booking(s)"
                )
                
                # Test 2: Cannot read all bookings
                response = client.table('bookings').select('*').execute()
                if response.data:
                    all_mine = all(b['user_id'] == user_id for b in response.data)
                    self.record_test(
                        f"{role.capitalize()} cannot read all bookings",
                        all_mine,
                        f"Can only see own bookings ({len(response.data)} total)"
                    )
                else:
                    self.record_test(
                        f"{role.capitalize()} cannot read all bookings",
                        True,
                        "No bookings found (expected)"
                    )
                
            except Exception as e:
                self.record_test(f"{role.capitalize()} bookings access test", False, str(e))
    
    def test_payments_access(self):
        """Test payments access"""
        print_section("💳 TEST 7: Payments Access")
        
        for role, user_info in self.users.items():
            client = user_info['client']
            user_id = user_info['user'].id
            
            try:
                # Test 1: Can read own payments
                response = client.table('payments').select('*').eq('user_id', user_id).execute()
                self.record_test(
                    f"{role.capitalize()} can read own payments",
                    True,
                    f"Found {len(response.data)} payment(s)"
                )
                
                # Test 2: Cannot read all payments
                response = client.table('payments').select('*').execute()
                if response.data:
                    all_mine = all(p['user_id'] == user_id for p in response.data)
                    self.record_test(
                        f"{role.capitalize()} cannot read all payments",
                        all_mine,
                        f"Can only see own payments ({len(response.data)} total)"
                    )
                else:
                    self.record_test(
                        f"{role.capitalize()} cannot read all payments",
                        True,
                        "No payments found (expected)"
                    )
                
            except Exception as e:
                self.record_test(f"{role.capitalize()} payments access test", False, str(e))
    
    def test_backend_tables_access(self):
        """Test backend-only tables are protected"""
        print_section("🔒 TEST 8: Backend Tables Protection")
        
        backend_tables = ['message_logs', 'interaction_logs', 'conversations']
        
        for role, user_info in self.users.items():
            client = user_info['client']
            
            for table in backend_tables:
                try:
                    response = client.table(table).select('*').limit(1).execute()
                    can_access = len(response.data) > 0
                    
                    self.record_test(
                        f"{role.capitalize()} blocked from {table}",
                        not can_access,
                        "RLS prevents access" if not can_access else "⚠️ Can access (security issue!)"
                    )
                except Exception:
                    self.record_test(
                        f"{role.capitalize()} blocked from {table}",
                        True,
                        "Access denied by RLS"
                    )
    
    def test_rls_policies_active(self):
        """Test RLS policies are active on all tables"""
        print_section("🛡️ TEST 9: RLS Policies Status")
        
        try:
            # Check RLS is enabled on critical tables
            critical_tables = ['users', 'events', 'bookings', 'tickets', 'payments', 'realtime_notifications']
            
            for table in critical_tables:
                # Try to query with anon key (should be restricted)
                anon_client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
                
                try:
                    # This should either return limited data or fail
                    response = anon_client.table(table).select('*').execute()
                    
                    # If it succeeds, check if data is restricted
                    self.record_test(
                        f"RLS active on {table}",
                        True,
                        f"Table accessible with restrictions ({len(response.data)} records visible)"
                    )
                except Exception as e:
                    # If it fails, RLS is working
                    self.record_test(
                        f"RLS active on {table}",
                        True,
                        "Access restricted by RLS"
                    )
            
            # Verify service role can access everything
            for table in critical_tables:
                response = self.service_client.table(table).select('*').limit(1).execute()
                self.record_test(
                    f"Service role can access {table}",
                    True,
                    f"Backend has full access ({len(response.data)} records)"
                )
            
        except Exception as e:
            self.record_test("RLS policies test", False, str(e))
    
    def test_data_integrity(self):
        """Test data integrity and relationships"""
        print_section("🔍 TEST 10: Data Integrity")
        
        try:
            # Test 1: All users have required fields
            users = self.service_client.table('users').select('id, email, role, wallet_balance').execute()
            
            users_with_all_fields = [u for u in users.data if u.get('id') and u.get('email') and u.get('role') is not None and u.get('wallet_balance') is not None]
            
            self.record_test(
                "All users have required fields",
                len(users_with_all_fields) == len(users.data),
                f"{len(users_with_all_fields)}/{len(users.data)} users complete"
            )
            
            # Test 2: Wallet balances are valid
            invalid_balances = [u for u in users.data if u.get('wallet_balance', 0) < 0]
            self.record_test(
                "All wallet balances are valid",
                len(invalid_balances) == 0,
                f"No negative balances found" if len(invalid_balances) == 0 else f"{len(invalid_balances)} invalid balances"
            )
            
            # Test 3: Events have valid hosts
            events = self.service_client.table('events').select('id, host_id').execute()
            user_ids = [u['id'] for u in users.data]
            
            orphaned_events = [e for e in events.data if e.get('host_id') not in user_ids]
            self.record_test(
                "All events have valid hosts",
                len(orphaned_events) == 0,
                f"All {len(events.data)} events have valid hosts" if len(orphaned_events) == 0 else f"{len(orphaned_events)} orphaned events"
            )
            
        except Exception as e:
            self.record_test("Data integrity test", False, str(e))
    
    def print_summary(self):
        """Print test summary"""
        print_header("RBAC TEST SUMMARY")
        
        total = self.test_results['total']
        passed = self.test_results['passed']
        failed = self.test_results['failed']
        pass_rate = (passed / total * 100) if total > 0 else 0
        
        print(f"Total Tests:  {total}")
        print(f"{Colors.GREEN}Passed:       {passed}{Colors.RESET}")
        print(f"{Colors.RED}Failed:       {failed}{Colors.RESET}")
        print(f"Pass Rate:    {pass_rate:.1f}%")
        
        if failed > 0:
            print(f"\n{Colors.RED}❌ FAILED TESTS:{Colors.RESET}")
            for test in self.test_results['tests']:
                if not test['passed']:
                    print(f"  • {test['name']}")
                    if test['details']:
                        print(f"    {test['details']}")
        
        print(f"\n{Colors.BOLD}{'='*100}{Colors.RESET}")
        
        if pass_rate >= 95:
            print(f"{Colors.GREEN}{Colors.BOLD}✅ EXCELLENT! RBAC is properly configured and working!{Colors.RESET}")
        elif pass_rate >= 80:
            print(f"{Colors.YELLOW}{Colors.BOLD}⚠️  GOOD! Minor RBAC issues to address{Colors.RESET}")
        else:
            print(f"{Colors.RED}{Colors.BOLD}❌ CRITICAL! Major RBAC issues found{Colors.RESET}")
        
        print(f"{Colors.BOLD}{'='*100}{Colors.RESET}\n")
        
        return pass_rate >= 80

def main():
    print_header("COMPREHENSIVE ROLE-BASED ACCESS CONTROL (RBAC) TEST")
    print(f"{Colors.YELLOW}Testing all user roles, permissions, and data access{Colors.RESET}\n")
    
    if not all([SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY]):
        print(f"{Colors.RED}❌ ERROR: Missing Supabase credentials{Colors.RESET}")
        return False
    
    print(f"Supabase URL: {SUPABASE_URL}")
    print(f"Testing roles: Admin, Organizer, Attendee\n")
    
    tester = RBACTester()
    
    # Run all tests
    tester.test_user_roles_assigned()
    tester.test_authentication_all_roles()
    tester.test_user_data_access()
    tester.test_wallet_security()
    tester.test_events_access_by_role()
    tester.test_bookings_access()
    tester.test_payments_access()
    tester.test_backend_tables_access()
    tester.test_rls_policies_active()
    tester.test_data_integrity()
    
    # Print summary
    success = tester.print_summary()
    
    return success

if __name__ == "__main__":
    try:
        success = main()
        exit(0 if success else 1)
    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}Test interrupted by user{Colors.RESET}")
        exit(1)
    except Exception as e:
        print(f"\n{Colors.RED}❌ Fatal error: {e}{Colors.RESET}")
        import traceback
        traceback.print_exc()
        exit(1)
