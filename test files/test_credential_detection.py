#!/usr/bin/env python3
"""
Test Credential Detection
Check what Flutterwave credentials are actually loaded
"""

import requests
import os
from pathlib import Path

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

def test_credential_detection():
    """Test what credentials are actually detected"""
    print("🔍 CREDENTIAL DETECTION TEST\n")
    
    # Read frontend environment
    frontend_env = read_env_file('apps/frontend/.env.production')
    backend_env = read_env_file('apps/backend-fastapi/.env')
    
    print("📋 Frontend Environment Variables:")
    for key, value in frontend_env.items():
        if 'FLUTTERWAVE' in key or 'PAYMENT' in key:
            masked_value = value[:20] + "..." if len(value) > 20 else value
            print(f"   {key} = {masked_value}")
    
    print("\n📋 Backend Environment Variables:")
    for key, value in backend_env.items():
        if 'FLUTTERWAVE' in key or 'PAYMENT' in key:
            masked_value = value[:20] + "..." if len(value) > 20 else value
            print(f"   {key} = {masked_value}")
    
    print("\n🔑 Credential Analysis:")
    
    # Check what the test expects
    frontend_public = frontend_env.get('VITE_FLUTTERWAVE_PUBLIC_KEY', '')
    backend_secret = backend_env.get('FLUTTERWAVE_SECRET_KEY', '')
    
    print(f"Frontend Public Key: {frontend_public[:30]}..." if frontend_public else "❌ Not found")
    print(f"Backend Secret Key: {backend_secret[:30]}..." if backend_secret else "❌ Not found")
    
    # Check formats
    if frontend_public:
        if frontend_public.startswith('FLWPUBK-'):
            print("✅ Frontend key has correct FLWPUBK- prefix")
        else:
            print("❌ Frontend key missing FLWPUBK- prefix")
    
    if backend_secret:
        if backend_secret.startswith('FLWSECK-'):
            print("✅ Backend key has correct FLWSECK- prefix")
        else:
            print("❌ Backend key missing FLWSECK- prefix")
    
    # Test backend service status
    print("\n🌐 Backend Service Status:")
    try:
        response = requests.get("http://localhost:8000/api/payments/methods", timeout=5)
        if response.status_code == 200:
            data = response.json()
            methods = data.get('methods', [])
            for method in methods:
                status = "✅" if method.get('available') else "❌"
                print(f"   {status} {method.get('name')}: {method.get('description')}")
        else:
            print(f"❌ Payment methods endpoint: {response.status_code}")
    except Exception as e:
        print(f"❌ Backend not accessible: {e}")

if __name__ == "__main__":
    test_credential_detection()