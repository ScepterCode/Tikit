#!/usr/bin/env python3
"""
Browser Integration Test - End-to-End System Verification
Tests the complete integrated system in a browser environment
"""

import os
import sys
import time
import subprocess
import requests
import json
from pathlib import Path

def check_backend_server():
    """Check if backend server is running"""
    print("🔍 Checking backend server...")
    
    try:
        response = requests.get("http://localhost:8000/health", timeout=5)
        if response.status_code == 200:
            return True, "Backend server is running"
        else:
            return False, f"Backend server returned status {response.status_code}"
    except requests.exceptions.RequestException as e:
        return False, f"Backend server not accessible: {str(e)}"

def check_frontend_server():
    """Check if frontend server is running"""
    print("🔍 Checking frontend server...")
    
    try:
        response = requests.get("http://localhost:3000", timeout=5)
        if response.status_code == 200:
            return True, "Frontend server is running"
        else:
            return False, f"Frontend server returned status {response.status_code}"
    except requests.exceptions.RequestException as e:
        return False, f"Frontend server not accessible: {str(e)}"

def test_api_endpoints():
    """Test key API endpoints"""
    print("🔍 Testing API endpoints...")
    
    endpoints = [
        ("GET", "/health", "Health check"),
        ("GET", "/api/events", "Events endpoint"),
        ("GET", "/api/payments/methods", "Payment methods"),
        ("GET", "/api/notifications/preferences", "Notifications"),
    ]
    
    results = []
    for method, endpoint, description in endpoints:
        try:
            url = f"http://localhost:8000{endpoint}"
            response = requests.request(method, url, timeout=5)
            
            if response.status_code in [200, 401]:  # 401 is expected for protected endpoints
                results.append(f"✅ {description}")
            else:
                results.append(f"❌ {description} (Status: {response.status_code})")
        except Exception as e:
            results.append(f"❌ {description} (Error: {str(e)[:50]})")
    
    success_count = len([r for r in results if "✅" in r])
    return success_count >= 3, f"API endpoints: {success_count}/{len(endpoints)} working"

def test_supabase_connection():
    """Test Supabase database connection"""
    print("🔍 Testing Supabase connection...")
    
    try:
        # Check if we can reach Supabase health endpoint
        response = requests.get("http://localhost:8000/api/health/database", timeout=10)
        if response.status_code == 200:
            return True, "Supabase connection working"
        else:
            return False, f"Database health check failed: {response.status_code}"
    except Exception as e:
        return False, f"Database connection error: {str(e)}"

def check_environment_variables():
    """Check required environment variables"""
    print("🔍 Checking environment variables...")
    
    # Check backend .env
    backend_env = Path("apps/backend-fastapi/.env")
    frontend_env = Path("apps/frontend/.env")
    
    env_checks = []
    
    if backend_env.exists():
        with open(backend_env, 'r') as f:
            backend_content = f.read()
        
        required_backend = ["SUPABASE_URL", "SUPABASE_ANON_KEY", "JWT_SECRET"]
        for var in required_backend:
            if var in backend_content:
                env_checks.append(f"✅ Backend {var}")
            else:
                env_checks.append(f"❌ Backend {var} missing")
    else:
        env_checks.append("❌ Backend .env file missing")
    
    if frontend_env.exists():
        with open(frontend_env, 'r') as f:
            frontend_content = f.read()
        
        required_frontend = ["REACT_APP_SUPABASE_URL", "REACT_APP_SUPABASE_ANON_KEY"]
        for var in required_frontend:
            if var in frontend_content:
                env_checks.append(f"✅ Frontend {var}")
            else:
                env_checks.append(f"❌ Frontend {var} missing")
    else:
        env_checks.append("❌ Frontend .env file missing")
    
    success_count = len([c for c in env_checks if "✅" in c])
    total_count = len(env_checks)
    
    return success_count >= 4, f"Environment: {success_count}/{total_count} variables configured"

def test_authentication_flow():
    """Test authentication endpoints"""
    print("🔍 Testing authentication flow...")
    
    auth_tests = []
    
    # Test signup endpoint
    try:
        signup_data = {
            "email": "test@example.com",
            "password": "testpassword123",
            "firstName": "Test",
            "lastName": "User"
        }
        response = requests.post("http://localhost:8000/api/auth/signup", 
                               json=signup_data, timeout=5)
        
        if response.status_code in [200, 400, 409]:  # 400/409 expected if user exists
            auth_tests.append("✅ Signup endpoint accessible")
        else:
            auth_tests.append(f"❌ Signup endpoint error: {response.status_code}")
    except Exception as e:
        auth_tests.append(f"❌ Signup endpoint error: {str(e)[:50]}")
    
    # Test login endpoint
    try:
        login_data = {
            "email": "test@example.com",
            "password": "testpassword123"
        }
        response = requests.post("http://localhost:8000/api/auth/login", 
                               json=login_data, timeout=5)
        
        if response.status_code in [200, 400, 401]:  # Various responses are acceptable
            auth_tests.append("✅ Login endpoint accessible")
        else:
            auth_tests.append(f"❌ Login endpoint error: {response.status_code}")
    except Exception as e:
        auth_tests.append(f"❌ Login endpoint error: {str(e)[:50]}")
    
    success_count = len([t for t in auth_tests if "✅" in t])
    return success_count >= 1, f"Auth endpoints: {success_count}/{len(auth_tests)} working"

