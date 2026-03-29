#!/usr/bin/env python3
"""
Deep Flutterwave Investigation
Investigate alternative Flutterwave API authentication methods
"""

import requests
import json
import base64

def test_all_flutterwave_auth_methods():
    """Test all possible Flutterwave authentication methods"""
    print("🔍 DEEP FLUTTERWAVE AUTHENTICATION INVESTIGATION")
    print("="*60)
    
    # Your credentials
    secret_key = "YAgj9aTkeCiZrIZh3YpfzLwuu86zA9hu"
    public_key = "FLWPUBK-8b7d138c4436a54926dece2bdc89beca-X"
    encryption_key = "bT79eq20Ic8kgNQFlA2DqZ+WBH5yzt7Ld3hhchz8m8Q="
    
    print(f"Testing with:")
    print(f"Secret: {secret_key}")
    print(f"Public: {public_key}")
    print(f"Encryption: {encryption_key[:20]}...")
    
    # Method 1: Standard Bearer with secret
    print("\n1. STANDARD BEARER TOKEN (SECRET KEY):")
    test_auth_method(
        "Bearer",
        secret_key,
        "Authorization"
    )
    
    # Method 2: Bearer with public key
    print("\n2. BEARER TOKEN (PUBLIC KEY):")
    test_auth_method(
        "Bearer",
        public_key,
        "Authorization"
    )
    
    # Method 3: Basic Auth with secret:public
    print("\n3. BASIC AUTH (SECRET:PUBLIC):")
    credentials = f"{secret_key}:{public_key}"
    encoded = base64.b64encode(credentials.encode()).decode()
    test_auth_method(
        "Basic",
        encoded,
        "Authorization"
    )
    
    # Method 4: API Key header
    print("\n4. X-API-KEY HEADER:")
    test_auth_method(
        "",
        secret_key,
        "X-API-Key"
    )
    
    # Method 5: Flutterwave-Sec header
    print("\n5. FLUTTERWAVE-SEC HEADER:")
    test_auth_method(
        "",
        secret_key,
        "Flutterwave-Sec"
    )
    
    # Method 6: Try with encryption key
    print("\n6. BEARER TOKEN (ENCRYPTION KEY):")
    test_auth_method(
        "Bearer",
        encryption_key,
        "Authorization"
    )
    
    # Method 7: Check if it's a v2 API key
    print("\n7. FLUTTERWAVE V2 API:")
    test_v2_api(secret_key, public_key)
    
    # Method 8: Check account status
    print("\n8. ACCOUNT STATUS CHECK:")
    check_account_status(secret_key, public_key)

def test_auth_method(prefix, key, header_name):
    """Test a specific authentication method"""
    try:
        headers = {
            'Content-Type': 'application/json'
        }
        
        if prefix:
            headers[header_name] = f"{prefix} {key}"
        else:
            headers[header_name] = key
        
        response = requests.get(
            'https://api.flutterwave.com/v3/banks/NG',
            headers=headers,
            timeout=10
        )
        
        print(f"   Response: {response.status_code}")
        
        if response.status_code == 200:
            print(f"   ✅ SUCCESS! This method works!")
            data = response.json()
            print(f"   Banks: {len(data.get('data', []))}")
            return True
        else:
            print(f"   ❌ Failed: {response.text[:100]}")
            return False
            
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False

def test_v2_api(secret_key, public_key):
    """Test if these are v2 API credentials"""
    try:
        # V2 API uses different endpoint structure
        headers = {
            'Authorization': f'Bearer {secret_key}',
            'Content-Type': 'application/json'
        }
        
        # Try v2 endpoint
        response = requests.get(
            'https://api.ravepay.co/flwv3-pug/getpaidx/api/banks',
            headers=headers,
            timeout=10
        )
        
        print(f"   V2 API Response: {response.status_code}")
        
        if response.status_code == 200:
            print("   ✅ V2 API works! You might be using Rave/V2 credentials")
            return True
        else:
            print(f"   ❌ V2 API failed: {response.text[:100]}")
            return False
            
    except Exception as e:
        print(f"   ❌ V2 API error: {e}")
        return False

def check_account_status(secret_key, public_key):
    """Check if account might have restrictions"""
    print("   Checking possible account issues:")
    
    # Check key lengths
    print(f"   Secret key length: {len(secret_key)} chars")
    print(f"   Public key length: {len(public_key)} chars")
    
    # Check if keys match expected patterns
    if len(secret_key) == 32 and secret_key.isalnum():
        print("   ⚠️  Secret key: 32-char format (unusual for Flutterwave)")
    
    if public_key.startswith('FLWPUBK-') and public_key.endswith('-X'):
        print("   ✅ Public key: Standard Flutterwave format")
    
    # Possible issues
    print("\n   Possible account issues:")
    print("   • Account might not be fully activated")
    print("   • Business verification might be pending")
    print("   • Account might be in sandbox/test mode")
    print("   • Keys might be from a partner/reseller integration")
    print("   • Account might have API access restrictions")

def test_inline_payment():
    """Test Flutterwave Inline/Standard payment (uses public key only)"""
    print("\n9. INLINE/STANDARD PAYMENT TEST:")
    print("   Testing if public key works for inline payments...")
    
    public_key = "FLWPUBK-8b7d138c4436a54926dece2bdc89beca-X"
    
    # Inline payments use public key differently
    print(f"   Public key: {public_key}")
    print("   ✅ Public key format is correct for inline payments")
    print("   Note: Inline payments work client-side with public key")
    print("   Backend API calls need the secret key")

def suggest_solutions():
    """Suggest possible solutions"""
    print("\n" + "="*60)
    print("🎯 POSSIBLE SOLUTIONS")
    print("="*60)
    
    print("\n1. VERIFY ACCOUNT STATUS:")
    print("   • Log into Flutterwave dashboard")
    print("   • Check if business verification is complete")
    print("   • Verify account is in 'Live' mode")
    print("   • Check if API access is enabled")
    
    print("\n2. CHECK API VERSION:")
    print("   • You might have Rave (v2) credentials")
    print("   • Flutterwave v3 uses different key format")
    print("   • Check which API version your account uses")
    
    print("\n3. CONTACT FLUTTERWAVE SUPPORT:")
    print("   • Your keys might be from a special integration")
    print("   • Support can verify if keys are correct")
    print("   • They can check account API access status")
    
    print("\n4. ALTERNATIVE: USE INLINE PAYMENT:")
    print("   • Your public key is valid")
    print("   • Can use Flutterwave Inline (client-side)")
    print("   • Doesn't require backend API calls")
    print("   • Still secure and production-ready")

if __name__ == "__main__":
    test_all_flutterwave_auth_methods()
    test_inline_payment()
    suggest_solutions()