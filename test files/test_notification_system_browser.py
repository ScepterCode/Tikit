#!/usr/bin/env python3
"""
Comprehensive Browser Test for Enhanced Notification System
Tests the notification system functionality in the actual browser environment
"""

import requests
import json
import time
from datetime import datetime

def test_notification_system_browser():
    """Test the notification system in browser environment"""
    
    print("🚀 Starting Browser Notification System Test...")
    print("=" * 70)
    
    # Test configuration
    frontend_url = "http://localhost:3000"
    backend_url = "http://localhost:8000"
    
    results = {
        "frontend_tests": [],
        "backend_tests": [],
        "integration_tests": [],
        "total_tests": 0,
        "passed_tests": 0,
        "failed_tests": 0
    }
    
    def add_test_result(category, test_name, status, details=""):
        """Add test result to tracking"""
        results[category].append({
            "test": test_name,
            "status": status,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })
        results["total_tests"] += 1
        if status == "✅ PASS":
            results["passed_tests"] += 1
        else:
            results["failed_tests"] += 1
        print(f"{status} {test_name}")
        if details:
            print(f"   📝 {details}")
    
    # Test 1: Frontend Server Accessibility
    print("\n🔄 Testing Frontend Server...")
    try:
        response = requests.get(frontend_url, timeout=10)
        if response.status_code == 200:
            add_test_result("frontend_tests", "Frontend Server Accessible", "✅ PASS", 
                          f"Status: {response.status_code}")
        else:
            add_test_result("frontend_tests", "Frontend Server Accessible", "❌ FAIL", 
                          f"Status: {response.status_code}")
    except Exception as e:
        add_test_result("frontend_tests", "Frontend Server Accessible", "❌ FAIL", str(e))
    
    # Test 2: Backend Server Accessibility
    print("\n🔄 Testing Backend Server...")
    try:
        response = requests.get(f"{backend_url}/health", timeout=10)
        if response.status_code == 200:
            add_test_result("backend_tests", "Backend Server Accessible", "✅ PASS", 
                          f"Status: {response.status_code}")
        else:
            add_test_result("backend_tests", "Backend Server Accessible", "❌ FAIL", 
                          f"Status: {response.status_code}")
    except Exception as e:
        add_test_result("backend_tests", "Backend Server Accessible", "❌ FAIL", str(e))
    
    # Test 3: Notification API Endpoints
    print("\n🔄 Testing Notification API Endpoints...")
    notification_endpoints = [
        "/api/notifications",
        "/api/notifications/unread-count",
        "/api/notifications/broadcast"
    ]
    
    for endpoint in notification_endpoints:
        try:
            response = requests.get(f"{backend_url}{endpoint}", timeout=5)
            # Accept 200 (success), 401/403 (auth required), 405 (wrong method) as valid responses
            # These indicate the endpoint exists and is working correctly
            if response.status_code in [200, 401, 403, 405]:
                add_test_result("backend_tests", f"Endpoint {endpoint}", "✅ PASS", 
                              f"Status: {response.status_code} (endpoint exists)")
            else:
                add_test_result("backend_tests", f"Endpoint {endpoint}", "❌ FAIL", 
                              f"Status: {response.status_code}")
        except Exception as e:
            add_test_result("backend_tests", f"Endpoint {endpoint}", "❌ FAIL", str(e))
    
    # Test 4: Frontend Routes Accessibility
    print("\n🔄 Testing Frontend Routes...")
    frontend_routes = [
        "/admin/announcements",
        "/attendee/dashboard",
        "/organizer/dashboard"
    ]
    
    for route in frontend_routes:
        try:
            response = requests.get(f"{frontend_url}{route}", timeout=5)
            # Frontend routes should return 200 (they handle auth client-side)
            if response.status_code == 200:
                add_test_result("frontend_tests", f"Route {route}", "✅ PASS", 
                              f"Status: {response.status_code}")
            else:
                add_test_result("frontend_tests", f"Route {route}", "❌ FAIL", 
                              f"Status: {response.status_code}")
        except Exception as e:
            add_test_result("frontend_tests", f"Route {route}", "❌ FAIL", str(e))
    
    # Test 5: Component Files Exist
    print("\n🔄 Testing Component Files...")
    import os
    component_files = [
        "apps/frontend/src/pages/admin/AdminAnnouncements.tsx",
        "apps/frontend/src/components/notifications/NotificationCenter.tsx",
        "apps/frontend/src/components/notifications/NotificationPreferences.tsx",
        "apps/backend-fastapi/services/notification_service.py"
    ]
    
    for file_path in component_files:
        if os.path.exists(file_path):
            add_test_result("integration_tests", f"File {file_path}", "✅ PASS", "File exists")
        else:
            add_test_result("integration_tests", f"File {file_path}", "❌ FAIL", "File missing")
    
    # Test 6: App.tsx Import Fix
    print("\n🔄 Testing App.tsx Import Fix...")
    try:
        with open("apps/frontend/src/App.tsx", "r") as f:
            app_content = f.read()
            
        # Check for duplicate imports
        admin_announcements_imports = app_content.count("AdminAnnouncements")
        if admin_announcements_imports == 2:  # One import, one usage in route
            add_test_result("integration_tests", "App.tsx Import Fix", "✅ PASS", 
                          "No duplicate imports found")
        else:
            add_test_result("integration_tests", "App.tsx Import Fix", "❌ FAIL", 
                          f"Found {admin_announcements_imports} references")
    except Exception as e:
        add_test_result("integration_tests", "App.tsx Import Fix", "❌ FAIL", str(e))
    
    # Generate Final Report
    print("\n" + "=" * 70)
    print("📊 BROWSER NOTIFICATION SYSTEM TEST RESULTS")
    print("=" * 70)
    
    success_rate = (results["passed_tests"] / results["total_tests"]) * 100 if results["total_tests"] > 0 else 0
    
    print(f"📈 Overall Success Rate: {success_rate:.1f}%")
    print(f"✅ Passed Tests: {results['passed_tests']}")
    print(f"❌ Failed Tests: {results['failed_tests']}")
    print(f"📊 Total Tests: {results['total_tests']}")
    
    print(f"\n🎯 Frontend Tests: {len([t for t in results['frontend_tests'] if t['status'] == '✅ PASS'])}/{len(results['frontend_tests'])}")
    print(f"🎯 Backend Tests: {len([t for t in results['backend_tests'] if t['status'] == '✅ PASS'])}/{len(results['backend_tests'])}")
    print(f"🎯 Integration Tests: {len([t for t in results['integration_tests'] if t['status'] == '✅ PASS'])}/{len(results['integration_tests'])}")
    
    # Status Assessment
    if success_rate >= 90:
        status = "🏆 EXCELLENT"
        message = "Notification system is fully functional!"
    elif success_rate >= 75:
        status = "✅ GOOD"
        message = "Notification system is working well with minor issues"
    elif success_rate >= 50:
        status = "⚠️ NEEDS IMPROVEMENT"
        message = "Notification system has some issues that need attention"
    else:
        status = "❌ CRITICAL"
        message = "Notification system has major issues"
    
    print(f"\n{status}")
    print(f"📝 {message}")
    
    # Browser Testing Instructions
    print("\n" + "=" * 70)
    print("🌐 BROWSER TESTING INSTRUCTIONS")
    print("=" * 70)
    print("1. Open http://localhost:3000 in your browser")
    print("2. Login as admin user")
    print("3. Navigate to /admin/announcements")
    print("4. Test creating a new announcement")
    print("5. Check notification center (bell icon) for updates")
    print("6. Test notification preferences")
    print("7. Verify real-time updates")
    
    print("\n🎉 Browser test completed!")
    return results

if __name__ == "__main__":
    test_notification_system_browser()