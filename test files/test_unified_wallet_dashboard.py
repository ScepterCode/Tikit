#!/usr/bin/env python3
"""
Test Unified Wallet Dashboard Implementation
Verifies the new unified wallet UI aligns with backend system
"""

import asyncio
import json
from datetime import datetime
import sys
import os

# Add the backend directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'apps', 'backend-fastapi'))

class UnifiedWalletDashboardTester:
    def __init__(self):
        self.test_results = []
        
    def test_component_structure(self):
        """Test that the unified wallet dashboard component exists and has correct structure"""
        print("🔄 Testing Unified Wallet Dashboard Component Structure...")
        
        try:
            # Check if UnifiedWalletDashboard.tsx exists
            dashboard_path = "apps/frontend/src/components/wallet/UnifiedWalletDashboard.tsx"
            if os.path.exists(dashboard_path):
                print("✅ UnifiedWalletDashboard.tsx component exists")
                self.test_results.append(("Component Exists", "PASS", "UnifiedWalletDashboard.tsx found"))
                
                # Read and analyze component structure
                with open(dashboard_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    
                # Check for key features
                features_to_check = [
                    ("Balance Overview", "balanceSection"),
                    ("Quick Actions", "actionsSection"),
                    ("Security Status", "securitySection"),
                    ("Transaction History", "transactionsSection"),
                    ("Single API Call", "fetchWalletData"),
                    ("Unified Data Fetch", "Promise.all"),
                    ("Balance Visibility Toggle", "balanceVisible"),
                    ("Expandable Transactions", "showAllTransactions"),
                    ("Modal Integration", "AddFundsModal"),
                    ("Real-time Updates", "useEffect")
                ]
                
                for feature_name, feature_code in features_to_check:
                    if feature_code in content:
                        print(f"✅ {feature_name}: Implemented")
                        self.test_results.append((f"Feature: {feature_name}", "PASS", "Found in component"))
                    else:
                        print(f"❌ {feature_name}: Missing")
                        self.test_results.append((f"Feature: {feature_name}", "FAIL", "Not found in component"))
                        
            else:
                print("❌ UnifiedWalletDashboard.tsx component not found")
                self.test_results.append(("Component Exists", "FAIL", "UnifiedWalletDashboard.tsx not found"))
                
        except Exception as e:
            print(f"❌ Component structure test failed: {e}")
            self.test_results.append(("Component Structure", "ERROR", str(e)))
            
    def test_wallet_page_integration(self):
        """Test that the main Wallet.tsx page uses the unified dashboard"""
        print("\n🔄 Testing Wallet Page Integration...")
        
        try:
            wallet_path = "apps/frontend/src/pages/attendee/Wallet.tsx"
            if os.path.exists(wallet_path):
                with open(wallet_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    
                # Check for unified dashboard integration
                integration_checks = [
                    ("Unified Dashboard Import", "UnifiedWalletDashboard"),
                    ("Component Usage", "<UnifiedWalletDashboard"),
                    ("Simplified Structure", "unified wallet dashboard"),
                    ("Removed Old Code", "fetchWalletData" not in content or "fetchTransactions" not in content)
                ]
                
                for check_name, check_code in integration_checks:
                    if isinstance(check_code, bool):
                        if check_code:
                            print(f"✅ {check_name}: Verified")
                            self.test_results.append((f"Integration: {check_name}", "PASS", "Verified"))
                        else:
                            print(f"❌ {check_name}: Failed")
                            self.test_results.append((f"Integration: {check_name}", "FAIL", "Not verified"))
                    elif check_code in content:
                        print(f"✅ {check_name}: Found")
                        self.test_results.append((f"Integration: {check_name}", "PASS", "Found in Wallet.tsx"))
                    else:
                        print(f"❌ {check_name}: Missing")
                        self.test_results.append((f"Integration: {check_name}", "FAIL", "Not found in Wallet.tsx"))
                        
            else:
                print("❌ Wallet.tsx page not found")
                self.test_results.append(("Wallet Page", "FAIL", "Wallet.tsx not found"))
                
        except Exception as e:
            print(f"❌ Wallet page integration test failed: {e}")
            self.test_results.append(("Wallet Integration", "ERROR", str(e)))
            
    def test_api_alignment(self):
        """Test that the component uses unified wallet API endpoints"""
        print("\n🔄 Testing API Alignment...")
        
        try:
            dashboard_path = "apps/frontend/src/components/wallet/UnifiedWalletDashboard.tsx"
            if os.path.exists(dashboard_path):
                with open(dashboard_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    
                # Check for correct API endpoints
                api_checks = [
                    ("Unified Balance API", "/api/wallet/unified/balance"),
                    ("Unified Transactions API", "/api/wallet/unified/transactions"),
                    ("Security Status API", "/api/wallet/security/status"),
                    ("Single API Call Pattern", "Promise.all"),
                    ("Error Handling", "try {" and "catch"),
                    ("Loading States", "setLoading"),
                    ("Real Data Integration", "authenticatedFetch")
                ]
                
                for check_name, check_code in api_checks:
                    if isinstance(check_code, tuple):
                        if all(code in content for code in check_code):
                            print(f"✅ {check_name}: Implemented")
                            self.test_results.append((f"API: {check_name}", "PASS", "Found in component"))
                        else:
                            print(f"❌ {check_name}: Missing")
                            self.test_results.append((f"API: {check_name}", "FAIL", "Not found in component"))
                    elif check_code in content:
                        print(f"✅ {check_name}: Found")
                        self.test_results.append((f"API: {check_name}", "PASS", "Found in component"))
                    else:
                        print(f"❌ {check_name}: Missing")
                        self.test_results.append((f"API: {check_name}", "FAIL", "Not found in component"))
                        
        except Exception as e:
            print(f"❌ API alignment test failed: {e}")
            self.test_results.append(("API Alignment", "ERROR", str(e)))
            
    def test_ui_structure_alignment(self):
        """Test that UI structure aligns with unified wallet concept"""
        print("\n🔄 Testing UI Structure Alignment...")
        
        try:
            dashboard_path = "apps/frontend/src/components/wallet/UnifiedWalletDashboard.tsx"
            if os.path.exists(dashboard_path):
                with open(dashboard_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    
                # Check for unified structure elements
                structure_checks = [
                    ("Single Balance Display", "totalBalance"),
                    ("Balance Breakdown", "availableBalance"),
                    ("Integrated Actions", "Quick Actions"),
                    ("Inline Security Status", "Security Status"),
                    ("Expandable Transactions", "showAllTransactions"),
                    ("Modal Overlays", "Modal"),
                    ("Responsive Design", "gridTemplateColumns"),
                    ("Consistent Styling", "styles."),
                    ("Loading States", "loading"),
                    ("Error Handling", "catch")
                ]
                
                for check_name, check_code in structure_checks:
                    if check_code in content:
                        print(f"✅ {check_name}: Implemented")
                        self.test_results.append((f"UI Structure: {check_name}", "PASS", "Found in component"))
                    else:
                        print(f"❌ {check_name}: Missing")
                        self.test_results.append((f"UI Structure: {check_name}", "FAIL", "Not found in component"))
                        
        except Exception as e:
            print(f"❌ UI structure alignment test failed: {e}")
            self.test_results.append(("UI Structure", "ERROR", str(e)))
            
    def test_old_components_status(self):
        """Test status of old fragmented components"""
        print("\n🔄 Testing Old Components Status...")
        
        old_components = [
            ("MultiWalletDashboard.tsx", "Should be deprecated/unused"),
            ("EnhancedTransactionHistory.tsx", "Should be integrated or deprecated"),
            ("WalletSecurity.tsx", "Should be integrated or deprecated"),
            ("WithdrawalForm.tsx", "Should be integrated or deprecated")
        ]
        
        for component_name, expected_status in old_components:
            component_path = f"apps/frontend/src/components/wallet/{component_name}"
            if os.path.exists(component_path):
                print(f"⚠️  {component_name}: Still exists ({expected_status})")
                self.test_results.append((f"Old Component: {component_name}", "WARNING", "Still exists - consider deprecation"))
            else:
                print(f"✅ {component_name}: Removed or moved")
                self.test_results.append((f"Old Component: {component_name}", "PASS", "Not found - good for cleanup"))
                
    def run_all_tests(self):
        """Run all unified wallet dashboard tests"""
        print("🚀 Starting Unified Wallet Dashboard Tests...")
        print("=" * 60)
        
        self.test_component_structure()
        self.test_wallet_page_integration()
        self.test_api_alignment()
        self.test_ui_structure_alignment()
        self.test_old_components_status()
        
        # Print summary
        self.print_test_summary()
        
    def print_test_summary(self):
        """Print test results summary"""
        print("\n" + "=" * 60)
        print("📊 UNIFIED WALLET DASHBOARD TEST RESULTS")
        print("=" * 60)
        
        passed = sum(1 for _, status, _ in self.test_results if status == "PASS")
        failed = sum(1 for _, status, _ in self.test_results if status == "FAIL")
        warnings = sum(1 for _, status, _ in self.test_results if status == "WARNING")
        errors = sum(1 for _, status, _ in self.test_results if status == "ERROR")
        total = len(self.test_results)
        
        print(f"\n📈 SUMMARY:")
        print(f"   Total Tests: {total}")
        print(f"   ✅ Passed: {passed}")
        print(f"   ❌ Failed: {failed}")
        print(f"   ⚠️  Warnings: {warnings}")
        print(f"   🔥 Errors: {errors}")
        
        if total > 0:
            success_rate = (passed / total) * 100
            print(f"   📊 Success Rate: {success_rate:.1f}%")
            
        print(f"\n📋 DETAILED RESULTS:")
        for test_name, status, details in self.test_results:
            status_icon = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️" if status == "WARNING" else "🔥"
            print(f"   {status_icon} {test_name}: {details}")
            
        print(f"\n🎯 ALIGNMENT STATUS:")
        if success_rate >= 90:
            print("   🎉 EXCELLENT - Unified wallet dashboard perfectly aligned!")
        elif success_rate >= 75:
            print("   ✅ GOOD - Most features aligned, minor improvements needed")
        elif success_rate >= 50:
            print("   ⚠️  PARTIAL - Some alignment achieved, significant work needed")
        else:
            print("   ❌ POOR - Major alignment issues, requires immediate attention")
            
        print("\n" + "=" * 60)

def main():
    """Main test execution"""
    tester = UnifiedWalletDashboardTester()
    tester.run_all_tests()

if __name__ == "__main__":
    main()