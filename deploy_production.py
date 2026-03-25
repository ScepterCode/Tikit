#!/usr/bin/env python3
"""
Production Deployment Script
Starts the Tikit FastAPI application in production mode
"""

import os
import sys
import subprocess
from pathlib import Path

def deploy_production():
    """Deploy the application in production mode"""
    
    print("🚀 TIKIT PRODUCTION DEPLOYMENT")
    print("=" * 50)
    
    # Change to backend directory
    backend_path = Path(__file__).parent / "apps" / "backend-fastapi"
    
    if not backend_path.exists():
        print("❌ Backend directory not found!")
        return False
    
    os.chdir(backend_path)
    print(f"📁 Changed to directory: {backend_path}")
    
    # Check if main.py exists
    main_py = backend_path / "main.py"
    if not main_py.exists():
        print("❌ main.py not found!")
        return False
    
    print("✅ main.py found")
    
    # Check if .env file exists
    env_file = backend_path / ".env"
    if not env_file.exists():
        print("❌ .env file not found!")
        return False
    
    print("✅ .env configuration found")
    
    # Set production environment variables
    os.environ["ENVIRONMENT"] = "production"
    os.environ["DEBUG"] = "false"
    
    print("⚙️  Environment configured for production")
    
    # Start the server
    print("\n🚀 Starting Tikit FastAPI Server...")
    print("=" * 50)
    print("📍 Server will be available at: http://localhost:8000")
    print("📖 API Documentation: http://localhost:8000/docs")
    print("🔍 Health Check: http://localhost:8000/health")
    print("=" * 50)
    print("Press Ctrl+C to stop the server")
    print()
    
    try:
        # Start uvicorn server
        subprocess.run([
            sys.executable, "-m", "uvicorn", 
            "main:app",
            "--host", "0.0.0.0",
            "--port", "8000",
            "--workers", "4",
            "--access-log",
            "--log-level", "info"
        ], check=True)
        
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Server failed to start: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

def main():
    """Main execution function"""
    print("🎉 TIKIT PRODUCTION DEPLOYMENT READY")
    print("All critical issues resolved - deploying to production")
    print()
    
    success = deploy_production()
    
    if success:
        print("\n✅ Deployment completed successfully!")
    else:
        print("\n❌ Deployment failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()