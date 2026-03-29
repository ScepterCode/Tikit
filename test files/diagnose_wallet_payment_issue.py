"""
Diagnose why the wallet payment is loading indefinitely
"""
import os
import sys

print("=" * 80)
print("WALLET PAYMENT DIAGNOSTIC")
print("=" * 80)

# Check frontend .env file
frontend_env_path = "apps/frontend/.env"
print(f"\n1. Checking {frontend_env_path}...")
if os.path.exists(frontend_env_path):
    with open(frontend_env_path, 'r') as f:
        content = f.read()
        if 'VITE_FLUTTERWAVE_PUBLIC_KEY' in content:
            # Extract the key
            for line in content.split('\n'):
                if line.startswith('VITE_FLUTTERWAVE_PUBLIC_KEY'):
                    key_value = line.split('=')[1] if '=' in line else 'NOT SET'
                    print(f"   ✅ VITE_FLUTTERWAVE_PUBLIC_KEY found: {key_value[:20]}...")
                    if key_value.startswith('FLWPUBK-'):
                        print(f"   ✅ Key format is correct (starts with FLWPUBK-)")
                    else:
                        print(f"   ❌ Key format is WRONG (should start with FLWPUBK-)")
        else:
            print(f"   ❌ VITE_FLUTTERWAVE_PUBLIC_KEY not found in .env")
else:
    print(f"   ❌ File not found: {frontend_env_path}")

# Check backend .env file
backend_env_path = "apps/backend-fastapi/.env"
print(f"\n2. Checking {backend_env_path}...")
if os.path.exists(backend_env_path):
    with open(backend_env_path, 'r') as f:
        content = f.read()
        if 'FLUTTERWAVE_LIVE_PUBLIC_KEY' in content:
            for line in content.split('\n'):
                if line.startswith('FLUTTERWAVE_LIVE_PUBLIC_KEY'):
                    key_value = line.split('=')[1] if '=' in line else 'NOT SET'
                    print(f"   ✅ FLUTTERWAVE_LIVE_PUBLIC_KEY found: {key_value[:20]}...")
        else:
            print(f"   ❌ FLUTTERWAVE_LIVE_PUBLIC_KEY not found")
else:
    print(f"   ❌ File not found: {backend_env_path}")

# Check if Flutterwave SDK is loaded in index.html
index_html_path = "apps/frontend/index.html"
print(f"\n3. Checking {index_html_path}...")
if os.path.exists(index_html_path):
    with open(index_html_path, 'r') as f:
        content = f.read()
        if 'checkout.flutterwave.com' in content:
            print(f"   ✅ Flutterwave SDK script found in index.html")
        else:
            print(f"   ❌ Flutterwave SDK script NOT found in index.html")
else:
    print(f"   ❌ File not found: {index_html_path}")

# Check UnifiedWalletDashboard.tsx
wallet_dashboard_path = "apps/frontend/src/components/wallet/UnifiedWalletDashboard.tsx"
print(f"\n4. Checking {wallet_dashboard_path}...")
if os.path.exists(wallet_dashboard_path):
    with open(wallet_dashboard_path, 'r') as f:
        content = f.read()
        if 'VITE_FLUTTERWAVE_PUBLIC_KEY' in content:
            print(f"   ✅ Code is looking for VITE_FLUTTERWAVE_PUBLIC_KEY")
        if 'FlutterwaveCheckout' in content:
            print(f"   ✅ Code calls FlutterwaveCheckout")
        if 'window as any' in content or '(window as any)' in content:
            print(f"   ✅ Code accesses window.FlutterwaveCheckout")
else:
    print(f"   ❌ File not found: {wallet_dashboard_path}")

print("\n" + "=" * 80)
print("DIAGNOSIS COMPLETE")
print("=" * 80)

print("\n📋 CHECKLIST:")
print("   [ ] Frontend .env has VITE_FLUTTERWAVE_PUBLIC_KEY with correct format")
print("   [ ] Backend .env has FLUTTERWAVE_LIVE_PUBLIC_KEY")
print("   [ ] index.html loads Flutterwave SDK script")
print("   [ ] UnifiedWalletDashboard.tsx uses correct env variable")
print("   [ ] Both servers are running (frontend:3000, backend:8000)")

print("\n🔍 COMMON ISSUES:")
print("   1. Infinite loading = Backend API call failing (check browser console)")
print("   2. 'Payment system not configured' = Env variable not found")
print("   3. 'FlutterwaveCheckout is not a function' = SDK not loaded")
print("   4. Modal doesn't open = Wrong public key format")

print("\n💡 NEXT STEPS:")
print("   1. Open browser console (F12) and check for errors")
print("   2. Check Network tab for failed API calls to /api/wallet/fund")
print("   3. Restart frontend server if .env was changed")
print("   4. Verify public key starts with 'FLWPUBK-'")
