#!/usr/bin/env python3
"""
Fix all hardcoded localhost:8001 references in frontend to use environment variable
"""
import os
import re
from pathlib import Path

def fix_hardcoded_ports(root_dir):
    """Replace all localhost:8001 with environment variable"""
    
    frontend_dir = Path(root_dir) / "apps" / "frontend" / "src"
    
    if not frontend_dir.exists():
        print(f"❌ Frontend directory not found: {frontend_dir}")
        return
    
    # Pattern to match localhost:8001 URLs
    pattern1 = r"'http://localhost:8001/api/"
    pattern2 = r"`http://localhost:8001/api/"
    pattern3 = r'"http://localhost:8001/api/'
    pattern4 = r"'http://localhost:8001/"
    pattern5 = r"`http://localhost:8001/"
    pattern6 = r'"http://localhost:8001/'
    
    # Replacement
    replacement1 = "`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/"
    replacement2 = "`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/"
    
    files_fixed = 0
    total_replacements = 0
    
    # Find all .tsx and .ts files
    for file_path in frontend_dir.rglob("*.tsx"):
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            original_content = content
            
            # Replace all patterns
            content = re.sub(pattern1, replacement1, content)
            content = re.sub(pattern2, replacement1, content)
            content = re.sub(pattern3, replacement1, content)
            content = re.sub(pattern4, replacement2, content)
            content = re.sub(pattern5, replacement2, content)
            content = re.sub(pattern6, replacement2, content)
            
            if content != original_content:
                # Count replacements
                replacements = content.count("${import.meta.env.VITE_API_URL") - original_content.count("${import.meta.env.VITE_API_URL")
                
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                
                files_fixed += 1
                total_replacements += replacements
                print(f"✅ Fixed {replacements} instances in: {file_path.relative_to(root_dir)}")
        
        except Exception as e:
            print(f"❌ Error processing {file_path}: {e}")
    
    print(f"\n{'='*60}")
    print(f"✅ COMPLETE: Fixed {total_replacements} hardcoded ports in {files_fixed} files")
    print(f"{'='*60}")

if __name__ == "__main__":
    # Run from Tikit directory
    root_dir = Path(__file__).parent
    fix_hardcoded_ports(root_dir)
