"""Check what routes are registered in the app"""
import sys
sys.path.insert(0, '.')

from simple_main import app

print("Checking registered routes...")
print("=" * 60)

all_routes = []
for route in app.routes:
    if hasattr(route, 'path'):
        all_routes.append(route.path)
        
print(f"Total routes: {len(all_routes)}")
print("\nAll routes:")
for route in sorted(all_routes):
    print(f"  {route}")

wallet_routes = [r for r in all_routes if 'wallet' in r.lower()]
print(f"\nWallet routes ({len(wallet_routes)}):")
for route in wallet_routes:
    print(f"  {route}")
