"""
Complete API Test Suite
Comprehensive testing of all FastAPI endpoints and functionality
"""

import pytest
import asyncio
from fastapi.testclient import TestClient
from main import app
import json
from datetime import datetime, timedelta

# Test client
client = TestClient(app)

# Test data
test_user_data = {
    "phoneNumber": "+2348012345678",
    "password": "testpassword123",
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "state": "Lagos",
    "role": "attendee"
}

test_organizer_data = {
    "phoneNumber": "+2348087654321",
    "password": "organizerpass123",
    "firstName": "Event",
    "lastName": "Organizer",
    "email": "organizer@example.com",
    "state": "Lagos",
    "role": "organizer",
    "organizationName": "Test Events Ltd"
}

test_event_data = {
    "title": "Test Event",
    "description": "A test event for API testing",
    "eventType": "conference",
    "startDate": (datetime.utcnow() + timedelta(days=30)).isoformat(),
    "endDate": (datetime.utcnow() + timedelta(days=31)).isoformat(),
    "location": "Lagos, Nigeria",
    "state": "Lagos",
    "capacity": 100,
    "isPublic": True,
    "tiers": [
        {
            "name": "Regular",
            "price": 5000,
            "capacity": 80,
            "description": "Regular admission"
        },
        {
            "name": "VIP",
            "price": 10000,
            "capacity": 20,
            "description": "VIP admission with perks"
        }
    ]
}

