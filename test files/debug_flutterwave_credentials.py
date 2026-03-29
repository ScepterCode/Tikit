#!/usr/bin/env python3
"""
Debug Flutterwave Credentials
Test the exact credentials being sent to Flutterwave API
"""

import os
import requests
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv('apps/backend-fastapi/.env')

def debug_flutterwave_credentials():
    """Debug what credentials are being loaded and sent"""
    print("🔍 FLUTTERWAVE CREDENTIALS DEBUG\n")
    
    # Get credentials using the same logic as the service
    secret_key = (
        os.getenv('FLUTTERWAVE_SECRET_KEY') or 
        os.getenv('FLUTTERWAVE_CLIENT_SECRET_KEY')
    )
    public_key = (
        os.getenv('FLUTTERWAVE_PUBLIC_KEY') or 
        os.getenv('FLUTTERWAVE_CLIENT_ID')
    )
    
    print("📋 Loaded Credentials:")
    print(f"Secret Key: {secret_key[:20]}..." if secret_key else "❌ Not found")
    print(f"Public Key: {public_key[:20]}..." if public_key else "❌ Not found")
    print(f"Secret Key Length: {len(secret_key) if secret_key else 0}")
    print(f"Public Key Length: {len(public_key) if public_key else 0}")
    
    if not secret_key:
        print("❌ No secret key found - cannot test API")
        return
    
    # Test a simple Flutterwave API call
    print("\n🌐 Testing Flutterwave API Connection...")
    
    headers = {
        'Authorization': f'Bearer {secret_key}',
        'Content-Type': 'application/json'
    }
    
    # Try a simple API call first (like getting banks)
    try:
        response = requests.get(
            'https://api.flutterwave.com/v3/banks/NG',
            headers=headers,
            timeout=10
        )
        
        print(f"Banks API Response: {response.status_code}")
        print(f"Response: {response.text[:200]}...")
        
        if response.status_code == 200:
            print("✅ API connection successful - credentials are valid")
        elif response.status_code == 401:
            print("❌ 401 Unauthorized - Invalid credentials")
        else:
            print(f"⚠️  Unexpected response: {response.status_code}")
            
    except Exception as e:
        print(f"❌ API connection error: {e}")
    
    # Test payment creation with minimal payload
    print("\n💳 Testing Payment Creation...")
    
    try:
        payload = {
            "tx_ref": "TEST_DEBUG_123",
            "amount": "1000",
            "currency": "NGN",
            "redirect_url": "https://example.com",
            "customer": {
                "email": "test@example.com",
                "name": "Test User"
            }
        }
        
        response = requests.post(
            'https://api.flutterwave.com/v3/payments',
            json=payload,
            headers=headers,
            timeout=15
        )
        
        print(f"Payment API Response: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            print("✅ Payment creation successful")
        elif response.status_code == 401:
            print("❌ 401 Unauthorized - Invalid credentials for payments")
        else:
            print(f"⚠️  Payment creation failed: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Payment creation error: {e}")

if __name__ == "__main__":
    debug_flutterwave_credentials()