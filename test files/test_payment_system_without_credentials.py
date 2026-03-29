#!/usr/bin/env python3
"""
Test Payment System Components (Without Credentials)
Tests all components that don't require actual Flutterwave credentials
"""

import os
import re
from pathlib import Path

def test_mock_data_removal():
    """Test that mock data has been removed"""
    print("🧹 Testing Mock Data Removal...")
    
    mock_patterns = [
        (r'walletBalance.*10000', 'Hardcoded wallet balance'),
        (r'Mock.*event.*\[', 'Mock events array'),
        (r'mockEvent', 'Mock event references'),
        (r'mockUser', 'Mock user references'),
        (r'Mock.*transaction', 'Mock transaction data'),
        (r'pk_test_your_key_here', 'Test API keys'),
    ]
    
    files_to_check = [
        'apps/frontend/src/contexts/SupabaseAuthContext.tsx',
        'apps/frontend/src/pages/Events.tsx',
        'apps/frontend/src/pages/organizer/OrganizerScanner.tsx',
        'apps/frontend/src/pages/admin/AdminUsers.tsx',
        'apps/frontend/src/pages/admin/AdminFinancials.tsx',
        'apps/frontend/src/components/payment/PaymentModal.tsx',
    ]
    
    issues_found = []
    
    for file_path in files_to_check:
        if not os.path.exists(file_path):
            print(f"⚠️  File not found: {file_path}")
            continue
            
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            for pattern, description in mock_patterns:
                if re.search(pattern, content, re.IGNORECASE):
                    issues_found.append(f"{file_path}: {description}")
        except Exception as e:
            print(f"❌ Error reading {file_path}: {e}")
    
    if issues_found:
        print("⚠️  Mock data patterns found:")
        for issue in issues_found:
            print(f"   - {issue}")
        return False
    else:
        print("✅ No mock data patterns found")
        return True

def test_secure_components_created():
    """Test that secure components were created"""
    print("🔒 Testing Secure Components...")
    
    required_files = [
        ('apps/backend-fastapi/services/flutterwave_service.py', 'Flutterwave service'),
        ('apps/backend-fastapi/middleware/payment_security.py', 'Payment security middleware'),
        ('apps/frontend/src/components/payment/SecurePaymentModal.tsx', 'Secure payment modal'),
    ]
    
    all_exist = True
    
    for file_path, description in required_files:
        if os.path.exists(file_path):
            print(f"✅ {description}: Found")
        else:
            print(f"❌ {description}: Missing")
            all_exist = False
    
    return all_exist

def test_api_endpoints_updated():
    """Test that API endpoints have been updated"""
    print("🌐 Testing API Endpoints...")
    
    payments_file = 'apps/backend-fastapi/routers/payments.py'
    
    if not os.path.exists(payments_file):
        print(f"❌ Payments router not found: {payments_file}")
        return False
    
    try:
        with open(payments_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        required_endpoints = [
            ('flutterwave/create', 'Flutterwave payment creation'),
            ('verify', 'Payment verification'),
            ('webhook/flutterwave', 'Flutterwave webhook'),
            ('methods', 'Payment methods'),
        ]
        
        all_found = True
        
        for endpoint, description in required_endpoints:
            if endpoint in content:
                print(f"✅ {description}: Found")
            else:
                print(f"❌ {description}: Missing")
                all_found = False
        
        return all_found
        
    except Exception as e:
        print(f"❌ Error reading payments router: {e}")
        return False

def test_frontend_integration():
    """Test frontend integration components"""
    print("🎨 Testing Frontend Integration...")
    
    # Test SecurePaymentModal
    modal_file = 'apps/frontend/src/components/payment/SecurePaymentModal.tsx'
    
    if not os.path.exists(modal_file):
        print(f"❌ SecurePaymentModal not found: {modal_file}")
        return False
    
    try:
        with open(modal_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        required_features = [
            ('FlutterwaveCheckout', 'Flutterwave integration'),
            ('VITE_FLUTTERWAVE_PUBLIC_KEY', 'Environment variable usage'),
            ('payment_security', 'Security features'),
            ('rate limiting', 'Rate limiting mention'),
        ]
        
        features_found = 0
        
        for feature, description in required_features:
            if feature.lower() in content.lower():
                print(f"✅ {description}: Found")
                features_found += 1
            else:
                print(f"⚠️  {description}: Not found")
        
        return features_found >= 2  # At least 2 features should be present
        
    except Exception as e:
        print(f"❌ Error reading SecurePaymentModal: {e}")
        return False

def test_purchase_button_updated():
    """Test that PurchaseButton uses SecurePaymentModal"""
    print("🎫 Testing Purchase Button...")
    
    button_file = 'apps/frontend/src/components/tickets/PurchaseButton.tsx'
    
    if not os.path.exists(button_file):
        print(f"❌ PurchaseButton not found: {button_file}")
        return False
    
    try:
        with open(button_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        if 'SecurePaymentModal' in content:
            print("✅ PurchaseButton uses SecurePaymentModal")
            return True
        else:
            print("❌ PurchaseButton not updated to use SecurePaymentModal")
            return False
            
    except Exception as e:
        print(f"❌ Error reading PurchaseButton: {e}")
        return False

def main():
    """Run all tests that don't require credentials"""
    print("🚀 Testing Payment System Components (No Credentials Required)\n")
    
    tests = [
        ("Mock Data Removal", test_mock_data_removal),
        ("Secure Components Created", test_secure_components_created),
        ("API Endpoints Updated", test_api_endpoints_updated),
        ("Frontend Integration", test_frontend_integration),
        ("Purchase Button Updated", test_purchase_button_updated),
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n{'='*50}")
        print(f"Running: {test_name}")
        print('='*50)
        
        try:
            if test_func():
                passed += 1
                print(f"✅ {test_name} PASSED")
            else:
                print(f"❌ {test_name} FAILED")
        except Exception as e:
            print(f"❌ {test_name} ERROR: {e}")
    
    # Summary
    print(f"\n{'='*50}")
    print("TEST SUMMARY")
    print('='*50)
    print(f"Tests Passed: {passed}/{total}")
    print(f"Success Rate: {(passed/total)*100:.1f}%")
    
    if passed == total:
        print("\n🎉 ALL COMPONENT TESTS PASSED!")
        print("✅ Mock data removed successfully")
        print("✅ Secure payment components created")
        print("✅ API endpoints updated")
        print("✅ Frontend integration complete")
    else:
        print(f"\n⚠️  {total-passed} tests failed - Please review issues above")
    
    print("\n📋 Next Steps:")
    print("1. ⚠️  RESTORE your actual Flutterwave public key in .env.production")
    print("2. Test payment flow with real credentials")
    print("3. Verify webhook endpoints")
    print("4. Monitor payment security")

if __name__ == "__main__":
    main()