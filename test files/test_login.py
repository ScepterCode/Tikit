#!/usr/bin/env python3
"""
Test login functionality
"""

import requests
import json

BASE_URL = "http://localhost:8000/api"

def test_login():
    print("Testing login functionality...\n")
    
    # Test credentials
    test_users = [
        {
            "name": "Admin",
            "phone_number": "+2349012345678",
            "password": "password123"
        },
        {
            "name": "Organizer",
            "phone_number": "+2349087654321",
            "password": "password123"
        },
        {
            "name": "Attendee",
            "phone_number": "+2349011111111",
            "password": "password123"
        }
    ]
    
    for user in test_users:
        print(f"Testing {user['name']} login...")
        print(f"Phone: {user['phone_number']}")
        print(f"Password: {user['password']}")
        
        # Try with phone_number field
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json={
                "phone_number": user['phone_number'],
                "password": user['password']
            }
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            print("✅ Login successful!\n")
        else:
            print("❌ Login failed!\n")
            
            # Try with phoneNumber field (camelCase)
            print("Trying with camelCase phoneNumber...")
            response2 = requests.post(
                f"{BASE_URL}/auth/login",
                json={
                    "phoneNumber": user['phone_number'],
                    "password": user['password']
                }
            )
            
            print(f"Status Code: {response2.status_code}")
            print(f"Response: {json.dumps(response2.json(), indent=2)}")
            
            if response2.status_code == 200:
                print("✅ Login successful with camelCase!\n")
            else:
                print("❌ Login failed with camelCase too!\n")

if __name__ == "__main__":
    test_login()
