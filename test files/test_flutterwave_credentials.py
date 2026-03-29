#!/usr/bin/env python3
"""
Test Flutterwave Credentials
Direct test of Flutterwave API with your credentials
"""

import requests
import json
import os
from datetime import datetime

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

def test_flutterwave_api_directly():
    """Test Flutterwave API directly with your credentials"""
    print("🔑 Testing Flutterwave API Directly...")
    
    # Read environment files
    frontend_env = read_env_file('apps/frontend/.env.production')
    
    # Get credentials
    public_key = frontend_env.get('VITE_FLUTTERWAVE_PUBLIC_KEY', '')
    
    if not public_key or not public_key.startswith('FLWPUBK-'):
        print("❌ Flutterwave public key not found or invalid")
        return False
    
    print(f"✅ Using public key: {public_key[:20]}...")
    
    # Test 1: Create a payment link
    try:
        headers = {
            'Authorization': f'Bearer {public_key}',
            'Content-Type': 'application/json'
        }
        
        payload = {
            "tx_ref": f"TEST_{int(datetime.now().timestamp())}",
            "amount": 1000,  # ₦1,000
            "currency": "NGN",
            "redirect_url": "https://grooovy.com/payment/callback",
            "payment_options": "card,banktransfer,ussd",
            "customer": {
                "email": "test@grooovy.com",
                "phonenumber": "+2348012345678",
                "name": "Test User"
            },
            "customizations": {
                "title": "Grooovy Payment Test",
                "description": "Testing Flutterwave integration",
                "logo": ""
            }
        }
        
        print("🧪 Testing payment link creation...")
        response = requests.post(
            "https://api.flutterwave.com/v3/payments",
            json=payload,
            headers=headers,
            timeout=15
        )
        
        print(f"📡 API Response: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('status') == 'success':
                print("✅ Payment link creation: SUCCESS")
                print(f"   Payment link: {data['data']['link'][:50]}...")
                print(f"   Transaction ref: {data['data']['tx_ref']}")
                return True
            else:
                print("❌ Payment link creation failed")
                print(f"   Error: {data.get('message', 'Unknown error')}")
                return False
        else:
            print(f"❌ API Error: {response.status_code}")
            try:
                error_data = response.json()
                print(f"   Error: {error_data.get('message', 'Unknown error')}")
            except:
                print(f"   Raw response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ API Test Error: {e}")
        return False

def test_flutterwave_banks():
    """Test Flutterwave banks endpoint"""
    print("🏦 Testing Flutterwave Banks API...")
    
    try:
        response = requests.get(
            "https://api.flutterwave.com/v3/banks/NG",
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get('status') == 'success':
                banks = data.get('data', [])
                print(f"✅ Banks API: {len(banks)} Nigerian banks available")
                return True
            else:
                print("❌ Banks API failed")
                return False
        else:
            print(f"❌ Banks API Error: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Banks API Error: {e}")
        return False

def main():
    """Test Flutterwave credentials and API"""
    print("🧪 FLUTTERWAVE CREDENTIALS TEST\n")
    
    # Check if environment file exists
    if not os.path.exists('apps/frontend/.env.production'):
        print("❌ Frontend .env.production file not found")
        return
    
    tests = [
        ("Flutterwave API Direct Test", test_flutterwave_api_directly),
        ("Flutterwave Banks API", test_flutterwave_banks),
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
    print("FLUTTERWAVE CREDENTIALS TEST RESULTS")
    print('='*50)
    print(f"Tests Passed: {passed}/{total}")
    print(f"Success Rate: {(passed/total)*100:.1f}%")
    
    if passed == total:
        print("\n🎉 FLUTTERWAVE CREDENTIALS WORKING PERFECTLY!")
        print("✅ Your Flutterwave public key is valid")
        print("✅ API integration is working")
        print("✅ Payment links can be created")
        print("✅ Ready for payment processing")
    else:
        print(f"\n⚠️  {total-passed} credential tests failed")
        print("❌ Please check your Flutterwave credentials")
    
    print("\n📋 Next Steps:")
    if passed == total:
        print("1. ✅ Credentials verified - ready to test full system")
        print("2. 🚀 Start servers: python start_payment_test_servers.py")
        print("3. 🧪 Run full test: python test_real_payment_system.py")
        print("4. 🌐 Test in browser: http://localhost:3000")
    else:
        print("1. 🔧 Check your Flutterwave public key in .env.production")
        print("2. 🔑 Ensure key starts with FLWPUBK-")
        print("3. 🌐 Verify key is active in Flutterwave dashboard")
        print("4. 🔄 Re-run this test")

if __name__ == "__main__":
    main()