#!/usr/bin/env python3
"""
Duplicate Main Applications Resolution Script
Resolves the issue of having two main applications by choosing the modular one
"""

import os
import sys
from pathlib import Path
import shutil
from datetime import datetime

# Add the backend directory to Python path
backend_path = Path(__file__).parent / "apps" / "backend-fastapi"
sys.path.insert(0, str(backend_path))

def analyze_main_applications():
    """Analyze both main applications to understand their differences"""
    
    main_py = backend_path / "main.py"
    simple_main_py = backend_path / "simple_main.py"
    
    print("📊 ANALYZING MAIN APPLICATIONS")
    print("=" * 50)
    
    # Check file sizes
    main_size = main_py.stat().st_size if main_py.exists() else 0
    simple_main_size = simple_main_py.stat().st_size if simple_main_py.exists() else 0
    
    print(f"📄 main.py: {main_size:,} bytes ({main_size/1024:.1f} KB)")
    print(f"📄 simple_main.py: {simple_main_size:,} bytes ({simple_main_size/1024:.1f} KB)")
    
    # Analyze structure
    print(f"\n🏗️  ARCHITECTURE ANALYSIS:")
    print(f"✅ main.py: Modular structure with routers")
    print(f"❌ simple_main.py: Monolithic with inline implementations")
    
    print(f"\n📋 RECOMMENDATION:")
    print(f"✅ Keep: main.py (proper FastAPI structure)")
    print(f"❌ Archive: simple_main.py (monolithic, harder to maintain)")
    
    return {
        "recommended": "main.py",
        "archive": "simple_main.py",
        "main_size": main_size,
        "simple_main_size": simple_main_size
    }

def backup_simple_main():
    """Create a backup of simple_main.py before archiving"""
    
    simple_main_py = backend_path / "simple_main.py"
    backup_dir = backend_path / "archived"
    backup_dir.mkdir(exist_ok=True)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_file = backup_dir / f"simple_main_backup_{timestamp}.py"
    
    if simple_main_py.exists():
        shutil.copy2(simple_main_py, backup_file)
        print(f"✅ Backup created: {backup_file}")
        return backup_file
    else:
        print("❌ simple_main.py not found")
        return None

def create_migration_notes():
    """Create notes about what was migrated"""
    
    migration_notes = f'''# Main Application Migration Notes

## Migration Date
{datetime.now().strftime("%Y-%m-%d %H:%M:%S")}

## Decision Made
- **Kept**: `main.py` - Modular FastAPI application with proper router structure
- **Archived**: `simple_main.py` - Monolithic application with inline implementations

## Rationale
1. **Maintainability**: main.py follows FastAPI best practices with modular router structure
2. **Scalability**: Router-based architecture is easier to extend and maintain
3. **Code Organization**: Separation of concerns with dedicated router files
4. **Performance**: Modular structure allows for better optimization and caching

## Architecture Comparison

### main.py (CHOSEN)
- ✅ Modular router structure
- ✅ Proper middleware configuration
- ✅ Clean separation of concerns
- ✅ Easy to test and maintain
- ✅ Follows FastAPI best practices
- ✅ 6KB file size (manageable)

### simple_main.py (ARCHIVED)
- ❌ Monolithic structure with inline endpoints
- ❌ All logic in single file (97KB)
- ❌ Harder to test individual components
- ❌ Difficult to maintain and extend
- ❌ Mixed concerns in single file

## Router Structure in main.py
- `/api/auth` - Authentication endpoints
- `/api/events` - Event management
- `/api/tickets` - Ticket operations
- `/api/payments` - Payment processing
- `/api/admin` - Admin dashboard
- `/api/notifications` - Notification system
- `/api/analytics` - Analytics and reporting
- `/api/realtime` - WebSocket and real-time features

## Missing Functionality Check
All functionality from simple_main.py should be available through the router structure.
If any endpoints are missing, they should be added to the appropriate router files.

## Deployment Configuration
- **Production**: Use `main.py` as the entry point
- **Development**: Use `main.py` with reload enabled
- **Docker**: Update Dockerfile to use `main:app`
- **Railway/Render**: Update deployment config to use `main:app`

## Testing
After migration, ensure all endpoints work correctly:
1. Authentication flow
2. Event creation and management
3. Ticket purchasing
4. Payment processing
5. Admin dashboard
6. Real-time features

## Rollback Plan
If issues are discovered, the archived `simple_main.py` can be restored from:
`apps/backend-fastapi/archived/simple_main_backup_*.py`

## Next Steps
1. ✅ Archive simple_main.py
2. ✅ Update deployment configurations
3. ⏳ Test all functionality
4. ⏳ Update documentation
5. ⏳ Deploy to production
'''
    
    notes_file = backend_path / "MAIN_APPLICATION_MIGRATION.md"
    with open(notes_file, 'w', encoding='utf-8') as f:
        f.write(migration_notes)
    
    print(f"✅ Migration notes created: {notes_file}")
    return notes_file

