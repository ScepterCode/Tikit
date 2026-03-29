#!/usr/bin/env python3
"""
Diagnose login page loading issue
"""

import requests
import time

FRONTEND_URL = "http://localhost:3000"
BACKEND_URL = "http://localhost:8000"

def test_frontend():
    """Test if frontend is responding"""
    try:
        response = requests.get(FRONTEND_URL, timeout=5)
        print(f"✅ Frontend responding: {response.status_code}")
        return True
    except Exception as e:
        print(f"❌ Frontend error: {str(e)}")
        return False

def test_backend():
    """Test if backend is responding"""
    try:
        response = requests.get(f"{BACKEND_URL}/health", timeout=5)
        print(f"✅ Backend responding: {response.status_code}")
        return True
    except Exception as e:
        print(f"❌ Backend error: {str(e)}")
        return False

def test_login_page():
    """Test if login page loads"""
    try:
        response = requests.get(f"{FRONTEND_URL}/auth/login", timeout=5)
        print(f"✅ Login page responding: {response.status_code}")
        if response.status_code == 200:
            print(f"   Content length: {len(response.text)} bytes")
        return True
    except Exception as e:
        print(f"❌ Login page error: {str(e)}")
        return False

def main():
    print("=" * 60)
    print("LOGIN PAGE DIAGNOSIS")
    print("=" * 60)
    
    print("\n1. Testing Frontend...")
    frontend_ok = test_frontend()
    
    print("\n2. Testing Backend...")
    backend_ok = test_backend()
    
    print("\n3. Testing Login Page...")
    login_ok = test_login_page()
    
    print("\n" + "=" * 60)
    if frontend_ok and backend_ok and login_ok:
        print("✅ All systems responding correctly")
        print("\nPossible causes of infinite loading:")
        print("1. Supabase auth initialization taking too long")
        print("2. Browser cache issue - try hard refresh (Ctrl+Shift+R)")
        print("3. JavaScript error in browser console")
        print("4. Network request hanging")
        print("\nNext steps:")
        print("1. Open browser DevTools (F12)")
        print("2. Check Console tab for errors")
        print("3. Check Network tab for hanging requests")
        print("4. Try hard refresh: Ctrl+Shift+R")
    else:
        print("❌ Some systems not responding")
    print("=" * 60)

if __name__ == "__main__":
    main()
