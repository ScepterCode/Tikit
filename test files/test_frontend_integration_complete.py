#!/usr/bin/env python3
"""
Comprehensive Frontend Integration Test
Tests all frontend components with real backend integration
"""

import asyncio
import aiohttp
import json
from datetime import datetime
import sys
import os

# Add the backend directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'apps', 'backend-fastapi'))

class FrontendIntegrationTester:
    def __init__(self):
        self.base_url = "http://localhost:8000"
        self.session = None
        self.test_user_token = None
        self.test_results = []
        
    async def setup_session(self):
        """Setup HTTP session for testing"""
        self.session = aiohttp.ClientSession()
        
    async def cleanup_session(self):
        """Cleanup HTTP session"""
        if self.session:
            await self.session.close()
            
    async def authenticate_test_user(self):
        """Authenticate a test user and get token"""
        try:
            # Try to create/login test user
            auth_data = {
                "email": "test@example.com",
                "password": "testpassword123",
                "first_name": "Test",
                "last_name": "User"
            }
            
            # Try login first
            async with self.session.post(
                f"{self.base_url}/api/auth/login",
                json={"email": auth_data["email"], "password": auth_data["password"]}
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    if data.get("success"):
                        self.test_user_token = data["data"]["access_token"]
                        return True
                        
            # If login fails, try registration
            async with self.session.post(
                f"{self.base_url}/api/auth/register",
                json=auth_data
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    if data.get("success"):
                        self.test_user_token = data["data"]["access_token"]
                        return True
                        
            return False
            
        except Exception as e:
            print(f"Authentication failed: {e}")
            return False
            
    def get_auth_headers(self):
        """Get authentication headers"""
        if self.test_user_token:
            return {"Authorization": f"Bearer {self.test_user_token}"}
        return {}
        
    async def test_wallet_integration(self):
        """Test wallet component integration"""
        print("\n🔄 Testing Wallet Integration...")
        
        try:
            # Test wallet balance endpoint
            async with self.session.get(
                f"{self.base_url}/api/payments/balance",
                headers=self.get_auth_headers()
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    if data.get("success"):
                        balance = data.get("balance", 0)
                        print(f"✅ Wallet balance retrieved: ₦{balance:,.2f}")
                        self.test_results.append(("Wallet Balance API", "PASS", f"Balance: ₦{balance:,.2f}"))
                    else:
                        print(f"❌ Wallet balance API failed: {data}")
                        self.test_results.append(("Wallet Balance API", "FAIL", str(data)))
                else:
                    print(f"❌ Wallet balance API returned {response.status}")
                    self.test_results.append(("Wallet Balance API", "FAIL", f"HTTP {response.status}"))
                    
            # Test unified wallet balance endpoint
            async with self.session.get(
                f"{self.base_url}/api/wallet/unified/balance",
                headers=self.get_auth_headers()
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    if data.get("success"):
                        total_balance = data["data"].get("total_balance", 0)
                        print(f"✅ Unified wallet balance: ₦{total_balance:,.2f}")
                        self.test_results.append(("Unified Wallet API", "PASS", f"Balance: ₦{total_balance:,.2f}"))
                    else:
                        print(f"❌ Unified wallet API failed: {data}")
                        self.test_results.append(("Unified Wallet API", "FAIL", str(data)))
                else:
                    print(f"❌ Unified wallet API returned {response.status}")
                    self.test_results.append(("Unified Wallet API", "FAIL", f"HTTP {response.status}"))
                    
            # Test wallet transactions endpoint
            async with self.session.get(
                f"{self.base_url}/api/wallet/unified/transactions",
                headers=self.get_auth_headers()
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    if data.get("success"):
                        transactions = data["data"].get("transactions", [])
                        print(f"✅ Transaction history retrieved: {len(transactions)} transactions")
                        self.test_results.append(("Transaction History API", "PASS", f"{len(transactions)} transactions"))
                    else:
                        print(f"❌ Transaction history API failed: {data}")
                        self.test_results.append(("Transaction History API", "FAIL", str(data)))
                else:
                    print(f"❌ Transaction history API returned {response.status}")
                    self.test_results.append(("Transaction History API", "FAIL", f"HTTP {response.status}"))
                    
        except Exception as e:
            print(f"❌ Wallet integration test failed: {e}")
            self.test_results.append(("Wallet Integration", "ERROR", str(e)))
            
    async def test_events_integration(self):
        """Test events component integration"""
        print("\n🔄 Testing Events Integration...")
        
        try:
            # Test events list endpoint
            async with self.session.get(
                f"{self.base_url}/api/events",
                headers=self.get_auth_headers()
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    if data.get("success"):
                        events = data["data"].get("events", [])
                        print(f"✅ Events list retrieved: {len(events)} events")
                        self.test_results.append(("Events List API", "PASS", f"{len(events)} events"))
                        
                        # Test individual event details if events exist
                        if events:
                            event_id = events[0]["id"]
                            async with self.session.get(
                                f"{self.base_url}/api/events/{event_id}",
                                headers=self.get_auth_headers()
                            ) as detail_response:
                                if detail_response.status == 200:
                                    detail_data = await detail_response.json()
                                    if detail_data.get("success"):
                                        event_title = detail_data["data"].get("title", "Unknown")
                                        print(f"✅ Event details retrieved: {event_title}")
                                        self.test_results.append(("Event Details API", "PASS", event_title))
                                    else:
                                        print(f"❌ Event details API failed: {detail_data}")
                                        self.test_results.append(("Event Details API", "FAIL", str(detail_data)))
                                else:
                                    print(f"❌ Event details API returned {detail_response.status}")
                                    self.test_results.append(("Event Details API", "FAIL", f"HTTP {detail_response.status}"))
                    else:
                        print(f"❌ Events list API failed: {data}")
                        self.test_results.append(("Events List API", "FAIL", str(data)))
                else:
                    print(f"❌ Events list API returned {response.status}")
                    self.test_results.append(("Events List API", "FAIL", f"HTTP {response.status}"))
                    
            # Test recommended events endpoint
            async with self.session.get(
                f"{self.base_url}/api/events/recommended",
                headers=self.get_auth_headers()
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    if data.get("success"):
                        recommended = data["data"].get("events", [])
                        print(f"✅ Recommended events retrieved: {len(recommended)} events")
                        self.test_results.append(("Recommended Events API", "PASS", f"{len(recommended)} events"))
                    else:
                        print(f"❌ Recommended events API failed: {data}")
                        self.test_results.append(("Recommended Events API", "FAIL", str(data)))
                else:
                    print(f"❌ Recommended events API returned {response.status}")
                    self.test_results.append(("Recommended Events API", "FAIL", f"HTTP {response.status}"))
                    
        except Exception as e:
            print(f"❌ Events integration test failed: {e}")
            self.test_results.append(("Events Integration", "ERROR", str(e)))
            
    async def test_payment_integration(self):
        """Test payment system integration"""
        print("\n🔄 Testing Payment Integration...")
        
        try:
            # Test payment methods endpoint
            async with self.session.get(
                f"{self.base_url}/api/payments/methods"
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    if data.get("success"):
                        methods = data.get("methods", [])
                        available_methods = [m["name"] for m in methods if m.get("available")]
                        print(f"✅ Payment methods retrieved: {', '.join(available_methods)}")
                        self.test_results.append(("Payment Methods API", "PASS", f"{len(available_methods)} methods"))
                    else:
                        print(f"❌ Payment methods API failed: {data}")
                        self.test_results.append(("Payment Methods API", "FAIL", str(data)))
                else:
                    print(f"❌ Payment methods API returned {response.status}")
                    self.test_results.append(("Payment Methods API", "FAIL", f"HTTP {response.status}"))
                    
            # Test wallet payment endpoint (simulation)
            payment_data = {
                "amount": 500000,  # ₦5,000 in kobo
                "reference": f"TEST_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                "event_id": "test-event-id",
                "ticket_details": {
                    "quantity": 1,
                    "tierName": "General",
                    "unitPrice": 5000
                }
            }
            
            async with self.session.post(
                f"{self.base_url}/api/payments/wallet",
                json=payment_data,
                headers=self.get_auth_headers()
            ) as response:
                data = await response.json()
                if response.status == 200 and data.get("success"):
                    print(f"✅ Wallet payment simulation successful")
                    self.test_results.append(("Wallet Payment API", "PASS", "Payment processed"))
                elif response.status == 400 and "INSUFFICIENT_BALANCE" in str(data):
                    print(f"✅ Wallet payment correctly rejected (insufficient balance)")
                    self.test_results.append(("Wallet Payment API", "PASS", "Insufficient balance check"))
                else:
                    print(f"❌ Wallet payment API failed: {data}")
                    self.test_results.append(("Wallet Payment API", "FAIL", str(data)))
                    
        except Exception as e:
            print(f"❌ Payment integration test failed: {e}")
            self.test_results.append(("Payment Integration", "ERROR", str(e)))
            
    async def test_database_integration(self):
        """Test database integration"""
        print("\n🔄 Testing Database Integration...")
        
        try:
            # Test if we can access user data
            async with self.session.get(
                f"{self.base_url}/api/auth/me",
                headers=self.get_auth_headers()
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    if data.get("success"):
                        user_data = data.get("data", {})
                        print(f"✅ User data retrieved: {user_data.get('email', 'Unknown')}")
                        self.test_results.append(("User Data API", "PASS", user_data.get('email', 'Unknown')))
                    else:
                        print(f"❌ User data API failed: {data}")
                        self.test_results.append(("User Data API", "FAIL", str(data)))
                else:
                    print(f"❌ User data API returned {response.status}")
                    self.test_results.append(("User Data API", "FAIL", f"HTTP {response.status}"))
                    
        except Exception as e:
            print(f"❌ Database integration test failed: {e}")
            self.test_results.append(("Database Integration", "ERROR", str(e)))
            
    async def run_all_tests(self):
        """Run all integration tests"""
        print("🚀 Starting Frontend Integration Tests...")
        print("=" * 60)
        
        await self.setup_session()
        
        try:
            # Authenticate first
            if await self.authenticate_test_user():
                print("✅ Test user authenticated successfully")
                
                # Run all integration tests
                await self.test_wallet_integration()
                await self.test_events_integration()
                await self.test_payment_integration()
                await self.test_database_integration()
                
            else:
                print("❌ Failed to authenticate test user")
                self.test_results.append(("Authentication", "FAIL", "Could not authenticate"))
                
        finally:
            await self.cleanup_session()
            
        # Print summary
        self.print_test_summary()
        
    def print_test_summary(self):
        """Print test results summary"""
        print("\n" + "=" * 60)
        print("📊 FRONTEND INTEGRATION TEST RESULTS")
        print("=" * 60)
        
        passed = sum(1 for _, status, _ in self.test_results if status == "PASS")
        failed = sum(1 for _, status, _ in self.test_results if status == "FAIL")
        errors = sum(1 for _, status, _ in self.test_results if status == "ERROR")
        total = len(self.test_results)
        
        print(f"\n📈 SUMMARY:")
        print(f"   Total Tests: {total}")
        print(f"   ✅ Passed: {passed}")
        print(f"   ❌ Failed: {failed}")
        print(f"   🔥 Errors: {errors}")
        
        if total > 0:
            success_rate = (passed / total) * 100
            print(f"   📊 Success Rate: {success_rate:.1f}%")
            
        print(f"\n📋 DETAILED RESULTS:")
        for test_name, status, details in self.test_results:
            status_icon = "✅" if status == "PASS" else "❌" if status == "FAIL" else "🔥"
            print(f"   {status_icon} {test_name}: {details}")
            
        print(f"\n🎯 INTEGRATION STATUS:")
        if success_rate >= 90:
            print("   🎉 EXCELLENT - Frontend fully integrated with backend!")
        elif success_rate >= 75:
            print("   ✅ GOOD - Most components integrated, minor issues remain")
        elif success_rate >= 50:
            print("   ⚠️  PARTIAL - Some integration working, significant work needed")
        else:
            print("   ❌ POOR - Major integration issues, requires immediate attention")
            
        print("\n" + "=" * 60)

async def main():
    """Main test execution"""
    tester = FrontendIntegrationTester()
    await tester.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())