#!/usr/bin/env python3
"""
Test frontend integration for wallet Phase 1 components
"""
import requests
import time

def test_frontend_wallet_pages():
    """Test that frontend can load wallet-related pages"""
    print("🌐 Testing Frontend Wallet Integration...")
    
    base_url = "http://localhost:3000"
    
    # Test main pages that should load without errors
    pages_to_test = [
        ("Home", "/"),
        ("Login", "/login"),
        ("Events", "/events"),
        ("Attendee Profile", "/attendee/profile"),
        ("Organizer Settings", "/organizer/settings")
    ]
    
    all_working = True
    
    for page_name, path in pages_to_test:
        try:
            response = requests.get(f"{base_url}{path}", timeout=5)
            if response.status_code == 200:
                print(f"  ✅ {page_name}: Accessible")
            else:
                print(f"  ❌ {page_name}: Status {response.status_code}")
                all_working = False
        except Exception as e:
            print(f"  ❌ {page_name}: Error - {e}")
            all_working = False
    
    return all_working

def test_api_endpoints_from_frontend():
    """Test that API endpoints are accessible from frontend perspective"""
    print("\n🔧 Testing API Endpoints Accessibility...")
    
    base_url = "http://localhost:8000"
    headers = {"Authorization": "Bearer mock_access_token_admin"}
    
    # Test key wallet endpoints
    endpoints_to_test = [
        ("Wallet Security Status", "/api/wallet/security/status"),
        ("Withdrawal Methods", "/api/wallet/withdrawal-methods"),
        ("Bank Accounts", "/api/wallet/bank-accounts"),
        ("Withdrawals History", "/api/wallet/withdrawals"),
        ("Original Balance", "/api/payments/wallet/balance")
    ]
    
    all_working = True
    
    for endpoint_name, path in endpoints_to_test:
        try:
            response = requests.get(f"{base_url}{path}", headers=headers, timeout=5)
            if response.status_code == 200:
                print(f"  ✅ {endpoint_name}: Working")
            else:
                print(f"  ❌ {endpoint_name}: Status {response.status_code}")
                all_working = False
        except Exception as e:
            print(f"  ❌ {endpoint_name}: Error - {e}")
            all_working = False
    
    return all_working

def main():
    """Test complete frontend integration"""
    print("🚀 WALLET FRONTEND INTEGRATION TEST")
    print("=" * 50)
    
    frontend_ok = test_frontend_wallet_pages()
    api_ok = test_api_endpoints_from_frontend()
    
    print("\n" + "=" * 50)
    print("🎯 INTEGRATION TEST RESULTS")
    print("=" * 50)
    
    if frontend_ok and api_ok:
        print("✅ FRONTEND INTEGRATION SUCCESSFUL!")
        print("🌐 All frontend pages accessible")
        print("🔧 All API endpoints working")
        print("🎯 Ready for wallet component integration")
        
        print("\n📋 NEXT STEPS FOR FRONTEND:")
        print("1. Add WalletSecurity component to user settings")
        print("2. Add WithdrawalForm component to wallet page")
        print("3. Integrate with existing wallet balance display")
        print("4. Add transaction PIN prompts to existing flows")
        print("5. Test complete user workflows")
        
    else:
        print("❌ INTEGRATION ISSUES DETECTED")
        if not frontend_ok:
            print("🔧 Frontend accessibility issues")
        if not api_ok:
            print("🔧 API endpoint issues")
    
    return frontend_ok and api_ok

if __name__ == "__main__":
    main()