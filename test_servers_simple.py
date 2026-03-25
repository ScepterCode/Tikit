#!/usr/bin/env python3
"""
Simple test to verify servers are running
"""

import urllib.request
import json

def test_backend():
    """Test backend server"""
    try:
        with urllib.request.urlopen("http://localhost:8000/health") as response:
            if response.status == 200:
                data = json.loads(response.read().decode())
                print(f"✅ Backend server: {data.get('message', 'Running')}")
                return True
            else:
                print(f"❌ Backend server returned status {response.status}")
                return False
    except Exception as e:
        print(f"❌ Backend server connection failed: {e}")
        return False

def test_frontend():
    """Test frontend server"""
    try:
        with urllib.request.urlopen("http://localhost:3000") as response:
            if response.status == 200:
                print("✅ Frontend server: Running and accessible")
                return True
            else:
                print(f"❌ Frontend server returned status {response.status}")
                return False
    except Exception as e:
        print(f"❌ Frontend server connection failed: {e}")
        return False

if __name__ == "__main__":
    print("🔄 Testing server connectivity...")
    
    backend_ok = test_backend()
    frontend_ok = test_frontend()
    
    if backend_ok and frontend_ok:
        print("\n🎉 Both servers are running successfully!")
        print("📱 Frontend: http://localhost:3000")
        print("🔧 Backend API: http://localhost:8000")
        print("📚 API Docs: http://localhost:8000/docs")
    else:
        print("\n⚠️  Some servers may not be fully ready yet")
        print("Please check the process outputs for more details")