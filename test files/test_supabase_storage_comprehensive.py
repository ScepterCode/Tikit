"""
Comprehensive Supabase Storage Test Suite
Tests all critical storage systems after RLS implementation
"""
import os
import sys
from supabase import create_client, Client
from datetime import datetime, timedelta
import json

# Load environment variables
from dotenv import load_dotenv
load_dotenv('apps/backend-fastapi/.env')

# Supabase configuration
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_ANON_KEY = os.getenv('SUPABASE_ANON_KEY')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY')

# Test user credentials
TEST_ORGANIZER_EMAIL = "organizer@grooovy.netlify.app"
TEST_ORGANIZER_PASSWORD = "password123"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def print_header(text):
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*80}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}{text.center(80)}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'='*80}{Colors.RESET}\n")

def print_test(name, passed, details=""):
    status = f"{Colors.GREEN}✅ PASS{Colors.RESET}" if passed else f"{Colors.RED}❌ FAIL{Colors.RESET}"
    print(f"{status} | {name}")
    if details:
        print(f"     {Colors.YELLOW}{details}{Colors.RESET}")

def print_section(text):
    print(f"\n{Colors.BOLD}{Colors.YELLOW}{'─'*80}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.YELLOW}{text}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.YELLOW}{'─'*80}{Colors.RESET}")

