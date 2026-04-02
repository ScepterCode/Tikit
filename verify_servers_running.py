#!/usr/bin/env python3
"""
Quick verification that servers are running and responding
"""
import requests
import time

def test_backend():
    """Test backend is responding"""
    try:
        response = requests.get('http://localhost:8000/health', timeout=5)
        if response.status_code == 200:
            print("✅ Backend is running on http://localhost:8000")
            return True
        else:
            print(f"⚠️  Backend responded with status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Backend not responding: {e}")
        return False

def test_frontend():
    """Test frontend is responding"""
    try:
        response = requests.get('http://localhost:3000', timeout=5)
        if response.status_code == 200:
            print("✅ Frontend is running on http://localhost:3000")
            return True
        else:
            print(f"⚠️  Frontend responded with status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Frontend not responding: {e}")
        return False

def test_api_docs():
    """Test API documentation is accessible"""
    try:
        response = requests.get('http://localhost:8000/docs', timeout=5)
        if response.status_code == 200:
            print("✅ API Documentation accessible at http://localhost:8000/docs")
            return True
        else:
            print(f"⚠️  API docs responded with status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ API docs not accessible: {e}")
        return False

def main():
    print("="*70)
    print("🔍 VERIFYING SERVERS ARE RUNNING")
    print("="*70)
    print()
    
    # Give servers a moment to fully start
    print("⏳ Waiting for servers to fully initialize...")
    time.sleep(2)
    print()
    
    backend_ok = test_backend()
    frontend_ok = test_frontend()
    docs_ok = test_api_docs()
    
    print()
    print("="*70)
    print("📊 VERIFICATION RESULTS")
    print("="*70)
    
    if backend_ok and frontend_ok:
        print("\n✅ ALL SERVERS RUNNING SUCCESSFULLY!")
        print("\n🌐 Access Points:")
        print("   Frontend: http://localhost:3000")
        print("   Backend:  http://localhost:8000")
        print("   API Docs: http://localhost:8000/docs")
        print("\n🎉 You can now test the application!")
        return True
    else:
        print("\n⚠️  SOME SERVERS NOT RESPONDING")
        if not backend_ok:
            print("   - Backend needs attention")
        if not frontend_ok:
            print("   - Frontend needs attention")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
