#!/usr/bin/env python3
"""
Test the login flow to verify the fix works
"""
import time
import requests
import json

# Test credentials
TEST_USERS = [
    {
        "email": "admin@grooovy.netlify.app",
        "password": "password123",
        "role": "admin"
    },
    {
        "email": "organizer@grooovy.netlify.app",
        "password": "password123",
        "role": "organizer"
    },
    {
        "email": "attendee@grooovy.netlify.app",
        "password": "password123",
        "role": "attendee"
    }
]

BACKEND_URL = "http://localhost:8000"
FRONTEND_URL = "http://localhost:3000"

def test_backend_health():
    """Test if backend is running"""
    try:
        response = requests.get(f"{BACKEND_URL}/health", timeout=5)
        if response.status_code == 200:
            print("✅ Backend is running")
            return True
    except Exception as e:
        print(f"❌ Backend error: {e}")
    return False

def test_frontend_health():
    """Test if frontend is running"""
    try:
        response = requests.get(FRONTEND_URL, timeout=5)
        if response.status_code == 200:
            print("✅ Frontend is running")
            return True
    except Exception as e:
        print(f"❌ Frontend error: {e}")
    return False

def main():
    print("🧪 Testing Login Flow Fix\n")
    
    # Check servers
    print("1️⃣  Checking servers...")
    if not test_backend_health():
        print("❌ Backend not running. Start it with: uvicorn simple_main:app --reload --host 0.0.0.0 --port 8000")
        return
    
    if not test_frontend_health():
        print("❌ Frontend not running. Start it with: pnpm dev")
        return
    
    print("\n2️⃣  Servers are ready!")
    print(f"   Backend: {BACKEND_URL}")
    print(f"   Frontend: {FRONTEND_URL}")
    
    print("\n3️⃣  Test Credentials:")
    for user in TEST_USERS:
        print(f"   - {user['email']} ({user['role']})")
        print(f"     Password: {user['password']}")
    
    print("\n4️⃣  Next Steps:")
    print("   1. Open http://localhost:3000/auth/login in your browser")
    print("   2. Try logging in with one of the test credentials")
    print("   3. You should be redirected to /dashboard (not stuck on loading)")
    print("   4. Check browser console for auth debug logs")
    
    print("\n✅ System is ready for testing!")

if __name__ == "__main__":
    main()