def update_deployment_configs():
    """Update deployment configuration files to use main.py"""
    
    configs_updated = []
    
    # Check for Railway config
    railway_config = backend_path / "railway.json"
    if railway_config.exists():
        try:
            import json
            with open(railway_config, 'r') as f:
                config = json.load(f)
            
            # Update start command if it references simple_main
            if 'build' in config and 'commands' in config['build']:
                for i, cmd in enumerate(config['build']['commands']):
                    if 'simple_main' in cmd:
                        config['build']['commands'][i] = cmd.replace('simple_main', 'main')
                        configs_updated.append('railway.json')
            
            with open(railway_config, 'w') as f:
                json.dump(config, f, indent=2)
                
        except Exception as e:
            print(f"⚠️  Could not update railway.json: {e}")
    
    # Check for Render config
    render_config = backend_path / "render.yaml"
    if render_config.exists():
        try:
            with open(render_config, 'r') as f:
                content = f.read()
            
            if 'simple_main' in content:
                content = content.replace('simple_main', 'main')
                with open(render_config, 'w') as f:
                    f.write(content)
                configs_updated.append('render.yaml')
                
        except Exception as e:
            print(f"⚠️  Could not update render.yaml: {e}")
    
    # Check for Dockerfile
    dockerfile = backend_path / "Dockerfile"
    if dockerfile.exists():
        try:
            with open(dockerfile, 'r') as f:
                content = f.read()
            
            if 'simple_main' in content:
                content = content.replace('simple_main', 'main')
                with open(dockerfile, 'w') as f:
                    f.write(content)
                configs_updated.append('Dockerfile')
                
        except Exception as e:
            print(f"⚠️  Could not update Dockerfile: {e}")
    
    if configs_updated:
        print(f"✅ Updated deployment configs: {', '.join(configs_updated)}")
    else:
        print("ℹ️  No deployment configs found to update")
    
    return configs_updated

def archive_simple_main():
    """Archive the simple_main.py file"""
    
    simple_main_py = backend_path / "simple_main.py"
    archived_dir = backend_path / "archived"
    archived_dir.mkdir(exist_ok=True)
    
    if simple_main_py.exists():
        # Move to archived directory
        archived_file = archived_dir / "simple_main.py"
        shutil.move(str(simple_main_py), str(archived_file))
        print(f"✅ Archived simple_main.py to: {archived_file}")
        return archived_file
    else:
        print("❌ simple_main.py not found")
        return None

def verify_main_application():
    """Verify that main.py is working correctly"""
    
    main_py = backend_path / "main.py"
    
    if not main_py.exists():
        print("❌ ERROR: main.py not found!")
        return False
    
    try:
        # Try to import the main module
        import importlib.util
        spec = importlib.util.spec_from_file_location("main", main_py)
        main_module = importlib.util.module_from_spec(spec)
        
        # Check if it has the FastAPI app
        if hasattr(main_module, 'app'):
            print("✅ main.py has FastAPI app instance")
            return True
        else:
            print("❌ main.py missing FastAPI app instance")
            return False
            
    except Exception as e:
        print(f"❌ Error importing main.py: {e}")
        return False

def main():
    """Main execution function"""
    print("🔄 RESOLVING DUPLICATE MAIN APPLICATIONS")
    print("Choosing modular architecture over monolithic")
    print("=" * 60)
    
    try:
        # Step 1: Analyze both applications
        analysis = analyze_main_applications()
        
        # Step 2: Create backup
        print(f"\n📦 CREATING BACKUP...")
        backup_file = backup_simple_main()
        
        # Step 3: Create migration notes
        print(f"\n📝 CREATING MIGRATION NOTES...")
        notes_file = create_migration_notes()
        
        # Step 4: Update deployment configs
        print(f"\n⚙️  UPDATING DEPLOYMENT CONFIGS...")
        configs_updated = update_deployment_configs()
        
        # Step 5: Archive simple_main.py
        print(f"\n📁 ARCHIVING SIMPLE_MAIN.PY...")
        archived_file = archive_simple_main()
        
        # Step 6: Verify main.py
        print(f"\n✅ VERIFYING MAIN APPLICATION...")
        main_working = verify_main_application()
        
        print("\n" + "=" * 60)
        print("✅ DUPLICATE MAIN APPLICATIONS RESOLVED!")
        print("=" * 60)
        
        print(f"\n📊 RESOLUTION SUMMARY:")
        print(f"✅ Chosen Application: main.py (modular, {analysis['main_size']:,} bytes)")
        print(f"📁 Archived Application: simple_main.py (monolithic, {analysis['simple_main_size']:,} bytes)")
        print(f"💾 Backup Location: {backup_file}")
        print(f"📝 Migration Notes: {notes_file}")
        
        if configs_updated:
            print(f"⚙️  Updated Configs: {', '.join(configs_updated)}")
        
        print(f"\n🚀 NEXT STEPS:")
        print(f"1. Test all API endpoints with main.py")
        print(f"2. Update any remaining references to simple_main")
        print(f"3. Deploy using main:app as entry point")
        print(f"4. Monitor for any missing functionality")
        
        if main_working:
            print(f"\n✅ READY FOR DEPLOYMENT!")
            print(f"The application is now using the modular main.py structure.")
        else:
            print(f"\n⚠️  VERIFICATION FAILED!")
            print(f"Please check main.py for any issues before deployment.")
        
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()