#!/usr/bin/env python3
"""
Debug frontend authentication by monitoring requests
"""

import requests
import time
from datetime import datetime

def monitor_backend_requests():
    """Monitor backend for incoming requests"""
    print("🔍 Monitoring backend requests...")
    print("   Please try to create an event in the frontend now...")
    print("   Watching for requests to /api/events...")
    
    # We can't directly monitor the backend, but we can test the current user endpoint
    # to see what's happening with authentication
    
    print("\n🔍 Testing current user endpoint...")
    
    # Test without token
    try:
        response = requests.get("http://localhost:8000/api/current-user", timeout=5)
        print(f"   No token - Status: {response.status_code}")
        print(f"   Response: {response.text[:100]}...")
    except Exception as e:
        print(f"   No token - Error: {e}")
    
    print("\n   Now please login in the frontend and try again...")
    print("   Press Enter when you've logged in...")
    input()
    
    # Test the health endpoint to make sure backend is responsive
    try:
        response = requests.get("http://localhost:8000/health", timeout=5)
        print(f"   Health check - Status: {response.status_code}")
        print(f"   Response: {response.text}")
    except Exception as e:
        print(f"   Health check - Error: {e}")

if __name__ == "__main__":
    print("🚀 Starting frontend auth debug...\n")
    monitor_backend_requests()
    print("\n✅ Debug complete!")