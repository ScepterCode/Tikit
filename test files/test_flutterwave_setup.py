#!/usr/bin/env python3
"""
Test Flutterwave Setup
Validates Flutterwave configuration and integration
"""

import os
import re

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

def test_frontend_credentials():
    """Test frontend Flutterwave credentials"""
    print("🎨 Testing Frontend Credentials...")
    
    frontend_env = read_env_file('apps/frontend/.env.production')
    
    public_key = frontend_env.get('VITE_FLUTTERWAVE_PUBLIC_KEY', '')
    
    if not public_key:
        print("❌ VITE_FLUTTERWAVE_PUBLIC_KEY not found")
        return False
    
    if public_key == 'FLWPUBK-your_actual_flutterwave_public_key_here':
        print("❌ Flutterwave public key is still placeholder")
        return False
    
    if not public_key.startswith('FLWPUBK-'):
        print("❌ Flutterwave public key format invalid (should start with FLWPUBK-)")
        return False
    
    if len(public_key) < 20:
        print("❌ Flutterwave public key too short")
        return False
    
    print(f"✅ Frontend public key configured: {public_key[:20]}...")
    return True

def test_backend_credentials():
    """Test backend Flutterwave credentials"""
    print("🔧 Testing Backend Credentials...")
    
    backend_env = read_env_file('apps/backend-fastapi/.env')
    
    # Check if secret key is configured
    secret_key = backend_env.get('FLUTTERWAVE_SECRET_KEY', '')
    
    if not secret_key:
        print("❌ FLUTTERWAVE_SECRET_KEY not found in backend .env")
        print("   Please add: FLUTTERWAVE_SECRET_KEY=FLWSECK-your_secret_key")
        return False
    
    if secret_key.startswith('${') and secret_key.endswith('}'):
        print("❌ FLUTTERWAVE_SECRET_KEY is using environment variable placeholder")
        print("   Please set actual value: FLUTTERWAVE_SECRET_KEY=FLWSECK-your_secret_key")
        return False
    
    if not secret_key.startswith('FLWSECK-'):
        print("❌ Flutterwave secret key format invalid (should start with FLWSECK-)")
        return False
    
    if len(secret_key) < 20:
        print("❌ Flutterwave secret key too short")
        return False
    
    print(f"✅ Backend secret key configured: {secret_key[:20]}...")
    return True

def test_payment_modal_integration():
    """Test payment modal integration"""
    print("💳 Testing Payment Modal Integration...")
    
    modal_file = 'apps/frontend/src/components/payment/SecurePaymentModal.tsx'
    
    if not os.path.exists(modal_file):
        print("❌ SecurePaymentModal.tsx not found")
        return False
    
    try:
        with open(modal_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        checks = [
            ('VITE_FLUTTERWAVE_PUBLIC_KEY', 'Environment variable usage'),
            ('FlutterwaveCheckout', 'Flutterwave checkout integration'),
            ('payment_options.*card', 'Card payment support'),
            ('payment_options.*bank', 'Bank transfer support'),
            ('callback.*response', 'Payment callback handling'),
        ]
        
        passed_checks = 0
        
        for pattern, description in checks:
            if re.search(pattern, content, re.IGNORECASE):
                print(f"✅ {description}: Found")
                passed_checks += 1
            else:
                print(f"⚠️  {description}: Not found")
        
        return passed_checks >= 3
        
    except Exception as e:
        print(f"❌ Error reading payment modal: {e}")
        return False

def test_backend_service():
    """Test backend Flutterwave service"""
    print("🔧 Testing Backend Service...")
    
    service_file = 'apps/backend-fastapi/services/flutterwave_service.py'
    
    if not os.path.exists(service_file):
        print("❌ flutterwave_service.py not found")
        return False
    
    try:
        with open(service_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        checks = [
            ('FLUTTERWAVE_SECRET_KEY', 'Secret key usage'),
            ('api\.flutterwave\.com', 'Flutterwave API endpoint'),
            ('create_payment_link', 'Payment link creation'),
            ('verify_payment', 'Payment verification'),
            ('webhook', 'Webhook handling'),
        ]
        
        passed_checks = 0
        
        for pattern, description in checks:
            if re.search(pattern, content, re.IGNORECASE):
                print(f"✅ {description}: Found")
                passed_checks += 1
            else:
                print(f"⚠️  {description}: Not found")
        
        return passed_checks >= 4
        
    except Exception as e:
        print(f"❌ Error reading backend service: {e}")
        return False

def test_payment_routes():
    """Test payment routes"""
    print("🛣️  Testing Payment Routes...")
    
    routes_file = 'apps/backend-fastapi/routers/payments.py'
    
    if not os.path.exists(routes_file):
        print("❌ payments.py router not found")
        return False
    
    try:
        with open(routes_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        routes = [
            ('flutterwave/create', 'Flutterwave payment creation'),
            ('verify', 'Payment verification'),
            ('webhook/flutterwave', 'Flutterwave webhook'),
            ('methods', 'Payment methods'),
            ('balance', 'Wallet balance'),
        ]
        
        found_routes = 0
        
        for route, description in routes:
            if route in content:
                print(f"✅ {description}: Found")
                found_routes += 1
            else:
                print(f"❌ {description}: Missing")
        
        return found_routes >= 4
        
    except Exception as e:
        print(f"❌ Error reading payment routes: {e}")
        return False

def main():
    """Test complete Flutterwave setup"""
    print("🧪 FLUTTERWAVE SETUP VALIDATION\n")
    
    tests = [
        ("Frontend Credentials", test_frontend_credentials),
        ("Backend Credentials", test_backend_credentials),
        ("Payment Modal Integration", test_payment_modal_integration),
        ("Backend Service", test_backend_service),
        ("Payment Routes", test_payment_routes),
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
    print("FLUTTERWAVE SETUP VALIDATION RESULTS")
    print('='*50)
    print(f"Tests Passed: {passed}/{total}")
    print(f"Success Rate: {(passed/total)*100:.1f}%")
    
    if passed == total:
        print("\n🎉 FLUTTERWAVE SETUP COMPLETE!")
        print("✅ Frontend credentials configured")
        print("✅ Backend credentials configured")
        print("✅ Payment integration complete")
        print("✅ All components ready")
    elif passed >= 3:
        print(f"\n🟡 MOSTLY READY - {total-passed} minor issues")
        print("✅ Core setup complete")
        print("⚠️  Some components need attention")
    else:
        print(f"\n🔴 SETUP INCOMPLETE - {total-passed} major issues")
        print("❌ Critical components missing")
    
    print("\n📋 Next Steps:")
    if passed >= 4:
        print("1. ✅ Setup validated - ready to start servers")
        print("2. 🚀 Start servers: python start_payment_test_servers.py")
        print("3. 🧪 Test payment flow in browser")
        print("4. 📊 Monitor payment logs")
    else:
        print("1. 🔧 Fix failing components above")
        print("2. 🔑 Ensure Flutterwave credentials are properly set")
        print("3. 🔄 Re-run this validation")
        print("4. 📞 Contact support if issues persist")
    
    print("\n⚠️  IMPORTANT REMINDERS:")
    print("• Frontend uses PUBLIC key (FLWPUBK-) for checkout")
    print("• Backend uses SECRET key (FLWSECK-) for API calls")
    print("• Both keys must be from the same Flutterwave account")
    print("• Keys must be active in your Flutterwave dashboard")

if __name__ == "__main__":
    main()