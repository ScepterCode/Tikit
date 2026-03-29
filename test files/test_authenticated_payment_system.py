#!/usr/bin/env python3
"""
Authenticated Payment System Test
Test payment system with proper authentication
"""

import requests
import json
import time
from datetime import datetime

# Test configuration
BACKEND_URL = "http://localhost:8000"

def get_test_user_token():
    """Get authentication token for test user"""
    try:
        # Login with test user
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
            print(f"Login response: {data}")
            if data.get('success'):
                # Try different possible token field names
                token = (
                    data.get('access_token') or 
                    data.get('token') or 
                    data.get('data', {}).get('access_token') or
                    data.get('data', {}).get('token')
                )
                if token:
                    print(f"✅ Authentication successful - Token: {token[:20]}...")
                    return token
                else:
                    print("❌ Token not found in response")
                    return None
        
        print(f"❌ Authentication failed: {response.status_code}")
        print(f"Response: {response.text}")
        return None
        
    except Exception as e:
        print(f"❌ Authentication error: {e}")
        return None

def test_authenticated_flutterwave_payment(token):
    """Test Flutterwave payment with authentication"""
    print("💳 Testing Authenticated Flutterwave Payment...")
    
    try:
        payment_data = {
            "amount": 100000,  # ₦1,000 in kobo
            "reference": f"TEST_AUTH_{int(time.time())}",
            "event_id": "test-event-123",
            "customer_email": "admin@grooovy.com",
            "customer_name": "Admin User",
            "customer_phone": "+2348012345678"
        }
        
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        response = requests.post(
            f"{BACKEND_URL}/api/payments/flutterwave/create",
            json=payment_data,
            headers=headers,
            timeout=15
        )
        
        print(f"Response Status: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print("✅ Authenticated Flutterwave payment creation: Success")
                print(f"   Payment link: {data.get('payment_link', 'N/A')[:50]}...")
                return True
            else:
                print("❌ Flutterwave payment creation failed")
                print(f"   Error: {data.get('error', {}).get('message', 'Unknown error')}")
                return False
        else:
            print(f"❌ Flutterwave payment creation: HTTP {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Authenticated Flutterwave payment error: {e}")
        return False

def test_authenticated_wallet_balance(token):
    """Test wallet balance with authentication"""
    print("💰 Testing Authenticated Wallet Balance...")
    
    try:
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        response = requests.get(
            f"{BACKEND_URL}/api/payments/balance",
            headers=headers,
            timeout=10
        )
        
        print(f"Response Status: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                balance = data.get('balance', 0)
                print(f"✅ Authenticated wallet balance: ₦{balance:,.2f}")
                return True
            else:
                print("❌ Wallet balance request failed")
                return False
        else:
            print(f"❌ Wallet balance: HTTP {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Authenticated wallet balance error: {e}")
        return False

def test_payment_security_with_auth(token):
    """Test payment security with authentication"""
    print("🔒 Testing Payment Security with Authentication...")
    
    security_tests = []
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Test 1: Amount validation (too low)
    try:
        payment_data = {
            "amount": 5000,  # ₦50 - below minimum
            "reference": f"TEST_LOW_AUTH_{int(time.time())}",
            "event_id": "test-event-123",
            "customer_email": "admin@grooovy.com",
            "customer_name": "Admin User"
        }
        
        response = requests.post(
            f"{BACKEND_URL}/api/payments/flutterwave/create",
            json=payment_data,
            headers=headers,
            timeout=10
        )
        
        print(f"Low amount test - Status: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 400:
            print("✅ Amount validation (minimum): Correctly rejected")
            security_tests.append(True)
        else:
            print("❌ Amount validation (minimum): Should have been rejected")
            security_tests.append(False)
            
    except Exception as e:
        print(f"⚠️  Amount validation test error: {e}")
        security_tests.append(False)
    
    return all(security_tests)

def main():
    """Run authenticated payment system tests"""
    print("🚀 AUTHENTICATED PAYMENT SYSTEM TEST\n")
    
    start_time = time.time()
    
    # Get authentication token
    print("🔐 Getting Authentication Token...")
    token = get_test_user_token()
    
    if not token:
        print("❌ Cannot proceed without authentication token")
        return
    
    # Test suite
    tests = [
        ("Authenticated Flutterwave Payment", lambda: test_authenticated_flutterwave_payment(token)),
        ("Authenticated Wallet Balance", lambda: test_authenticated_wallet_balance(token)),
        ("Payment Security with Auth", lambda: test_payment_security_with_auth(token)),
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
    print("AUTHENTICATED PAYMENT SYSTEM TEST RESULTS")
    print('='*60)
    print(f"Tests Passed: {passed}/{total}")
    print(f"Success Rate: {(passed/total)*100:.1f}%")
    print(f"Duration: {duration:.2f} seconds")
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    if passed == total:
        print("\n🎉 ALL AUTHENTICATED TESTS PASSED!")
        print("✅ Payment system working with real credentials")
        print("✅ Authentication properly implemented")
        print("✅ Ready for production testing")
    else:
        print(f"\n🟡 {total-passed} tests need attention")

if __name__ == "__main__":
    main()