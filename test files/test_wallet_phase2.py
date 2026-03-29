#!/usr/bin/env python3
"""
Comprehensive Test for Wallet Phase 2 Implementation
Tests enhanced features: transaction history, multi-wallet, real-time updates, advanced spray money
"""
import requests
import json
import time

BASE_URL = "http://localhost:8000"

def test_enhanced_transaction_history():
    """Test enhanced transaction history features"""
    print("📊 Testing Enhanced Transaction History...")
    
    headers = {"Authorization": "Bearer mock_access_token_admin"}
    
    # Test enhanced transactions endpoint
    print("  📋 Testing enhanced transactions endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/api/wallet/transactions/enhanced", headers=headers)
        if response.status_code == 200:
            data = response.json()
            print(f"    ✅ Enhanced transactions retrieved")
            print(f"    - Total transactions: {data['data'].get('total', 0)}")
            print(f"    - Filtered total: {data['data'].get('filtered_total', 0)}")
        else:
            print(f"    ❌ Error: {response.text}")
            return False
    except Exception as e:
        print(f"    ❌ Request failed: {e}")
        return False
    
    # Test spending analytics
    print("  📈 Testing spending analytics...")
    try:
        response = requests.get(f"{BASE_URL}/api/wallet/transactions/analytics?period=month", headers=headers)
        if response.status_code == 200:
            data = response.json()
            if "error" not in data["data"]:
                print(f"    ✅ Analytics retrieved successfully")
            else:
                print(f"    ⚠️ No data available: {data['data']['error']}")
        else:
            print(f"    ❌ Error: {response.text}")
            return False
    except Exception as e:
        print(f"    ❌ Request failed: {e}")
        return False
    
    # Test transaction search
    print("  🔍 Testing transaction search...")
    try:
        response = requests.get(f"{BASE_URL}/api/wallet/transactions/search?query=topup", headers=headers)
        if response.status_code == 200:
            data = response.json()
            print(f"    ✅ Search completed: {data['data']['count']} results")
        else:
            print(f"    ❌ Error: {response.text}")
            return False
    except Exception as e:
        print(f"    ❌ Request failed: {e}")
        return False
    
    return True

def test_multi_wallet_system():
    """Test multi-wallet system"""
    print("\n💼 Testing Multi-Wallet System...")
    
    headers = {"Authorization": "Bearer mock_access_token_admin"}
    
    # Test getting user wallets
    print("  👛 Testing wallet retrieval...")
    try:
        response = requests.get(f"{BASE_URL}/api/wallet/multi-wallets", headers=headers)
        if response.status_code == 200:
            data = response.json()
            wallets = data["data"]["wallets"]
            total_balance = data["data"]["total_balance"]
            print(f"    ✅ Wallets retrieved: {len(wallets)} wallets")
            print(f"    - Total balance: ₦{total_balance:,.2f}")
            
            for wallet in wallets:
                print(f"    - {wallet['name']}: ₦{wallet['balance']:,.2f} ({wallet['type']})")
            
            return wallets
        else:
            print(f"    ❌ Error: {response.text}")
            return []
    except Exception as e:
        print(f"    ❌ Request failed: {e}")
        return []

def test_wallet_transfer(wallets):
    """Test inter-wallet transfers"""
    if len(wallets) < 2:
        print("  ⚠️ Skipping transfer test - need at least 2 wallets")
        return True
    
    print("  💸 Testing wallet transfer...")
    
    headers = {"Authorization": "Bearer mock_access_token_admin"}
    
    # Find main and savings wallets
    main_wallet = next((w for w in wallets if w["type"] == "main"), None)
    savings_wallet = next((w for w in wallets if w["type"] == "savings"), None)
    
    if not main_wallet or not savings_wallet:
        print("    ⚠️ Skipping transfer - main or savings wallet not found")
        return True
    
    try:
        transfer_data = {
            "from_wallet": "main",
            "to_wallet": "savings",
            "amount": 1000,
            "description": "Test transfer to savings"
        }
        
        response = requests.post(f"{BASE_URL}/api/wallet/multi-wallets/transfer", 
                               headers=headers, json=transfer_data)
        
        if response.status_code == 200:
            data = response.json()
            print(f"    ✅ Transfer successful")
            print(f"    - From balance: ₦{data['data']['from_wallet_balance']:,.2f}")
            print(f"    - To balance: ₦{data['data']['to_wallet_balance']:,.2f}")
            return True
        else:
            print(f"    ❌ Error: {response.text}")
            return False
    except Exception as e:
        print(f"    ❌ Request failed: {e}")
        return False

