#!/usr/bin/env python3
"""
Test Keldan UI Integration - Comprehensive Testing
Tests the integration of keldan's UI improvements with current work's functionality
"""

import os
import sys
import json
import time
import subprocess
from pathlib import Path

def test_react_icons_installation():
    """Test that react-icons is properly installed"""
    print("🔍 Testing react-icons installation...")
    
    package_json_path = Path("apps/frontend/package.json")
    if not package_json_path.exists():
        return False, "package.json not found"
    
    with open(package_json_path, 'r', encoding='utf-8') as f:
        package_data = json.load(f)
    
    dependencies = package_data.get('dependencies', {})
    if 'react-icons' not in dependencies:
        return False, "react-icons not found in dependencies"
    
    return True, f"react-icons {dependencies['react-icons']} installed"

def test_layout_components_exist():
    """Test that new layout components exist"""
    print("🔍 Testing layout components existence...")
    
    components = [
        "apps/frontend/src/components/layout/DashboardNavbar.tsx",
        "apps/frontend/src/components/layout/DashboardSidebar.tsx", 
        "apps/frontend/src/components/layout/DashboardLayout.tsx"
    ]
    
    results = []
    for component in components:
        if Path(component).exists():
            results.append(f"✅ {Path(component).name}")
        else:
            results.append(f"❌ {Path(component).name} missing")
    
    all_exist = all("✅" in result for result in results)
    return all_exist, "\n".join(results)

