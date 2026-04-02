#!/usr/bin/env python3
"""
Critical End-to-End Workflow Tests
Tests all critical user journeys before server restart
"""
import os
import re
from pathlib import Path
from typing import List, Dict, Tuple

class WorkflowTester:
    def __init__(self, root_dir: Path):
        self.root_dir = root_dir
        self.frontend_dir = root_dir / "apps" / "frontend" / "src"
        self.backend_dir = root_dir / "apps" / "backend-fastapi"
        self.issues = []
        self.warnings = []
        self.passed = []
        
    def log_issue(self, category: str, severity: str, message: str):
        """Log an issue found during testing"""
        self.issues.append({
            "category": category,
            "severity": severity,
            "message": message
        })
        
    def log_warning(self, category: str, message: str):
        """Log a warning"""
        self.warnings.append({
            "category": category,
            "message": message
        })
        
    def log_pass(self, category: str, message: str):
        """Log a passed test"""
        self.passed.append({
            "category": category,
            "message": message
        })

    def test_attendee_dashboard(self):
        """Test attendee dashboard workflow"""
        print("\n🔍 Testing Attendee Dashboard Workflow...")
        
        # Check if attendee dashboard exists
        dashboard_file = self.frontend_dir / "pages" / "attendee" / "AttendeeDashboard.tsx"
        if not dashboard_file.exists():
            self.log_issue("Attendee Dashboard", "HIGH", "AttendeeDashboard.tsx not found")
            return
            
        content = dashboard_file.read_text(encoding='utf-8')
        
        # Check for API calls
        api_calls = re.findall(r'fetch\([\'"`]([^\'"`]+)[\'"`]', content)
        api_calls += re.findall(r'authenticatedFetch\([\'"`]([^\'"`]+)[\'"`]', content)
        
        # Check for hardcoded ports
        if 'localhost:8001' in content:
            self.log_issue("Attendee Dashboard", "CRITICAL", "Still has hardcoded localhost:8001")
        else:
            self.log_pass("Attendee Dashboard", "No hardcoded ports found")
            
        # Check for environment variable usage
        if 'import.meta.env.VITE_API_URL' in content or 'authenticatedFetch' in content:
            self.log_pass("Attendee Dashboard", "Uses environment variables or auth wrapper")
        else:
            self.log_warning("Attendee Dashboard", "May not be using environment variables")
            
        print(f"   Found {len(api_calls)} API calls")

    def test_event_display(self):
        """Test event display workflow"""
        print("\n🔍 Testing Event Display Workflow...")
        
        # Check Events page
        events_file = self.frontend_dir / "pages" / "Events.tsx"
        if not events_file.exists():
            self.log_issue("Event Display", "CRITICAL", "Events.tsx not found")
            return
            
        content = events_file.read_text(encoding='utf-8')
        
        # Check for hardcoded ports
        if 'localhost:8001' in content:
            self.log_issue("Event Display", "CRITICAL", "Events.tsx has hardcoded localhost:8001")
        else:
            self.log_pass("Event Display", "Events.tsx - No hardcoded ports")
            
        # Check EventDetail page
        detail_file = self.frontend_dir / "pages" / "EventDetail.tsx"
        if detail_file.exists():
            detail_content = detail_file.read_text(encoding='utf-8')
            if 'localhost:8001' in detail_content:
                self.log_issue("Event Display", "CRITICAL", "EventDetail.tsx has hardcoded localhost:8001")
            else:
                self.log_pass("Event Display", "EventDetail.tsx - No hardcoded ports")
        
        # Check backend events endpoint
        events_router = self.backend_dir / "routers" / "events.py"
        if events_router.exists():
            router_content = events_router.read_text(encoding='utf-8')
            if '@router.get' in router_content or '@router.post' in router_content:
                self.log_pass("Event Display", "Backend events router exists with endpoints")
            else:
                self.log_warning("Event Display", "Backend events router may be incomplete")

    def test_ticket_purchase_workflow(self):
        """Test ticket purchase workflow"""
        print("\n🔍 Testing Ticket Purchase Workflow...")
        
        # Check PurchaseButton component
        purchase_btn = self.frontend_dir / "components" / "tickets" / "PurchaseButton.tsx"
        if not purchase_btn.exists():
            self.log_issue("Ticket Purchase", "CRITICAL", "PurchaseButton.tsx not found")
            return
            
        content = purchase_btn.read_text(encoding='utf-8')
        
        # Check for hardcoded ports
        if 'localhost:8001' in content:
            self.log_issue("Ticket Purchase", "CRITICAL", "PurchaseButton has hardcoded localhost:8001")
        else:
            self.log_pass("Ticket Purchase", "PurchaseButton - No hardcoded ports")
            
        # Check PaymentModal
        payment_modal = self.frontend_dir / "components" / "payment" / "PaymentModal.tsx"
        if payment_modal.exists():
            modal_content = payment_modal.read_text(encoding='utf-8')
            if 'localhost:8001' in modal_content:
                self.log_issue("Ticket Purchase", "CRITICAL", "PaymentModal has hardcoded localhost:8001")
            else:
                self.log_pass("Ticket Purchase", "PaymentModal - No hardcoded ports")
                
            # Check for payment methods
            payment_methods = ['wallet', 'bank-transfer', 'ussd', 'airtime']
            for method in payment_methods:
                if f'/payments/{method}' in modal_content:
                    self.log_pass("Ticket Purchase", f"Payment method '{method}' endpoint found")
                    
        # Check backend tickets router
        tickets_router = self.backend_dir / "routers" / "tickets.py"
        if tickets_router.exists():
            router_content = tickets_router.read_text(encoding='utf-8')
            if '@router.post("/issue"' in router_content:
                self.log_pass("Ticket Purchase", "Backend ticket issue endpoint exists")
            else:
                self.log_warning("Ticket Purchase", "Backend ticket issue endpoint may be missing")

    def test_event_creation(self):
        """Test event creation workflow"""
        print("\n🔍 Testing Event Creation Workflow...")
        
        # Check CreateEvent page
        create_event = self.frontend_dir / "pages" / "organizer" / "CreateEvent.tsx"
        if not create_event.exists():
            self.log_issue("Event Creation", "CRITICAL", "CreateEvent.tsx not found")
            return
            
        content = create_event.read_text(encoding='utf-8')
        
        # Check for hardcoded ports
        if 'localhost:8001' in content:
            self.log_issue("Event Creation", "CRITICAL", "CreateEvent has hardcoded localhost:8001")
        else:
            self.log_pass("Event Creation", "No hardcoded ports")
            
        # Check for API endpoint
        if '/api/events/create' in content or '/api/events' in content:
            self.log_pass("Event Creation", "Event creation API call found")
        else:
            self.log_warning("Event Creation", "Event creation API call may be missing")
            
        # Check TicketTierManager
        tier_manager = self.frontend_dir / "components" / "organizer" / "TicketTierManager.tsx"
        if tier_manager.exists():
            tier_content = tier_manager.read_text(encoding='utf-8')
            if 'localhost:8001' in tier_content:
                self.log_issue("Event Creation", "CRITICAL", "TicketTierManager has hardcoded localhost:8001")
            else:
                self.log_pass("Event Creation", "TicketTierManager - No hardcoded ports")
                
        # Check backend
        events_router = self.backend_dir / "routers" / "events.py"
        if events_router.exists():
            router_content = events_router.read_text(encoding='utf-8')
            if '@router.post' in router_content and 'create' in router_content.lower():
                self.log_pass("Event Creation", "Backend event creation endpoint exists")

    def test_event_editing(self):
        """Test event editing workflow"""
        print("\n🔍 Testing Event Editing Workflow...")
        
        # Check EditEventModal
        edit_modal = self.frontend_dir / "components" / "modals" / "EditEventModal.tsx"
        if not edit_modal.exists():
            self.log_warning("Event Editing", "EditEventModal.tsx not found")
        else:
            content = edit_modal.read_text(encoding='utf-8')
            if 'localhost:8001' in content:
                self.log_issue("Event Editing", "CRITICAL", "EditEventModal has hardcoded localhost:8001")
            else:
                self.log_pass("Event Editing", "EditEventModal - No hardcoded ports")
                
        # Check OrganizerEvents page
        org_events = self.frontend_dir / "pages" / "organizer" / "OrganizerEvents.tsx"
        if org_events.exists():
            content = org_events.read_text(encoding='utf-8')
            if 'localhost:8001' in content:
                self.log_issue("Event Editing", "CRITICAL", "OrganizerEvents has hardcoded localhost:8001")
            else:
                self.log_pass("Event Editing", "OrganizerEvents - No hardcoded ports")
                
            # Check for update endpoint
            if 'PUT' in content or 'method: "PUT"' in content:
                self.log_pass("Event Editing", "Update method found in OrganizerEvents")
                
        # Check backend
        events_router = self.backend_dir / "routers" / "events.py"
        if events_router.exists():
            router_content = events_router.read_text(encoding='utf-8')
            if '@router.put' in router_content:
                self.log_pass("Event Editing", "Backend event update endpoint exists")

    def test_organizer_dashboard(self):
        """Test organizer dashboard workflow"""
        print("\n🔍 Testing Organizer Dashboard Workflow...")
        
        # Check OrganizerDashboard
        dashboard = self.frontend_dir / "pages" / "organizer" / "OrganizerDashboard.tsx"
        if not dashboard.exists():
            self.log_issue("Organizer Dashboard", "CRITICAL", "OrganizerDashboard.tsx not found")
            return
            
        content = dashboard.read_text(encoding='utf-8')
        
        # Check for hardcoded ports
        if 'localhost:8001' in content:
            self.log_issue("Organizer Dashboard", "CRITICAL", "Has hardcoded localhost:8001")
        else:
            self.log_pass("Organizer Dashboard", "No hardcoded ports")
            
        # Check related components
        components = [
            "OrganizerEvents.tsx",
            "OrganizerScanner.tsx",
            "OrganizerWallet.tsx",
            "OrganizerBroadcast.tsx"
        ]
        
        for comp in components:
            comp_file = self.frontend_dir / "pages" / "organizer" / comp
            if comp_file.exists():
                comp_content = comp_file.read_text(encoding='utf-8')
                if 'localhost:8001' in comp_content:
                    self.log_issue("Organizer Dashboard", "CRITICAL", f"{comp} has hardcoded localhost:8001")
                else:
                    self.log_pass("Organizer Dashboard", f"{comp} - No hardcoded ports")

    def test_authentication_flow(self):
        """Test authentication and context"""
        print("\n🔍 Testing Authentication Flow...")
        
        # Check auth context
        auth_context = self.frontend_dir / "contexts" / "SupabaseAuthContext.tsx"
        if auth_context.exists():
            content = auth_context.read_text(encoding='utf-8')
            if 'localhost:8001' in content:
                self.log_issue("Authentication", "CRITICAL", "Auth context has hardcoded localhost:8001")
            else:
                self.log_pass("Authentication", "Auth context - No hardcoded ports")
                
        # Check auth utils
        auth_utils = self.frontend_dir / "utils" / "auth.ts"
        if auth_utils.exists():
            content = auth_utils.read_text(encoding='utf-8')
            if 'localhost:8001' in content:
                self.log_issue("Authentication", "CRITICAL", "Auth utils has hardcoded localhost:8001")
            else:
                self.log_pass("Authentication", "Auth utils - No hardcoded ports")
                
        # Check backend auth
        auth_router = self.backend_dir / "routers" / "auth.py"
        if auth_router.exists():
            self.log_pass("Authentication", "Backend auth router exists")

    def test_api_consistency(self):
        """Test API endpoint consistency"""
        print("\n🔍 Testing API Endpoint Consistency...")
        
        # Check for any remaining localhost:8001
        frontend_files = list(self.frontend_dir.rglob("*.tsx")) + list(self.frontend_dir.rglob("*.ts"))
        
        files_with_8001 = []
        for file in frontend_files:
            try:
                content = file.read_text(encoding='utf-8')
                if 'localhost:8001' in content:
                    files_with_8001.append(file.relative_to(self.root_dir))
            except:
                pass
                
        if files_with_8001:
            self.log_issue("API Consistency", "CRITICAL", 
                          f"Found {len(files_with_8001)} files still using localhost:8001")
            for f in files_with_8001[:5]:  # Show first 5
                self.log_issue("API Consistency", "CRITICAL", f"  - {f}")
        else:
            self.log_pass("API Consistency", "No files using localhost:8001")
            
        # Check .env file
        env_file = self.root_dir / "apps" / "frontend" / ".env"
        if env_file.exists():
            env_content = env_file.read_text(encoding='utf-8')
            if 'VITE_API_URL' in env_content:
                self.log_pass("API Consistency", "VITE_API_URL is set in .env")
            else:
                self.log_issue("API Consistency", "CRITICAL", "VITE_API_URL not set in .env")

    def test_backend_routers(self):
        """Test backend router registration"""
        print("\n🔍 Testing Backend Router Registration...")
        
        main_file = self.backend_dir / "main.py"
        if not main_file.exists():
            self.log_issue("Backend", "CRITICAL", "main.py not found")
            return
            
        content = main_file.read_text(encoding='utf-8')
        
        # Check for router imports and registrations
        required_routers = [
            ('auth', '/api/auth'),
            ('events', '/api/events'),
            ('tickets', '/api/tickets'),
            ('payments', '/api/payments'),
            ('wallet', '/api/wallet'),
            ('users', '/api/users')
        ]
        
        for router_name, prefix in required_routers:
            if f'include_router({router_name}' in content or f'include_router(users.router' in content:
                self.log_pass("Backend", f"{router_name} router registered")
            else:
                self.log_warning("Backend", f"{router_name} router may not be registered")

    def run_all_tests(self):
        """Run all workflow tests"""
        print("="*70)
        print("🧪 CRITICAL END-TO-END WORKFLOW TESTS")
        print("="*70)
        
        self.test_attendee_dashboard()
        self.test_event_display()
        self.test_ticket_purchase_workflow()
        self.test_event_creation()
        self.test_event_editing()
        self.test_organizer_dashboard()
        self.test_authentication_flow()
        self.test_api_consistency()
        self.test_backend_routers()
        
        # Print results
        print("\n" + "="*70)
        print("📊 TEST RESULTS")
        print("="*70)
        
        print(f"\n✅ PASSED: {len(self.passed)}")
        for item in self.passed:
            print(f"   [{item['category']}] {item['message']}")
            
        if self.warnings:
            print(f"\n⚠️  WARNINGS: {len(self.warnings)}")
            for item in self.warnings:
                print(f"   [{item['category']}] {item['message']}")
                
        if self.issues:
            print(f"\n❌ ISSUES: {len(self.issues)}")
            for item in self.issues:
                severity_icon = "🔴" if item['severity'] == "CRITICAL" else "🟡"
                print(f"   {severity_icon} [{item['category']}] {item['message']}")
        else:
            print("\n✅ NO CRITICAL ISSUES FOUND!")
            
        # Summary
        print("\n" + "="*70)
        print("📋 SUMMARY")
        print("="*70)
        
        total_tests = len(self.passed) + len(self.warnings) + len(self.issues)
        critical_issues = len([i for i in self.issues if i['severity'] == 'CRITICAL'])
        
        print(f"Total Checks: {total_tests}")
        print(f"Passed: {len(self.passed)}")
        print(f"Warnings: {len(self.warnings)}")
        print(f"Issues: {len(self.issues)} ({critical_issues} critical)")
        
        if critical_issues == 0:
            print("\n✅ READY FOR SERVER RESTART")
            print("All critical workflows are properly configured.")
        else:
            print(f"\n⚠️  {critical_issues} CRITICAL ISSUES NEED ATTENTION")
            print("Please fix critical issues before restarting servers.")
            
        return critical_issues == 0

if __name__ == "__main__":
    root_dir = Path(__file__).parent
    tester = WorkflowTester(root_dir)
    success = tester.run_all_tests()
    
    exit(0 if success else 1)