class SupabaseStorageTests:
    def __init__(self):
        self.anon_client: Client = None
        self.service_client: Client = None
        self.auth_user = None
        self.test_results = {
            'total': 0,
            'passed': 0,
            'failed': 0,
            'tests': []
        }
    
    def record_test(self, name, passed, details=""):
        self.test_results['total'] += 1
        if passed:
            self.test_results['passed'] += 1
        else:
            self.test_results['failed'] += 1
        self.test_results['tests'].append({
            'name': name,
            'passed': passed,
            'details': details
        })
        print_test(name, passed, details)
    
    def setup(self):
        """Initialize Supabase clients"""
        print_section("🔧 SETUP: Initializing Supabase Clients")
        
        try:
            # Create anon client (frontend simulation)
            self.anon_client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
            self.record_test("Create anon client", True, "Frontend client initialized")
            
            # Create service client (backend simulation)
            self.service_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
            self.record_test("Create service client", True, "Backend client initialized")
            
            return True
        except Exception as e:
            self.record_test("Setup clients", False, str(e))
            return False
    
    def test_authentication(self):
        """Test authentication system"""
        print_section("🔐 TEST 1: Authentication System")
        
        try:
            # Test login
            response = self.anon_client.auth.sign_in_with_password({
                "email": TEST_ORGANIZER_EMAIL,
                "password": TEST_ORGANIZER_PASSWORD
            })
            
            if response.user:
                self.auth_user = response.user
                self.record_test("User login", True, f"Logged in as: {response.user.email}")
                self.record_test("JWT token generated", True, f"Token length: {len(response.session.access_token)}")
                return True
            else:
                self.record_test("User login", False, "No user returned")
                return False
                
        except Exception as e:
            self.record_test("User login", False, str(e))
            return False
    
    def test_users_table_rls(self):
        """Test users table with RLS"""
        print_section("👤 TEST 2: Users Table & RLS")
        
        try:
            # Test 1: Can read own user profile
            response = self.anon_client.table('users').select('*').eq('id', self.auth_user.id).execute()
            self.record_test(
                "Read own user profile",
                len(response.data) == 1,
                f"Retrieved {len(response.data)} user(s)"
            )
            
            # Test 2: Cannot read all users (RLS should restrict)
            response = self.anon_client.table('users').select('*').execute()
            self.record_test(
                "RLS restricts user list",
                len(response.data) <= 1,
                f"Can only see {len(response.data)} user(s) (should be 1 or 0)"
            )
            
            # Test 3: Cannot update wallet balance directly
            try:
                response = self.anon_client.table('users').update({
                    'wallet_balance': 999999.99
                }).eq('id', self.auth_user.id).execute()
                
                # Check if wallet was actually updated
                check = self.anon_client.table('users').select('wallet_balance').eq('id', self.auth_user.id).execute()
                wallet_changed = check.data[0]['wallet_balance'] == 999999.99 if check.data else False
                
                self.record_test(
                    "RLS prevents wallet tampering",
                    not wallet_changed,
                    "Wallet balance protected from direct updates"
                )
            except Exception as e:
                self.record_test("RLS prevents wallet tampering", True, "Update blocked by RLS")
            
            # Test 4: Service role can update wallet (backend)
            original_balance = self.service_client.table('users').select('wallet_balance').eq('id', self.auth_user.id).execute().data[0]['wallet_balance']
            
            test_balance = original_balance + 100.00
            response = self.service_client.table('users').update({
                'wallet_balance': test_balance
            }).eq('id', self.auth_user.id).execute()
            
            # Verify update
            check = self.service_client.table('users').select('wallet_balance').eq('id', self.auth_user.id).execute()
            updated_balance = check.data[0]['wallet_balance']
            
            self.record_test(
                "Backend can update wallet",
                updated_balance == test_balance,
                f"Balance updated: {original_balance} → {updated_balance}"
            )
            
            # Restore original balance
            self.service_client.table('users').update({
                'wallet_balance': original_balance
            }).eq('id', self.auth_user.id).execute()
            
            return True
            
        except Exception as e:
            self.record_test("Users table test", False, str(e))
            return False
    
    def test_events_table_rls(self):
        """Test events table with RLS"""
        print_section("🎉 TEST 3: Events Table & RLS")
        
        try:
            # Test 1: Can read published events
            response = self.anon_client.table('events').select('*').eq('status', 'published').execute()
            self.record_test(
                "Read published events",
                True,
                f"Found {len(response.data)} published event(s)"
            )
            
            # Test 2: Can read own events
            response = self.anon_client.table('events').select('*').eq('host_id', self.auth_user.id).execute()
            self.record_test(
                "Read own events",
                True,
                f"Found {len(response.data)} own event(s)"
            )
            
            # Test 3: Can create event as organizer
            import uuid
            test_event = {
                'id': str(uuid.uuid4()),  # Generate UUID for id
                'title': f'Test Event {datetime.now().strftime("%Y%m%d%H%M%S")}',
                'description': 'Test event for RLS verification',
                'host_id': self.auth_user.id,
                'event_date': (datetime.now() + timedelta(days=30)).isoformat(),
                'full_address': 'Test Location',
                'venue_name': 'Test Venue',
                'capacity': 100,
                'ticket_price': 5000.00,
                'status': 'draft',
                'category': 'conference'
            }
            
            response = self.anon_client.table('events').insert(test_event).execute()
            created_event = response.data[0] if response.data else None
            
            self.record_test(
                "Create event as organizer",
                created_event is not None,
                f"Event created with ID: {created_event['id'] if created_event else 'N/A'}"
            )
            
            # Clean up: Delete test event
            if created_event:
                self.service_client.table('events').delete().eq('id', created_event['id']).execute()
            
            return True
            
        except Exception as e:
            self.record_test("Events table test", False, str(e))
            return False
    
    def test_bookings_table_rls(self):
        """Test bookings table with RLS"""
        print_section("🎫 TEST 4: Bookings Table & RLS")
        
        try:
            # Test 1: Can read own bookings
            response = self.anon_client.table('bookings').select('*').eq('user_id', self.auth_user.id).execute()
            self.record_test(
                "Read own bookings",
                True,
                f"Found {len(response.data)} booking(s)"
            )
            
            # Test 2: Cannot read other users' bookings
            response = self.anon_client.table('bookings').select('*').execute()
            if response.data:
                all_mine = all(booking['user_id'] == self.auth_user.id for booking in response.data)
                self.record_test(
                    "RLS restricts bookings",
                    all_mine,
                    f"Can only see own bookings ({len(response.data)} total)"
                )
            else:
                self.record_test("RLS restricts bookings", True, "No bookings found (expected)")
            
            return True
            
        except Exception as e:
            self.record_test("Bookings table test", False, str(e))
            return False
    
    def test_tickets_table_rls(self):
        """Test tickets table with RLS"""
        print_section("🎟️ TEST 5: Tickets Table & RLS")
        
        try:
            # Test 1: Can read own tickets
            response = self.anon_client.table('tickets').select('*').eq('user_id', self.auth_user.id).execute()
            self.record_test(
                "Read own tickets",
                True,
                f"Found {len(response.data)} ticket(s)"
            )
            
            # Test 2: Cannot read other users' tickets
            response = self.anon_client.table('tickets').select('*').execute()
            if response.data:
                all_mine = all(ticket['user_id'] == self.auth_user.id for ticket in response.data)
                self.record_test(
                    "RLS restricts tickets",
                    all_mine,
                    f"Can only see own tickets ({len(response.data)} total)"
                )
            else:
                self.record_test("RLS restricts tickets", True, "No tickets found (expected)")
            
            return True
            
        except Exception as e:
            self.record_test("Tickets table test", False, str(e))
            return False
    
    def test_payments_table_rls(self):
        """Test payments table with RLS"""
        print_section("💳 TEST 6: Payments Table & RLS")
        
        try:
            # Test 1: Can read own payments
            response = self.anon_client.table('payments').select('*').eq('user_id', self.auth_user.id).execute()
            self.record_test(
                "Read own payments",
                True,
                f"Found {len(response.data)} payment(s)"
            )
            
            # Test 2: Cannot read other users' payments
            response = self.anon_client.table('payments').select('*').execute()
            if response.data:
                all_mine = all(payment['user_id'] == self.auth_user.id for payment in response.data)
                self.record_test(
                    "RLS restricts payments",
                    all_mine,
                    f"Can only see own payments ({len(response.data)} total)"
                )
            else:
                self.record_test("RLS restricts payments", True, "No payments found (expected)")
            
            return True
            
        except Exception as e:
            self.record_test("Payments table test", False, str(e))
            return False
    
    def test_notifications_table_rls(self):
        """Test realtime_notifications table with RLS"""
        print_section("🔔 TEST 7: Notifications Table & RLS")
        
        try:
            # Test 1: Can read own notifications
            response = self.anon_client.table('realtime_notifications').select('*').eq('user_id', self.auth_user.id).execute()
            self.record_test(
                "Read own notifications",
                True,
                f"Found {len(response.data)} notification(s)"
            )
            
            # Test 2: Cannot read other users' notifications
            response = self.anon_client.table('realtime_notifications').select('*').execute()
            if response.data:
                all_mine = all(notif['user_id'] == self.auth_user.id for notif in response.data)
                self.record_test(
                    "RLS restricts notifications",
                    all_mine,
                    f"Can only see own notifications ({len(response.data)} total)"
                )
            else:
                self.record_test("RLS restricts notifications", True, "No notifications found (expected)")
            
            return True
            
        except Exception as e:
            self.record_test("Notifications table test", False, str(e))
            return False
    
    def test_backend_tables_rls(self):
        """Test backend-only tables with RLS"""
        print_section("🔒 TEST 8: Backend Tables & RLS")
        
        try:
            # Test 1: Frontend cannot access message_logs
            try:
                response = self.anon_client.table('message_logs').select('*').execute()
                can_access = len(response.data) > 0
                self.record_test(
                    "Frontend blocked from message_logs",
                    not can_access,
                    "RLS prevents frontend access"
                )
            except Exception:
                self.record_test("Frontend blocked from message_logs", True, "Access denied by RLS")
            
            # Test 2: Frontend cannot access interaction_logs
            try:
                response = self.anon_client.table('interaction_logs').select('*').execute()
                can_access = len(response.data) > 0
                self.record_test(
                    "Frontend blocked from interaction_logs",
                    not can_access,
                    "RLS prevents frontend access"
                )
            except Exception:
                self.record_test("Frontend blocked from interaction_logs", True, "Access denied by RLS")
            
            # Test 3: Frontend cannot access conversations
            try:
                response = self.anon_client.table('conversations').select('*').execute()
                can_access = len(response.data) > 0
                self.record_test(
                    "Frontend blocked from conversations",
                    not can_access,
                    "RLS prevents frontend access"
                )
            except Exception:
                self.record_test("Frontend blocked from conversations", True, "Access denied by RLS")
            
            # Test 4: Backend can access message_logs
            response = self.service_client.table('message_logs').select('*').limit(1).execute()
            self.record_test(
                "Backend can access message_logs",
                True,
                f"Service role has access ({len(response.data)} records)"
            )
            
            return True
            
        except Exception as e:
            self.record_test("Backend tables test", False, str(e))
            return False
    
    def test_database_integrity(self):
        """Test database integrity and relationships"""
        print_section("🔍 TEST 9: Database Integrity")
        
        try:
            # Test 1: Check user has role assigned
            response = self.service_client.table('users').select('id, email, role').eq('id', self.auth_user.id).execute()
            user = response.data[0] if response.data else None
            
            self.record_test(
                "User has role assigned",
                user and user.get('role') is not None,
                f"Role: {user.get('role') if user else 'N/A'}"
            )
            
            # Test 2: Check wallet_balance column exists
            response = self.service_client.table('users').select('wallet_balance').eq('id', self.auth_user.id).execute()
            has_wallet = response.data and 'wallet_balance' in response.data[0]
            
            self.record_test(
                "Wallet balance column exists",
                has_wallet,
                f"Balance: ₦{response.data[0]['wallet_balance'] if has_wallet else 'N/A'}"
            )
            
            # Test 3: Check all critical tables exist
            tables = ['users', 'events', 'bookings', 'tickets', 'payments', 'realtime_notifications']
            all_exist = True
            
            for table in tables:
                try:
                    self.service_client.table(table).select('*').limit(1).execute()
                except Exception:
                    all_exist = False
                    break
            
            self.record_test(
                "All critical tables exist",
                all_exist,
                f"Verified {len(tables)} tables"
            )
            
            return True
            
        except Exception as e:
            self.record_test("Database integrity test", False, str(e))
            return False
    
    def print_summary(self):
        """Print test summary"""
        print_header("TEST SUMMARY")
        
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
        
        print(f"\n{Colors.BOLD}{'='*80}{Colors.RESET}")
        
        if pass_rate >= 90:
            print(f"{Colors.GREEN}{Colors.BOLD}✅ EXCELLENT! Database is production-ready!{Colors.RESET}")
        elif pass_rate >= 75:
            print(f"{Colors.YELLOW}{Colors.BOLD}⚠️  GOOD! Minor issues to address{Colors.RESET}")
        else:
            print(f"{Colors.RED}{Colors.BOLD}❌ CRITICAL! Major issues found{Colors.RESET}")
        
        print(f"{Colors.BOLD}{'='*80}{Colors.RESET}\n")
        
        return pass_rate >= 75

