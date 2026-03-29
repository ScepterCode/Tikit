#!/usr/bin/env python3
"""
Debug Flutterwave Credentials - Live Test
Check what credentials are actually being loaded by the service
"""

import os
import sys
sys.path.append('apps/backend-fastapi')

from services.flutterwave_service import flutterwave_service

def debug_credentials():
    """Debug current credential configuration"""
    print("🔍 DEBUGGING FLUTTERWAVE CREDENTIALS")
    print("="*60)
    
    # Check environment variables directly
    print("Environment Variables:")
    env_vars = [
        'FLUTTERWAVE_SECRET_KEY',
        'FLUTTERWAVE_CLIENT_SECRET_KEY', 
        'FLUTTERWAVE_LIVE_SECRET_KEY',
        'FLUTTERWAVE_PUBLIC_KEY',
        'FLUTTERWAVE_CLIENT_ID',
        'FLUTTERWAVE_LIVE_PUBLIC_KEY',
        'FLUTTERWAVE_ENCRYPTION_KEY'
    ]
    
    for var in env_vars:
        value = os.getenv(var)
        if value:
            print(f"✅ {var}: {value[:20]}...")
        else:
            print(f"❌ {var}: Not set")
    
    print("\nFlutterwave Service Configuration:")
    print(f"Secret Key: {flutterwave_service.secret_key[:20] if flutterwave_service.secret_key else 'None'}...")
    print(f"Public Key: {flutterwave_service.public_key[:20] if flutterwave_service.public_key else 'None'}...")
    print(f"Encryption Key: {flutterwave_service.encryption_key[:20] if flutterwave_service.encryption_key else 'None'}...")
    
    # Test a simple API call to validate credentials
    print("\n🧪 Testing Flutterwave API Connection...")
    
    import requests
    
    if flutterwave_service.secret_key:
        try:
            headers = {
                'Authorization': f'Bearer {flutterwave_service.secret_key}',
                'Content-Type': 'application/json'
            }
            
            # Test with a simple API call (get banks)
            response = requests.get(
                'https://api.flutterwave.com/v3/banks/NG',
                headers=headers,
                timeout=10
            )
            
            print(f"API Test Response: {response.status_code}")
            if response.status_code == 200:
                print("✅ Flutterwave API credentials are valid!")
                data = response.json()
                print(f"   Banks available: {len(data.get('data', []))}")
            else:
                print(f"❌ Flutterwave API error: {response.text}")
                
        except Exception as e:
            print(f"❌ API test error: {e}")
    else:
        print("❌ No secret key available for testing")

if __name__ == "__main__":
    debug_credentials()