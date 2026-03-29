#!/usr/bin/env python3
"""
Restart Backend with New Credentials
Restart the backend server to pick up updated Flutterwave credentials
"""

import subprocess
import time
import requests
import os
import signal
import psutil

def find_backend_process():
    """Find the running backend process"""
    for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
        try:
            cmdline = ' '.join(proc.info['cmdline'])
            if 'uvicorn' in cmdline and 'main:app' in cmdline and '8000' in cmdline:
                return proc.info['pid']
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue
    return None

def stop_backend():
    """Stop the running backend server"""
    print("🛑 Stopping backend server...")
    
    pid = find_backend_process()
    if pid:
        try:
            os.kill(pid, signal.SIGTERM)
            time.sleep(2)
            print(f"✅ Stopped backend process (PID: {pid})")
            return True
        except ProcessLookupError:
            print("✅ Backend process already stopped")
            return True
        except Exception as e:
            print(f"❌ Error stopping backend: {e}")
            return False
    else:
        print("✅ No backend process found")
        return True

def start_backend():
    """Start the backend server with new environment"""
    print("🚀 Starting backend server with updated credentials...")
    
    try:
        # Change to backend directory
        backend_dir = "apps/backend-fastapi"
        
        # Start the server
        process = subprocess.Popen(
            ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"],
            cwd=backend_dir,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        
        # Wait a moment for server to start
        time.sleep(3)
        
        # Check if server is running
        try:
            response = requests.get("http://localhost:8000/health", timeout=5)
            if response.status_code == 200:
                print("✅ Backend server started successfully")
                return True
            else:
                print(f"❌ Backend server not responding properly: {response.status_code}")
                return False
        except requests.exceptions.RequestException as e:
            print(f"❌ Backend server not accessible: {e}")
            return False
            
    except Exception as e:
        print(f"❌ Error starting backend: {e}")
        return False

def test_credentials_loaded():
    """Test if credentials are now loaded"""
    print("🔍 Testing if credentials are loaded...")
    
    try:
        # Import and check the service
        import sys
        sys.path.append('apps/backend-fastapi')
        
        # Force reload the module to pick up new environment
        if 'services.flutterwave_service' in sys.modules:
            del sys.modules['services.flutterwave_service']
        
        from services.flutterwave_service import flutterwave_service
        
        if flutterwave_service.secret_key and flutterwave_service.public_key:
            print(f"✅ Credentials loaded:")
            print(f"   Secret Key: {flutterwave_service.secret_key[:20]}...")
            print(f"   Public Key: {flutterwave_service.public_key[:20]}...")
            return True
        else:
            print("❌ Credentials still not loaded")
            return False
            
    except Exception as e:
        print(f"❌ Error testing credentials: {e}")
        return False

def main():
    """Main restart process"""
    print("🔄 RESTARTING BACKEND WITH NEW FLUTTERWAVE CREDENTIALS")
    print("="*60)
    
    # Step 1: Stop backend
    if not stop_backend():
        print("❌ Failed to stop backend")
        return False
    
    # Step 2: Wait a moment
    time.sleep(2)
    
    # Step 3: Start backend
    if not start_backend():
        print("❌ Failed to start backend")
        return False
    
    # Step 4: Test credentials
    time.sleep(2)  # Give server time to fully initialize
    if test_credentials_loaded():
        print("\n🎉 Backend restarted successfully with new credentials!")
        print("✅ Ready to test payments with live Flutterwave credentials")
        return True
    else:
        print("\n❌ Backend restarted but credentials not loaded properly")
        return False

if __name__ == "__main__":
    success = main()
    if success:
        print("\n📋 Next Steps:")
        print("1. Run: python test_authenticated_payment_system.py")
        print("2. Test payment creation with live credentials")
        print("3. Verify Flutterwave integration working")
    else:
        print("\n📋 Troubleshooting:")
        print("1. Check environment file: apps/backend-fastapi/.env")
        print("2. Verify Flutterwave credentials are correct")
        print("3. Manually restart backend if needed")