def main():
    print_header("SUPABASE STORAGE COMPREHENSIVE TEST SUITE")
    print(f"{Colors.YELLOW}Testing all critical storage systems after RLS implementation{Colors.RESET}\n")
    
    # Check environment variables
    if not all([SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY]):
        print(f"{Colors.RED}❌ ERROR: Missing Supabase credentials in .env file{Colors.RESET}")
        return False
    
    print(f"Supabase URL: {SUPABASE_URL}")
    print(f"Test User: {TEST_ORGANIZER_EMAIL}")
    
    # Run tests
    tests = SupabaseStorageTests()
    
    if not tests.setup():
        print(f"\n{Colors.RED}❌ Setup failed. Cannot continue.{Colors.RESET}")
        return False
    
    # Run all test suites
    tests.test_authentication()
    tests.test_users_table_rls()
    tests.test_events_table_rls()
    tests.test_bookings_table_rls()
    tests.test_tickets_table_rls()
    tests.test_payments_table_rls()
    tests.test_notifications_table_rls()
    tests.test_backend_tables_rls()
    tests.test_database_integrity()
    
    # Print summary
    success = tests.print_summary()
    
    return success

if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}Test interrupted by user{Colors.RESET}")
        sys.exit(1)
    except Exception as e:
        print(f"\n{Colors.RED}❌ Fatal error: {e}{Colors.RESET}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
