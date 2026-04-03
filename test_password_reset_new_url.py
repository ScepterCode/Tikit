"""
Test password reset with new /auth/reset-password URL
"""
import requests
import os
from dotenv import load_dotenv

load_dotenv('apps/backend-fastapi/.env')

API_URL = "http://localhost:8000"
EMAIL = "scepterboss@gmail.com"

def test_password_reset():
    """Test password reset flow"""
    print(f"\n🔐 Testing Password Reset for: {EMAIL}")
    print("=" * 60)
    
    # Request password reset
    print(f"\n1️⃣ Requesting password reset...")
    response = requests.post(
        f"{API_URL}/api/auth/forgot-password",
        params={"email": EMAIL}
    )
    
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    
    if response.status_code == 200:
        data = response.json()
        if data.get('success'):
            print("\n✅ Password reset email sent!")
            print(f"📧 Check your email at: {EMAIL}")
            print(f"🔗 The link will be: http://localhost:5173/auth/reset-password?token=...")
            print("\n⚠️ Note: Email can only be sent to scepterboss@gmail.com (Resend test domain)")
        else:
            print(f"\n❌ Failed: {data.get('error')}")
    else:
        print(f"\n❌ Request failed with status {response.status_code}")

if __name__ == "__main__":
    test_password_reset()
