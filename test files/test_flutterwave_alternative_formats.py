#!/usr/bin/env python3
"""
Test Alternative Flutterwave Integration Formats
Some Flutterwave integrations use different credential formats
"""

import requests
import json
import os

def test_alternative_flutterwave_formats():
    """Test different Flutterwave API integration methods"""
    print("🔍 TESTING ALTERNATIVE FLUTTERWAVE FORMATS")
    print("="*50)
    
    # Get credentials
    secret_key = "YAgj9aTkeCiZrIZh3YpfzLwuu86zA9hu"
    public_key = "FLWPUBK-8b7d138c4436a54926dece2bdc89beca-X"
    encryption_key = "bT79eq20Ic8kgNQFlA2DqZ+WBH5yzt7Ld3hhchz8m8Q="
    
    print(f"Secret key: {secret_key}")
    print(f"Public key: {public_key}")
    print(f"Encryption key: {encryption_key[:20]}...")
    
    # Test 1: Standard Bearer token (already failed)
    print("\n1. STANDARD BEARER TOKEN (already tested - failed)")
    
    # Test 2: Try as API key in different header
    print("\n2. TESTING AS API KEY IN X-API-KEY HEADER:")
    try:
        headers = {
            'X-API-Key': secret_key,
            'Content-Type': 'application/json'
        }
        
        response = requests.get(
            'https://api.flutterwave.com/v3/banks/NG',
            headers=headers,
            timeout=10
        )
        
        print(f"Response: {response.status_code}")
        if response.status_code == 200:
            print("✅ X-API-Key format works!")
        else:
            print(f"❌ X-API-Key failed: {response.text[:100]}")
    except Exception as e:
        print(f"❌ X-API-Key test error: {e}")
    
    # Test 3: Try with public key as Bearer
    print("\n3. TESTING PUBLIC KEY AS BEARER TOKEN:")
    try:
        headers = {
            'Authorization': f'Bearer {public_key}',
            'Content-Type': 'application/json'
        }
        
        response = requests.get(
            'https://api.flutterwave.com/v3/banks/NG',
            headers=headers,
            timeout=10
        )
        
        print(f"Response: {response.status_code}")
        if response.status_code == 200:
            print("✅ Public key as Bearer works!")
        else:
            print(f"❌ Public key as Bearer failed: {response.text[:100]}")
    except Exception as e:
        print(f"❌ Public key Bearer test error: {e}")
    
    # Test 4: Check if these might be Paystack credentials
    print("\n4. TESTING IF THESE ARE PAYSTACK CREDENTIALS:")
    try:
        headers = {
            'Authorization': f'Bearer {secret_key}',
            'Content-Type': 'application/json'
        }
        
        response = requests.get(
            'https://api.paystack.co/bank',
            headers=headers,
            timeout=10
        )
        
        print(f"Paystack response: {response.status_code}")
        if response.status_code == 200:
            print("✅ These might be Paystack credentials!")
            data = response.json()
            print(f"Paystack banks: {len(data.get('data', []))}")
        else:
            print(f"❌ Not Paystack credentials: {response.text[:100]}")
    except Exception as e:
        print(f"❌ Paystack test error: {e}")
    
    # Test 5: Check credential format analysis
    print("\n5. CREDENTIAL FORMAT ANALYSIS:")
    
    # Analyze secret key
    if len(secret_key) == 32 and secret_key.isalnum():
        print("✅ Secret key: 32-character alphanumeric (common API key format)")
    elif len(secret_key) == 40 and secret_key.isalnum():
        print("✅ Secret key: 40-character alphanumeric (SHA1-like format)")
    else:
        print(f"⚠️  Secret key: {len(secret_key)} characters, mixed format")
    
    # Analyze public key
    if public_key.startswith('FLWPUBK-') and public_key.endswith('-X'):
        print("✅ Public key: Standard Flutterwave live public key format")
    else:
        print("⚠️  Public key: Non-standard format")
    
    # Test 6: Try a different Flutterwave endpoint
    print("\n6. TESTING DIFFERENT FLUTTERWAVE ENDPOINT:")
    try:
        headers = {
            'Authorization': f'Bearer {secret_key}',
            'Content-Type': 'application/json'
        }
        
        # Try the profile endpoint
        response = requests.get(
            'https://api.flutterwave.com/v3/profile',
            headers=headers,
            timeout=10
        )
        
        print(f"Profile endpoint response: {response.status_code}")
        if response.status_code == 200:
            print("✅ Profile endpoint works!")
            data = response.json()
            print(f"Profile data: {data}")
        else:
            print(f"❌ Profile endpoint failed: {response.text[:100]}")
    except Exception as e:
        print(f"❌ Profile endpoint test error: {e}")

def suggest_solutions():
    """Suggest possible solutions"""
    print("\n" + "="*50)
    print("🎯 SUGGESTED SOLUTIONS")
    print("="*50)
    
    print("\n1. VERIFY CREDENTIAL SOURCE:")
    print("   - Check your Flutterwave dashboard")
    print("   - Ensure you're copying from the correct section")
    print("   - Live keys should start with FLWSECK- for secret keys")
    
    print("\n2. CHECK INTEGRATION TYPE:")
    print("   - Standard API integration uses FLWSECK- format")
    print("   - Some older integrations might use different formats")
    print("   - Verify you're using the v3 API credentials")
    
    print("\n3. CREDENTIAL LOCATION:")
    print("   - Dashboard > Settings > API Keys")
    print("   - Make sure you're in 'Live' mode, not 'Test' mode")
    print("   - Copy the 'Secret Key' (not Client ID or other keys)")
    
    print("\n4. ALTERNATIVE POSSIBILITIES:")
    print("   - These might be credentials for a different service")
    print("   - Check if you have multiple payment gateway accounts")
    print("   - Verify the account is properly activated for live transactions")

if __name__ == "__main__":
    test_alternative_flutterwave_formats()
    suggest_solutions()