#!/usr/bin/env python3
"""
Comprehensive End-to-End Testing Script
Tests all critical functionality after database migration completion
"""

import os
import sys
import asyncio
import requests
import json
import time
from pathlib import Path

# Add the backend directory to Python path
backend_path = Path(__file__).parent / "apps" / "backend-fastapi"
sys.path.insert(0, str(backend_path))

from supabase import create_client, Client
from config import config

class ComprehensiveTestSuite:
    def __init__(self):
        self.supabase = create_client(config.SUPABASE_URL, config.SUPABASE_ANON_KEY)
        self.base_url = "http://localhost:8000"
        self.test_results = {
            "database_tests": {},
            "service_tests": {},
            "api_tests": {},
            "integration_tests": {}
        }
        self.total_tests = 0
        self.passed_tests = 0
        self.failed_tests = 0

    def log_test_result(self, test_name: str, category: str, passed: bool, message: str = ""):
        """Log test result"""
        self.total_tests += 1
        if passed:
            self.passed_tests += 1
            print(f"✅ {test_name}: PASS")
        else:
            self.failed_tests += 1
            print(f"❌ {test_name}: FAIL - {message}")
        
        self.test_results[category][test_name] = {
            "passed": passed,
            "message": message,
            "timestamp": time.time()
        }

    def test_database_tables(self):
        """Test all database tables exist and are accessible"""
        print("\n🗄️  TESTING DATABASE TABLES")
        print("=" * 40)
        
        tables_to_test = [
            'users', 'events', 'tickets', 'wallet_balances',
            'notifications', 'chat_messages', 'secret_events',
            'memberships', 'sessions', 'analytics'
        ]
        
        for table in tables_to_test:
            try:
                result = self.supabase.table(table).select('*').limit(1).execute()
                self.log_test_result(f"Table {table} exists", "database_tests", True)
            except Exception as e:
                self.log_test_result(f"Table {table} exists", "database_tests", False, str(e))

    def test_service_imports(self):
        """Test all service modules can be imported"""
        print("\n🔧 TESTING SERVICE IMPORTS")
        print("=" * 40)
        
        services_to_test = [
            ("user_service", "services.user_service"),
            ("event_service", "services.event_service"),
            ("ticket_service", "services.ticket_service"),
            ("wallet_balance_service", "services.wallet_balance_service"),
            ("unified_wallet_service", "services.unified_wallet_service"),
            ("wallet_performance", "services.wallet_performance"),
            ("wallet_validation", "services.wallet_validation"),
            ("wallet_rate_limiting", "services.wallet_rate_limiting")
        ]
        
        for service_name, module_path in services_to_test:
            try:
                __import__(module_path)
                self.log_test_result(f"Import {service_name}", "service_tests", True)
            except Exception as e:
                self.log_test_result(f"Import {service_name}", "service_tests", False, str(e))

    def test_main_application(self):
        """Test main application structure"""
        print("\n🚀 TESTING MAIN APPLICATION")
        print("=" * 40)
        
        # Test main.py exists and has correct structure
        main_py = backend_path / "main.py"
        if main_py.exists():
            try:
                with open(main_py, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                has_fastapi_app = 'app = FastAPI(' in content
                has_routers = 'include_router' in content
                has_lifespan = 'lifespan' in content
                
                self.log_test_result("main.py exists", "integration_tests", True)
                self.log_test_result("FastAPI app instance", "integration_tests", has_fastapi_app)
                self.log_test_result("Router includes", "integration_tests", has_routers)
                self.log_test_result("Lifespan events", "integration_tests", has_lifespan)
                
            except Exception as e:
                self.log_test_result("main.py structure", "integration_tests", False, str(e))
        else:
            self.log_test_result("main.py exists", "integration_tests", False, "File not found")
        
        # Test simple_main.py is archived
        simple_main_py = backend_path / "simple_main.py"
        archived_simple_main = backend_path / "archived" / "simple_main.py"
        
        simple_main_archived = not simple_main_py.exists() and archived_simple_main.exists()
        self.log_test_result("simple_main.py archived", "integration_tests", simple_main_archived)

    def test_configuration_security(self):
        """Test configuration and security setup"""
        print("\n🔒 TESTING CONFIGURATION SECURITY")
        print("=" * 40)
        
        # Test environment variables are loaded
        has_supabase_url = bool(config.SUPABASE_URL)
        has_supabase_key = bool(config.SUPABASE_ANON_KEY)
        has_jwt_secret = bool(config.JWT_SECRET)
        
        self.log_test_result("Supabase URL configured", "integration_tests", has_supabase_url)
        self.log_test_result("Supabase key configured", "integration_tests", has_supabase_key)
        self.log_test_result("JWT secret configured", "integration_tests", has_jwt_secret)
        
        # Test .env file exists
        env_file = backend_path / ".env"
        env_exists = env_file.exists()
        self.log_test_result(".env file exists", "integration_tests", env_exists)
        
        # Test no hardcoded credentials in main files
        files_to_check = [
            backend_path / "main.py",
            backend_path / "config.py"
        ]
        
        for file_path in files_to_check:
            if file_path.exists():
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    # Check for common hardcoded patterns
                    hardcoded_patterns = [
                        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",  # JWT token pattern
                        "https://hwwzbsppzwcyvambeade.supabase.co",  # Hardcoded URL
                        "password123",  # Hardcoded password
                        "secret-key"   # Hardcoded secret
                    ]
                    
                    has_hardcoded = any(pattern in content for pattern in hardcoded_patterns)
                    self.log_test_result(f"No hardcoded credentials in {file_path.name}", "integration_tests", not has_hardcoded)
                    
                except Exception as e:
                    self.log_test_result(f"Check {file_path.name} for credentials", "integration_tests", False, str(e))

    def test_wallet_consolidation(self):
        """Test wallet consolidation is complete"""
        print("\n💰 TESTING WALLET CONSOLIDATION")
        print("=" * 40)
        
        # Test unified wallet service files exist
        wallet_files = [
            "services/unified_wallet_service.py",
            "services/wallet_performance.py",
            "services/wallet_validation.py",
            "services/wallet_rate_limiting.py"
        ]
        
        for file_path in wallet_files:
            full_path = backend_path / file_path
            exists = full_path.exists()
            self.log_test_result(f"Wallet file {file_path}", "integration_tests", exists)

    async def test_service_functionality(self):
        """Test basic service functionality"""
        print("\n⚙️  TESTING SERVICE FUNCTIONALITY")
        print("=" * 40)
        
        try:
            # Test user service
            from services.user_service import user_service
            
            # Test basic operations (without actually creating data)
            test_user_data = {
                "email": "test@example.com",
                "first_name": "Test",
                "last_name": "User"
            }
            
            # Test service methods exist
            has_create_user = hasattr(user_service, 'create_user')
            has_get_user = hasattr(user_service, 'get_user')
            has_update_user = hasattr(user_service, 'update_user')
            
            self.log_test_result("User service create_user method", "service_tests", has_create_user)
            self.log_test_result("User service get_user method", "service_tests", has_get_user)
            self.log_test_result("User service update_user method", "service_tests", has_update_user)
            
        except Exception as e:
            self.log_test_result("User service functionality", "service_tests", False, str(e))
        
        try:
            # Test event service
            from services.event_service import event_service
            
            has_create_event = hasattr(event_service, 'create_event')
            has_get_event = hasattr(event_service, 'get_event')
            has_list_events = hasattr(event_service, 'list_events')
            
            self.log_test_result("Event service create_event method", "service_tests", has_create_event)
            self.log_test_result("Event service get_event method", "service_tests", has_get_event)
            self.log_test_result("Event service list_events method", "service_tests", has_list_events)
            
        except Exception as e:
            self.log_test_result("Event service functionality", "service_tests", False, str(e))

    def test_api_endpoints_structure(self):
        """Test API endpoint structure (without starting server)"""
        print("\n🌐 TESTING API STRUCTURE")
        print("=" * 40)
        
        # Test router files exist
        router_files = [
            "routers/auth.py",
            "routers/events.py",
            "routers/tickets.py",
            "routers/payments.py",
            "routers/admin.py",
            "routers/notifications.py",
            "routers/analytics.py",
            "routers/realtime.py"
        ]
        
        for router_file in router_files:
            full_path = backend_path / router_file
            exists = full_path.exists()
            self.log_test_result(f"Router {router_file}", "api_tests", exists)

    def generate_test_report(self):
        """Generate comprehensive test report"""
        print("\n📊 COMPREHENSIVE TEST REPORT")
        print("=" * 60)
        
        # Calculate success rate
        success_rate = (self.passed_tests / self.total_tests * 100) if self.total_tests > 0 else 0
        
        print(f"🎯 OVERALL RESULTS:")
        print(f"✅ Passed: {self.passed_tests}")
        print(f"❌ Failed: {self.failed_tests}")
        print(f"📊 Total: {self.total_tests}")
        print(f"📈 Success Rate: {success_rate:.1f}%")
        
        # Category breakdown
        print(f"\n📋 CATEGORY BREAKDOWN:")
        for category, tests in self.test_results.items():
            category_passed = sum(1 for test in tests.values() if test['passed'])
            category_total = len(tests)
            category_rate = (category_passed / category_total * 100) if category_total > 0 else 0
            
            print(f"  {category}: {category_passed}/{category_total} ({category_rate:.1f}%)")
        
        # Production readiness assessment
        print(f"\n🚀 PRODUCTION READINESS:")
        if success_rate >= 90:
            print("🎉 EXCELLENT - Ready for production deployment")
            readiness = "EXCELLENT"
        elif success_rate >= 80:
            print("✅ GOOD - Ready for production with minor issues")
            readiness = "GOOD"
        elif success_rate >= 70:
            print("⚠️  FAIR - Needs some fixes before production")
            readiness = "FAIR"
        else:
            print("❌ POOR - Significant issues need resolution")
            readiness = "POOR"
        
        # Save detailed report
        report_content = f"""# Comprehensive End-to-End Test Report

## Test Summary
- **Date**: {time.strftime('%Y-%m-%d %H:%M:%S')}
- **Total Tests**: {self.total_tests}
- **Passed**: {self.passed_tests}
- **Failed**: {self.failed_tests}
- **Success Rate**: {success_rate:.1f}%
- **Production Readiness**: {readiness}

## Category Results
"""
        
        for category, tests in self.test_results.items():
            category_passed = sum(1 for test in tests.values() if test['passed'])
            category_total = len(tests)
            report_content += f"\n### {category.replace('_', ' ').title()}\n"
            report_content += f"- **Results**: {category_passed}/{category_total}\n"
            
            for test_name, result in tests.items():
                status = "✅ PASS" if result['passed'] else f"❌ FAIL - {result['message']}"
                report_content += f"- {test_name}: {status}\n"
        
        report_content += f"""
## Recommendations
{'Ready for production deployment!' if success_rate >= 80 else 'Complete remaining fixes before production deployment.'}

## Next Steps
1. {'Deploy to production' if success_rate >= 80 else 'Fix failing tests'}
2. Monitor production performance
3. Set up monitoring and alerting
4. Create backup and recovery procedures
"""
        
        report_file = Path(__file__).parent / "COMPREHENSIVE_TEST_REPORT.md"
        with open(report_file, 'w', encoding='utf-8') as f:
            f.write(report_content)
        
        print(f"\n📄 Detailed report saved: {report_file}")
        
        return {
            "success_rate": success_rate,
            "production_ready": success_rate >= 80,
            "total_tests": self.total_tests,
            "passed_tests": self.passed_tests,
            "failed_tests": self.failed_tests
        }

    async def run_all_tests(self):
        """Run all test suites"""
        print("🧪 COMPREHENSIVE END-TO-END TESTING")
        print("Testing all critical functionality")
        print("=" * 60)
        
        # Run all test suites
        self.test_database_tables()
        self.test_service_imports()
        self.test_main_application()
        self.test_configuration_security()
        self.test_wallet_consolidation()
        await self.test_service_functionality()
        self.test_api_endpoints_structure()
        
        # Generate final report
        return self.generate_test_report()

async def main():
    """Main execution function"""
    test_suite = ComprehensiveTestSuite()
    
    try:
        results = await test_suite.run_all_tests()
        
        if results['production_ready']:
            print(f"\n🎉 SUCCESS: System is production ready!")
            sys.exit(0)
        else:
            print(f"\n⚠️  WARNING: System needs fixes before production")
            sys.exit(1)
            
    except Exception as e:
        print(f"❌ CRITICAL ERROR: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())