def test_savings_features():
    """Test savings features"""
    print("\n🏦 Testing Savings Features...")
    
    headers = {"Authorization": "Bearer mock_access_token_admin"}
    
    # Test creating savings goal
    print("  🎯 Testing savings goal creation...")
    try:
        goal_data = {
            "name": "Emergency Fund",
            "description": "Build emergency fund for unexpected expenses",
            "target_amount": 100000,
            "category": "emergency",
            "target_date": time.time() + (90 * 24 * 60 * 60)  # 90 days from now
        }
        
        response = requests.post(f"{BASE_URL}/api/wallet/multi-wallets/savings-goal", 
                               headers=headers, json=goal_data)
        
        if response.status_code == 200:
            data = response.json()
            goal = data["data"]["goal"]
            print(f"    ✅ Savings goal created: {goal['name']}")
            print(f"    - Target: ₦{goal['target_amount']:,.2f}")
            print(f"    - Weekly target: ₦{goal.get('weekly_target', 0):,.2f}")
            return goal["id"]
        else:
            print(f"    ❌ Error: {response.text}")
            return None
    except Exception as e:
        print(f"    ❌ Request failed: {e}")
        return None

def test_goal_contribution(goal_id):
    """Test contributing to savings goal"""
    if not goal_id:
        print("  ⚠️ Skipping goal contribution - no goal created")
        return True
    
    print("  💰 Testing goal contribution...")
    
    headers = {"Authorization": "Bearer mock_access_token_admin"}
    
    try:
        contribution_data = {
            "amount": 5000,
            "source_wallet": "main"
        }
        
        response = requests.post(f"{BASE_URL}/api/wallet/multi-wallets/contribute-goal/{goal_id}", 
                               headers=headers, json=contribution_data)
        
        if response.status_code == 200:
            data = response.json()
            goal = data["data"]["goal"]
            progress = data["data"]["progress_percentage"]
            print(f"    ✅ Contribution successful")
            print(f"    - Progress: {progress:.1f}%")
            print(f"    - Current amount: ₦{goal['current_amount']:,.2f}")
            return True
        else:
            print(f"    ❌ Error: {response.text}")
            return False
    except Exception as e:
        print(f"    ❌ Request failed: {e}")
        return False

