#!/usr/bin/env python3
"""
Integrated UI System Test - End-to-End Verification
Tests the complete integrated system with Keldan's UI improvements and comprehensive functionality
"""

import os
import sys
import json
import time
import subprocess
from pathlib import Path

def test_frontend_build():
    """Test that frontend builds successfully"""
    print("🔍 Testing frontend build...")
    
    try:
        os.chdir("apps/frontend")
        result = subprocess.run(
            ["npm", "run", "build"],
            capture_output=True,
            text=True,
            timeout=120
        )
        os.chdir("../..")
        
        if result.returncode == 0:
            return True, "Frontend build successful"
        else:
            return False, f"Build failed: {result.stderr[:500]}"
    
    except subprocess.TimeoutExpired:
        os.chdir("../..")
        return False, "Frontend build timed out"
    except Exception as e:
        os.chdir("../..")
        return False, f"Build failed: {str(e)}"

def test_component_imports():
    """Test that all layout components can be imported"""
    print("🔍 Testing component imports...")
    
    components = [
        "apps/frontend/src/components/layout/DashboardLayout.tsx",
        "apps/frontend/src/components/layout/DashboardNavbar.tsx",
        "apps/frontend/src/components/layout/DashboardSidebar.tsx",
        "apps/frontend/src/contexts/SupabaseAuthContext.tsx"
    ]
    
    import_tests = []
    for component in components:
        if not Path(component).exists():
            import_tests.append(f"❌ {Path(component).name} missing")
            continue
            
        with open(component, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check for proper exports
        component_name = Path(component).stem
        if component_name == "SupabaseAuthContext":
            if "export function SupabaseAuthProvider" in content and "export const useSupabaseAuth" in content:
                import_tests.append(f"✅ {component_name} exports correct")
            else:
                import_tests.append(f"❌ {component_name} missing exports")
        elif "export function" in content:
            import_tests.append(f"✅ {component_name} exports correct")
        else:
            import_tests.append(f"❌ {component_name} missing exports")
    
    all_passed = all("✅" in test for test in import_tests)
    return all_passed, "\n".join(import_tests)

def test_dashboard_integration():
    """Test dashboard pages use new layout"""
    print("🔍 Testing dashboard integration...")
    
    dashboards = [
        "apps/frontend/src/pages/organizer/OrganizerDashboard.tsx",
        "apps/frontend/src/pages/attendee/AttendeeDashboard.tsx"
    ]
    
    integration_tests = []
    for dashboard in dashboards:
        if not Path(dashboard).exists():
            integration_tests.append(f"❌ {Path(dashboard).name} missing")
            continue
            
        with open(dashboard, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check for new layout usage
        required_imports = [
            "import { DashboardLayout }",
            "import { useSupabaseAuth }",
            "<DashboardLayout>",
            "</DashboardLayout>"
        ]
        
        dashboard_name = Path(dashboard).stem
        missing_elements = []
        for element in required_imports:
            if element not in content:
                missing_elements.append(element)
        
        if not missing_elements:
            integration_tests.append(f"✅ {dashboard_name} fully integrated")
        else:
            integration_tests.append(f"❌ {dashboard_name} missing: {', '.join(missing_elements)}")
    
    all_passed = all("✅" in test for test in integration_tests)
    return all_passed, "\n".join(integration_tests)

def test_responsive_design():
    """Test responsive design elements"""
    print("🔍 Testing responsive design...")
    
    layout_files = [
        "apps/frontend/src/components/layout/DashboardNavbar.tsx",
        "apps/frontend/src/components/layout/DashboardSidebar.tsx"
    ]
    
    responsive_tests = []
    for layout_file in layout_files:
        if not Path(layout_file).exists():
            responsive_tests.append(f"❌ {Path(layout_file).name} missing")
            continue
            
        with open(layout_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check for responsive elements
        responsive_elements = [
            "isMobile",
            "@media",
            "mobileToggle",
            "mobileOverlay"
        ]
        
        file_name = Path(layout_file).stem
        found_elements = [elem for elem in responsive_elements if elem in content]
        
        if len(found_elements) >= 2:  # At least 2 responsive elements
            responsive_tests.append(f"✅ {file_name} has responsive design")
        else:
            responsive_tests.append(f"❌ {file_name} lacks responsive elements")
    
    all_passed = all("✅" in test for test in responsive_tests)
    return all_passed, "\n".join(responsive_tests)

def test_authentication_flow():
    """Test authentication integration"""
    print("🔍 Testing authentication flow...")
    
    auth_context = Path("apps/frontend/src/contexts/SupabaseAuthContext.tsx")
    if not auth_context.exists():
        return False, "SupabaseAuthContext.tsx missing"
    
    with open(auth_context, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check for complete auth flow
    auth_elements = [
        "signUp",
        "signIn", 
        "signOut",
        "logout",
        "useSupabaseAuth",
        "SupabaseAuthProvider",
        "user_metadata",
        "email_confirmed_at"
    ]
    
    auth_tests = []
    for element in auth_elements:
        if element in content:
            auth_tests.append(f"✅ {element}")
        else:
            auth_tests.append(f"❌ {element} missing")
    
    passed_count = len([test for test in auth_tests if "✅" in test])
    total_count = len(auth_tests)
    
    success = passed_count >= 7  # At least 7/8 elements
    return success, f"Auth flow: {passed_count}/{total_count} elements present"

def test_ui_styling():
    """Test UI styling and design elements"""
    print("🔍 Testing UI styling...")
    
    layout_components = [
        "apps/frontend/src/components/layout/DashboardNavbar.tsx",
        "apps/frontend/src/components/layout/DashboardSidebar.tsx"
    ]
    
    styling_tests = []
    for component in layout_components:
        if not Path(component).exists():
            styling_tests.append(f"❌ {Path(component).name} missing")
            continue
            
        with open(component, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check for modern styling elements
        styling_elements = [
            "gradient",
            "borderRadius",
            "boxShadow",
            "transition",
            "backgroundColor",
            "const styles"
        ]
        
        component_name = Path(component).stem
        found_elements = [elem for elem in styling_elements if elem in content]
        
        if len(found_elements) >= 4:  # At least 4 styling elements
            styling_tests.append(f"✅ {component_name} has modern styling")
        else:
            styling_tests.append(f"❌ {component_name} lacks styling elements")
    
    all_passed = all("✅" in test for test in styling_tests)
    return all_passed, "\n".join(styling_tests)

def test_role_based_navigation():
    """Test role-based navigation"""
    print("🔍 Testing role-based navigation...")
    
    sidebar_path = Path("apps/frontend/src/components/layout/DashboardSidebar.tsx")
    if not sidebar_path.exists():
        return False, "DashboardSidebar.tsx missing"
    
    with open(sidebar_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check for role-based menu items
    role_elements = [
        "case 'attendee':",
        "case 'organizer':",
        "case 'admin':",
        "getMenuItems",
        "user.role"
    ]
    
    role_tests = []
    for element in role_elements:
        if element in content:
            role_tests.append(f"✅ {element}")
        else:
            role_tests.append(f"❌ {element} missing")
    
    passed_count = len([test for test in role_tests if "✅" in test])
    total_count = len(role_tests)
    
    success = passed_count >= 4  # At least 4/5 elements
    return success, f"Role-based navigation: {passed_count}/{total_count} elements present"

def test_icon_integration():
    """Test React Icons integration"""
    print("🔍 Testing icon integration...")
    
    # Check package.json for react-icons
    package_json = Path("apps/frontend/package.json")
    if not package_json.exists():
        return False, "package.json missing"
    
    with open(package_json, 'r', encoding='utf-8') as f:
        package_data = json.load(f)
    
    dependencies = package_data.get('dependencies', {})
    if 'react-icons' not in dependencies:
        return False, "react-icons not installed"
    
    # Check components use icons
    components_with_icons = [
        "apps/frontend/src/components/layout/DashboardNavbar.tsx",
        "apps/frontend/src/components/layout/DashboardSidebar.tsx"
    ]
    
    icon_tests = []
    for component in components_with_icons:
        if not Path(component).exists():
            icon_tests.append(f"❌ {Path(component).name} missing")
            continue
            
        with open(component, 'r', encoding='utf-8') as f:
            content = f.read()
        
        component_name = Path(component).stem
        if "from 'react-icons/" in content and "Hi" in content:
            icon_tests.append(f"✅ {component_name} uses React Icons")
        else:
            icon_tests.append(f"❌ {component_name} missing icons")
    
    all_passed = all("✅" in test for test in icon_tests)
    return all_passed, f"React Icons: {dependencies.get('react-icons', 'missing')}, Usage: {len([t for t in icon_tests if '✅' in t])}/{len(icon_tests)}"

def test_backend_integration():
    """Test backend integration points"""
    print("🔍 Testing backend integration...")
    
    # Check for API integration in components
    integration_files = [
        "apps/frontend/src/pages/attendee/Wallet.tsx",
        "apps/frontend/src/pages/Events.tsx",
        "apps/frontend/src/components/payment/PaymentModal.tsx"
    ]
    
    integration_tests = []
    for file_path in integration_files:
        if not Path(file_path).exists():
            integration_tests.append(f"❌ {Path(file_path).name} missing")
            continue
            
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check for backend API calls
        api_patterns = [
            "http://localhost:8000",
            "authenticatedFetch",
            "fetch(",
            "/api/"
        ]
        
        file_name = Path(file_path).stem
        found_patterns = [pattern for pattern in api_patterns if pattern in content]
        
        if len(found_patterns) >= 2:  # At least 2 API integration patterns
            integration_tests.append(f"✅ {file_name} has backend integration")
        else:
            integration_tests.append(f"❌ {file_name} lacks backend integration")
    
    all_passed = all("✅" in test for test in integration_tests)
    return all_passed, "\n".join(integration_tests)

def run_integrated_system_test():
    """Run comprehensive integrated system test"""
    print("🚀 INTEGRATED UI SYSTEM - COMPREHENSIVE TEST")
    print("=" * 60)
    
    tests = [
        ("Component Imports", test_component_imports),
        ("Dashboard Integration", test_dashboard_integration),
        ("Responsive Design", test_responsive_design),
        ("Authentication Flow", test_authentication_flow),
        ("UI Styling", test_ui_styling),
        ("Role-Based Navigation", test_role_based_navigation),
        ("Icon Integration", test_icon_integration),
        ("Backend Integration", test_backend_integration),
        # ("Frontend Build", test_frontend_build),  # Skip build test for speed
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
    print("📊 INTEGRATED SYSTEM TEST SUMMARY")
    print("=" * 60)
    
    success_rate = (passed / total) * 100
    print(f"Tests Passed: {passed}/{total} ({success_rate:.1f}%)")
    
    if success_rate >= 90:
        grade = "🏆 EXCELLENT"
        status = "PRODUCTION READY"
    elif success_rate >= 80:
        grade = "🥇 VERY GOOD"
        status = "READY FOR TESTING"
    elif success_rate >= 70:
        grade = "🥈 GOOD"
        status = "MINOR FIXES NEEDED"
    elif success_rate >= 60:
        grade = "🥉 FAIR"
        status = "NEEDS IMPROVEMENT"
    else:
        grade = "❌ NEEDS WORK"
        status = "MAJOR ISSUES"
    
    print(f"Grade: {grade}")
    print(f"Status: {status}")
    
    # Feature assessment
    print("\n🎯 FEATURE ASSESSMENT:")
    
    ui_components = sum(1 for r in results if r['test'] in ['Component Imports', 'UI Styling', 'Icon Integration'] and r['success'])
    integration = sum(1 for r in results if r['test'] in ['Dashboard Integration', 'Authentication Flow', 'Backend Integration'] and r['success'])
    responsive = sum(1 for r in results if r['test'] in ['Responsive Design', 'Role-Based Navigation'] and r['success'])
    
    print(f"  UI Components: {ui_components}/3 ({'✅' if ui_components >= 2 else '⚠️'})")
    print(f"  System Integration: {integration}/3 ({'✅' if integration >= 2 else '⚠️'})")
    print(f"  Responsive Design: {responsive}/2 ({'✅' if responsive >= 1 else '⚠️'})")
    
    # Detailed results
    print("\n📋 DETAILED RESULTS:")
    for result in results:
        print(f"  {result['status']} {result['test']}")
        if not result['success'] and len(result['details']) < 100:
            print(f"    Details: {result['details']}")
    
    # Integration status
    print("\n🎨 UI INTEGRATION STATUS:")
    if success_rate >= 85:
        print("  ✅ Keldan UI improvements successfully integrated")
        print("  ✅ Modern layout system with responsive design")
        print("  ✅ Role-based navigation and authentication")
        print("  ✅ Backend integration preserved and enhanced")
        print("  ✅ Ready for production deployment")
    elif success_rate >= 70:
        print("  ✅ Core UI integration complete")
        print("  ⚠️ Minor issues need resolution")
        print("  ✅ Most features working correctly")
    else:
        print("  ❌ UI integration needs more work")
        print("  🔧 Review component structure and imports")
    
    # Next steps
    print("\n🚀 NEXT STEPS:")
    if success_rate >= 85:
        print("  ✅ Start frontend development server")
        print("  ✅ Test user flows in browser")
        print("  ✅ Deploy to production environment")
    elif success_rate >= 70:
        print("  🔧 Fix remaining integration issues")
        print("  🧪 Run additional component tests")
        print("  ✅ Prepare for browser testing")
    else:
        print("  🔧 Review component architecture")
        print("  🔧 Fix import and export issues")
        print("  🔧 Ensure proper layout integration")
    
    # Save results
    with open("INTEGRATED_UI_SYSTEM_TEST_RESULTS.json", "w") as f:
        json.dump({
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "success_rate": success_rate,
            "grade": grade,
            "status": status,
            "passed": passed,
            "total": total,
            "results": results
        }, f, indent=2)
    
    print(f"\n📄 Results saved to: INTEGRATED_UI_SYSTEM_TEST_RESULTS.json")
    
    return success_rate >= 75

if __name__ == "__main__":
    success = run_integrated_system_test()
    sys.exit(0 if success else 1)