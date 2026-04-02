import sys
sys.path.insert(0, 'apps/backend-fastapi')

try:
    from routers import events
    print("✅ Events router imported successfully")
    print(f"Router: {events.router}")
    print(f"Routes: {[route.path for route in events.router.routes]}")
except Exception as e:
    print(f"❌ Failed to import events router: {e}")
    import traceback
    traceback.print_exc()
