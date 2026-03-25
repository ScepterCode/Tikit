#!/usr/bin/env python3
"""
Security Fix Script - Remove Hardcoded Credentials
Replaces all hardcoded Supabase credentials with environment variable imports
"""

import os
import re
from pathlib import Path

# Files that need credential fixes
FILES_TO_FIX = [
    "confirm_supabase_emails.py",
    "debug_jwt_issue.py", 
    "debug_token.py",
    "setup_supabase_admin.py",
    "setup_supabase_users.py",
    "test_auth_complete.py",
    "test_fixes.py",
    "test_frontend_auth_flow.py",
    "test_frontend_login.py",
    "test_jwt_validation.py",
    "test_supabase_auth.py"
]

# Hardcoded credentials to replace
HARDCODED_URL = "https://hwwzbsppzwcyvambeade.supabase.co"
HARDCODED_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3d3pic3BwendjeXZhbWJlYWRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3NjgyOTYsImV4cCI6MjA4MjM0NDI5Nn0.Cwsvgq1qJ7fAfxT2opSfmnJkShy8F6lcRa4xXLdAbnc"

def fix_file_credentials(file_path: Path) -> bool:
    """Fix hardcoded credentials in a single file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Add import for config at the top (after existing imports)
        if 'from config import config' not in content and 'import os' in content:
            content = content.replace(
                'import os',
                'import os\nfrom config import config'
            )
        elif 'from config import config' not in content:
            # Add import at the beginning
            lines = content.split('\n')
            import_line_added = False
            for i, line in enumerate(lines):
                if line.startswith('import ') or line.startswith('from '):
                    if not import_line_added:
                        lines.insert(i, 'from config import config')
                        import_line_added = True
                        break
            if not import_line_added:
                lines.insert(0, 'from config import config')
            content = '\n'.join(lines)
        
        # Replace hardcoded URL
        content = re.sub(
            r'SUPABASE_URL\s*=\s*["\']https://hwwzbsppzwcyvambeade\.supabase\.co["\']',
            'SUPABASE_URL = config.SUPABASE_URL',
            content
        )
        
        # Replace hardcoded key patterns
        content = re.sub(
            r'SUPABASE_(?:ANON_)?KEY\s*=\s*["\']eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9[^"\']*["\']',
            'SUPABASE_ANON_KEY = config.SUPABASE_ANON_KEY',
            content
        )
        
        # Replace any remaining hardcoded credentials
        content = content.replace(f'"{HARDCODED_URL}"', 'config.SUPABASE_URL')
        content = content.replace(f"'{HARDCODED_URL}'", 'config.SUPABASE_URL')
        content = content.replace(f'"{HARDCODED_KEY}"', 'config.SUPABASE_ANON_KEY')
        content = content.replace(f"'{HARDCODED_KEY}'", 'config.SUPABASE_ANON_KEY')
        
        # Write back if changed
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✅ Fixed credentials in: {file_path}")
            return True
        else:
            print(f"ℹ️  No changes needed in: {file_path}")
            return False
            
    except Exception as e:
        print(f"❌ Error fixing {file_path}: {e}")
        return False

def main():
    """Main function to fix all hardcoded credentials"""
    print("🔧 FIXING HARDCODED CREDENTIALS")
    print("=" * 50)
    
    fixed_count = 0
    total_files = 0
    
    # Fix files in root directory
    for filename in FILES_TO_FIX:
        file_path = Path(filename)
        if file_path.exists():
            total_files += 1
            if fix_file_credentials(file_path):
                fixed_count += 1
        else:
            print(f"⚠️  File not found: {filename}")
    
    print("\n" + "=" * 50)
    print(f"📊 SUMMARY:")
    print(f"   Files processed: {total_files}")
    print(f"   Files fixed: {fixed_count}")
    print(f"   Files unchanged: {total_files - fixed_count}")
    
    if fixed_count > 0:
        print("\n✅ SECURITY FIX COMPLETE!")
        print("   All hardcoded credentials have been replaced with environment variables.")
        print("   Make sure to set up your .env file with the correct values.")
    else:
        print("\nℹ️  No files needed fixing.")
    
    print("\n🔒 NEXT STEPS:")
    print("   1. Verify .env file has correct Supabase credentials")
    print("   2. Test authentication flow")
    print("   3. Remove any remaining hardcoded credentials manually")

if __name__ == "__main__":
    main()