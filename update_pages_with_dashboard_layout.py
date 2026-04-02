#!/usr/bin/env python3
"""
Script to update all pages to use DashboardLayout instead of custom sidebars
"""

import os
import re

# Pages to update (relative to Tikit/apps/frontend/src/pages/)
PAGES_TO_UPDATE = [
    'organizer/OrganizerAttendees.tsx',
    'organizer/OrganizerBroadcast.tsx',
    'organizer/OrganizerScanner.tsx',
    'organizer/CreateEvent.tsx',
    'organizer/OrganizerSettings.tsx',
    'organizer/OrganizerWallet.tsx',
    'attendee/Wallet.tsx',
    'attendee/MyTickets.tsx',
    'Events.tsx',
]

BASE_PATH = 'apps/frontend/src/pages/'

def update_page(filepath):
    """Update a single page file to use DashboardLayout"""
    
    if not os.path.exists(filepath):
        print(f"⚠️  File not found: {filepath}")
        return False
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check if already using DashboardLayout
    if 'DashboardLayout' in content:
        print(f"✓ Already using DashboardLayout: {filepath}")
        return True
    
    original_content = content
    
    # 1. Add DashboardLayout import
    import_pattern = r"(import.*from\s+['\"].*SupabaseAuthContext['\"];?\n)"
    if re.search(import_pattern, content):
        content = re.sub(
            import_pattern,
            r"\1import { DashboardLayout } from '../../components/layout/DashboardLayout';\n",
            content
        )
    
    # 2. Remove header section
    header_pattern = r"\s*{/\* Top Bar \*/}\s*<header style={styles\.header}>.*?</header>\s*"
    content = re.sub(header_pattern, '', content, flags=re.DOTALL)
    
    # 3. Remove sidebar section
    sidebar_pattern = r"\s*{/\* Sidebar \*/}\s*<aside style={styles\.sidebar}>.*?</aside>\s*"
    content = re.sub(sidebar_pattern, '', content, flags=re.DOTALL)
    
    # 4. Remove layout wrapper but keep main content
    # Replace: <div style={styles.layout}> with nothing
    content = re.sub(r'<div style={styles\.layout}>\s*', '', content)
    
    # 5. Remove main wrapper but keep content
    # Replace: <main style={styles.main}> with <div style={styles.container}>
    content = re.sub(r'<main style={styles\.main}>', '<div style={styles.container}>', content)
    content = re.sub(r'</main>\s*</div>', '</div>', content)
    
    # 6. Wrap return with DashboardLayout
    # Find the return statement and wrap content
    return_pattern = r'(return\s*\(\s*)<div style={styles\.container}>'
    if re.search(return_pattern, content):
        content = re.sub(
            return_pattern,
            r'\1<DashboardLayout>\n      <div style={styles.container}>',
            content
        )
        
        # Close DashboardLayout before the last closing parenthesis
        # Find the last </div> before ); and add </DashboardLayout>
        content = re.sub(
            r'(</div>\s*)\);(\s*})',
            r'\1</DashboardLayout>\n  );\2',
            content
        )
    
    # 7. Remove NavItem function
    navitem_pattern = r'function NavItem\({[^}]*}\)\s*{[^}]*return\s*\([^)]*\);[^}]*}\s*'
    content = re.sub(navitem_pattern, '', content, flags=re.DOTALL)
    
    # 8. Update styles - remove header, layout, sidebar, nav styles
    styles_to_remove = [
        'header', 'logo', 'userMenu', 'userName', 'logoutButton',
        'layout', 'sidebar', 'nav', 'navItem', 'navItemActive', 'navIcon', 'main'
    ]
    
    for style_name in styles_to_remove:
        # Remove style definition
        pattern = rf'\s*{style_name}:\s*{{[^}}]*}},?\s*'
        content = re.sub(pattern, '', content, flags=re.DOTALL)
    
    # 9. Update container style
    content = re.sub(
        r'container:\s*{\s*minHeight:\s*[\'"]100vh[\'"],\s*backgroundColor:\s*[\'"]#f9fafb[\'"],?\s*},',
        'container: {\n    width: \'100%\',\n  },',
        content
    )
    
    # Only write if content changed
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✅ Updated: {filepath}")
        return True
    else:
        print(f"⚠️  No changes made: {filepath}")
        return False

def main():
    print("🔄 Updating pages to use DashboardLayout...\n")
    
    updated = 0
    skipped = 0
    errors = 0
    
    for page in PAGES_TO_UPDATE:
        filepath = os.path.join(BASE_PATH, page)
        try:
            if update_page(filepath):
                updated += 1
            else:
                skipped += 1
        except Exception as e:
            print(f"❌ Error updating {filepath}: {e}")
            errors += 1
    
    print(f"\n📊 Summary:")
    print(f"   ✅ Updated: {updated}")
    print(f"   ⚠️  Skipped: {skipped}")
    print(f"   ❌ Errors: {errors}")

if __name__ == '__main__':
    main()
