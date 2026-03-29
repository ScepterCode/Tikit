#!/usr/bin/env python3
"""
Comprehensive Notification System Analysis
Tests the current notification system implementation and identifies gaps
"""

import os
import json

def analyze_notification_system():
    """Analyze the current notification system implementation"""
    print("🔄 Analyzing Notification System Implementation...")
    
    analysis_results = {
        "backend_components": {},
        "frontend_components": {},
        "ui_integration": {},
        "admin_features": {},
        "user_features": {},
        "gaps_identified": []
    }
    
    # Check backend components
    backend_files = [
        ("Notification Service", "apps/backend-fastapi/services/notification_service.py"),
        ("Notification Router", "apps/backend-fastapi/routers/notifications.py"),
        ("Admin Dashboard Service", "apps/backend-fastapi/services/admin_dashboard_service.py"),
        ("Admin Dashboard Router", "apps/backend-fastapi/routers/admin_dashboard.py")
    ]
    
    for name, path in backend_files:
        if os.path.exists(path):
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
                analysis_results["backend_components"][name] = {
                    "exists": True,
                    "size": len(content),
                    "has_broadcast": "broadcast" in content.lower(),
                    "has_admin_features": "admin" in content.lower(),
                    "has_user_notifications": "user" in content.lower()
                }
                print(f"✅ {name}: Found ({len(content)} chars)")
        else:
            analysis_results["backend_components"][name] = {"exists": False}
            print(f"❌ {name}: Not found")
    
    # Check frontend components
    frontend_files = [
        ("Notification Center", "apps/frontend/src/components/notifications/NotificationCenter.tsx"),
        ("Notification Hook", "apps/frontend/src/hooks/useNotifications.ts"),
        ("Admin Dashboard", "apps/frontend/src/pages/admin/AdminDashboard.tsx"),
        ("Organizer Broadcast", "apps/frontend/src/pages/organizer/OrganizerBroadcast.tsx")
    ]
    
    for name, path in frontend_files:
        if os.path.exists(path):
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
                analysis_results["frontend_components"][name] = {
                    "exists": True,
                    "size": len(content),
                    "has_real_time": "useEffect" in content and "interval" in content.lower(),
                    "has_admin_features": "admin" in content.lower(),
                    "has_broadcast": "broadcast" in content.lower()
                }
                print(f"✅ {name}: Found ({len(content)} chars)")
        else:
            analysis_results["frontend_components"][name] = {"exists": False}
            print(f"❌ {name}: Not found")
    
    # Check UI integration
    ui_integration_files = [
        ("Attendee Dashboard", "apps/frontend/src/pages/attendee/AttendeeDashboard.tsx"),
        ("Organizer Dashboard", "apps/frontend/src/pages/organizer/OrganizerDashboard.tsx"),
        ("Admin Dashboard", "apps/frontend/src/pages/admin/AdminDashboard.tsx")
    ]
    
    for name, path in ui_integration_files:
        if os.path.exists(path):
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
                has_notification_center = "NotificationCenter" in content
                analysis_results["ui_integration"][name] = {
                    "exists": True,
                    "has_notification_center": has_notification_center
                }
                print(f"✅ {name}: {'Has' if has_notification_center else 'Missing'} NotificationCenter")
        else:
            analysis_results["ui_integration"][name] = {"exists": False}
            print(f"❌ {name}: Not found")
    
    # Check for missing admin announcement page
    admin_announcement_path = "apps/frontend/src/pages/admin/AdminAnnouncements.tsx"
    if not os.path.exists(admin_announcement_path):
        analysis_results["gaps_identified"].append("Missing Admin Announcements Page")
        print("❌ Admin Announcements Page: Not found")
    
    # Check for comprehensive notification types
    notification_center_path = "apps/frontend/src/components/notifications/NotificationCenter.tsx"
    if os.path.exists(notification_center_path):
        with open(notification_center_path, 'r', encoding='utf-8') as f:
            content = f.read()
            notification_types = []
            if "broadcast" in content: notification_types.append("broadcast")
            if "ticket_sale" in content: notification_types.append("ticket_sale")
            if "event_update" in content: notification_types.append("event_update")
            if "event_cancelled" in content: notification_types.append("event_cancelled")
            if "payment" in content: notification_types.append("payment")
            if "security" in content: notification_types.append("security")
            
            analysis_results["user_features"]["notification_types"] = notification_types
            print(f"📋 Notification Types: {', '.join(notification_types)}")
    
    return analysis_results

def identify_gaps(analysis_results):
    """Identify gaps in the notification system"""
    print("\n🔍 Identifying Gaps in Notification System...")
    
    gaps = []
    
    # Check for missing admin features
    if not analysis_results["backend_components"].get("Admin Dashboard Service", {}).get("exists", False):
        gaps.append("Missing Admin Dashboard Service")
    
    if not analysis_results["backend_components"].get("Admin Dashboard Router", {}).get("exists", False):
        gaps.append("Missing Admin Dashboard Router")
    
    # Check for missing admin announcement page
    admin_announcement_exists = os.path.exists("apps/frontend/src/pages/admin/AdminAnnouncements.tsx")
    if not admin_announcement_exists:
        gaps.append("Missing Admin Announcements/Broadcast Page")
    
    # Check for real-time notifications
    notification_hook = analysis_results["frontend_components"].get("Notification Hook", {})
    if not notification_hook.get("has_real_time", False):
        gaps.append("Limited Real-time Notification Updates")
    
    # Check for comprehensive notification types
    notification_types = analysis_results["user_features"].get("notification_types", [])
    expected_types = ["broadcast", "ticket_sale", "event_update", "payment", "security", "system"]
    missing_types = [t for t in expected_types if t not in notification_types]
    if missing_types:
        gaps.append(f"Missing Notification Types: {', '.join(missing_types)}")
    
    # Check for push notifications
    if not any("push" in str(comp).lower() for comp in analysis_results["frontend_components"].values()):
        gaps.append("No Push Notification Support")
    
    # Check for notification preferences
    if not os.path.exists("apps/frontend/src/components/notifications/NotificationPreferences.tsx"):
        gaps.append("Missing Notification Preferences/Settings")
    
    # Check for notification templates
    if not os.path.exists("apps/backend-fastapi/services/notification_templates.py"):
        gaps.append("Missing Notification Templates System")
    
    return gaps

