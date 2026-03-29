#!/usr/bin/env python3
"""
Start Payment Test Servers
Starts both backend and frontend servers for payment testing
"""

import subprocess
import time
import os
import sys
from pathlib import Path

def start_backend_server():
    """Start the FastAPI backend server"""
    print("🚀 Starting Backend Server...")
    
    backend_dir = Path("apps/backend-fastapi")
    if not backend_dir.exists():
        print("❌ Backend directory not found")
        return None
    
    try:
        # Change to backend directory and start server
        os.chdir(backend_dir)
        
        # Start uvicorn server
        process = subprocess.Popen([
            sys.executable, "-m", "uvicorn", 
            "simple_main:app", 
            "--reload", 
            "--host", "0.0.0.0", 
            "--port", "8000"
        ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        
        print("✅ Backend server starting on http://localhost:8000")
        return process
        
    except Exception as e:
        print(f"❌ Failed to start backend server: {e}")
        return None
    finally:
        # Return to original directory
        os.chdir("../..")

def start_frontend_server():
    """Start the React frontend server"""
    print("🎨 Starting Frontend Server...")
    
    frontend_dir = Path("apps/frontend")
    if not frontend_dir.exists():
        print("❌ Frontend directory not found")
        return None
    
    try:
        # Change to frontend directory and start server
        os.chdir(frontend_dir)
        
        # Start npm dev server
        process = subprocess.Popen([
            "npm", "run", "dev"
        ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        
        print("✅ Frontend server starting on http://localhost:3000")
        return process
        
    except Exception as e:
        print(f"❌ Failed to start frontend server: {e}")
        return None
    finally:
        # Return to original directory
        os.chdir("../..")

def check_server_health():
    """Check if servers are healthy"""
    import requests
    
    print("🔍 Checking server health...")
    
    # Check backend
    try:
        response = requests.get("http://localhost:8000/", timeout=5)
        print(f"✅ Backend health: {response.status_code}")
    except Exception as e:
        print(f"❌ Backend health check failed: {e}")
    
    # Check frontend
    try:
        response = requests.get("http://localhost:3000", timeout=5)
        print(f"✅ Frontend health: {response.status_code}")
    except Exception as e:
        print(f"❌ Frontend health check failed: {e}")

def main():
    """Start both servers and run health checks"""
    print("🚀 STARTING PAYMENT TEST SERVERS\n")
    
    # Check if we're in the right directory
    if not Path("apps").exists():
        print("❌ Please run this script from the Tikit root directory")
        return
    
    print("📋 Pre-flight Checks:")
    
    # Check if backend dependencies are installed
    backend_main = Path("apps/backend-fastapi/simple_main.py")
    if backend_main.exists():
        print("✅ Backend main file found")
    else:
        print("❌ Backend main file not found")
        return
    
    # Check if frontend package.json exists
    frontend_package = Path("apps/frontend/package.json")
    if frontend_package.exists():
        print("✅ Frontend package.json found")
    else:
        print("❌ Frontend package.json not found")
        return
    
    print("\n🚀 Starting servers...")
    
    # Start backend server
    backend_process = start_backend_server()
    if not backend_process:
        print("❌ Failed to start backend server")
        return
    
    # Wait a moment for backend to start
    time.sleep(3)
    
    # Start frontend server
    frontend_process = start_frontend_server()
    if not frontend_process:
        print("❌ Failed to start frontend server")
        if backend_process:
            backend_process.terminate()
        return
    
    # Wait for servers to fully start
    print("\n⏳ Waiting for servers to start...")
    time.sleep(10)
    
    # Check server health
    check_server_health()
    
    print("\n📋 Server Status:")
    print("🔗 Backend API: http://localhost:8000")
    print("🎨 Frontend App: http://localhost:3000")
    print("📊 API Docs: http://localhost:8000/docs")
    
    print("\n🧪 To test payments:")
    print("1. Open http://localhost:3000 in your browser")
    print("2. Navigate to an event page")
    print("3. Click 'Buy Ticket' to test payment flow")
    print("4. Run: python test_real_payment_system.py")
    
    print("\n⚠️  IMPORTANT:")
    print("Make sure you've added your Flutterwave secret key to:")
    print("apps/backend-fastapi/.env")
    print("FLUTTERWAVE_SECRET_KEY=FLWSECK-your_actual_secret_key")
    
    print("\n🛑 Press Ctrl+C to stop both servers")
    
    try:
        # Keep script running
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n🛑 Stopping servers...")
        if backend_process:
            backend_process.terminate()
        if frontend_process:
            frontend_process.terminate()
        print("✅ Servers stopped")

if __name__ == "__main__":
    main()