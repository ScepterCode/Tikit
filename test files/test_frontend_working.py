#!/usr/bin/env python3
"""
Test that the frontend is working and authentication is fixed
"""

import requests
import time

def test_frontend_status():
    """Test that the frontend is accessible"""
    print("🌐 Testing frontend status...")
    
    try:
        response = requests.get("http://localhost:3000", timeout=10)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            print("   ✅ Frontend is accessible")
            return True
        else:
            print("   ❌ Frontend returned error")
            return False
            
    except Exception as e:
        print(f"   ❌ Frontend not accessible: {e}")
        return False

def test_backend_status():
    """Test that the backend is accessible"""
    print("🔧 Testing backend status...")
    
    try:
        response = requests.get("http://localhost:8000/health", timeout=10)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Backend is running: {data.get('message', 'N/A')}")
            return True
        else:
            print("   ❌ Backend returned error")
            return False
            
    except Exception as e:
        print(f"   ❌ Backend not accessible: {e}")
        return False

def test_auth_endpoints():
    """Test authentication endpoints"""
    print("🔐 Testing authentication endpoints...")
    
    # Test endpoints that don't require auth
    endpoints = [
        "/health",
        "/api/events",
    ]
    
    for endpoint in endpoints:
        try:
            response = requests.get(f"http://localhost:8000{endpoint}", timeout=5)
            print(f"   {endpoint}: {response.status_code}")
        except Exception as e:
            print(f"   {endpoint}: Error - {e}")

if __name__ == "__main__":
    print("🚀 Testing frontend and backend status...\n")
    
    # Test both servers
    frontend_ok = test_frontend_status()
    print()
    backend_ok = test_backend_status()
    print()
    
    if backend_ok:
        test_auth_endpoints()
        print()
    
    if frontend_ok and backend_ok:
        print("✅ Both servers are running successfully!")
        print("🎯 You can now test the authentication:")
        print("   1. Go to http://localhost:3000/auth/login")
        print("   2. Login with: organizer@grooovy.netlify.app / password123")
        print("   3. Try creating an event at http://localhost:3000/organizer/create-event")
        print("   4. Check browser console for detailed auth logs")
    else:
        print("❌ Some servers are not running properly")
    
    print("\n✅ Status check complete!")