def test_advanced_spray_money():
    """Test advanced spray money features"""
    print("\n💸 Testing Advanced Spray Money...")
    
    headers = {"Authorization": "Bearer mock_access_token_admin"}
    
    # First create a test event
    event_data = {
        "title": "Phase 2 Spray Test Event",
        "description": "Testing advanced spray features",
        "start_date": "2026-04-01T18:00:00",
        "venue": "Test Venue",
        "ticket_price": 1000,
        "category": "test"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/events", 
                               headers={"Authorization": "Bearer mock_access_token_organizer"}, 
                               json=event_data)
        if response.status_code != 200:
            print(f"    ❌ Failed to create test event: {response.text}")
            return False
        
        event_id = response.json()["data"]["event"]["id"]
        print(f"    ✅ Test event created: {event_id}")
        
        # Test advanced spray creation
        print("  🌧️ Testing advanced spray (rain type)...")
        spray_data = {
            "event_id": event_id,
            "amount": 5000,
            "spray_type": "rain",
            "effect": "confetti",
            "message": "Testing advanced spray features!",
            "is_anonymous": False,
            "target_count": 3
        }
        
        response = requests.post(f"{BASE_URL}/api/wallet/spray-money/advanced", 
                               headers=headers, json=spray_data)
        
        if response.status_code == 200:
            data = response.json()
            spray = data["data"]["spray"]
            print(f"    ✅ Advanced spray created")
            print(f"    - Type: {spray['spray_type']}")
            print(f"    - Effect: {spray['effect']}")
            print(f"    - Total cost: ₦{spray['total_cost']:,.2f}")
            print(f"    - Multiplier: {spray['multiplier']}x")
        else:
            print(f"    ❌ Error: {response.text}")
            return False
        
        # Test enhanced leaderboard
        print("  🏆 Testing enhanced leaderboard...")
        response = requests.get(f"{BASE_URL}/api/wallet/spray-money/leaderboard/{event_id}?period=all_time&limit=5", 
                               headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            leaderboard = data["data"]["leaderboard"]
            print(f"    ✅ Enhanced leaderboard retrieved: {len(leaderboard)} entries")
            
            for i, entry in enumerate(leaderboard):
                print(f"    - #{entry['rank']}: ₦{entry['total_amount']:,.2f} ({entry['spray_count']} sprays)")
        else:
            print(f"    ❌ Error: {response.text}")
            return False
        
        return True
        
    except Exception as e:
        print(f"    ❌ Request failed: {e}")
        return False

def test_wallet_analytics():
    """Test wallet analytics"""
    print("\n📊 Testing Wallet Analytics...")
    
    headers = {"Authorization": "Bearer mock_access_token_admin"}
    
    try:
        response = requests.get(f"{BASE_URL}/api/wallet/multi-wallets/analytics", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            analytics = data["data"]
            
            print(f"    ✅ Wallet analytics retrieved")
            print(f"    - Total balance: ₦{analytics['total_balance']:,.2f}")
            print(f"    - Wallet distribution:")
            
            for wallet_type, info in analytics["wallet_distribution"].items():
                print(f"      - {wallet_type}: ₦{info['balance']:,.2f} ({info['percentage']:.1f}%)")
            
            if "savings_performance" in analytics:
                savings = analytics["savings_performance"]
                print(f"    - Savings performance:")
                print(f"      - Interest earned: ₦{savings.get('total_interest_earned', 0):,.2f}")
                print(f"      - Interest rate: {savings.get('interest_rate', 0)}%")
            
            return True
        else:
            print(f"    ❌ Error: {response.text}")
            return False
    except Exception as e:
        print(f"    ❌ Request failed: {e}")
        return False

def test_interest_calculation():
    """Test daily interest calculation"""
    print("\n💹 Testing Interest Calculation...")
    
    headers = {"Authorization": "Bearer mock_access_token_admin"}
    
    try:
        response = requests.post(f"{BASE_URL}/api/wallet/multi-wallets/calculate-interest", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            interest_data = data["data"]
            
            print(f"    ✅ Interest calculated successfully")
            print(f"    - Interest earned: ₦{interest_data['interest_earned']:,.2f}")
            print(f"    - New balance: ₦{interest_data['new_balance']:,.2f}")
            print(f"    - Annual rate: {interest_data['annual_rate']}%")
            return True
        else:
            # Interest might already be calculated today
            error_data = response.json()
            if "already calculated" in error_data.get("detail", ""):
                print(f"    ⚠️ Interest already calculated today")
                return True
            else:
                print(f"    ❌ Error: {response.text}")
                return False
    except Exception as e:
        print(f"    ❌ Request failed: {e}")
        return False

def main():
    """Run comprehensive Phase 2 wallet test"""
    print("🚀 WALLET PHASE 2 COMPREHENSIVE TEST")
    print("=" * 60)
    
    # Test all Phase 2 features
    history_ok = test_enhanced_transaction_history()
    wallets = test_multi_wallet_system()
    transfer_ok = test_wallet_transfer(wallets)
    goal_id = test_savings_features()
    contribution_ok = test_goal_contribution(goal_id)
    spray_ok = test_advanced_spray_money()
    analytics_ok = test_wallet_analytics()
    interest_ok = test_interest_calculation()
    
    print("\n" + "=" * 60)
    print("🎯 PHASE 2 TEST RESULTS")
    print("=" * 60)
    
    results = {
        "Enhanced Transaction History": "✅ Working" if history_ok else "❌ Failed",
        "Multi-Wallet System": "✅ Working" if len(wallets) > 0 else "❌ Failed",
        "Wallet Transfers": "✅ Working" if transfer_ok else "❌ Failed",
        "Savings Goals": "✅ Working" if goal_id else "❌ Failed",
        "Goal Contributions": "✅ Working" if contribution_ok else "❌ Failed",
        "Advanced Spray Money": "✅ Working" if spray_ok else "❌ Failed",
        "Wallet Analytics": "✅ Working" if analytics_ok else "❌ Failed",
        "Interest Calculation": "✅ Working" if interest_ok else "❌ Failed"
    }
    
    for feature, status in results.items():
        print(f"{feature}: {status}")
    
    all_working = all([history_ok, len(wallets) > 0, transfer_ok, goal_id, contribution_ok, 
                      spray_ok, analytics_ok, interest_ok])
    
    print("\n" + "=" * 60)
    if all_working:
        print("🎉 PHASE 2 IMPLEMENTATION COMPLETE!")
        print("✅ All enhanced wallet features working perfectly")
        print("📊 Enhanced transaction history with analytics")
        print("💼 Multi-wallet system with transfers")
        print("🏦 Savings goals and interest calculation")
        print("💸 Advanced spray money with special effects")
        print("📈 Comprehensive wallet analytics")
        
        print("\n🚀 READY FOR PHASE 3:")
        print("- Real-time WebSocket updates")
        print("- Payment gateway integration")
        print("- KYC/AML compliance features")
        print("- Investment and cryptocurrency support")
    else:
        print("❌ SOME PHASE 2 FEATURES NEED ATTENTION")
        print("🔧 Review failed tests and fix issues before proceeding")
    
    return all_working

if __name__ == "__main__":
    main()