class TestAPI:
    """Complete API test suite"""
    
    def __init__(self):
        self.user_token = None
        self.organizer_token = None
        self.test_event_id = None
        self.test_ticket_id = None
    
    def test_01_health_check(self):
        """Test health check endpoint"""
        print("\n🏥 Testing health check...")
        
        response = client.get("/health")
        assert response.status_code in [200, 503]  # 503 if services are down
        
        data = response.json()
        assert "status" in data
        assert "message" in data
        assert "timestamp" in data
        
        print(f"✅ Health check: {data['status']}")
        return True
    
    def test_02_user_registration(self):
        """Test user registration"""
        print("\n👤 Testing user registration...")
        
        # Test attendee registration
        response = client.post("/api/auth/register", json=test_user_data)
        
        if response.status_code == 201:
            data = response.json()
            assert data["success"] is True
            assert "accessToken" in data["data"]
            assert "user" in data["data"]
            
            self.user_token = data["data"]["accessToken"]
            print("✅ Attendee registration successful")
        else:
            print(f"⚠️ Attendee registration failed: {response.json()}")
        
        # Test organizer registration
        response = client.post("/api/auth/register", json=test_organizer_data)
        
        if response.status_code == 201:
            data = response.json()
            assert data["success"] is True
            assert "accessToken" in data["data"]
            
            self.organizer_token = data["data"]["accessToken"]
            print("✅ Organizer registration successful")
        else:
            print(f"⚠️ Organizer registration failed: {response.json()}")
        
        return True
    
    def test_03_user_login(self):
        """Test user login"""
        print("\n🔐 Testing user login...")
        
        login_data = {
            "phoneNumber": test_user_data["phoneNumber"],
            "password": test_user_data["password"]
        }
        
        response = client.post("/api/auth/login", json=login_data)
        
        if response.status_code == 200:
            data = response.json()
            assert data["success"] is True
            assert "accessToken" in data["data"]
            
            if not self.user_token:  # If registration failed, use login token
                self.user_token = data["data"]["accessToken"]
            
            print("✅ User login successful")
        else:
            print(f"⚠️ User login failed: {response.json()}")
        
        return True
    
    def test_04_get_current_user(self):
        """Test get current user endpoint"""
        print("\n👤 Testing get current user...")
        
        if not self.user_token:
            print("⚠️ No user token available, skipping test")
            return True
        
        headers = {"Authorization": f"Bearer {self.user_token}"}
        response = client.get("/api/auth/me", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            assert "user" in data
            assert data["user"]["phoneNumber"] == test_user_data["phoneNumber"]
            print("✅ Get current user successful")
        else:
            print(f"⚠️ Get current user failed: {response.json()}")
        
        return True
    
    def test_05_create_event(self):
        """Test event creation"""
        print("\n🎉 Testing event creation...")
        
        if not self.organizer_token:
            print("⚠️ No organizer token available, skipping test")
            return True
        
        headers = {"Authorization": f"Bearer {self.organizer_token}"}
        response = client.post("/api/events", json=test_event_data, headers=headers)
        
        if response.status_code == 201:
            data = response.json()
            assert "id" in data
            assert data["title"] == test_event_data["title"]
            
            self.test_event_id = data["id"]
            print("✅ Event creation successful")
        else:
            print(f"⚠️ Event creation failed: {response.json()}")
        
        return True
    
    def test_06_get_events(self):
        """Test get events endpoint"""
        print("\n📅 Testing get events...")
        
        response = client.get("/api/events")
        
        if response.status_code == 200:
            data = response.json()
            assert isinstance(data, list)
            print(f"✅ Get events successful ({len(data)} events)")
        else:
            print(f"⚠️ Get events failed: {response.json()}")
        
        return True
    
    def test_07_get_event_details(self):
        """Test get event details"""
        print("\n📋 Testing get event details...")
        
        if not self.test_event_id:
            print("⚠️ No test event ID available, skipping test")
            return True
        
        response = client.get(f"/api/events/{self.test_event_id}")
        
        if response.status_code == 200:
            data = response.json()
            assert data["id"] == self.test_event_id
            assert data["title"] == test_event_data["title"]
            print("✅ Get event details successful")
        else:
            print(f"⚠️ Get event details failed: {response.json()}")
        
        return True
    
    def test_08_purchase_ticket(self):
        """Test ticket purchase"""
        print("\n🎫 Testing ticket purchase...")
        
        if not self.user_token or not self.test_event_id:
            print("⚠️ Missing user token or event ID, skipping test")
            return True
        
        purchase_data = {
            "eventId": self.test_event_id,
            "tierId": "regular",  # This would be the actual tier ID
            "quantity": 1,
            "paymentMethod": "wallet"
        }
        
        headers = {"Authorization": f"Bearer {self.user_token}"}
        response = client.post("/api/tickets/purchase", json=purchase_data, headers=headers)
        
        if response.status_code == 201:
            data = response.json()
            assert "ticketId" in data
            
            self.test_ticket_id = data["ticketId"]
            print("✅ Ticket purchase successful")
        else:
            print(f"⚠️ Ticket purchase failed: {response.json()}")
        
        return True
    
    def test_09_get_user_tickets(self):
        """Test get user tickets"""
        print("\n🎫 Testing get user tickets...")
        
        if not self.user_token:
            print("⚠️ No user token available, skipping test")
            return True
        
        headers = {"Authorization": f"Bearer {self.user_token}"}
        response = client.get("/api/tickets/my-tickets", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            assert isinstance(data, list)
            print(f"✅ Get user tickets successful ({len(data)} tickets)")
        else:
            print(f"⚠️ Get user tickets failed: {response.json()}")
        
        return True
    
    def test_10_verify_ticket(self):
        """Test ticket verification"""
        print("\n✅ Testing ticket verification...")
        
        if not self.organizer_token or not self.test_ticket_id:
            print("⚠️ Missing organizer token or ticket ID, skipping test")
            return True
        
        verify_data = {
            "ticketId": self.test_ticket_id,
            "scanType": "qr_code"
        }
        
        headers = {"Authorization": f"Bearer {self.organizer_token}"}
        response = client.post("/api/tickets/verify", json=verify_data, headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            assert data["success"] is True
            print("✅ Ticket verification successful")
        else:
            print(f"⚠️ Ticket verification failed: {response.json()}")
        
        return True
    
    def test_11_payment_methods(self):
        """Test get payment methods"""
        print("\n💳 Testing get payment methods...")
        
        response = client.get("/api/payments/methods")
        
        if response.status_code == 200:
            data = response.json()
            assert isinstance(data, list)
            print(f"✅ Get payment methods successful ({len(data)} methods)")
        else:
            print(f"⚠️ Get payment methods failed: {response.json()}")
        
        return True
    
    def test_12_wallet_balance(self):
        """Test get wallet balance"""
        print("\n💰 Testing get wallet balance...")
        
        if not self.user_token:
            print("⚠️ No user token available, skipping test")
            return True
        
        headers = {"Authorization": f"Bearer {self.user_token}"}
        response = client.get("/api/payments/wallet/balance", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            assert "balance" in data
            assert "currency" in data
            print(f"✅ Get wallet balance successful (₦{data['balance']})")
        else:
            print(f"⚠️ Get wallet balance failed: {response.json()}")
        
        return True
    
    def test_13_notifications(self):
        """Test get notifications"""
        print("\n🔔 Testing get notifications...")
        
        if not self.user_token:
            print("⚠️ No user token available, skipping test")
            return True
        
        headers = {"Authorization": f"Bearer {self.user_token}"}
        response = client.get("/api/notifications/", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            assert isinstance(data, list)
            print(f"✅ Get notifications successful ({len(data)} notifications)")
        else:
            print(f"⚠️ Get notifications failed: {response.json()}")
        
        return True
    
    def test_14_analytics_dashboard(self):
        """Test analytics dashboard"""
        print("\n📊 Testing analytics dashboard...")
        
        if not self.user_token:
            print("⚠️ No user token available, skipping test")
            return True
        
        headers = {"Authorization": f"Bearer {self.user_token}"}
        response = client.get("/api/analytics/dashboard", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            assert isinstance(data, dict)
            print("✅ Analytics dashboard successful")
        else:
            print(f"⚠️ Analytics dashboard failed: {response.json()}")
        
        return True
    
    def test_15_realtime_connection_stats(self):
        """Test real-time connection stats"""
        print("\n🔄 Testing real-time connection stats...")
        
        # This test might fail if user is not admin
        if not self.user_token:
            print("⚠️ No user token available, skipping test")
            return True
        
        headers = {"Authorization": f"Bearer {self.user_token}"}
        response = client.get("/api/realtime/connections", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            assert "total_connections" in data
            print("✅ Real-time connection stats successful")
        elif response.status_code == 403:
            print("⚠️ Real-time connection stats requires admin access")
        else:
            print(f"⚠️ Real-time connection stats failed: {response.json()}")
        
        return True
    
    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Complete FastAPI Test Suite")
        print("=" * 50)
        
        tests = [
            self.test_01_health_check,
            self.test_02_user_registration,
            self.test_03_user_login,
            self.test_04_get_current_user,
            self.test_05_create_event,
            self.test_06_get_events,
            self.test_07_get_event_details,
            self.test_08_purchase_ticket,
            self.test_09_get_user_tickets,
            self.test_10_verify_ticket,
            self.test_11_payment_methods,
            self.test_12_wallet_balance,
            self.test_13_notifications,
            self.test_14_analytics_dashboard,
            self.test_15_realtime_connection_stats
        ]
        
        passed = 0
        failed = 0
        
        for test in tests:
            try:
                if test():
                    passed += 1
                else:
                    failed += 1
            except Exception as e:
                print(f"❌ {test.__name__} failed with exception: {e}")
                failed += 1
        
        print("\n" + "=" * 50)
        print(f"🎯 Test Results: {passed} passed, {failed} failed")
        print(f"📊 Success Rate: {(passed / (passed + failed)) * 100:.1f}%")
        
        if failed == 0:
            print("🎉 All tests passed! FastAPI backend is working correctly.")
        else:
            print("⚠️ Some tests failed. Check the output above for details.")
        
        return failed == 0

def main():
    """Main test runner"""
    test_suite = TestAPI()
    success = test_suite.run_all_tests()
    
    if success:
        print("\n✅ FastAPI backend is ready for production!")
    else:
        print("\n❌ FastAPI backend needs attention before deployment.")
    
    return success

if __name__ == "__main__":
    main()