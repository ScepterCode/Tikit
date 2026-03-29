#!/usr/bin/env python3
"""
Test New Flutterwave Credentials
Quick test to verify new Flutterwave credentials work
"""

import requests
import sys

def test_flutterwave_credentials(secret_key, public_key):
    """Test if Flutterwave credentials are valid"""
    print("🧪 TESTING NEW FLUTTERWAVE CREDENTIALS")
    print("="*50)
    
    print(f"Secret Key: {secret_key[:20]}...")
    print(f"Public Key: {public_key[:20]}...")
    
    # Step 1: Format validation
    print("\n1. FORMAT VALIDATION:")
    if secret_key.startswith('FLWSECK-'):
        print("✅ Secret Key: Correct live format")
    elif secret_key.startswith('FLWSECK_TEST-'):
        print("⚠️  Secret Key: Test format (will work but for test only)")
    else:
        print("❌ Secret Key: Wrong format")
        return False
    
    if public_key.startswith('FLWPUBK-'):
        print("✅ Public Key: Correct live format")
    elif public_key.startswith('FLWPUBK_TEST-'):
        print("⚠️  Public Key: Test format (will work but for test only)")
    else:
        print("❌ Public Key: Wrong format")
        return False
    
    # Step 2: API Test
    print("\n2. API CONNECTIVITY TEST:")
    try:
        headers = {
            'Authorization': f'Bearer {secret_key}',
            'Content-Type': 'application/json'
        }
        
        response = requests.get(
            'https://api.flutterwave.com/v3/banks/NG',
            headers=headers,
            timeout=10
        )
        
        print(f"API Response: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ API Test: SUCCESS!")
            data = response.json()
            banks = data.get('data', [])
            print(f"   Nigerian banks available: {len(banks)}")
            
            # Step 3: Payment creation test
            print("\n3. PAYMENT CREATION TEST:")
            test_payment_creation(secret_key)
            
            return True
        else:
            print(f"❌ API Test: FAILED - {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ API Test: ERROR - {e}")
        return False

def test_payment_creation(secret_key):
    """Test payment creation with new credentials"""
    try:
        headers = {
            'Authorization': f'Bearer {secret_key}',
            'Content-Type': 'application/json'
        }
        
        payload = {
            "tx_ref": f"TEST_NEW_CREDS_{int(time.time())}",
            "amount": "1000",
            "currency": "NGN",
            "redirect_url": "https://example.com",
            "payment_options": "card,banktransfer",
            "customer": {
                "email": "test@example.com",
                "phonenumber": "+2348012345678",
                "name": "Test User"
            },
            "customizations": {
                "title": "Test Payment",
                "description": "Testing new credentials"
            }
        }
        
        response = requests.post(
            'https://api.flutterwave.com/v3/payments',
            json=payload,
            headers=headers,
            timeout=15
        )
        
        print(f"Payment Creation: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('status') == 'success':
                print("✅ Payment Creation: SUCCESS!")
                print(f"   Payment link generated: {data['data']['link'][:50]}...")
                return True
            else:
                print(f"❌ Payment Creation: API Error - {data}")
                return False
        else:
            print(f"❌ Payment Creation: HTTP Error - {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Payment Creation: Exception - {e}")
        return False

def main():
    """Main test function"""
    print("🔑 FLUTTERWAVE CREDENTIALS TESTER")
    print("="*50)
    print("This script will test your new Flutterwave credentials")
    print("before we update the system.")
    print("\nUsage:")
    print("python test_new_flutterwave_credentials.py SECRET_KEY PUBLIC_KEY")
    print("\nExample:")
    print("python test_new_flutterwave_credentials.py FLWSECK-xxxxx FLWPUBK-xxxxx")
    
    if len(sys.argv) != 3:
        print("\n❌ Please provide both SECRET_KEY and PUBLIC_KEY as arguments")
        return False
    
    secret_key = sys.argv[1]
    public_key = sys.argv[2]
    
    success = test_flutterwave_credentials(secret_key, public_key)
    
    if success:
        print("\n🎉 CREDENTIALS TEST PASSED!")
        print("✅ Ready to update the payment system")
        print("✅ All Flutterwave features will work")
        print("\nNext: I'll update your environment files with these credentials")
    else:
        print("\n❌ CREDENTIALS TEST FAILED!")
        print("Please check your Flutterwave dashboard and get the correct keys")
    
    return success

if __name__ == "__main__":
    import time
    main()