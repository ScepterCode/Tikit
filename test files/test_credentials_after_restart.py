#!/usr/bin/env python3
"""
Test Credentials After Manual Restart
Test if Flutterwave credentials are working after backend restart
"""

import os
import sys
import requests
import time

def test_environment_variables():
    """Test environment variables directly"""
    print("🔍 TESTING ENVIRONMENT VARIABLES")
    print("="*60)
    
    # Read the .env file directly
    env_file = 'apps/backend-fastapi/.env'
    env_vars = {}
    
    try:
        with open(env_file, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    env_vars[key] = value
    except FileNotFoundError:
        print(f"❌ Environment file not found: {env_file}")
        return False
    
    # Check Flutterwave credentials
    flw_secret = (
        env_vars.get('FLUTTERWAVE_SECRET_KEY') or 
        env_vars.get('FLUTTERWAVE_CLIENT_SECRET_KEY') or
        env_vars.get('FLUTTERWAVE_LIVE_SECRET_KEY')
    )
    
    flw_public = (
        env_vars.get('FLUTTERWAVE_PUBLIC_KEY') or 
        env_vars.get('FLUTTERWAVE_CLIENT_ID') or
        env_vars.get('FLUTTERWAVE_LIVE_PUBLIC_KEY')
    )
    
    if flw_secret:
        print(f"✅ Secret Key Found: {flw_secret[:20]}...")
    else:
        print("❌ Secret Key Not Found")
        
    if flw_public:
        print(f"✅ Public Key Found: {flw_public[:20]}...")
    else:
        print("❌ Public Key Not Found")
    
    return bool(flw_secret and flw_public)

def test_flutterwave_api_direct():
    """Test Flutterwave API directly with credentials from file"""
    print("\n🧪 TESTING FLUTTERWAVE API DIRECTLY")
    print("="*60)
    
    # Read credentials from file
    env_file = 'apps/backend-fastapi/.env'
    env_vars = {}
    
    try:
        with open(env_file, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    env_vars[key] = value
    except FileNotFoundError:
        print(f"❌ Environment file not found: {env_file}")
        return False
    
    secret_key = (
        env_vars.get('FLUTTERWAVE_SECRET_KEY') or 
        env_vars.get('FLUTTERWAVE_CLIENT_SECRET_KEY') or
        env_vars.get('FLUTTERWAVE_LIVE_SECRET_KEY')
    )
    
    if not secret_key:
        print("❌ No secret key found")
        return False
    
    try:
        headers = {
            'Authorization': f'Bearer {secret_key}',
            'Content-Type': 'application/json'
        }
        
        # Test with a simple API call (get banks)
        response = requests.get(
            'https://api.flutterwave.com/v3/banks/NG',
            headers=headers,
            timeout=10
        )
        
        print(f"API Response: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Flutterwave API credentials are VALID!")
            data = response.json()
            banks = data.get('data', [])
            print(f"   Banks available: {len(banks)}")
            return True
        else:
            print(f"❌ Flutterwave API error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ API test error: {e}")
        return False

def test_backend_payment_endpoint():
    """Test backend payment endpoint with authentication"""
    print("\n💳 TESTING BACKEND PAYMENT ENDPOINT")
    print("="*60)
    
    try:
        # First get authentication token
        login_data = {
            "phone_number": "+2348012345678",
            "password": "admin123"
        }
        
        response = requests.post(
            "http://localhost:8000/api/auth/login",
            json=login_data,
            timeout=10
        )
        
        if response.status_code != 200:
            print(f"❌ Authentication failed: {response.status_code}")
            return False
        
        data = response.json()
        token = data.get('data', {}).get('access_token')
        
        if not token:
            print("❌ No token received")
            return False
        
        print(f"✅ Authentication successful")
        
        # Now test payment creation
        payment_data = {
            "amount": 100000,  # ₦1,000 in kobo
            "reference": f"TEST_LIVE_{int(time.time())}",
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
            "http://localhost:8000/api/payments/flutterwave/create",
            json=payment_data,
            headers=headers,
            timeout=15
        )
        
        print(f"Payment Response: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print("✅ Payment creation SUCCESSFUL!")
                print(f"   Payment link: {data.get('payment_link', 'N/A')[:50]}...")
                print(f"   Transaction ref: {data.get('tx_ref', 'N/A')}")
                return True
            else:
                print("❌ Payment creation failed")
                print(f"   Error: {data.get('error', {}).get('message', 'Unknown error')}")
                return False
        else:
            print(f"❌ Payment creation: HTTP {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Backend payment test error: {e}")
        return False

def main():
    """Run comprehensive credential tests"""
    print("🚀 COMPREHENSIVE FLUTTERWAVE CREDENTIALS TEST")
    print("="*80)
    
    tests = [
        ("Environment Variables", test_environment_variables),
        ("Flutterwave API Direct", test_flutterwave_api_direct),
        ("Backend Payment Endpoint", test_backend_payment_endpoint),
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
    print(f"\n{'='*60}")
    print("FLUTTERWAVE CREDENTIALS TEST RESULTS")
    print('='*60)
    print(f"Tests Passed: {passed}/{total}")
    print(f"Success Rate: {(passed/total)*100:.1f}%")
    
    if passed == total:
        print("\n🎉 ALL TESTS PASSED!")
        print("✅ Flutterwave credentials are working correctly")
        print("✅ Payment system ready for live transactions")
        print("✅ Backend properly configured")
    elif passed >= 2:
        print(f"\n🟡 MOSTLY WORKING - {total-passed} minor issues")
        print("✅ Core Flutterwave integration working")
    else:
        print(f"\n🔴 CRITICAL ISSUES - {total-passed} major problems")
        print("❌ Flutterwave credentials need attention")
    
    print("\n📋 Next Steps:")
    if passed == total:
        print("1. ✅ Run full payment system tests")
        print("2. 🧪 Test with small real payments")
        print("3. 📊 Monitor payment success rates")
    else:
        print("1. 🔧 Check backend server is running")
        print("2. 🔄 Restart backend to pick up new credentials")
        print("3. 🔍 Verify .env file has correct credentials")

if __name__ == "__main__":
    main()