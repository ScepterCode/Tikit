import sys
sys.path.insert(0, 'apps/backend-fastapi')

from main import app

print("Registered routes:")
for route in app.routes:
    if hasattr(route, 'path'):
        print(f"  {route.methods if hasattr(route, 'methods') else 'N/A'} {route.path}")