def test_dashboard_navbar_structure():
    """Test DashboardNavbar component structure"""
    print("🔍 Testing DashboardNavbar structure...")
    
    navbar_path = Path("apps/frontend/src/components/layout/DashboardNavbar.tsx")
    if not navbar_path.exists():
        return False, "DashboardNavbar.tsx not found"
    
    with open(navbar_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    required_elements = [
        "import { useState, useEffect, useRef } from 'react'",
        "import { useNavigate } from 'react-router-dom'",
        "import { HiUser, HiChevronDown, HiLogout",
        "interface NavUser",
        "interface DashboardNavbarProps",
        "export function DashboardNavbar",
        "const styles = {",
        "navbar:",
        "userBtn:",
        "dropdown:"
    ]
    
    results = []
    for element in required_elements:
        if element in content:
            results.append(f"✅ {element}")
        else:
            results.append(f"❌ {element} missing")
    
    all_present = all("✅" in result for result in results)
    return all_present, f"Structure check: {len([r for r in results if '✅' in r])}/{len(results)} elements found"

def test_dashboard_sidebar_structure():
    """Test DashboardSidebar component structure"""
    print("🔍 Testing DashboardSidebar structure...")
    
    sidebar_path = Path("apps/frontend/src/components/layout/DashboardSidebar.tsx")
    if not sidebar_path.exists():
        return False, "DashboardSidebar.tsx not found"
    
    with open(sidebar_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    required_elements = [
        "interface SidebarUser",
        "interface DashboardSidebarProps", 
        "export function DashboardSidebar",
        "const getMenuItems = () => {",
        "case 'attendee':",
        "case 'organizer':",
        "case 'admin':",
        "HiHome, HiTicket, HiCreditCard",
        "const styles = {",
        "sidebar:",
        "nav:",
        "navItem:"
    ]
    
    results = []
    for element in required_elements:
        if element in content:
            results.append(f"✅ {element}")
        else:
            results.append(f"❌ {element} missing")
    
    all_present = all("✅" in result for result in results)
    return all_present, f"Structure check: {len([r for r in results if '✅' in r])}/{len(results)} elements found"

def test_dashboard_layout_integration():
    """Test DashboardLayout integration"""
    print("🔍 Testing DashboardLayout integration...")
    
    layout_path = Path("apps/frontend/src/components/layout/DashboardLayout.tsx")
    if not layout_path.exists():
        return False, "DashboardLayout.tsx not found"
    
    with open(layout_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    required_elements = [
        "import { useState, ReactNode } from 'react'",
        "import { DashboardNavbar } from './DashboardNavbar'",
        "import { DashboardSidebar } from './DashboardSidebar'",
        "import { useSupabaseAuth } from '../../contexts/SupabaseAuthContext'",
        "interface DashboardLayoutProps",
        "export function DashboardLayout",
        "const { user, logout } = useSupabaseAuth()",
        "navUser =",
        "sidebarUser =",
        "<DashboardSidebar",
        "<DashboardNavbar"
    ]
    
    results = []
    for element in required_elements:
        if element in content:
            results.append(f"✅ {element}")
        else:
            results.append(f"❌ {element} missing")
    
    all_present = all("✅" in result for result in results)
    return all_present, f"Integration check: {len([r for r in results if '✅' in r])}/{len(results)} elements found"

def test_attendee_dashboard_updated():
    """Test that AttendeeDashboard uses new layout"""
    print("🔍 Testing AttendeeDashboard layout integration...")
    
    dashboard_path = Path("apps/frontend/src/pages/attendee/AttendeeDashboard.tsx")
    if not dashboard_path.exists():
        return False, "AttendeeDashboard.tsx not found"
    
    with open(dashboard_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check for new layout usage
    new_layout_elements = [
        "import { DashboardLayout } from '../../components/layout/DashboardLayout'",
        "import { useSupabaseAuth } from '../../contexts/SupabaseAuthContext'",
        "const { user, logout, loading } = useSupabaseAuth()",
        "<DashboardLayout>",
        "</DashboardLayout>"
    ]
    
    # Check that old layout elements are removed
    old_layout_elements = [
        "import { useAuth } from",
        "<header style={styles.header}>",
        "<aside style={styles.sidebar}>",
        "const { user, signOut, loading } = useAuth()"
    ]
    
    new_results = []
    for element in new_layout_elements:
        if element in content:
            new_results.append(f"✅ {element}")
        else:
            new_results.append(f"❌ {element} missing")
    
    old_results = []
    for element in old_layout_elements:
        if element not in content:
            old_results.append(f"✅ {element} removed")
        else:
            old_results.append(f"❌ {element} still present")
    
    new_present = all("✅" in result for result in new_results)
    old_removed = all("✅" in result for result in old_results)
    
    success = new_present and old_removed
    details = f"New layout: {len([r for r in new_results if '✅' in r])}/{len(new_results)}, Old removed: {len([r for r in old_results if '✅' in r])}/{len(old_results)}"
    
    return success, details

def test_organizer_dashboard_updated():
    """Test that OrganizerDashboard uses new layout"""
    print("🔍 Testing OrganizerDashboard layout integration...")
    
    dashboard_path = Path("apps/frontend/src/pages/organizer/OrganizerDashboard.tsx")
    if not dashboard_path.exists():
        return False, "OrganizerDashboard.tsx not found"
    
    with open(dashboard_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check for new layout usage
    new_layout_elements = [
        "import { DashboardLayout } from '../../components/layout/DashboardLayout'",
        "import { useSupabaseAuth } from '../../contexts/SupabaseAuthContext'",
        "const { user, logout } = useSupabaseAuth()",
        "<DashboardLayout>",
        "</DashboardLayout>"
    ]
    
    # Check that old layout elements are removed
    old_layout_elements = [
        "import { useAuth } from",
        "<header style={styles.header}>",
        "<aside style={styles.sidebar}>",
        "const { user, signOut } = useAuth()"
    ]
    
    new_results = []
    for element in new_layout_elements:
        if element in content:
            new_results.append(f"✅ {element}")
        else:
            new_results.append(f"❌ {element} missing")
    
    old_results = []
    for element in old_layout_elements:
        if element not in content:
            old_results.append(f"✅ {element} removed")
        else:
            old_results.append(f"❌ {element} still present")
    
    new_present = all("✅" in result for result in new_results)
    old_removed = all("✅" in result for result in old_results)
    
    success = new_present and old_removed
    details = f"New layout: {len([r for r in new_results if '✅' in r])}/{len(new_results)}, Old removed: {len([r for r in old_results if '✅' in r])}/{len(old_results)}"
    
    return success, details

def test_typescript_compilation():
    """Test TypeScript compilation"""
    print("🔍 Testing TypeScript compilation...")
    
    try:
        os.chdir("apps/frontend")
        result = subprocess.run(
            ["npx", "tsc", "--noEmit", "--skipLibCheck"],
            capture_output=True,
            text=True,
            timeout=60
        )
        os.chdir("../..")
        
        if result.returncode == 0:
            return True, "TypeScript compilation successful"
        else:
            return False, f"TypeScript errors: {result.stderr[:500]}"
    
    except subprocess.TimeoutExpired:
        os.chdir("../..")
        return False, "TypeScript compilation timed out"
    except Exception as e:
        os.chdir("../..")
        return False, f"TypeScript compilation failed: {str(e)}"

def test_supabase_auth_integration():
    """Test Supabase authentication integration"""
    print("🔍 Testing Supabase authentication integration...")
    
    auth_context_path = Path("apps/frontend/src/contexts/SupabaseAuthContext.tsx")
    if not auth_context_path.exists():
        return False, "SupabaseAuthContext.tsx not found"
    
    with open(auth_context_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    required_elements = [
        "export function SupabaseAuthProvider",
        "export const useSupabaseAuth",
        "const logout = async",
        "user_metadata",
        "email_confirmed_at"
    ]
    
    results = []
    for element in required_elements:
        if element in content:
            results.append(f"✅ {element}")
        else:
            results.append(f"❌ {element} missing")
    
    all_present = all("✅" in result for result in results)
    return all_present, f"Auth integration: {len([r for r in results if '✅' in r])}/{len(results)} elements found"

def run_comprehensive_test():
    """Run all tests and generate report"""
    print("🚀 KELDAN UI INTEGRATION - COMPREHENSIVE TEST")
    print("=" * 60)
    
    tests = [
        ("React Icons Installation", test_react_icons_installation),
        ("Layout Components Exist", test_layout_components_exist),
        ("DashboardNavbar Structure", test_dashboard_navbar_structure),
        ("DashboardSidebar Structure", test_dashboard_sidebar_structure),
        ("DashboardLayout Integration", test_dashboard_layout_integration),
        ("AttendeeDashboard Updated", test_attendee_dashboard_updated),
        ("OrganizerDashboard Updated", test_organizer_dashboard_updated),
        ("TypeScript Compilation", test_typescript_compilation),
        ("Supabase Auth Integration", test_supabase_auth_integration),
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
    print("📊 TEST SUMMARY")
    print("=" * 60)
    
    success_rate = (passed / total) * 100
    print(f"Tests Passed: {passed}/{total} ({success_rate:.1f}%)")
    
    if success_rate >= 90:
        grade = "🏆 EXCELLENT"
    elif success_rate >= 80:
        grade = "🥇 VERY GOOD"
    elif success_rate >= 70:
        grade = "🥈 GOOD"
    elif success_rate >= 60:
        grade = "🥉 FAIR"
    else:
        grade = "❌ NEEDS WORK"
    
    print(f"Grade: {grade}")
    
    # Detailed results
    print("\n📋 DETAILED RESULTS:")
    for result in results:
        print(f"  {result['status']} {result['test']}")
        if not result['success']:
            print(f"    Details: {result['details']}")
    
    # Integration status
    print("\n🎯 INTEGRATION STATUS:")
    
    layout_components = sum(1 for r in results if r['test'] in ['Layout Components Exist', 'DashboardNavbar Structure', 'DashboardSidebar Structure', 'DashboardLayout Integration'] and r['success'])
    dashboard_updates = sum(1 for r in results if r['test'] in ['AttendeeDashboard Updated', 'OrganizerDashboard Updated'] and r['success'])
    
    print(f"  Layout Components: {layout_components}/4 ({'✅' if layout_components == 4 else '⚠️'})")
    print(f"  Dashboard Updates: {dashboard_updates}/2 ({'✅' if dashboard_updates == 2 else '⚠️'})")
    print(f"  TypeScript Compilation: {'✅' if any(r['test'] == 'TypeScript Compilation' and r['success'] for r in results) else '❌'}")
    print(f"  Authentication Integration: {'✅' if any(r['test'] == 'Supabase Auth Integration' and r['success'] for r in results) else '❌'}")
    
    # Next steps
    print("\n🚀 NEXT STEPS:")
    if success_rate >= 90:
        print("  ✅ UI Integration is ready for testing!")
        print("  ✅ Start frontend server and test dashboard pages")
        print("  ✅ Verify navigation and user experience")
    elif success_rate >= 70:
        print("  ⚠️ Minor issues need to be resolved")
        print("  🔧 Fix failing tests before proceeding")
    else:
        print("  ❌ Major issues need to be addressed")
        print("  🔧 Review component structure and imports")
        print("  🔧 Fix TypeScript compilation errors")
    
    # Save results
    with open("KELDAN_UI_INTEGRATION_TEST_RESULTS.json", "w") as f:
        json.dump({
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "success_rate": success_rate,
            "grade": grade,
            "passed": passed,
            "total": total,
            "results": results
        }, f, indent=2)
    
    print(f"\n📄 Results saved to: KELDAN_UI_INTEGRATION_TEST_RESULTS.json")
    
    return success_rate >= 80

if __name__ == "__main__":
    success = run_comprehensive_test()
    sys.exit(0 if success else 1)