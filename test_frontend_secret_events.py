#!/usr/bin/env python3
"""
Test frontend secret events integration
"""
import requests
import json

def test_frontend_running():
    """Test if frontend is accessible"""
    print("🌐 Testing frontend accessibility...")
    
    try:
        response = requests.get("http://localhost:3000", timeout=5)
        if response.status_code == 200:
            print("✅ Frontend is running and accessible")
            return True
        else:
            print(f"❌ Frontend returned status: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Frontend not accessible: {e}")
        return False

def test_backend_running():
    """Test if backend is accessible"""
    print("🔧 Testing backend accessibility...")
    
    try:
        response = requests.get("http://localhost:8000/docs", timeout=5)
        if response.status_code == 200:
            print("✅ Backend is running and accessible")
            return True
        else:
            print(f"❌ Backend returned status: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Backend not accessible: {e}")
        return False

def main():
    """Test both servers"""
    print("🚀 TESTING BOTH SERVERS AFTER RESTART")
    print("=" * 50)
    
    backend_ok = test_backend_running()
    frontend_ok = test_frontend_running()
    
    print("\n" + "=" * 50)
    if backend_ok and frontend_ok:
        print("✅ BOTH SERVERS RUNNING SUCCESSFULLY!")
        print("🎯 Secret Events Phase 2 is ready for testing")
        print("🌐 Frontend: http://localhost:3000")
        print("🔧 Backend: http://localhost:8000")
        print("📚 API Docs: http://localhost:8000/docs")
    else:
        print("❌ Some servers are not running properly")

if __name__ == "__main__":
    main()