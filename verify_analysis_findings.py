#!/usr/bin/env python3
"""
Verification script for comprehensive project analysis findings
"""

import os
import re
import json
from pathlib import Path
from typing import Dict, List, Set, Any

class ProjectAnalysisVerifier:
    def __init__(self, project_root: str = "."):
        self.project_root = Path(project_root)
        self.findings = {
            "duplicate_functions": [],
            "authentication_conflicts": [],
            "hardcoded_credentials": [],
            "duplicate_files": [],
            "in_memory_databases": [],
            "websocket_implementations": [],
            "test_duplicates": [],
            "import_issues": []
        }
    
    def verify_duplicate_auth_implementations(self):
        """Verify the three authentication implementations"""
        print("🔍 Verifying authentication implementations...")
        
        auth_files = [
            "apps/backend-fastapi/auth_utils.py",
            "apps/backend-fastapi/jwt_validator.py", 
            "apps/backend-fastapi/services/auth_service.py"
        ]
        
        auth_implementations = []
        
        for file_path in auth_files:
            full_path = self.project_root / file_path
            if full_path.exists():
                with open(full_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    
                # Check for auth-related functions
                if "def login" in content or "def authenticate" in content or "validate_token" in content:
                    auth_implementations.append({
                        "file": file_path,
                        "has_login": "def login" in content,
                        "has_token_validation": "validate_token" in content or "verify_token" in content,
                        "has_user_database": "user_database" in content,
                        "has_jwt": "jwt.decode" in content or "jwt.encode" in content
                    })
        
        self.findings["authentication_conflicts"] = auth_implementations
        print(f"   Found {len(auth_implementations)} authentication implementations")
        return auth_implementations
    
    def verify_duplicate_main_apps(self):
        """Verify duplicate main applications"""
        print("🔍 Verifying main application files...")
        
        main_files = [
            "apps/backend-fastapi/main.py",
            "apps/backend-fastapi/simple_main.py"
        ]
        
        main_apps = []
        
        for file_path in main_files:
            full_path = self.project_root / file_path
            if full_path.exists():
                with open(full_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    
                # Check for FastAPI app creation and endpoints
                has_fastapi = "FastAPI(" in content
                has_auth_endpoints = "/api/auth" in content
                has_events_endpoints = "/api/events" in content
                line_count = len(content.split('\n'))
                
                if has_fastapi:
                    main_apps.append({
                        "file": file_path,
                        "line_count": line_count,
                        "has_auth_endpoints": has_auth_endpoints,
                        "has_events_endpoints": has_events_endpoints,
                        "has_cors": "CORSMiddleware" in content
                    })
        
        self.findings["duplicate_files"].extend(main_apps)
        print(f"   Found {len(main_apps)} main application files")
        return main_apps
    
    def verify_wallet_services(self):
        """Verify multiple wallet service implementations"""
        print("🔍 Verifying wallet service implementations...")
        
        wallet_services = [
            "apps/backend-fastapi/services/multi_wallet_service.py",
            "apps/backend-fastapi/services/wallet_security_service.py",
            "apps/backend-fastapi/services/wallet_realtime_service.py",
            "apps/backend-fastapi/services/withdrawal_service.py"
        ]
        
        wallet_implementations = []
        
        for file_path in wallet_services:
            full_path = self.project_root / file_path
            if full_path.exists():
                with open(full_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    
                wallet_implementations.append({
                    "file": file_path,
                    "has_balance_logic": "balance" in content.lower(),
                    "has_transfer_logic": "transfer" in content.lower(),
                    "has_withdrawal_logic": "withdrawal" in content.lower(),
                    "has_security_logic": "security" in content.lower() or "pin" in content.lower(),
                    "line_count": len(content.split('\n'))
                })
        
        self.findings["duplicate_functions"].extend(wallet_implementations)
        print(f"   Found {len(wallet_implementations)} wallet service files")
        return wallet_implementations
    
    def verify_hardcoded_credentials(self):
        """Find hardcoded credentials in source code"""
        print("🔍 Scanning for hardcoded credentials...")
        
        credential_patterns = [
            r'SUPABASE_URL\s*=\s*["\']https://[^"\']+["\']',
            r'SUPABASE_ANON_KEY\s*=\s*["\']eyJ[^"\']+["\']',
            r'password["\']?\s*:\s*["\']password123["\']',
            r'api_key\s*=\s*["\'][^"\']+["\']',
            r'secret\s*=\s*["\'][^"\']+["\']'
        ]
        
        hardcoded_creds = []
        
        # Scan Python files
        for py_file in self.project_root.rglob("*.py"):
            if "node_modules" in str(py_file) or ".git" in str(py_file):
                continue
                
            try:
                with open(py_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                    
                for i, line in enumerate(content.split('\n'), 1):
                    for pattern in credential_patterns:
                        if re.search(pattern, line, re.IGNORECASE):
                            hardcoded_creds.append({
                                "file": str(py_file.relative_to(self.project_root)),
                                "line": i,
                                "content": line.strip()[:100] + "..." if len(line.strip()) > 100 else line.strip()
                            })
            except Exception as e:
                continue
        
        self.findings["hardcoded_credentials"] = hardcoded_creds
        print(f"   Found {len(hardcoded_creds)} hardcoded credentials")
        return hardcoded_creds
    
    def verify_in_memory_databases(self):
        """Find in-memory database declarations"""
        print("🔍 Scanning for in-memory databases...")
        
        db_patterns = [
            r'user_database\s*:\s*Dict',
            r'events_database\s*:\s*Dict',
            r'tickets_database\s*:\s*List',
            r'notifications_database\s*:\s*Dict',
            r'user_wallets\s*:\s*Dict',
            r'withdrawals\s*=\s*\{\}',
            r'active_connections\s*:\s*Dict'
        ]
        
        in_memory_dbs = []
        
        for py_file in self.project_root.rglob("*.py"):
            if "node_modules" in str(py_file) or ".git" in str(py_file):
                continue
                
            try:
                with open(py_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                    
                for i, line in enumerate(content.split('\n'), 1):
                    for pattern in db_patterns:
                        if re.search(pattern, line):
                            in_memory_dbs.append({
                                "file": str(py_file.relative_to(self.project_root)),
                                "line": i,
                                "database": line.strip()
                            })
            except Exception as e:
                continue
        
        self.findings["in_memory_databases"] = in_memory_dbs
        print(f"   Found {len(in_memory_dbs)} in-memory database declarations")
        return in_memory_dbs
    
    def verify_websocket_implementations(self):
        """Find WebSocket implementations"""
        print("🔍 Scanning for WebSocket implementations...")
        
        websocket_files = []
        
        for py_file in self.project_root.rglob("*.py"):
            if "node_modules" in str(py_file) or ".git" in str(py_file):
                continue
                
            try:
                with open(py_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                    
                if "@router.websocket" in content or "WebSocket" in content:
                    websocket_endpoints = len(re.findall(r'@router\.websocket', content))
                    websocket_files.append({
                        "file": str(py_file.relative_to(self.project_root)),
                        "websocket_endpoints": websocket_endpoints,
                        "has_connection_manager": "ConnectionManager" in content or "active_connections" in content
                    })
            except Exception as e:
                continue
        
        self.findings["websocket_implementations"] = websocket_files
        print(f"   Found {len(websocket_files)} files with WebSocket implementations")
        return websocket_files
    
    def verify_duplicate_test_files(self):
        """Find duplicate test files"""
        print("🔍 Scanning for duplicate test files...")
        
        test_files = []
        test_functions = {}
        
        for test_file in self.project_root.rglob("test_*.py"):
            if "node_modules" in str(test_file) or ".git" in str(test_file):
                continue
                
            try:
                with open(test_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                    
                # Find test functions
                functions = re.findall(r'def (test_[a-zA-Z_]+)', content)
                
                test_files.append({
                    "file": str(test_file.relative_to(self.project_root)),
                    "function_count": len(functions),
                    "functions": functions,
                    "line_count": len(content.split('\n'))
                })
                
                # Track function duplicates
                for func in functions:
                    if func not in test_functions:
                        test_functions[func] = []
                    test_functions[func].append(str(test_file.relative_to(self.project_root)))
            except Exception as e:
                continue
        
        # Find duplicate functions
        duplicate_functions = {func: files for func, files in test_functions.items() if len(files) > 1}
        
        self.findings["test_duplicates"] = {
            "files": test_files,
            "duplicate_functions": duplicate_functions
        }
        
        print(f"   Found {len(test_files)} test files")
        print(f"   Found {len(duplicate_functions)} duplicate test functions")
        return test_files, duplicate_functions
    
    def generate_report(self):
        """Generate comprehensive verification report"""
        print("\n" + "="*80)
        print("📊 COMPREHENSIVE PROJECT ANALYSIS - VERIFICATION REPORT")
        print("="*80)
        
        # Run all verifications
        self.verify_duplicate_auth_implementations()
        self.verify_duplicate_main_apps()
        self.verify_wallet_services()
        self.verify_hardcoded_credentials()
        self.verify_in_memory_databases()
        self.verify_websocket_implementations()
        self.verify_duplicate_test_files()
        
        print("\n🔍 VERIFICATION SUMMARY:")
        print(f"   Authentication Implementations: {len(self.findings['authentication_conflicts'])}")
        print(f"   Hardcoded Credentials: {len(self.findings['hardcoded_credentials'])}")
        print(f"   In-Memory Databases: {len(self.findings['in_memory_databases'])}")
        print(f"   WebSocket Implementations: {len(self.findings['websocket_implementations'])}")
        print(f"   Wallet Services: {len([f for f in self.findings['duplicate_functions'] if 'wallet' in f.get('file', '')])}")
        print(f"   Test Files: {len(self.findings['test_duplicates'].get('files', []))}")
        print(f"   Duplicate Test Functions: {len(self.findings['test_duplicates'].get('duplicate_functions', {}))}")
        
        # Critical issues summary
        critical_issues = 0
        critical_issues += len(self.findings['authentication_conflicts'])
        critical_issues += len([c for c in self.findings['hardcoded_credentials'] if 'password' in c['content'].lower() or 'key' in c['content'].lower()])
        critical_issues += len([f for f in self.findings['duplicate_files'] if 'main.py' in f.get('file', '')])
        
        print(f"\n🚨 CRITICAL ISSUES CONFIRMED: {critical_issues}")
        
        if critical_issues > 0:
            print("   ❌ IMMEDIATE ACTION REQUIRED")
        else:
            print("   ✅ No critical issues found")
        
        return self.findings

if __name__ == "__main__":
    print("🚀 Starting comprehensive project analysis verification...")
    
    verifier = ProjectAnalysisVerifier()
    findings = verifier.generate_report()
    
    # Save findings to JSON
    with open("analysis_verification_results.json", "w") as f:
        json.dump(findings, f, indent=2)
    
    print(f"\n📄 Detailed findings saved to: analysis_verification_results.json")
    print("✅ Verification complete!")