def generate_recommendations(gaps):
    """Generate recommendations based on identified gaps"""
    print("\n💡 Generating Recommendations...")
    
    recommendations = []
    
    if "Missing Admin Announcements/Broadcast Page" in gaps:
        recommendations.append({
            "priority": "HIGH",
            "title": "Create Admin Announcements Page",
            "description": "Build comprehensive admin page for sending system-wide announcements",
            "components": ["AdminAnnouncements.tsx", "AnnouncementComposer.tsx"]
        })
    
    if "Missing Admin Dashboard Service" in gaps or "Missing Admin Dashboard Router" in gaps:
        recommendations.append({
            "priority": "HIGH", 
            "title": "Complete Admin Backend Services",
            "description": "Implement missing admin dashboard services and routers",
            "components": ["admin_dashboard_service.py", "admin_dashboard.py"]
        })
    
    if any("Missing Notification Types" in gap for gap in gaps):
        recommendations.append({
            "priority": "MEDIUM",
            "title": "Expand Notification Types",
            "description": "Add support for payment, security, and system notifications",
            "components": ["notification_service.py", "NotificationCenter.tsx"]
        })
    
    if "Missing Notification Preferences/Settings" in gaps:
        recommendations.append({
            "priority": "MEDIUM",
            "title": "Add Notification Preferences",
            "description": "Allow users to customize notification settings",
            "components": ["NotificationPreferences.tsx", "notification_preferences_service.py"]
        })
    
    if "No Push Notification Support" in gaps:
        recommendations.append({
            "priority": "LOW",
            "title": "Implement Push Notifications",
            "description": "Add browser push notification support for real-time alerts",
            "components": ["push_notification_service.py", "usePushNotifications.ts"]
        })
    
    if "Missing Notification Templates System" in gaps:
        recommendations.append({
            "priority": "MEDIUM",
            "title": "Create Notification Templates",
            "description": "Build template system for consistent notification formatting",
            "components": ["notification_templates.py", "template_service.py"]
        })
    
    return recommendations

def main():
    """Main analysis execution"""
    print("🚀 Starting Comprehensive Notification System Analysis...")
    print("=" * 70)
    
    # Analyze current system
    analysis_results = analyze_notification_system()
    
    # Identify gaps
    gaps = identify_gaps(analysis_results)
    
    # Generate recommendations
    recommendations = generate_recommendations(gaps)
    
    # Print summary
    print("\n" + "=" * 70)
    print("📊 NOTIFICATION SYSTEM ANALYSIS RESULTS")
    print("=" * 70)
    
    # Backend status
    backend_count = sum(1 for comp in analysis_results["backend_components"].values() if comp.get("exists", False))
    backend_total = len(analysis_results["backend_components"])
    print(f"\n🔧 Backend Components: {backend_count}/{backend_total}")
    
    # Frontend status
    frontend_count = sum(1 for comp in analysis_results["frontend_components"].values() if comp.get("exists", False))
    frontend_total = len(analysis_results["frontend_components"])
    print(f"🎨 Frontend Components: {frontend_count}/{frontend_total}")
    
    # UI integration status
    ui_count = sum(1 for comp in analysis_results["ui_integration"].values() if comp.get("has_notification_center", False))
    ui_total = len(analysis_results["ui_integration"])
    print(f"🖥️  UI Integration: {ui_count}/{ui_total}")
    
    # Overall status
    total_components = backend_total + frontend_total + ui_total
    total_working = backend_count + frontend_count + ui_count
    overall_percentage = (total_working / total_components * 100) if total_components > 0 else 0
    
    print(f"\n📈 Overall Implementation: {total_working}/{total_components} ({overall_percentage:.1f}%)")
    
    # Gaps identified
    print(f"\n🔍 Gaps Identified: {len(gaps)}")
    for i, gap in enumerate(gaps, 1):
        print(f"   {i}. {gap}")
    
    # Recommendations
    print(f"\n💡 Recommendations: {len(recommendations)}")
    for i, rec in enumerate(recommendations, 1):
        print(f"   {i}. [{rec['priority']}] {rec['title']}")
        print(f"      {rec['description']}")
    
    # Final assessment
    print(f"\n🎯 SYSTEM STATUS:")
    if overall_percentage >= 90:
        print("   🎉 EXCELLENT - Comprehensive notification system in place")
        print("   🚀 Ready for production with minor enhancements")
    elif overall_percentage >= 70:
        print("   ✅ GOOD - Solid foundation with some gaps to fill")
        print("   🔧 Implement missing admin features for completeness")
    elif overall_percentage >= 50:
        print("   ⚠️  PARTIAL - Basic system working, significant gaps remain")
        print("   🛠️  Focus on admin features and notification types")
    else:
        print("   ❌ INCOMPLETE - Major implementation required")
        print("   🔨 Significant development needed")
    
    print("\n" + "=" * 70)
    
    return {
        "analysis": analysis_results,
        "gaps": gaps,
        "recommendations": recommendations,
        "overall_percentage": overall_percentage
    }

if __name__ == "__main__":
    main()