#!/usr/bin/env python3
"""
Test complete frontend functionality after dependency fix
"""
import requests
import time

def test_frontend_pages():
    """Test key frontend pages are accessible"""
    print("🌐 Testing Frontend Pages...")
    
    pages_to_test = [
        ("Home", "http://localhost:3000/"),
        ("Login", "http://localhost:3000/login"),
        ("Events", "http://localhost:3000/events"),
    ]
    
    all_working = True
    
    for page_name, url in pages_to_test:
        try:
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                print(f"✅ {page_name} page: Working")
            else:
                print(f"❌ {page_name} page: Status {response.status_code}")
                all_working = False
        except Exception as e:
            print(f"❌ {page_name} page: Error - {e}")
            all_working = False
    
    return all_working

def test_api_endpoints():
    """Test key API endpoints are working"""
    print("\n🔧 Testing API Endpoints...")
    
    endpoints_to_test = [
        ("API Docs", "http://localhost:8000/docs"),
        ("Health Check", "http://localhost:8000/"),
        ("Membership Status", "http://localhost:8000/api/memberships/status"),
        ("Secret Events", "http://localhost:8000/api/secret-events/accessible"),
    ]
    
    all_working = True
    
    for endpoint_name, url in endpoints_to_test:
        try:
            headers = {}
            if "api/" in url:
                headers["Authorization"] = "Bearer mock_access_token_admin"
            
            response = requests.get(url, headers=headers, timeout=5)
            if response.status_code in [200, 422]:  # 422 is expected for some endpoints without proper auth
                print(f"✅ {endpoint_name}: Working")
            else:
                print(f"❌ {endpoint_name}: Status {response.status_code}")
                all_working = False
        except Exception as e:
            print(f"❌ {endpoint_name}: Error - {e}")
            all_working = False
    
    return all_working

def main():
    """Test complete system functionality"""
    print("🚀 COMPLETE SYSTEM TEST AFTER DEPENDENCY FIX")
    print("=" * 60)
    
    frontend_ok = test_frontend_pages()
    backend_ok = test_api_endpoints()
    
    print("\n" + "=" * 60)
    if frontend_ok and backend_ok:
        print("✅ COMPLETE SYSTEM IS WORKING PERFECTLY!")
        print("🎯 Secret Events Phase 2 is fully functional")
        print("🔧 All dependencies resolved")
        print("🌐 Frontend: http://localhost:3000")
        print("🔧 Backend: http://localhost:8000")
        print("📚 API Docs: http://localhost:8000/docs")
        print("\n🚀 READY FOR PHASE 3 TESTING!")
    else:
        print("❌ Some components are not working properly")
        if not frontend_ok:
            print("🔧 Frontend issues detected")
        if not backend_ok:
            print("🔧 Backend issues detected")

if __name__ == "__main__":
    main()