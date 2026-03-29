#!/usr/bin/env python3
"""
Deep scan of wallet system to identify mock data and integration points
"""

import os
import re

def scan_file(filepath):
    """Scan a file for mock data patterns"""
    issues = []
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            lines = content.split('\n')
            
            # Patterns to detect mock data
            mock_patterns = [
                (r'mock_', 'Mock prefix'),
                (r'test-\w+-\d+', 'Test ID pattern'),
                (r'wallet_balance.*=.*\d+\.0', 'Hardcoded balance'),
                (r'balance.*\*.*0\.\d+', 'Fake balance calculation'),
                (r'transactions.*=.*\[\]', 'Empty transaction array'),
                (r'# Fallback|# Mock|# Test', 'Mock/test comment'),
            ]
            
            for i, line in enumerate(lines, 1):
                for pattern, desc in mock_patterns:
                    if re.search(pattern, line, re.IGNORECASE):
                        issues.append({
                            'file': filepath,
                            'line': i,
                            'issue': desc,
                            'code': line.strip()
                        })
    except Exception as e:
        pass
    
    return issues

def scan_directory(directory, extensions):
    """Scan directory for files"""
    all_issues = []
    
    for root, dirs, files in os.walk(directory):
        # Skip node_modules and other irrelevant dirs
        dirs[:] = [d for d in dirs if d not in ['node_modules', '.git', '__pycache__', 'dist', 'build']]
        
        for file in files:
            if any(file.endswith(ext) for ext in extensions):
                filepath = os.path.join(root, file)
                issues = scan_file(filepath)
                all_issues.extend(issues)
    
    return all_issues

print("🔍 SCANNING WALLET SYSTEM FOR MOCK DATA")
print("="*70)

# Scan backend
print("\n📁 Scanning Backend...")
backend_issues = scan_directory('apps/backend-fastapi', ['.py'])

# Scan frontend wallet components
print("📁 Scanning Frontend Wallet Components...")
frontend_issues = scan_directory('apps/frontend/src/components/wallet', ['.tsx', '.ts'])
frontend_issues.extend(scan_directory('apps/frontend/src/pages/organizer', ['.tsx', '.ts']))

print(f"\n📊 RESULTS:")
print(f"Backend issues found: {len(backend_issues)}")
print(f"Frontend issues found: {len(frontend_issues)}")

print("\n🔴 CRITICAL MOCK DATA LOCATIONS:")
print("-"*70)

# Group by file
from collections import defaultdict
by_file = defaultdict(list)
for issue in backend_issues + frontend_issues:
    by_file[issue['file']].append(issue)

for filepath, issues in sorted(by_file.items()):
    print(f"\n📄 {filepath}")
    for issue in issues[:5]:  # Show first 5 per file
        print(f"   Line {issue['line']}: {issue['issue']}")
        print(f"   → {issue['code'][:80]}")

print("\n" + "="*70)
print("✅ Scan complete. Ready to implement production wallet system.")