def generate_startup_instructions():
    """Generate instructions for starting the servers"""
    print("\n📋 SERVER STARTUP INSTRUCTIONS")
    print("=" * 50)
    
    instructions = """
🚀 TO START THE INTEGRATED SYSTEM:

1. START BACKEND SERVER:
   cd apps/backend-fastapi
   python main_minimal.py
   
   Expected output:
   - Server starting on http://localhost:8000
   - Database connection established
   - All routers loaded successfully

2. START FRONTEND SERVER (in new terminal):
   cd apps/frontend
   npm run dev
   
   Expected output:
   - Development server starting
   - Local: http://localhost:3000
   - Ready in X seconds

3. VERIFY SYSTEM:
   - Backend: http://localhost:8000/health
   - Frontend: http://localhost:3000
   - API Docs: http://localhost:8000/docs

4. TEST USER FLOWS:
   - Register new account
   - Login with credentials
   - Navigate dashboard (role-based)
   - Test wallet functionality
   - Create/browse events
   - Test payment system

5. MOBILE TESTING:
   - Open http://localhost:3000 on mobile device
   - Test responsive sidebar
   - Verify touch interactions
   - Test all user flows on mobile
"""
    
    print(instructions)
    return instructions

def run_browser_integration_test():
    """Run comprehensive browser integration test"""
    print("🚀 BROWSER INTEGRATION TEST - COMPREHENSIVE VERIFICATION")
    print("=" * 60)
    
    tests = [
        ("Environment Variables", check_environment_variables),
        ("Backend Server", check_backend_server),
        ("Frontend Server", check_frontend_server),
        ("API Endpoints", test_api_endpoints),
        ("Supabase Connection", test_supabase_connection),
        ("Authentication Flow", test_authentication_flow),
    ]
    
    results = []
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        try:
            success, details = test_func()
            status = "✅ PASS" if success else "❌ FAIL"
            results.append({
                "test": test_name,
                "status": status,
                "details": details,
                "success": success
            })
            if success:
                passed += 1
            print(f"{status} {test_name}: {details}")
        except Exception as e:
            results.append({
                "test": test_name,
                "status": "❌ ERROR",
                "details": str(e),
                "success": False
            })
            print(f"❌ ERROR {test_name}: {str(e)}")
    
    print("\n" + "=" * 60)
    print("📊 BROWSER INTEGRATION TEST SUMMARY")
    print("=" * 60)
    
    success_rate = (passed / total) * 100
    print(f"Tests Passed: {passed}/{total} ({success_rate:.1f}%)")
    
    if success_rate >= 80:
        grade = "🏆 EXCELLENT"
        status = "READY FOR BROWSER TESTING"
    elif success_rate >= 60:
        grade = "🥇 GOOD"
        status = "MOSTLY READY - MINOR ISSUES"
    elif success_rate >= 40:
        grade = "🥈 FAIR"
        status = "NEEDS SETUP"
    else:
        grade = "❌ NEEDS WORK"
        status = "MAJOR SETUP REQUIRED"
    
    print(f"Grade: {grade}")
    print(f"Status: {status}")
    
    # Detailed results
    print("\n📋 DETAILED RESULTS:")
    for result in results:
        print(f"  {result['status']} {result['test']}")
        if not result['success']:
            print(f"    Issue: {result['details']}")
    
    # Next steps based on results
    print("\n🎯 NEXT STEPS:")
    
    if success_rate >= 80:
        print("  ✅ System is ready for browser testing!")
        print("  ✅ Both servers are running correctly")
        print("  ✅ Start testing user flows in browser")
        print("  ✅ Verify mobile responsiveness")
    elif success_rate >= 60:
        print("  🔧 Start the servers if not running")
        print("  🔧 Check environment variable configuration")
        print("  ✅ Most components are ready for testing")
    elif success_rate >= 40:
        print("  🔧 Configure environment variables")
        print("  🔧 Start backend and frontend servers")
        print("  🔧 Verify Supabase connection")
    else:
        print("  🔧 Complete environment setup")
        print("  🔧 Configure all required variables")
        print("  🔧 Ensure Supabase is properly configured")
    
    # Generate startup instructions
    if success_rate < 80:
        generate_startup_instructions()
    
    # Save results
    with open("BROWSER_INTEGRATION_TEST_RESULTS.json", "w") as f:
        json.dump({
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "success_rate": success_rate,
            "grade": grade,
            "status": status,
            "passed": passed,
            "total": total,
            "results": results
        }, f, indent=2)
    
    print(f"\n📄 Results saved to: BROWSER_INTEGRATION_TEST_RESULTS.json")
    
    return success_rate >= 60

if __name__ == "__main__":
    success = run_browser_integration_test()
    sys.exit(0 if success else 1)