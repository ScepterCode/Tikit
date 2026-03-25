"""
Helper script to create admin user via API
Run this after starting the backend to create an admin account
"""
import requests
import json

API_URL = "http://localhost:8000/api"

def create_admin():
    """Create an admin user"""
    
    admin_data = {
        "phone_number": "+2349012345678",
        "password": "admin123",
        "first_name": "Admin",
        "last_name": "User",
        "email": "admin@tikit.com",
        "state": "Lagos",
        "role": "admin"
    }
    
    print("🔧 Creating admin user...")
    print(f"📱 Phone: {admin_data['phone_number']}")
    print(f"🔑 Password: {admin_data['password']}")
    print(f"👤 Role: {admin_data['role']}")
    print()
    
    try:
        response = requests.post(
            f"{API_URL}/auth/register",
            json=admin_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            result = response.json()
            if result.get("success"):
                print("✅ Admin user created successfully!")
                print()
                print("📋 Login Credentials:")
                print(f"   Phone: {admin_data['phone_number']}")
                print(f"   Password: {admin_data['password']}")
                print()
                print("🎯 You can now login at: http://localhost:3000/auth/login")
                return True
            else:
                print(f"❌ Failed to create admin: {result.get('error', {}).get('message')}")
                return False
        else:
            print(f"❌ HTTP Error {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to backend!")
        print("   Make sure the FastAPI backend is running on http://localhost:8000")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def create_test_users():
    """Create test users with different roles"""
    
    test_users = [
        {
            "phone_number": "+2348012345678",
            "password": "attendee123",
            "first_name": "Test",
            "last_name": "Attendee",
            "email": "attendee@test.com",
            "state": "Lagos",
            "role": "attendee"
        },
        {
            "phone_number": "+2347012345678",
            "password": "organizer123",
            "first_name": "Test",
            "last_name": "Organizer",
            "email": "organizer@test.com",
            "state": "Lagos",
            "role": "organizer",
            "organization_name": "Test Events Ltd"
        }
    ]
    
    print("\n🔧 Creating test users...")
    print()
    
    for user_data in test_users:
        try:
            response = requests.post(
                f"{API_URL}/auth/register",
                json=user_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get("success"):
                    print(f"✅ {user_data['role'].capitalize()} created: {user_data['phone_number']}")
                else:
                    print(f"⚠️ {user_data['role'].capitalize()} already exists or failed")
            else:
                print(f"❌ Failed to create {user_data['role']}")
                
        except Exception as e:
            print(f"❌ Error creating {user_data['role']}: {e}")
    
    print()
    print("📋 Test User Credentials:")
    print("   Attendee  - Phone: +2348012345678, Password: attendee123")
    print("   Organizer - Phone: +2347012345678, Password: organizer123")
    print()

if __name__ == "__main__":
    print("=" * 60)
    print("  Tikit Admin & Test User Creator")
    print("=" * 60)
    print()
    
    # Create admin user
    admin_created = create_admin()
    
    # Ask if user wants to create test users
    if admin_created:
        print()
        response = input("Create test users (attendee & organizer)? (y/n): ")
        if response.lower() == 'y':
            create_test_users()
    
    print()
    print("=" * 60)
    print("  Done!")
    print("=" * 60)
