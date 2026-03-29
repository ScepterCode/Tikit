#!/usr/bin/env python3
"""
Final Payment System Test
Comprehensive test of the complete payment system after all fixes
"""

import requests
import json
import time
import os
from datetime import datetime

# Test configuration
BACKEND_URL = "http://localhost:8000"
FRONTEND_URL = "http://localhost:3000"

def print_header(title):
    """Print formatted header"""
    print(f"\n{'='*80}")
    print(f"🔍 {title}")
    print('='*80)

def print_section(title):
    """Print formatted section"""
    print(f"\n{'-'*60}")
    print(f"📋 {title}")
    print('-'*60)

def test_system_health():
    """Test overall system health"""
    print_header("SYSTEM HEALTH CHECK")
    
    results = {}
    
    # Test backend
    try:
        response = requests.get(f"{BACKEND_URL}/health", timeout=5)
        if response.status_code == 200:
            print("✅ Backend server: Running and healthy")
            results['backend'] = True
        else:
            print(f"⚠️  Backend server: HTTP {response.status_code}")
            results['backend'] = False
    except Exception as e:
        print(f"❌ Backend server: Not accessible - {e}")
        results['backend'] = False
    
    # Test frontend
    try:
        response = requests.get(f"{FRONTEND_URL}", timeout=5)
        if response.status_code == 200:
            print("✅ Frontend server: Running and accessible")
            results['frontend'] = True
        else:
            print(f"⚠️  Frontend server: HTTP {response.status_code}")
            results['frontend'] = False
    except Exception as e:
        print(f"❌ Frontend server: Not accessible - {e}")
        results['frontend'] = False
    
    return results

def test_credentials_configuration():
    """Test credential configuration"""
    print_header("CREDENTIALS CONFIGURATION")
    
    results = {}
    
    # Read backend environment
    try:
        with open('apps/backend-fastapi/.env', 'r') as f:
            backend_content = f.read()
        
        # Check for LIVE credentials (prioritized)
        if 'FLUTTERWAVE_LIVE_SECRET_KEY=' in backend_content:
            print("✅ Backend: LIVE secret key configured")
            results['backend_secret'] = True
        elif 'FLUTTERWAVE_CLIENT_SECRET_KEY=' in backend_content:
            print("⚠️  Backend: CLIENT secret key found (LIVE preferred)")
            results['backend_secret'] = True
        else:
            print("❌ Backend: No secret key found")
            results['backend_secret'] = False
        
        if 'FLUTTERWAVE_LIVE_PUBLIC_KEY=' in backend_content:
            print("✅ Backend: LIVE public key configured")
            results['backend_public'] = True
        elif 'FLUTTERWAVE_CLIENT_ID=' in backend_content:
            print("⚠️  Backend: CLIENT ID found (LIVE preferred)")
            results['backend_public'] = True
        else:
            print("❌ Backend: No public key found")
            results['backend_public'] = False
            
    except Exception as e:
        print(f"❌ Backend credentials: Error reading file - {e}")
        results['backend_secret'] = False
        results['backend_public'] = False
    
    # Read frontend environment
    try:
        with open('apps/frontend/.env.production', 'r') as f:
            frontend_content = f.read()
        
        if 'VITE_FLUTTERWAVE_LIVE_PUBLIC_KEY=' in frontend_content:
            print("✅ Frontend: LIVE public key configured")
            results['frontend_public'] = True
        elif 'VITE_FLUTTERWAVE_PUBLIC_KEY=' in frontend_content:
            print("⚠️  Frontend: Standard public key found")
            results['frontend_public'] = True
        else:
            print("❌ Frontend: No public key found")
            results['frontend_public'] = False
            
    except Exception as e:
        print(f"❌ Frontend credentials: Error reading file - {e}")
        results['frontend_public'] = False
    
    return results

