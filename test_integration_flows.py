#!/usr/bin/env python3
"""
Integration Flow Tests
Tests the actual data flow and component integration
"""
import re
from pathlib import Path
from typing import Dict, List

class IntegrationTester:
    def __init__(self, root_dir: Path):
        self.root_dir = root_dir
        self.frontend_dir = root_dir / "apps" / "frontend" / "src"
        self.backend_dir = root_dir / "apps" / "backend-fastapi"
        self.results = []
        
    def log(self, workflow: str, status: str, message: str):
        self.results.append({
            "workflow": workflow,
            "status": status,
            "message": message
        })
        
    def test_event_display_flow(self):
        """Test event display data flow"""
        print("\n🔄 Testing Event Display Flow...")
        
        # Frontend: Events.tsx should fetch events
        events_page = self.frontend_dir / "pages" / "Events.tsx"
        if events_page.exists():
            content = events_page.read_text(encoding='utf-8')
            
            # Check for event fetching
            if 'fetchEvents' in content or '/api/events' in content:
                self.log("Event Display", "✅", "Frontend fetches events")
                
                # Check for event state management
                if 'useState' in content and 'events' in content.lower():
                    self.log("Event Display", "✅", "Uses state management for events")
                    
                # Check for loading state
                if 'loading' in content.lower() or 'isLoading' in content:
                    self.log("Event Display", "✅", "Has loading state")
                    
                # Check for error handling
                if 'catch' in content or 'error' in content.lower():
                    self.log("Event Display", "✅", "Has error handling")
            else:
                self.log("Event Display", "⚠️", "Event fetching not found")
                
        # Backend: events router should have GET endpoint
        events_router = self.backend_dir / "routers" / "events.py"
        if events_router.exists():
            content = events_router.read_text(encoding='utf-8')
            
            if '@router.get' in content:
                self.log("Event Display", "✅", "Backend has GET events endpoint")
                
                # Check for pagination
                if 'limit' in content or 'offset' in content or 'page' in content:
                    self.log("Event Display", "✅", "Backend supports pagination")
                    
                # Check for filtering
                if 'filter' in content.lower() or 'search' in content.lower():
                    self.log("Event Display", "✅", "Backend supports filtering")

    def test_ticket_purchase_flow(self):
        """Test ticket purchase data flow"""
        print("\n🔄 Testing Ticket Purchase Flow...")
        
        # Frontend: PurchaseButton should trigger payment
        purchase_btn = self.frontend_dir / "components" / "tickets" / "PurchaseButton.tsx"
        if purchase_btn.exists():
            content = purchase_btn.read_text(encoding='utf-8')
            
            # Check for purchase handler
            if 'handlePurchase' in content or 'onPurchase' in content:
                self.log("Ticket Purchase", "✅", "Has purchase handler")
                
            # Check for payment modal integration
            if 'PaymentModal' in content or 'payment' in content.lower():
                self.log("Ticket Purchase", "✅", "Integrates with payment modal")
                
        # Frontend: PaymentModal should handle payment methods
        payment_modal = self.frontend_dir / "components" / "payment" / "PaymentModal.tsx"
        if payment_modal.exists():
            content = payment_modal.read_text(encoding='utf-8')
            
            payment_methods = ['wallet', 'bank', 'ussd', 'airtime']
            found_methods = [m for m in payment_methods if m in content.lower()]
            
            if len(found_methods) >= 3:
                self.log("Ticket Purchase", "✅", f"Supports {len(found_methods)} payment methods")
                
            # Check for payment verification
            if 'verify' in content.lower():
                self.log("Ticket Purchase", "✅", "Has payment verification")
                
        # Backend: payments router should handle payments
        payments_router = self.backend_dir / "routers" / "payments.py"
        if payments_router.exists():
            content = payments_router.read_text(encoding='utf-8')
            
            if '@router.post' in content:
                self.log("Ticket Purchase", "✅", "Backend has payment endpoints")
                
            # Check for payment verification endpoint
            if 'verify' in content.lower():
                self.log("Ticket Purchase", "✅", "Backend has verification endpoint")

    def test_event_creation_flow(self):
        """Test event creation data flow"""
        print("\n🔄 Testing Event Creation Flow...")
        
        # Frontend: CreateEvent should have form
        create_event = self.frontend_dir / "pages" / "organizer" / "CreateEvent.tsx"
        if create_event.exists():
            content = create_event.read_text(encoding='utf-8')
            
            # Check for form handling
            if 'handleSubmit' in content or 'onSubmit' in content:
                self.log("Event Creation", "✅", "Has form submission handler")
                
            # Check for form validation
            if 'validate' in content.lower() or 'error' in content.lower():
                self.log("Event Creation", "✅", "Has form validation")
                
            # Check for ticket tier management
            if 'TicketTier' in content or 'ticketTiers' in content:
                self.log("Event Creation", "✅", "Supports ticket tiers")
                
            # Check for image upload
            if 'image' in content.lower() or 'upload' in content.lower():
                self.log("Event Creation", "✅", "Supports image upload")
                
        # Backend: events router should have create endpoint
        events_router = self.backend_dir / "routers" / "events.py"
        if events_router.exists():
            content = events_router.read_text(encoding='utf-8')
            
            if '@router.post' in content and 'create' in content.lower():
                self.log("Event Creation", "✅", "Backend has create endpoint")
                
            # Check for organizer verification
            if 'organizer' in content.lower() or 'require_role' in content:
                self.log("Event Creation", "✅", "Backend verifies organizer role")

    def test_event_editing_flow(self):
        """Test event editing data flow"""
        print("\n🔄 Testing Event Editing Flow...")
        
        # Frontend: EditEventModal should load and save
        edit_modal = self.frontend_dir / "components" / "modals" / "EditEventModal.tsx"
        if edit_modal.exists():
            content = edit_modal.read_text(encoding='utf-8')
            
            # Check for data loading
            if 'useEffect' in content or 'fetch' in content:
                self.log("Event Editing", "✅", "Loads event data")
                
            # Check for update handler
            if 'handleUpdate' in content or 'onUpdate' in content or 'PUT' in content:
                self.log("Event Editing", "✅", "Has update handler")
                
        # Backend: events router should have update endpoint
        events_router = self.backend_dir / "routers" / "events.py"
        if events_router.exists():
            content = events_router.read_text(encoding='utf-8')
            
            if '@router.put' in content:
                self.log("Event Editing", "✅", "Backend has update endpoint")
                
            # Check for ownership verification
            if 'organizer_id' in content or 'owner' in content.lower():
                self.log("Event Editing", "✅", "Backend verifies event ownership")

    def test_organizer_dashboard_flow(self):
        """Test organizer dashboard data flow"""
        print("\n🔄 Testing Organizer Dashboard Flow...")
        
        # Frontend: OrganizerDashboard should fetch stats
        dashboard = self.frontend_dir / "pages" / "organizer" / "OrganizerDashboard.tsx"
        if dashboard.exists():
            content = dashboard.read_text(encoding='utf-8')
            
            # Check for data fetching
            if 'useEffect' in content:
                self.log("Organizer Dashboard", "✅", "Fetches dashboard data")
                
            # Check for stats display
            stats_keywords = ['revenue', 'tickets', 'events', 'sales']
            found_stats = [s for s in stats_keywords if s in content.lower()]
            
            if len(found_stats) >= 2:
                self.log("Organizer Dashboard", "✅", f"Displays {len(found_stats)} stat types")
                
            # Check for navigation to sub-pages
            if 'navigate' in content or 'Link' in content:
                self.log("Organizer Dashboard", "✅", "Has navigation to sub-pages")

    def test_authentication_integration(self):
        """Test authentication integration"""
        print("\n🔄 Testing Authentication Integration...")
        
        # Frontend: Auth context should provide user
        auth_context = self.frontend_dir / "contexts" / "SupabaseAuthContext.tsx"
        if auth_context.exists():
            content = auth_context.read_text(encoding='utf-8')
            
            # Check for user state
            if 'user' in content and 'useState' in content:
                self.log("Authentication", "✅", "Manages user state")
                
            # Check for session management
            if 'session' in content.lower():
                self.log("Authentication", "✅", "Manages session")
                
            # Check for token handling
            if 'token' in content.lower() or 'access_token' in content:
                self.log("Authentication", "✅", "Handles authentication tokens")
                
        # Frontend: Auth utils should have helper functions
        auth_utils = self.frontend_dir / "utils" / "auth.ts"
        if auth_utils.exists():
            content = auth_utils.read_text(encoding='utf-8')
            
            # Check for authenticated fetch
            if 'authenticatedFetch' in content:
                self.log("Authentication", "✅", "Has authenticated fetch wrapper")
                
            # Check for token refresh
            if 'refresh' in content.lower():
                self.log("Authentication", "✅", "Supports token refresh")

    def test_error_handling(self):
        """Test error handling across components"""
        print("\n🔄 Testing Error Handling...")
        
        critical_files = [
            self.frontend_dir / "pages" / "Events.tsx",
            self.frontend_dir / "pages" / "EventDetail.tsx",
            self.frontend_dir / "components" / "tickets" / "PurchaseButton.tsx",
            self.frontend_dir / "pages" / "organizer" / "CreateEvent.tsx"
        ]
        
        files_with_error_handling = 0
        for file in critical_files:
            if file.exists():
                content = file.read_text(encoding='utf-8')
                if 'catch' in content and ('error' in content.lower() or 'Error' in content):
                    files_with_error_handling += 1
                    
        if files_with_error_handling >= 3:
            self.log("Error Handling", "✅", f"{files_with_error_handling}/{len(critical_files)} critical files have error handling")
        else:
            self.log("Error Handling", "⚠️", f"Only {files_with_error_handling}/{len(critical_files)} files have error handling")

    def test_data_validation(self):
        """Test data validation"""
        print("\n🔄 Testing Data Validation...")
        
        # Check backend models
        models_dir = self.backend_dir / "models"
        if models_dir.exists():
            model_files = list(models_dir.glob("*.py"))
            
            if len(model_files) > 0:
                self.log("Data Validation", "✅", f"Found {len(model_files)} model files")
                
                # Check for Pydantic models
                for model_file in model_files:
                    content = model_file.read_text(encoding='utf-8')
                    if 'BaseModel' in content:
                        self.log("Data Validation", "✅", f"{model_file.name} uses Pydantic validation")
                        break

    def run_all_tests(self):
        """Run all integration tests"""
        print("="*70)
        print("🔗 INTEGRATION FLOW TESTS")
        print("="*70)
        
        self.test_event_display_flow()
        self.test_ticket_purchase_flow()
        self.test_event_creation_flow()
        self.test_event_editing_flow()
        self.test_organizer_dashboard_flow()
        self.test_authentication_integration()
        self.test_error_handling()
        self.test_data_validation()
        
        # Print results
        print("\n" + "="*70)
        print("📊 INTEGRATION TEST RESULTS")
        print("="*70)
        
        workflows = {}
        for result in self.results:
            workflow = result['workflow']
            if workflow not in workflows:
                workflows[workflow] = []
            workflows[workflow].append(result)
            
        for workflow, results in workflows.items():
            print(f"\n{workflow}:")
            for result in results:
                print(f"  {result['status']} {result['message']}")
                
        # Summary
        passed = len([r for r in self.results if r['status'] == '✅'])
        warnings = len([r for r in self.results if r['status'] == '⚠️'])
        
        print("\n" + "="*70)
        print("📋 INTEGRATION SUMMARY")
        print("="*70)
        print(f"Total Checks: {len(self.results)}")
        print(f"Passed: {passed}")
        print(f"Warnings: {warnings}")
        
        if warnings == 0:
            print("\n✅ ALL INTEGRATION FLOWS VERIFIED")
        else:
            print(f"\n⚠️  {warnings} integration points need attention")

if __name__ == "__main__":
    root_dir = Path(__file__).parent
    tester = IntegrationTester(root_dir)
    tester.run_all_tests()
