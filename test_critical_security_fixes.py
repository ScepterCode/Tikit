#!/usr/bin/env python3
"""
Critical Security Fixes Verification Test
Tests the implementation of critical security fixes
"""

import os
import sys
import jwt
import time
from datetime import datetime

def test_jwt_validation_security():
    """Test JWT validation security improvements"""
    print("🔐 Testing JWT validation security...")
    
    try:
        # Import the fixed JWT validator
        sys.path.append('apps/backend-fastapi')
        from jwt_validator import validate_token
        
        # Test 1: Invalid token should fail
        try:
            validate_token("invalid.token.here")
            print("❌ FAIL: Invalid token was accepted")
            return False
        except ValueError:
            print("✅ PASS: Invalid token properly rejected")
        
        # Test 2: Token without required claims should fail
        try:
            # Create token without required claims
            token = jwt.encode({"some": "data"}, "secret", algorithm="HS256")
            validate_token(token)
            print("❌ FAIL: Token without required claims was accepted")
            return False
        except ValueError:
            print("✅ PASS: Token without required claims properly rejected")
        
        print("✅ JWT validation security tests passed")
        return True
        
    except Exception as e:
        print(f"❌ JWT validation test error: {e}")
        return False

def test_mock_token_security():
    """Test mock token security restrictions"""
    print("🔐 Testing mock token security...")
    
    try:
        # Set production environment
        os.environ["ENVIRONMENT"] = "production"
        
        # Import auth utils (should fail in production)
        sys.path.append('apps/backend-fastapi')
        
        try:
            from auth_utils import ENABLE_MOCK_TOKENS, ENABLE_TEST_USERS
            
            if ENABLE_MOCK_TOKENS or ENABLE_TEST_USERS:
                print("❌ FAIL: Mock tokens/test users enabled in production")
                return False
            else:
                print("✅ PASS: Mock tokens/test users disabled in production")
                
        except RuntimeError as e:
            if "SECURITY ERROR" in str(e):
                print("✅ PASS: Production security check working")
            else:
                print(f"❌ FAIL: Unexpected error: {e}")
                return False
        
        # Reset to development for other tests
        os.environ["ENVIRONMENT"] = "development"
        print("✅ Mock token security tests passed")
        return True
        
    except Exception as e:
        print(f"❌ Mock token test error: {e}")
        return False

def test_environment_security():
    """Test environment configuration security"""
    print("🔐 Testing environment configuration security...")
    
    try:
        # Check .env file for hardcoded credentials
        env_file = "apps/backend-fastapi/.env"
        
        if not os.path.exists(env_file):
            print("❌ FAIL: .env file not found")
            return False
        
        with open(env_file, 'r') as f:
            content = f.read()
        
        # Check for hardcoded Supabase credentials
        security_issues = []
        
        if "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" in content:
            security_issues.append("Hardcoded JWT tokens found")
        
        if "https://hwwzbsppzwcyvambeade.supabase.co" in content:
            security_issues.append("Hardcoded Supabase URL found")
        
        if "ENABLE_MOCK_TOKENS=true" in content:
            security_issues.append("Mock tokens enabled by default")
        
        if "DEBUG=true" in content:
            security_issues.append("Debug mode enabled by default")
        
        if security_issues:
            print("❌ FAIL: Security issues in .env file:")
            for issue in security_issues:
                print(f"  - {issue}")
            return False
        
        print("✅ PASS: .env file security checks passed")
        return True
        
    except Exception as e:
        print(f"❌ Environment security test error: {e}")
        return False

def test_csrf_protection():
    """Test CSRF protection implementation"""
    print("🔐 Testing CSRF protection...")
    
    try:
        # Check security middleware for CSRF bypass removal
        middleware_file = "apps/backend-fastapi/middleware/security.py"
        
        if not os.path.exists(middleware_file):
            print("❌ FAIL: Security middleware file not found")
            return False
        
        with open(middleware_file, 'r') as f:
            content = f.read()
        
        # Check for development bypass removal
        if 'x-development-mode' in content:
            print("❌ FAIL: Development mode bypass still present")
            return False
        
        if 'CSRF_TOKEN_MISSING' in content and 'INVALID_CSRF_TOKEN' in content:
            print("✅ PASS: CSRF protection properly implemented")
            return True
        else:
            print("❌ FAIL: CSRF protection not properly implemented")
            return False
        
    except Exception as e:
        print(f"❌ CSRF protection test error: {e}")
        return False

def test_secure_config():
    """Test secure configuration management"""
    print("🔐 Testing secure configuration...")
    
    try:
        # Check if secure config file exists
        config_file = "apps/backend-fastapi/secure_config.py"
        
        if not os.path.exists(config_file):
            print("❌ FAIL: Secure config file not found")
            return False
        
        # Import and test secure config
        sys.path.append('apps/backend-fastapi')
        from secure_config import SecureConfig
        
        # Test production validation
        os.environ["ENVIRONMENT"] = "production"
        os.environ["ENABLE_MOCK_TOKENS"] = "true"  # This should trigger error
        
        try:
            config = SecureConfig()
            print("❌ FAIL: Production validation should have failed")
            return False
        except RuntimeError as e:
            if "PRODUCTION SECURITY ISSUES" in str(e):
                print("✅ PASS: Production security validation working")
            else:
                print(f"❌ FAIL: Unexpected error: {e}")
                return False
        
        # Clean up
        os.environ["ENABLE_MOCK_TOKENS"] = "false"
        os.environ["ENVIRONMENT"] = "development"
        
        return True
        
    except Exception as e:
        print(f"❌ Secure config test error: {e}")
        return False

def main():
    """Run all critical security tests"""
    print("🔐 CRITICAL SECURITY FIXES VERIFICATION")
    print("=" * 50)
    print(f"Test started at: {datetime.now().isoformat()}")
    print()
    
    tests = [
        ("JWT Validation Security", test_jwt_validation_security),
        ("Mock Token Security", test_mock_token_security),
        ("Environment Security", test_environment_security),
        ("CSRF Protection", test_csrf_protection),
        ("Secure Configuration", test_secure_config)
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n📋 Running: {test_name}")
        print("-" * 30)
        
        if test_func():
            passed += 1
            print(f"✅ {test_name}: PASSED")
        else:
            print(f"❌ {test_name}: FAILED")
    
    print("\n" + "=" * 50)
    print(f"🔐 SECURITY TEST RESULTS")
    print(f"Passed: {passed}/{total} ({(passed/total)*100:.1f}%)")
    
    if passed == total:
        print("✅ ALL CRITICAL SECURITY FIXES VERIFIED")
        print("🔒 System is ready for production deployment")
    else:
        print("❌ SECURITY ISSUES DETECTED")
        print("⚠️  DO NOT DEPLOY TO PRODUCTION")
    
    print(f"Test completed at: {datetime.now().isoformat()}")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)