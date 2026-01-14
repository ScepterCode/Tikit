"""
Test script for FastAPI authentication
"""
import asyncio
import httpx
import json

BASE_URL = "http://localhost:4000"

async def test_auth_flow():
    """Test the complete authentication flow"""
    async with httpx.AsyncClient() as client:
        print("🧪 Testing FastAPI Authentication Flow...")
        
        # Test health check
        print("\n1️⃣ Testing health check...")
        response = await client.get(f"{BASE_URL}/health")
        print(f"Health Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        # Test user registration
        print("\n2️⃣ Testing user registration...")
        register_data = {
            "phone_number": "+2348012345678",
            "password": "testpassword123",
            "first_name": "Test",
            "last_name": "User",
            "email": "test@example.com",
            "state": "Lagos",
            "role": "attendee"
        }
        
        response = await client.post(f"{BASE_URL}/api/auth/register", json=register_data)
        print(f"Registration Status: {response.status_code}")
        
        if response.status_code == 200:
            register_result = response.json()
            access_token = register_result["access_token"]
            print("✅ Registration successful!")
            print(f"User ID: {register_result['user']['id']}")
            print(f"Access Token: {access_token[:50]}...")
            
            # Test getting current user
            print("\n3️⃣ Testing get current user...")
            headers = {"Authorization": f"Bearer {access_token}"}
            response = await client.get(f"{BASE_URL}/api/auth/me", headers=headers)
            print(f"Get User Status: {response.status_code}")
            
            if response.status_code == 200:
                user_info = response.json()
                print("✅ Get user successful!")
                print(f"User: {user_info['first_name']} {user_info['last_name']}")
                print(f"Phone: {user_info['phone_number']}")
                print(f"Role: {user_info['role']}")
            else:
                print(f"❌ Get user failed: {response.text}")
            
            # Test login
            print("\n4️⃣ Testing user login...")
            login_data = {
                "phone_number": "+2348012345678",
                "password": "testpassword123"
            }
            
            response = await client.post(f"{BASE_URL}/api/auth/login", json=login_data)
            print(f"Login Status: {response.status_code}")
            
            if response.status_code == 200:
                login_result = response.json()
                print("✅ Login successful!")
                print(f"New Access Token: {login_result['access_token'][:50]}...")
            else:
                print(f"❌ Login failed: {response.text}")
                
        else:
            print(f"❌ Registration failed: {response.text}")

if __name__ == "__main__":
    print("🚀 Starting FastAPI Authentication Tests...")
    print("Make sure the FastAPI server is running on http://localhost:4000")
    asyncio.run(test_auth_flow())