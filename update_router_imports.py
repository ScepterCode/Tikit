#!/usr/bin/env python3
"""
Script to update react-router-dom imports to react-router for React Router v7
"""

import os
import re

def update_router_imports():
    """Update all react-router-dom imports to react-router"""
    
    updated_files = []
    
    # Walk through the frontend src directory
    for root, dirs, files in os.walk("apps/frontend/src"):
        for file in files:
            if file.endswith(('.ts', '.tsx')):
                file_path = os.path.join(root, file)
                
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    # Check if file contains react-router-dom imports
                    if 'react-router-dom' in content:
                        # Replace react-router-dom with react-router
                        updated_content = content.replace('react-router-dom', 'react-router')
                        
                        # Write back the updated content
                        with open(file_path, 'w', encoding='utf-8') as f:
                            f.write(updated_content)
                        
                        updated_files.append(file_path)
                        print(f"Updated: {file_path}")
                
                except Exception as e:
                    print(f"Error processing {file_path}: {e}")
    
    print(f"\nTotal files updated: {len(updated_files)}")
    return updated_files

if __name__ == "__main__":
    update_router_imports()