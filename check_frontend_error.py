#!/usr/bin/env python3
"""
Check if frontend is accessible and get any console errors
"""
import requests

FRONTEND_URL = "http://localhost:3000"

try:
    response = requests.get(FRONTEND_URL, timeout=5)
    print(f"Status Code: {response.status_code}")
    print(f"Content Length: {len(response.text)}")
    
    if response.status_code == 200:
        if len(response.text) < 100:
            print("\n❌ Response is too short - likely an error")
            print(f"Content: {response.text}")
        else:
            print("\n✅ Frontend is responding")
            # Check if it's HTML
            if '<html' in response.text.lower():
                print("✅ HTML content detected")
            else:
                print("❌ Not HTML content")
    else:
        print(f"\n❌ Error: Status {response.status_code}")
        
except Exception as e:
    print(f"❌ Error connecting to frontend: {e}")

print("\n📋 Instructions:")
print("1. Open http://localhost:3000 in your browser")
print("2. Press F12 to open Developer Tools")
print("3. Check the Console tab for any errors")
print("4. Share any error messages you see")
