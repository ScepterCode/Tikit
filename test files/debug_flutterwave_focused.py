#!/usr/bin/env python3
"""
Focused Flutterwave Debugging
Quick diagnosis of the credential issue
"""

import os
import sys
import requests
import json

def main():
    print("🔍 FOCUSED FLUTTERWAVE DEBUGGING")
    print("="*50)
    
    # Step 1: Check environment file
    print("\n1. CHECKING ENVIRONMENT FILE:")
    env_file = 'apps/backend-fastapi/.env'
    
    if os.path.exists(env_file):
        with open(env_file, 'r') as f:
            content = f.read()
        
        # Extract Flutterwave credentials
        lines = content.split('\n')
        credentials = {}
        
        for line in lines:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                if 'FLUTTERWAVE' in key:
                    credentials[key] = value
        
        print("Found credentials:")
        for key, value in credentials.items():
            print(f"  {key}: {value[:20]}...")
    else:
        print("❌ Environment file not found")
        return
    
    # Step 2: Test credentials directly
    print("\n2. TESTING CREDENTIALS DIRECTLY:")
    
    # Priority order: LIVE > STANDARD > CLIENT
    secret_key = (
        credentials.get('FLUTTERWAVE_LIVE_SECRET_KEY') or
        credentials.get('FLUTTERWAVE_SECRET_KEY') or 
        credentials.get('FLUTTERWAVE_CLIENT_SECRET_KEY')
    )
    
    public_key = (
        credentials.get('FLUTTERWAVE_LIVE_PUBLIC_KEY') or
        credentials.get('FLUTTERWAVE_PUBLIC_KEY') or 
        credentials.get('FLUTTERWAVE_CLIENT_ID')
    )
    
    print(f"Using secret key: {secret_key[:20] if secret_key else 'None'}...")
    print(f"Using public key: {public_key[:20] if public_key else 'None'}...")
    
    if not secret_key:
        print("❌ No secret key found")
        return
    
    # Step 3: Test with Flutterwave API
    print("\n3. TESTING WITH FLUTTERWAVE API:")
    
    try:
        headers = {
            'Authorization': f'Bearer {secret_key}',
            'Content-Type': 'application/json'
        }
        
        # Simple API test
        response = requests.get(
            'https://api.flutterwave.com/v3/banks/NG',
            headers=headers,
            timeout=10
        )
        
        print(f"API Response: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ CREDENTIALS ARE VALID!")
            data = response.json()
            print(f"Banks available: {len(data.get('data', []))}")
            
            # Test payment creation
            print("\n4. TESTING PAYMENT CREATION:")
            test_payment_creation(secret_key)
            
        else:
            print(f"❌ CREDENTIALS INVALID: {response.text}")
            
            # Check if it's a format issue
            if 'Invalid authorization key' in response.text:
                print("\n🔍 CREDENTIAL FORMAT ANALYSIS:")
                analyze_credential_format(secret_key, public_key)
            
    except Exception as e:
        print(f"❌ API test error: {e}")

def test_payment_creation(secret_key):
    """Test actual payment creation"""
    try:
        headers = {
            'Authorization': f'Bearer {secret_key}',
            'Content-Type': 'application/json'
        }
        
        payload = {
            "tx_ref": f"TEST_{int(time.time())}",
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
                "description": "Test payment creation"
            }
        }
        
        response = requests.post(
            'https://api.flutterwave.com/v3/payments',
            json=payload,
            headers=headers,
            timeout=15
        )
        
        print(f"Payment creation: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('status') == 'success':
                print("✅ PAYMENT CREATION SUCCESSFUL!")
                print(f"Payment link: {data['data']['link'][:50]}...")
            else:
                print(f"❌ Payment creation failed: {data}")
        else:
            print(f"❌ Payment creation error: {response.text}")
            
    except Exception as e:
        print(f"❌ Payment creation test error: {e}")

def analyze_credential_format(secret_key, public_key):
    """Analyze credential format"""
    print("Analyzing credential formats:")
    
    # Check secret key format
    if secret_key:
        if secret_key.startswith('FLWSECK-'):
            print("✅ Secret key: Standard live format")
        elif secret_key.startswith('FLWSECK_TEST-'):
            print("⚠️  Secret key: Test format")
        elif len(secret_key) > 30 and secret_key.isalnum():
            print("⚠️  Secret key: Non-standard format (might be valid)")
        else:
            print("❌ Secret key: Unknown format")
    
    # Check public key format
    if public_key:
        if public_key.startswith('FLWPUBK-'):
            print("✅ Public key: Standard live format")
        elif public_key.startswith('FLWPUBK_TEST-'):
            print("⚠️  Public key: Test format")
        elif '-' in public_key and len(public_key) > 30:
            print("⚠️  Public key: UUID format (might be client ID)")
        else:
            print("❌ Public key: Unknown format")

if __name__ == "__main__":
    import time
    main()