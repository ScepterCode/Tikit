#!/usr/bin/env python3
"""
Fix React Router imports from 'react-router' to 'react-router-dom'
"""

import os
import re

def fix_react_router_imports(directory):
    """Fix React Router imports in all TypeScript/TSX files"""
    files_fixed = 0
    
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(('.tsx', '.ts')):
                file_path = os.path.join(root, file)
                
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    # Replace react-router imports with react-router-dom
                    original_content = content
                    content = re.sub(
                        r"from 'react-router'",
                        "from 'react-router-dom'",
                        content
                    )
                    
                    # Only write if content changed
                    if content != original_content:
                        with open(file_path, 'w', encoding='utf-8') as f:
                            f.write(content)
                        files_fixed += 1
                        print(f"Fixed: {file_path}")
                        
                except Exception as e:
                    print(f"Error processing {file_path}: {e}")
    
    return files_fixed

if __name__ == "__main__":
    frontend_src = "apps/frontend/src"
    
    if os.path.exists(frontend_src):
        print("Fixing React Router imports...")
        fixed_count = fix_react_router_imports(frontend_src)
        print(f"\n✅ Fixed {fixed_count} files")
    else:
        print(f"❌ Directory {frontend_src} not found")