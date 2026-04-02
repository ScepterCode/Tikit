#!/usr/bin/env python3
"""
Fix malformed template strings in frontend files
"""
import re
from pathlib import Path

def fix_template_strings(root_dir):
    """Fix malformed template strings"""
    
    frontend_dir = Path(root_dir) / "apps" / "frontend" / "src"
    
    # Pattern to find malformed template strings
    # Looking for: `${...}', { or `${...}`, {
    pattern1 = r"`\$\{import\.meta\.env\.VITE_API_URL \|\| 'http://localhost:8000'\}/([^`]+)', \{"
    pattern2 = r"`\$\{import\.meta\.env\.VITE_API_URL \|\| 'http://localhost:8000'\}/([^`]+)`, \{"
    
    # Correct format
    replacement = r"`$${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/\1`, {"
    
    files_fixed = 0
    
    for file_path in frontend_dir.rglob("*.tsx"):
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            original_content = content
            
            # Fix pattern 1 (single quote before comma)
            content = re.sub(pattern1, replacement, content)
            # Fix pattern 2 (backtick before comma)
            content = re.sub(pattern2, replacement, content)
            
            if content != original_content:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                
                files_fixed += 1
                print(f"✅ Fixed: {file_path.relative_to(root_dir)}")
        
        except Exception as e:
            print(f"❌ Error processing {file_path}: {e}")
    
    print(f"\n✅ Fixed {files_fixed} files")

if __name__ == "__main__":
    root_dir = Path(__file__).parent
    fix_template_strings(root_dir)
