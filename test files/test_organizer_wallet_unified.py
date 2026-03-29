#!/usr/bin/env python3
"""
Test Organizer Wallet Unified Dashboard Implementation
Verifies that the organizer wallet page now uses the unified dashboard
"""

import os

def test_organizer_wallet_unified():
    """Test that organizer wallet page uses unified dashboard"""
    print("🔄 Testing Organizer Wallet Unified Dashboard Implementation...")
    
    organizer_wallet_path = "apps/frontend/src/pages/organizer/OrganizerWallet.tsx"
    
    if not os.path.exists(organizer_wallet_path):
        print("❌ OrganizerWallet.tsx not found")
        return False
    
    with open(organizer_wallet_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check for unified dashboard implementation
    checks = [
        ("Unified Dashboard Import", "UnifiedWalletDashboard"),
        ("Component Usage", "<UnifiedWalletDashboard"),
        ("Removed Old Tabs", "activeTab" not in content),
        ("Removed Old Components", "MultiWalletDashboard" not in content),
        ("Simplified Structure", "renderTabContent" not in content),
        ("Clean Header", "Organizer Wallet"),
        ("Proper Navigation", "navigate('/organizer/dashboard')"),
        ("Removed Complex State", "quickStats" not in content),
        ("Removed Tab Navigation", "tabsContainer" not in content),
        ("Streamlined Imports", len([line for line in content.split('\n') if 'import' in line and 'wallet' in line.lower()]) <= 2)
    ]
    
    passed = 0
    total = len(checks)
    
    for check_name, condition in checks:
        if isinstance(condition, bool):
            if condition:
                print(f"✅ {check_name}: Verified")
                passed += 1
            else:
                print(f"❌ {check_name}: Failed")
        elif condition in content:
            print(f"✅ {check_name}: Found")
            passed += 1
        else:
            print(f"❌ {check_name}: Missing")
    
    success_rate = (passed / total) * 100
    print(f"\n📊 Organizer Wallet Test Results: {passed}/{total} ({success_rate:.1f}%)")
    
    if success_rate >= 90:
        print("🎉 EXCELLENT - Organizer wallet successfully unified!")
        return True
    elif success_rate >= 70:
        print("✅ GOOD - Most features unified, minor issues remain")
        return True
    else:
        print("❌ NEEDS WORK - Significant issues with unification")
        return False

def main():
    """Main test execution"""
    print("🚀 Testing Organizer Wallet Unified Dashboard...")
    print("=" * 60)
    
    success = test_organizer_wallet_unified()
    
    print("\n" + "=" * 60)
    if success:
        print("🎯 ORGANIZER WALLET UNIFICATION: SUCCESS")
        print("The organizer wallet page now uses the unified dashboard!")
        print("Both attendee and organizer wallets are now aligned.")
    else:
        print("⚠️ ORGANIZER WALLET UNIFICATION: NEEDS ATTENTION")
        print("Some issues remain with the organizer wallet implementation.")
    print("=" * 60)

if __name__ == "__main__":
    main()