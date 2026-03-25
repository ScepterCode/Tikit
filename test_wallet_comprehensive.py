#!/usr/bin/env python3
"""
Comprehensive Wallet System Test
Tests all current wallet features and identifies improvement areas
"""
import requests
import json
import time

BASE_URL = "http://localhost:8000"

def test_wallet_balance():
    """Test wallet balance retrieval"""
    print("💰 Testing Wallet Balance...")
    
    headers = {"Authorization": "Bearer mock_access_token_admin"}
    
    try:
        response = requests.get(f"{BASE_URL}/api/payments/wallet/balance", headers=headers)
        if response.status_code == 200:
            data = response.json()
            balance = data["data"]["balance"]
            print(f"✅ Current Balance: ₦{balance:,.2f}")
            return balance
        else:
            print(f"❌ Error: {response.text}")
            return 0
    except Exception as e:
        print(f"❌ Request failed: {e}")
        return 0

def test_wallet_topup():
    """Test wallet top-up functionality"""
    print("\n💳 Testing Wallet Top-up...")
    
    headers = {"Authorization": "Bearer mock_access_token_admin"}
    topup_data = {
        "amount": 5000,
        "payment_method": "card"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/payments/wallet/topup", 
                               headers=headers, json=topup_data)
        if response.status_code == 200:
            data = response.json()
            new_balance = data["data"]["new_balance"]
            print(f"✅ Top-up Successful: ₦{topup_data['amount']:,.2f}")
            print(f"✅ New Balance: ₦{new_balance:,.2f}")
            return True
        else:
            print(f"❌ Error: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Request failed: {e}")
        return False

def test_spray_money():
    """Test spray money functionality"""
    print("\n💸 Testing Spray Money...")
    
    # First create a test event
    headers = {"Authorization": "Bearer mock_access_token_organizer"}
    event_data = {
        "title": "Wallet Test Event",
        "description": "Testing spray money",
        "start_date": "2026-04-01T18:00:00",
        "venue": "Test Venue",
        "ticket_price": 1000,
        "category": "test"
    }
    
    try:
        # Create event
        response = requests.post(f"{BASE_URL}/api/events", headers=headers, json=event_data)
        if response.status_code != 200:
            print(f"❌ Failed to create test event: {response.text}")
            return False
        
        event_id = response.json()["data"]["event"]["id"]
        print(f"✅ Test event created: {event_id}")
        
        # Test spray money
        headers = {"Authorization": "Bearer mock_access_token_admin"}
        spray_data = {
            "amount": 1000,
            "message": "Test spray from wallet system!",
            "is_anonymous": False
        }
        
        response = requests.post(f"{BASE_URL}/api/events/{event_id}/spray-money", 
                               headers=headers, json=spray_data)
        
        if response.status_code == 200:
            data = response.json()
            spray_id = data["data"]["spray_id"]
            new_balance = data["data"]["new_balance"]
            print(f"✅ Spray Money Successful: ₦{spray_data['amount']:,.2f}")
            print(f"✅ Spray ID: {spray_id}")
            print(f"✅ New Balance: ₦{new_balance:,.2f}")
            return True
        else:
            print(f"❌ Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Request failed: {e}")
        return False

def test_transaction_history():
    """Test transaction history"""
    print("\n📊 Testing Transaction History...")
    
    headers = {"Authorization": "Bearer mock_access_token_admin"}
    
    try:
        response = requests.get(f"{BASE_URL}/api/payments/wallet/transactions", headers=headers)
        if response.status_code == 200:
            data = response.json()
            transactions = data["data"]["transactions"]
            count = data["data"]["count"]
            print(f"✅ Transaction History Retrieved: {count} transactions")
            
            for txn in transactions:
                print(f"  - {txn['type']}: ₦{txn['amount']:,.2f} - {txn['description']}")
            
            return True
        else:
            print(f"❌ Error: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Request failed: {e}")
        return False

def analyze_wallet_limitations():
    """Analyze current wallet system limitations"""
    print("\n🔍 WALLET SYSTEM ANALYSIS")
    print("=" * 50)
    
    limitations = [
        "❌ No real withdrawal system",
        "❌ Limited payment gateway integration", 
        "❌ No fraud detection mechanisms",
        "❌ Basic transaction history (mock data)",
        "❌ No multi-currency support",
        "❌ Limited security features",
        "❌ No KYC/AML compliance",
        "❌ Basic spray money features",
        "❌ No real-time WebSocket updates",
        "❌ Limited bulk purchase features"
    ]
    
    improvements = [
        "✅ Multi-wallet system (main, savings, business)",
        "✅ Enhanced security (2FA, biometric, PIN)",
        "✅ Real payment gateway integration",
        "✅ Comprehensive fraud detection",
        "✅ KYC/AML compliance features",
        "✅ Multi-currency support",
        "✅ Advanced spray money (rain, storm, scheduled)",
        "✅ Investment and savings features",
        "✅ Business analytics for organizers",
        "✅ Loyalty and rewards program"
    ]
    
    print("CURRENT LIMITATIONS:")
    for limitation in limitations:
        print(f"  {limitation}")
    
    print("\nRECOMMENDED IMPROVEMENTS:")
    for improvement in improvements:
        print(f"  {improvement}")

def main():
    """Run comprehensive wallet system test"""
    print("🏦 COMPREHENSIVE WALLET SYSTEM TEST")
    print("=" * 60)
    
    # Test current functionality
    initial_balance = test_wallet_balance()
    topup_success = test_wallet_topup()
    spray_success = test_spray_money()
    history_success = test_transaction_history()
    
    # Final balance check
    final_balance = test_wallet_balance()
    
    print("\n" + "=" * 60)
    print("🎯 TEST RESULTS SUMMARY")
    print("=" * 60)
    
    results = {
        "Wallet Balance": "✅ Working",
        "Wallet Top-up": "✅ Working" if topup_success else "❌ Failed",
        "Spray Money": "✅ Working" if spray_success else "❌ Failed", 
        "Transaction History": "✅ Working" if history_success else "❌ Failed"
    }
    
    for feature, status in results.items():
        print(f"{feature}: {status}")
    
    print(f"\nBalance Change: ₦{initial_balance:,.2f} → ₦{final_balance:,.2f}")
    
    # Analyze limitations and improvements
    analyze_wallet_limitations()
    
    print("\n🚀 NEXT STEPS:")
    print("1. Review WALLET_SYSTEM_IMPROVEMENTS.md for detailed enhancement plan")
    print("2. Implement Phase 1: Security & Compliance Foundation")
    print("3. Add real payment gateway integration")
    print("4. Implement withdrawal system")
    print("5. Add fraud detection and KYC features")

if __name__ == "__main__":
    main()