#!/usr/bin/env python3
"""
Membership System Verification Script
Checks that all backend and frontend components are properly built
"""

import os
import sys
from pathlib import Path

# Color codes for output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

def check_file_exists(filepath, description):
    """Check if a file exists"""
    if os.path.exists(filepath):
        print(f"{GREEN}✓{RESET} {description}: {filepath}")
        return True
    else:
        print(f"{RED}✗{RESET} {description}: {filepath} - NOT FOUND")
        return False

def check_file_contains(filepath, search_strings, description):
    """Check if file contains specific strings"""
    if not os.path.exists(filepath):
        print(f"{RED}✗{RESET} {description}: File not found - {filepath}")
        return False
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    missing = []
    for search_str in search_strings:
        if search_str not in content:
            missing.append(search_str)
    
    if missing:
        print(f"{RED}✗{RESET} {description}: Missing {', '.join(missing)}")
        return False
    else:
        print(f"{GREEN}✓{RESET} {description}")
        return True

def main():
    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{BLUE}Membership System Verification{RESET}")
    print(f"{BLUE}{'='*60}{RESET}\n")
    
    all_checks_passed = True
    
    # Backend checks
    print(f"\n{YELLOW}Backend Components:{RESET}\n")
    
    # 1. Check membership_service.py exists and has required methods
    service_file = "apps/backend-fastapi/services/membership_service.py"
    if check_file_exists(service_file, "Membership Service"):
        all_checks_passed &= check_file_contains(
            service_file,
            [
                "class MembershipTier",
                "REGULAR = \"regular\"",
                "SPECIAL = \"special\"",
                "LEGEND = \"legend\"",
                "def start_trial",
                "def process_payment",
                "def get_membership_stats",
                "trial_history",
                "TIER_PRICING"
            ],
            "  - Has all required methods and tier system"
        )
    else:
        all_checks_passed = False
    
    # 2. Check membership router exists and has endpoints
    router_file = "apps/backend-fastapi/routers/membership.py"
    if check_file_exists(router_file, "Membership Router"):
        all_checks_passed &= check_file_contains(
            router_file,
            [
                "@router.post(\"/start-trial\")",
                "@router.post(\"/process-payment\")",
                "@router.get(\"/status\")",
                "@router.get(\"/pricing\")",
                "@router.get(\"/check-feature",
                "@router.get(\"/stats\")",
                "class StartTrialRequest",
                "class ProcessPaymentRequest"
            ],
            "  - Has all required endpoints"
        )
    else:
        all_checks_passed = False
    
    # 3. Check router is registered in main.py
    main_file = "apps/backend-fastapi/main.py"
    if check_file_exists(main_file, "Main Application"):
        all_checks_passed &= check_file_contains(
            main_file,
            [
                "from routers import",
                "membership",
                "app.include_router(membership.router"
            ],
            "  - Membership router is registered"
        )
    else:
        all_checks_passed = False
    
    # Frontend checks
    print(f"\n{YELLOW}Frontend Components:{RESET}\n")
    
    # 4. Check useMembership hook
    hook_file = "apps/frontend/src/hooks/useMembership.ts"
    if check_file_exists(hook_file, "useMembership Hook"):
        all_checks_passed &= check_file_contains(
            hook_file,
            [
                "tier: 'regular' | 'special' | 'legend'",
                "status: 'active' | 'trial' | 'expired'",
                "const startTrial",
                "const processPayment",
                "const upgradeMembership",
                "isSpecial",
                "isLegend",
                "isTrial"
            ],
            "  - Has all required methods and types"
        )
    else:
        all_checks_passed = False
    
    # 5. Check MembershipUpgradeModal
    modal_file = "apps/frontend/src/components/membership/MembershipUpgradeModal.tsx"
    if check_file_exists(modal_file, "MembershipUpgradeModal Component"):
        all_checks_passed &= check_file_contains(
            modal_file,
            [
                "interface MembershipUpgradeModalProps",
                "currentTier: 'regular' | 'special' | 'legend'",
                "onUpgrade: (tier: 'special' | 'legend')",
                "Start 7-Day Free Trial",
                "special: {",
                "legend: {"
            ],
            "  - Has correct props and tier system"
        )
    else:
        all_checks_passed = False
    
    # 6. Check TierBadge component
    badge_file = "apps/frontend/src/components/membership/TierBadge.tsx"
    if check_file_exists(badge_file, "TierBadge Component"):
        all_checks_passed &= check_file_contains(
            badge_file,
            [
                "tier: 'regular' | 'special' | 'legend'",
                "Crown",
                "Star",
                "Lock"
            ],
            "  - Has correct tier types and icons"
        )
    else:
        all_checks_passed = False
    
    # 7. Check SecretEvents integration
    secret_events_file = "apps/frontend/src/pages/organizer/SecretEvents.tsx"
    if check_file_exists(secret_events_file, "SecretEvents Page"):
        all_checks_passed &= check_file_contains(
            secret_events_file,
            [
                "import { MembershipUpgradeModal }",
                "const { membership, loading: membershipLoading, startTrial }",
                "const [showUpgradeModal, setShowUpgradeModal]",
                "const handleUpgrade",
                "<MembershipUpgradeModal",
                "isOpen={showUpgradeModal}",
                "onUpgrade={handleUpgrade}"
            ],
            "  - Modal is properly integrated"
        )
    else:
        all_checks_passed = False
    
    # Database checks
    print(f"\n{YELLOW}Database Migration:{RESET}\n")
    
    # 8. Check migration file exists
    migration_file = "MEMBERSHIP_SYSTEM_MIGRATION.sql"
    if check_file_exists(migration_file, "Migration SQL File"):
        all_checks_passed &= check_file_contains(
            migration_file,
            [
                "CREATE TABLE memberships",
                "CREATE TABLE membership_payments",
                "CREATE TABLE membership_features",
                "tier VARCHAR(20) CHECK (tier IN ('regular', 'special', 'legend'))",
                "status VARCHAR(20) CHECK (status IN ('active', 'trial', 'expired', 'cancelled', 'pending'))"
            ],
            "  - Has correct schema with new tier system"
        )
    else:
        all_checks_passed = False
    
    # Summary
    print(f"\n{BLUE}{'='*60}{RESET}")
    if all_checks_passed:
        print(f"{GREEN}✓ All checks passed! Membership system is properly built.{RESET}")
        print(f"\n{YELLOW}Next Steps:{RESET}")
        print("1. Start backend: cd apps/backend-fastapi && python main.py")
        print("2. Start frontend: cd apps/frontend && npm run dev")
        print("3. Test upgrade flow at: http://localhost:3000/organizer/secret-events")
    else:
        print(f"{RED}✗ Some checks failed. Please review the errors above.{RESET}")
        sys.exit(1)
    print(f"{BLUE}{'='*60}{RESET}\n")

if __name__ == "__main__":
    main()
