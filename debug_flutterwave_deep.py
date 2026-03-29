#!/usr/bin/env python3
"""
Deep Flutterwave Debugging
Comprehensive debugging of Flutterwave credentials and API integration
"""

import os
import sys
import requests
import json
import time
from datetime import datetime

def print_section(title):
    print(f"\n{'='*60}")
    print(f"🔍 {title}")
    print('='*60)

def debug_environment_loading():
    """Debug how environment variables are being loaded"""
    print_section("ENVIRONMENT VARIABLE LOADING")
    
    # Check current working directory
    print(f"Current working directory: {os.getcwd()}")
    
    # Check if .env file exists
    env_file = 'apps/backend-fastapi/.env'
    if os.path.exists(env_file):
        print(f"✅ Environment file exists: {env_file}")
        
        # Read file content
        with open(env_file, 'r') as f:
            content = f.read()
        
        print(f"File size: {len(content)} characters")
        
        # Find Flutterwave lines
        lines = content.split('\n')
        flw_lines = []
        for i, line in enumerate(lines, 1):
            if 'FLUTTERWAVE' in line.upper() or 'CLIENT' in line.upper():
                flw_lines.append((i, line.strip()))
        
        print(f"Found {len(flw_lines)} Flutterwave-related lines:")
        for line_num, line in flw_lines:
            print(f"  Line {line_num}: {line}")
    else:
        print(f"❌ Environment file not found: {env_file}")
        return False
    
    # Check what Python sees
    print("\nWhat Python os.getenv() returns:")
    env_vars = [
        'FLUTTERWAVE_LIVE_SECRET_KEY',
        'FLUTTERWAVE_LIVE_PUBLIC_KEY', 
        'FLUTTERWAVE_CLIENT_SECRET_KEY',
        'FLUTTERWAVE_CLIENT_ID',
        'FLUTTERWAVE_SECRET_KEY',
        'FLUTTERWAVE_PUBLIC_KEY',
        'FLUTTERWAVE_ENCRYPTION_KEY'
    ]
    
    found_vars = {}
    for var in env_vars:
        value = os.getenv(var)
        if value:
            print(f"  ✅ {var}: {value[:20]}...")
            found_vars[var] = value
        else:
            print(f"  ❌ {var}: Not set")
    
    return len(found_vars) > 0

def test_flutterwave_service_import():
    """Test importing and checking the Flutterwave service"""
    print_section("FLUTTERWAVE SERVICE IMPORT")
    
    try:
        # Add backend path to Python path
        backend_path = os.path.join(os.getcwd(), 'apps', 'backend-fastapi')
        if backend_path not in sys.path:
            sys.path.insert(0, backend_path)
        
        # Force reload if already imported
        if 'services.flutterwave_service' in sys.modules:
            del sys.modules['services.flutterwave_service']
        
        from services.flutterwave_service import flutterwave_service
        
        print("✅ Flutterwave service imported successfully")
        print(f"Secret key: {flutterwave_service.secret_key[:20] if flutterwave_service.secret_key else 'None'}...")
        print(f"Public key: {flutterwave_service.public_key[:20] if flutterwave_service.public_key else 'None'}...")
        print(f"Encryption key: {flutterwave_service.encryption_key[:20] if flutterwave_service.encryption_key else 'None'}...")
        
        return flutterwave_service
        
    except Exception as e:
        print(f"❌ Error importing Flutterwave service: {e}")
        return None

def test_flutterwave_api_with_different_keys():
    """Test Flutterwave API with different credential combinations"""
    print_section("FLUTTERWAVE API TESTING WITH DIFFERENT KEYS")
    
    # Get all possible credentials
    credentials = {
        'live_secret': os.getenv('FLUTTERWAVE_LIVE_SECRET_KEY'),
        'live_public': os.getenv('FLUTTERWAVE_LIVE_PUBLIC_KEY'),
        'client_secret': os.getenv('FLUTTERWAVE_CLIENT_SECRET_KEY'),
        'client_id': os.getenv('FLUTTERWAVE_CLIENT_ID'),
        'standard_secret': os.getenv('FLUTTERWAVE_SECRET_KEY'),
        'standard_public': os.getenv('FLUTTERWAVE_PUBLIC_KEY'),
    }
    
    print("Available credentials:")
    for key, value in credentials.items():
        if value:
            print(f"  ✅ {key}: {value[:20]}...")
        else:
            print(f"  ❌ {key}: Not set")
    
    # Test different secret key combinations
    secret_keys = [
        ('LIVE', credentials['live_secret']),
        ('CLIENT', credentials['client_secret']),
        ('STANDARD', credentials['standard_secret'])
    ]
    
    for key_type, secret_key in secret_keys:
        if not secret_key:
            continue
            
        print(f"\n🧪 Testing {key_type} secret key: {secret_key[:20]}...")
        
        try:
            headers = {
                'Authorization': f'Bearer {secret_key}',
                'Content-Type': 'application/json'
            }
            
            # Test with banks endpoint (simple test)
            response = requests.get(
                'https://api.flutterwave.com/v3/banks/NG',
                headers=headers,
                timeout=10
            )
            
            print(f"  Response: {response.status_code}")
            
            if response.status_code == 200:
                print(f"  ✅ {key_type} credentials VALID!")
                data = response.json()
                banks = data.get('data', [])
                print(f"  Banks returned: {len(banks)}")
                return key_type, secret_key
            else:
                print(f"  ❌ {key_type} credentials invalid: {response.text[:100]}...")
                
        except Exception as e:
            print(f"  ❌ {key_type} test error: {e}")
    
    return None, None

def test_payment_creation_with_valid_key(secret_key):
    """Test payment creation with a valid secret key"""
    print_section("PAYMENT CREATION TEST WITH VALID KEY")
    
    if not secret_key:
        print("❌ No valid secret key provided")
        return False
    
    try:
        headers = {
            'Authorization': f'Be