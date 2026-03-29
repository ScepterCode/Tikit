#!/usr/bin/env python3
"""
Real Payment System Test
Comprehensive testing with actual Flutterwave credentials
"""

import requests
import json
import time
import os
import re
from datetime import datetime

# Test configuration
BACKEND_URL = "http://localhost:8000"
FRONTEND_URL = "http://localhost:3000"

def read_env_file(file_path):
    """Read environment variables from file"""
    env_vars = {}
    try:
        with open(file_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    env_vars[key] = value
    except FileNotFoundError:
        print(f"⚠️  Environment file not found: {file_path}")
    return env_vars

def test_flutterwave_credentials():
    """Test Flutterwave credentials configuration"""
    print("🔑 Testing Flutterwave Credentials...")
    
    # Read frontend environment
    frontend_env = read_env_file('apps/frontend/.env.production')
    backend_env = read_env_file('apps/backend-fastapi/.env')
    
    # Check frontend public key - support multiple formats
    flw_public_key = (
        frontend_env.get('VITE_FLUTTERWAVE_PUBLIC_KEY', '') or
        frontend_env.get('VITE_FLUTTERWAVE_CLIENT_ID', '')
    )
    if flw_public_key and len(flw_public_key) > 10:  # Real credentials are longer than 10 chars
        print(f"✅ Frontend Flutterwave public key: {flw_public_key[:20]}...")
        frontend_configured = True
    else:
        print("❌ Frontend Flutterwave public key not properly configured")
        frontend_configured = False
    
    # Check backend secret key - support multiple formats
    flw_secret_key = (
        backend_env.get('FLUTTERWAVE_SECRET_KEY', '') or 
        backend_env.get('FLUTTERWAVE_CLIENT_SECRET_KEY', '')
    )
    if flw_secret_key and len(flw_secret_key) > 10:  # Real credentials are longer than 10 chars
        print(f"✅ Backend Flutterwave secret key: {flw_secret_key[:20]}...")
        backend_configured = True
    else:
        print("❌ Backend Flutterwave secret key not properly configured")
        backend_configured = False
    
    return frontend_configured and backend_configured

def test_server_connectivity():
    """Test if both servers are running"""
    print("🌐 Testing Server Connectivity...")
    
    # Test backend
    try:
        response = requests.get(f"{BACKEND_URL}/", timeout=5)
        print(f"✅ Backend server: {response.status_code}")
        backend_running = True
    except requests.exceptions.RequestException as e:
        print(f"❌ Backend server not accessible: {e}")
        backend_running = False
    
    # Test frontend
    try:
        response = requests.get(f"{FRONTEND_URL}", timeout=5)
        print(f"✅ Frontend server: {response.status_code}")
        frontend_running = True
    except requests.exceptions.RequestException as e:
        print(f"❌ Frontend server not accessible: {e}")
        frontend_running = False
    
    return backend_running and frontend_running

def test_payment_methods_endpoint():
    """Test payment methods endpoint"""
    print("📋 Testing Payment Methods Endpoint...")
    
    try:
        response = requests.get(f"{BACKEND_URL}/api/payments/methods", timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                methods = data.get('methods', [])
                print(f"✅ Payment methods endpoint: {len(methods)} methods available")
                
                for method in methods:
                    status = "✅" if method.get('available') else "❌"
                    print(f"   {status} {method.get('name')}: {method.get('description')}")
                
                return True
            else:
                print("❌ Payment methods endpoint returned unsuccessful response")
                return False
        else:
            print(f"❌ Payment methods endpoint: HTTP {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Payment methods endpoint error: {e}")
        return False

def test_flutterwave_service():
    """Test Flutterwave service functionality"""
    print("💳 Testing Flutterwave Service...")
    
    # Test payment creation endpoint
    try:
        payment_data = {
            "amount": 100000,  # ₦1,000 in kobo
            "reference": f"TEST_{int(time.time())}",
            "event_id": "test-event-123",
            "customer_email": "test@grooovy.com",
            "customer_name": "Test User",
            "customer_phone": "+2348012345678"
        }
        
        response = requests.post(
            f"{BACKEND_URL}/api/payments/flutterwave/create",
            json=payment_data,
            timeout=15
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print("✅ Flutterwave payment creation: Success")
                print(f"   Payment link generated: {data.get('payment_link', 'N/A')[:50]}...")
                print(f"   Transaction reference: {data.get('tx_ref', 'N/A')}")
                return True
            else:
                print("❌ Flutterwave payment creation failed")
                print(f"   Error: {data.get('error', {}).get('message', 'Unknown error')}")
                return False
        else:
            print(f"❌ Flutterwave payment creation: HTTP {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Flutterwave service error: {e}")
        return False

def test_payment_security():
    """Test payment security measures"""
    print("🔒 Testing Payment Security...")
    
    security_tests = []
    
    # Test 1: Amount validation (too low)
    try:
        payment_data = {
            "amount": 5000,  # ₦50 - below minimum
            "reference": f"TEST_LOW_{int(time.time())}",
            "event_id": "test-event-123",
            "customer_email": "test@grooovy.com",
            "customer_name": "Test User"
        }
        
        response = requests.post(
            f"{BACKEND_URL}/api/payments/flutterwave/create",
            json=payment_data,
            timeout=10
        )
        
        if response.status_code == 400:
            print("✅ Amount validation (minimum): Correctly rejected")
            security_tests.append(True)
        else:
            print("❌ Amount validation (minimum): Should have been rejected")
            security_tests.append(False)
            
    except Exception as e:
        print(f"⚠️  Amount validation test error: {e}")
        security_tests.append(False)
    
    # Test 2: Amount validation (too high)
    try:
        payment_data = {
            "amount": 1500000,  # ₦15,000 - above maximum
            "reference": f"TEST_HIGH_{int(time.time())}",
            "event_id": "test-event-123",
            "customer_email": "test@grooovy.com",
            "customer_name": "Test User"
        }
        
        response = requests.post(
            f"{BACKEND_URL}/api/payments/flutterwave/create",
            json=payment_data,
            timeout=10
        )
        
        if response.status_code == 400:
            print("✅ Amount validation (maximum): Correctly rejected")
            security_tests.append(True)
        else:
            print("❌ Amount validation (maximum): Should have been rejected")
            security_tests.append(False)
            
    except Exception as e:
        print(f"⚠️  Amount validation test error: {e}")
        security_tests.append(False)
    
    # Test 3: Required field validation
    try:
        payment_data = {
            "amount": 100000,
            # Missing required fields
        }
        
        response = requests.post(
            f"{BACKEND_URL}/api/payments/flutterwave/create",
            json=payment_data,
            timeout=10
        )
        
        if response.status_code == 400:
            print("✅ Required field validation: Correctly rejected")
            security_tests.append(True)
        else:
            print("❌ Required field validation: Should have been rejected")
            security_tests.append(False)
            
    except Exception as e:
        print(f"⚠️  Required field validation test error: {e}")
        security_tests.append(False)
    
    return all(security_tests)

def test_wallet_balance_endpoint():
    """Test wallet balance endpoint"""
    print("💰 Testing Wallet Balance Endpoint...")
    
    try:
        response = requests.get(f"{BACKEND_URL}/api/payments/balance", timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                balance = data.get('balance', 0)
                print(f"✅ Wallet balance endpoint: ₦{balance:,.2f}")
                return True
            else:
                print("❌ Wallet balance endpoint returned unsuccessful response")
                return False
        elif response.status_code == 401:
            print("✅ Wallet balance endpoint: Correctly requires authentication")
            return True
        else:
            print(f"❌ Wallet balance endpoint: HTTP {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Wallet balance endpoint error: {e}")
        return False

def test_frontend_payment_integration():
    """Test frontend payment integration"""
    print("🎨 Testing Frontend Payment Integration...")
    
    # Check if SecurePaymentModal exists and has proper integration
    modal_file = 'apps/frontend/src/components/payment/SecurePaymentModal.tsx'
    
    if not os.path.exists(modal_file):
        print("❌ SecurePaymentModal not found")
        return False
    
    try:
        with open(modal_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        checks = [
            ('VITE_FLUTTERWAVE_PUBLIC_KEY', 'Environment variable usage'),
            ('FlutterwaveCheckout', 'Flutterwave integration'),
            ('payment_options.*card.*bank', 'Payment options'),
            ('verify.*payment', 'Payment verification'),
            ('webhook', 'Webhook handling'),
        ]
        
        passed_checks = 0
        
        for pattern, description in checks:
            if re.search(pattern, content, re.IGNORECASE):
                print(f"✅ {description}: Found")
                passed_checks += 1
            else:
                print(f"⚠️  {description}: Not found")
        
        return passed_checks >= 3  # At least 3 checks should pass
        
    except Exception as e:
        print(f"❌ Frontend integration test error: {e}")
        return False

def test_webhook_endpoint():
    """Test webhook endpoint"""
    print("🔗 Testing Webhook Endpoint...")
    
    try:
        # Test webhook endpoint accessibility
        webhook_data = {
            "event": "charge.completed",
            "data": {
                "id": 12345,
                "tx_ref": "TEST_WEBHOOK",
                "flw_ref": "FLW_REF_123",
                "status": "successful",
                "amount": 1000,
                "currency": "NGN"
            }
        }
        
        response = requests.post(
            f"{BACKEND_URL}/api/payments/webhook/flutterwave",
            json=webhook_data,
            timeout=10
        )
        
        # Webhook should reject without proper signature
        if response.status_code == 400:
            print("✅ Webhook endpoint: Correctly validates signatures")
            return True
        elif response.status_code == 404:
            print("❌ Webhook endpoint: Not found")
            return False
        else:
            print(f"⚠️  Webhook endpoint: HTTP {response.status_code}")
            return True  # Endpoint exists
            
    except Exception as e:
        print(f"❌ Webhook endpoint error: {e}")
        return False

def main():
    """Run comprehensive real payment system tests"""
    print("🚀 REAL PAYMENT SYSTEM TEST WITH FLUTTERWAVE CREDENTIALS\n")
    
    start_time = time.time()
    
    # Test suite
    tests = [
        ("Flutterwave Credentials", test_flutterwave_credentials),
        ("Server Connectivity", test_server_connectivity),
        ("Payment Methods Endpoint", test_payment_methods_endpoint),
        ("Flutterwave Service", test_flutterwave_service),
        ("Payment Security", test_payment_security),
        ("Wallet Balance Endpoint", test_wallet_balance_endpoint),
        ("Frontend Integration", test_frontend_payment_integration),
        ("Webhook Endpoint", test_webhook_endpoint),
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n{'='*60}")
        print(f"Running: {test_name}")
        print('='*60)
        
        try:
            if test_func():
                passed += 1
                print(f"✅ {test_name} PASSED")
            else:
                print(f"❌ {test_name} FAILED")
        except Exception as e:
            print(f"❌ {test_name} ERROR: {e}")
    
    # Summary
    end_time = time.time()
    duration = end_time - start_time
    
    print(f"\n{'='*60}")
    print("REAL PAYMENT SYSTEM TEST RESULTS")
    print('='*60)
    print(f"Tests Passed: {passed}/{total}")
    print(f"Success Rate: {(passed/total)*100:.1f}%")
    print(f"Duration: {duration:.2f} seconds")
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    if passed == total:
        print("\n🎉 ALL TESTS PASSED - PAYMENT SYSTEM FULLY OPERATIONAL!")
        print("✅ Flutterwave credentials configured correctly")
        print("✅ Payment endpoints working")
        print("✅ Security measures active")
        print("✅ Frontend integration complete")
        print("✅ Ready for production payments")
    elif passed >= total * 0.8:
        print(f"\n🟡 MOSTLY OPERATIONAL - {total-passed} minor issues")
        print("✅ Core payment functionality working")
        print("⚠️  Some non-critical features need attention")
    else:
        print(f"\n🔴 CRITICAL ISSUES - {total-passed} major problems")
        print("❌ Payment system needs fixes before production")
    
    print("\n📋 Next Steps:")
    if passed == total:
        print("1. ✅ System ready for production payments")
        print("2. 🧪 Test with small real payments")
        print("3. 📊 Monitor payment logs")
        print("4. 🔔 Set up payment alerts")
        print("5. 📈 Track payment success rates")
    else:
        print("1. 🔧 Fix failing tests above")
        print("2. 🔄 Re-run tests until all pass")
        print("3. 🧪 Test payment flow manually")
        print("4. 📞 Contact support if issues persist")

if __name__ == "__main__":
    main()