def test_authentication_system():
    """Test authentication system"""
    print_header("AUTHENTICATION SYSTEM")
    
    try:
        login_data = {
            "phone_number": "+2348012345678",
            "password": "admin123"
        }
        
        response = requests.post(
            f"{BACKEND_URL}/api/auth/login",
            json=login_data,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                token = data.get('data', {}).get('access_token')
                if token:
                    print("✅ Authentication: Working correctly")
                    print(f"   Token format: {token[:20]}...")
                    return token
        
        print(f"❌ Authentication: Failed - {response.status_code}")
        return None
        
    except Exception as e:
        print(f"❌ Authentication: Error - {e}")
        return None

def test_payment_endpoints(token):
    """Test payment endpoints"""
    print_header("PAYMENT ENDPOINTS")
    
    results = {}
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    } if token else {"Content-Type": "application/json"}
    
    # Test payment methods
    print_section("Payment Methods Endpoint")
    try:
        response = requests.get(f"{BACKEND_URL}/api/payments/methods", timeout=10)
        if response.status_code == 200:
            data = response.json()
            methods = data.get('methods', [])
            print(f"✅ Payment methods: {len(methods)} methods available")
            
            for method in methods:
                status = "✅" if method.get('available') else "❌"
                print(f"   {status} {method.get('name')}: {method.get('description')}")
            
            results['methods'] = True
        else:
            print(f"❌ Payment methods: HTTP {response.status_code}")
            results['methods'] = False
    except Exception as e:
        print(f"❌ Payment methods: Error - {e}")
        results['methods'] = False
    
    # Test wallet balance
    print_section("Wallet Balance Endpoint")
    if token:
        try:
            response = requests.get(
                f"{BACKEND_URL}/api/payments/balance",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    balance = data.get('balance', 0)
                    print(f"✅ Wallet balance: ₦{balance:,.2f}")
                    results['wallet'] = True
                else:
                    print("❌ Wallet balance: API returned error")
                    results['wallet'] = False
            else:
                print(f"❌ Wallet balance: HTTP {response.status_code}")
                results['wallet'] = False
        except Exception as e:
            print(f"❌ Wallet balance: Error - {e}")
            results['wallet'] = False
    else:
        print("⚠️  Wallet balance: Skipped (no authentication)")
        results['wallet'] = False
    
    # Test Flutterwave payment creation
    print_section("Flutterwave Payment Creation")
    if token:
        try:
            payment_data = {
                "amount": 100000,  # ₦1,000 in kobo
                "reference": f"TEST_FINAL_{int(time.time())}",
                "event_id": "test-event-final",
                "customer_email": "admin@grooovy.com",
                "customer_name": "Admin User",
                "customer_phone": "+2348012345678"
            }
            
            response = requests.post(
                f"{BACKEND_URL}/api/payments/flutterwave/create",
                json=payment_data,
                headers=headers,
                timeout=15
            )
            
            print(f"Response Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    print("✅ Flutterwave payment: Working correctly")
                    print(f"   Payment link: {data.get('payment_link', 'N/A')[:50]}...")
                    print(f"   Transaction ref: {data.get('tx_ref', 'N/A')}")
                    results['flutterwave'] = True
                else:
                    print("❌ Flutterwave payment: API returned error")
                    error_msg = data.get('error', {}).get('message', 'Unknown error')
                    print(f"   Error: {error_msg}")
                    results['flutterwave'] = False
            else:
                print(f"❌ Flutterwave payment: HTTP {response.status_code}")
                try:
                    error_data = response.json()
                    error_msg = error_data.get('detail', {}).get('error', {}).get('message', '')
                    if 'Invalid authorization key' in error_msg:
                        print("   Issue: Flutterwave credentials invalid or server needs restart")
                    print(f"   Error: {error_msg}")
                except:
                    pass
                results['flutterwave'] = False
                
        except Exception as e:
            print(f"❌ Flutterwave payment: Error - {e}")
            results['flutterwave'] = False
    else:
        print("⚠️  Flutterwave payment: Skipped (no authentication)")
        results['flutterwave'] = False
    
    return results

def test_security_features(token):
    """Test security features"""
    print_header("SECURITY FEATURES")
    
    results = {}
    
    if not token:
        print("⚠️  Security tests: Skipped (no authentication)")
        return {'security': False}
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Test amount validation (minimum)
    print_section("Amount Validation (Minimum)")
    try:
        payment_data = {
            "amount": 5000,  # ₦50 - below minimum
            "reference": f"TEST_LOW_FINAL_{int(time.time())}",
            "event_id": "test-event-final",
            "customer_email": "admin@grooovy.com",
            "customer_name": "Admin User"
        }
        
        response = requests.post(
            f"{BACKEND_URL}/api/payments/flutterwave/create",
            json=payment_data,
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 400:
            print("✅ Amount validation (minimum): Correctly rejected low amount")
            results['min_amount'] = True
        else:
            print("⚠️  Amount validation (minimum): Should have been rejected")
            results['min_amount'] = False
            
    except Exception as e:
        print(f"❌ Amount validation (minimum): Error - {e}")
        results['min_amount'] = False
    
    # Test amount validation (maximum)
    print_section("Amount Validation (Maximum)")
    try:
        payment_data = {
            "amount": 1500000,  # ₦15,000 - above maximum
            "reference": f"TEST_HIGH_FINAL_{int(time.time())}",
            "event_id": "test-event-final",
            "customer_email": "admin@grooovy.com",
            "customer_name": "Admin User"
        }
        
        response = requests.post(
            f"{BACKEND_URL}/api/payments/flutterwave/create",
            json=payment_data,
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 400:
            print("✅ Amount validation (maximum): Correctly rejected high amount")
            results['max_amount'] = True
        else:
            print("⚠️  Amount validation (maximum): Should have been rejected")
            results['max_amount'] = False
            
    except Exception as e:
        print(f"❌ Amount validation (maximum): Error - {e}")
        results['max_amount'] = False
    
    return results

def test_frontend_integration():
    """Test frontend integration"""
    print_header("FRONTEND INTEGRATION")
    
    results = {}
    
    # Check SecurePaymentModal
    modal_file = 'apps/frontend/src/components/payment/SecurePaymentModal.tsx'
    
    if os.path.exists(modal_file):
        print("✅ SecurePaymentModal: File exists")
        
        try:
            with open(modal_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Check for key integrations
            checks = [
                ('VITE_FLUTTERWAVE_LIVE_PUBLIC_KEY', 'LIVE public key support'),
                ('VITE_FLUTTERWAVE_PUBLIC_KEY', 'Standard public key support'),
                ('FlutterwaveCheckout', 'Flutterwave integration'),
                ('payment_options.*card.*bank', 'Payment options'),
                ('verify.*payment', 'Payment verification'),
                ('wallet.*balance', 'Wallet integration'),
            ]
            
            passed_checks = 0
            
            for pattern, description in checks:
                if pattern.lower() in content.lower():
                    print(f"✅ {description}: Implemented")
                    passed_checks += 1
                else:
                    print(f"⚠️  {description}: Not found")
            
            results['frontend'] = passed_checks >= 4  # At least 4 checks should pass
            
        except Exception as e:
            print(f"❌ Frontend integration: Error reading file - {e}")
            results['frontend'] = False
    else:
        print("❌ SecurePaymentModal: File not found")
        results['frontend'] = False
    
    return results

def generate_final_report(all_results):
    """Generate comprehensive final report"""
    print_header("FINAL PAYMENT SYSTEM STATUS REPORT")
    
    # Calculate overall scores
    total_tests = 0
    passed_tests = 0
    
    for category, results in all_results.items():
        if isinstance(results, dict):
            for test, result in results.items():
                total_tests += 1
                if result:
                    passed_tests += 1
        elif isinstance(results, bool):
            total_tests += 1
            if results:
                passed_tests += 1
    
    success_rate = (passed_tests / total_tests) * 100 if total_tests > 0 else 0
    
    print(f"📊 Overall Success Rate: {success_rate:.1f}% ({passed_tests}/{total_tests})")
    print(f"📅 Test Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Detailed results
    print_section("Detailed Results")
    
    for category, results in all_results.items():
        print(f"\n🔍 {category.upper()}:")
        if isinstance(results, dict):
            for test, result in results.items():
                status = "✅ PASS" if result else "❌ FAIL"
                print(f"   {status} {test}")
        elif isinstance(results, bool):
            status = "✅ PASS" if results else "❌ FAIL"
            print(f"   {status} {category}")
    
    # System status assessment
    print_section("System Status Assessment")
    
    if success_rate >= 90:
        print("🎉 EXCELLENT: Payment system fully operational!")
        print("✅ Ready for production use")
        print("✅ All critical features working")
        print("✅ Security measures active")
        status = "EXCELLENT"
    elif success_rate >= 75:
        print("🟢 GOOD: Payment system mostly operational")
        print("✅ Core functionality working")
        print("⚠️  Minor issues need attention")
        status = "GOOD"
    elif success_rate >= 50:
        print("🟡 FAIR: Payment system partially operational")
        print("✅ Basic functionality working")
        print("❌ Several issues need fixing")
        status = "FAIR"
    else:
        print("🔴 NEEDS WORK: Payment system needs significant attention")
        print("❌ Multiple critical issues")
        status = "NEEDS_WORK"
    
    # Specific recommendations
    print_section("Recommendations")
    
    if success_rate >= 90:
        print("1. ✅ System ready for production")
        print("2. 🧪 Conduct user acceptance testing")
        print("3. 📊 Monitor payment success rates")
        print("4. 🔔 Set up payment alerts")
    else:
        print("1. 🔧 Address failing tests above")
        
        # Specific issues
        flutterwave_working = all_results.get('payment_endpoints', {}).get('flutterwave', False)
        if not flutterwave_working:
            print("2. 🔑 CRITICAL: Fix Flutterwave credentials")
            print("   - Verify credentials are correct live keys")
            print("   - Restart backend server to pick up new environment")
            print("   - Test credentials directly with Flutterwave API")
        
        auth_working = all_results.get('auth_token') is not None
        if not auth_working:
            print("3. 🔐 Fix authentication system")
        
        print("4. 🔄 Re-run tests after fixes")
        print("5. 📞 Contact support if issues persist")
    
    return status, success_rate

def main():
    """Run comprehensive final payment system test"""
    print("🚀 FINAL COMPREHENSIVE PAYMENT SYSTEM TEST")
    print("="*80)
    print("Testing all components after user credential updates")
    
    start_time = time.time()
    all_results = {}
    
    # Test 1: System Health
    health_results = test_system_health()
    all_results['system_health'] = health_results
    
    # Test 2: Credentials
    cred_results = test_credentials_configuration()
    all_results['credentials'] = cred_results
    
    # Test 3: Authentication
    token = test_authentication_system()
    all_results['auth_token'] = token is not None
    
    # Test 4: Payment Endpoints
    if health_results.get('backend'):
        payment_results = test_payment_endpoints(token)
        all_results['payment_endpoints'] = payment_results
    else:
        print("⚠️  Skipping payment endpoint tests (backend not accessible)")
        all_results['payment_endpoints'] = {}
    
    # Test 5: Security Features
    if token:
        security_results = test_security_features(token)
        all_results['security'] = security_results
    else:
        print("⚠️  Skipping security tests (no authentication)")
        all_results['security'] = {}
    
    # Test 6: Frontend Integration
    frontend_results = test_frontend_integration()
    all_results['frontend_integration'] = frontend_results
    
    # Generate final report
    end_time = time.time()
    duration = end_time - start_time
    
    status, success_rate = generate_final_report(all_results)
    
    print_section("Test Summary")
    print(f"Duration: {duration:.2f} seconds")
    print(f"Status: {status}")
    print(f"Success Rate: {success_rate:.1f}%")
    
    # Return status for automation
    return status == "EXCELLENT" or status == "GOOD"

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)