#!/usr/bin/env python3
"""
Comprehensive Test Suite for Unified Wallet Service
Tests all consolidated wallet operations
"""
import asyncio
import time
import sys
import os

# Add the backend-fastapi directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'apps', 'backend-fastapi'))

from services.unified_wallet_service import UnifiedWalletService
from services.wallet_models import WalletType, TransactionType, WithdrawalMethod

class TestUnifiedWalletService:
    def __init__(self):
        self.service = UnifiedWalletService()
        self.test_user_id = "test_user_123"
        self.test_results = []

    def log_test(self, test_name: str, success: bool, message: str = ""):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        self.test_results.append({
            "test": test_name,
            "success": success,
            "message": message
        })
        print(f"{status} {test_name}: {message}")

    def test_wallet_initialization(self):
        """Test wallet initialization for new user"""
        print("\n🧪 Testing Wallet Initialization...")
        
        # Initialize wallets for test user
        result = self.service.initialize_user_wallets(self.test_user_id, {
            "initial_balance": 10000,
            "role": "organizer"
        })
        
        self.log_test(
            "Wallet Initialization",
            result["success"],
            f"Created wallets: {list(result.get('wallets', {}).keys()) if result['success'] else result.get('error', '')}"
        )
        
        # Verify wallets were created
        wallets_result = self.service.get_user_wallets(self.test_user_id)
        if wallets_result["success"]:
            wallets = wallets_result["data"]["wallets"]
            wallet_types = [w["type"] for w in wallets]
            
            self.log_test(
                "Main Wallet Created",
                WalletType.MAIN in wallet_types,
                f"Main wallet balance: ₦{next((w['balance'] for w in wallets if w['type'] == WalletType.MAIN), 0):,.2f}"
            )
            
            self.log_test(
                "Savings Wallet Created",
                WalletType.SAVINGS in wallet_types,
                "Savings wallet with interest rate configured"
            )
            
            self.log_test(
                "Business Wallet Created",
                WalletType.BUSINESS in wallet_types,
                "Business wallet for organizer role"
            )

    def test_balance_operations(self):
        """Test balance checking and updating"""
        print("\n🧪 Testing Balance Operations...")
        
        # Test balance retrieval
        balance = self.service.get_wallet_balance(self.test_user_id, WalletType.MAIN)
        self.log_test(
            "Balance Retrieval",
            balance > 0,
            f"Main wallet balance: ₦{balance:,.2f}"
        )
        
        # Test balance update (deposit)
        deposit_result = self.service.update_wallet_balance(
            self.test_user_id,
            WalletType.MAIN,
            5000,
            "Test deposit"
        )
        
        self.log_test(
            "Balance Update (Deposit)",
            deposit_result["success"],
            f"New balance: ₦{deposit_result.get('new_balance', 0):,.2f}" if deposit_result["success"] else deposit_result.get("error", "")
        )
        
        # Test balance update (withdrawal)
        withdrawal_result = self.service.update_wallet_balance(
            self.test_user_id,
            WalletType.MAIN,
            -2000,
            "Test withdrawal"
        )
        
        self.log_test(
            "Balance Update (Withdrawal)",
            withdrawal_result["success"],
            f"New balance: ₦{withdrawal_result.get('new_balance', 0):,.2f}" if withdrawal_result["success"] else withdrawal_result.get("error", "")
        )
        
        # Test insufficient balance
        insufficient_result = self.service.update_wallet_balance(
            self.test_user_id,
            WalletType.MAIN,
            -50000,
            "Test insufficient funds"
        )
        
        self.log_test(
            "Insufficient Balance Protection",
            not insufficient_result["success"],
            "Correctly prevented overdraft"
        )

    def test_wallet_transfers(self):
        """Test internal wallet transfers"""
        print("\n🧪 Testing Wallet Transfers...")
        
        # Transfer from main to savings
        transfer_result = self.service.transfer_between_wallets(self.test_user_id, {
            "from_wallet": WalletType.MAIN,
            "to_wallet": WalletType.SAVINGS,
            "amount": 3000,
            "description": "Test transfer to savings"
        })
        
        self.log_test(
            "Main to Savings Transfer",
            transfer_result["success"],
            f"Transferred ₦3,000" if transfer_result["success"] else transfer_result.get("error", "")
        )
        
        if transfer_result["success"]:
            # Verify balances after transfer
            main_balance = self.service.get_wallet_balance(self.test_user_id, WalletType.MAIN)
            savings_balance = self.service.get_wallet_balance(self.test_user_id, WalletType.SAVINGS)
            
            self.log_test(
                "Transfer Balance Verification",
                savings_balance == 3000,
                f"Main: ₦{main_balance:,.2f}, Savings: ₦{savings_balance:,.2f}"
            )
        
        # Test invalid transfer (insufficient funds)
        invalid_transfer = self.service.transfer_between_wallets(self.test_user_id, {
            "from_wallet": WalletType.SAVINGS,
            "to_wallet": WalletType.MAIN,
            "amount": 5000,
            "description": "Test insufficient transfer"
        })
        
        self.log_test(
            "Insufficient Transfer Protection",
            not invalid_transfer["success"],
            "Correctly prevented insufficient funds transfer"
        )

    def test_security_operations(self):
        """Test security features"""
        print("\n🧪 Testing Security Operations...")
        
        # Set transaction PIN
        pin_result = self.service.set_transaction_pin(self.test_user_id, "1234")
        self.log_test(
            "Set Transaction PIN",
            pin_result["success"],
            pin_result.get("message", pin_result.get("error", ""))
        )
        
        # Verify PIN
        pin_valid = self.service.verify_pin(self.test_user_id, "1234")
        self.log_test(
            "PIN Verification (Correct)",
            pin_valid,
            "PIN verified successfully"
        )
        
        # Test wrong PIN
        wrong_pin = self.service.verify_pin(self.test_user_id, "9999")
        self.log_test(
            "PIN Verification (Wrong)",
            not wrong_pin,
            "Correctly rejected wrong PIN"
        )
        
        # Generate OTP
        otp_result = self.service.generate_otp(self.test_user_id, "transaction")
        self.log_test(
            "OTP Generation",
            otp_result["success"],
            f"OTP: {otp_result.get('otp_code', 'N/A')}" if otp_result["success"] else otp_result.get("error", "")
        )
        
        if otp_result["success"]:
            # Verify OTP
            otp_verify = self.service.verify_otp(self.test_user_id, otp_result["otp_code"])
            self.log_test(
                "OTP Verification",
                otp_verify["success"],
                otp_verify.get("message", otp_verify.get("error", ""))
            )
        
        # Get security status
        security_status = self.service.get_security_status(self.test_user_id)
        self.log_test(
            "Security Status",
            security_status["has_transaction_pin"],
            f"PIN set: {security_status['has_transaction_pin']}, Locked: {security_status['is_locked_out']}"
        )

    def test_withdrawal_operations(self):
        """Test withdrawal operations"""
        print("\n🧪 Testing Withdrawal Operations...")
        
        # Add bank account
        bank_account_result = self.service.add_bank_account(self.test_user_id, {
            "account_number": "0123456789",
            "bank_code": "058",
            "account_name": "Test User"
        })
        
        self.log_test(
            "Add Bank Account",
            bank_account_result["success"],
            bank_account_result.get("message", bank_account_result.get("error", ""))
        )
        
        # Get bank accounts
        bank_accounts = self.service.get_user_bank_accounts(self.test_user_id)
        self.log_test(
            "Get Bank Accounts",
            len(bank_accounts) > 0,
            f"Found {len(bank_accounts)} bank account(s)"
        )
        
        # Initiate withdrawal
        withdrawal_result = self.service.initiate_withdrawal(self.test_user_id, {
            "amount": 2000,
            "method": WithdrawalMethod.BANK_TRANSFER,
            "destination": {
                "account_number": "0123456789",
                "bank_code": "058"
            },
            "processing_type": "standard"
        })
        
        self.log_test(
            "Initiate Withdrawal",
            withdrawal_result["success"],
            f"Withdrawal ID: {withdrawal_result.get('withdrawal', {}).get('id', 'N/A')}" if withdrawal_result["success"] else withdrawal_result.get("error", "")
        )
        
        if withdrawal_result["success"]:
            withdrawal_id = withdrawal_result["withdrawal"]["id"]
            
            # Process withdrawal
            process_result = self.service.process_withdrawal(withdrawal_id)
            self.log_test(
                "Process Withdrawal",
                process_result["success"],
                f"Status: {process_result.get('withdrawal', {}).get('status', 'N/A')}" if process_result["success"] else process_result.get("error", "")
            )

    def test_transaction_history(self):
        """Test transaction history"""
        print("\n🧪 Testing Transaction History...")
        
        # Get transaction history
        transactions_result = self.service.get_user_transactions(self.test_user_id, {
            "limit": 20,
            "offset": 0
        })
        
        self.log_test(
            "Get Transaction History",
            transactions_result["success"],
            f"Found {transactions_result.get('data', {}).get('total', 0)} transactions" if transactions_result["success"] else transactions_result.get("error", "")
        )
        
        if transactions_result["success"]:
            transactions = transactions_result["data"]["transactions"]
            
            # Verify transaction types
            transaction_types = set(t["type"] for t in transactions)
            self.log_test(
                "Transaction Types Variety",
                len(transaction_types) > 1,
                f"Types: {', '.join(transaction_types)}"
            )
            
            # Verify transaction data completeness
            if transactions:
                first_tx = transactions[0]
                required_fields = ["id", "user_id", "type", "amount", "description", "created_at"]
                has_all_fields = all(field in first_tx for field in required_fields)
                
                self.log_test(
                    "Transaction Data Completeness",
                    has_all_fields,
                    f"Latest transaction: {first_tx.get('description', 'N/A')}"
                )

    def test_analytics_operations(self):
        """Test analytics features"""
        print("\n🧪 Testing Analytics Operations...")
        
        # Get wallet analytics
        analytics_result = self.service.get_wallet_analytics(self.test_user_id)
        self.log_test(
            "Wallet Analytics",
            analytics_result["success"],
            f"Total balance: ₦{analytics_result.get('data', {}).get('total_balance', 0):,.2f}" if analytics_result["success"] else analytics_result.get("error", "")
        )
        
        # Get spending analytics
        spending_result = self.service.get_spending_analytics(self.test_user_id, "month")
        self.log_test(
            "Spending Analytics",
            spending_result["success"],
            f"Monthly spending: ₦{spending_result.get('data', {}).get('total_spent', 0):,.2f}" if spending_result["success"] else spending_result.get("error", "")
        )
        
        # Get financial health score
        health_result = self.service.get_financial_health_score(self.test_user_id)
        self.log_test(
            "Financial Health Score",
            health_result["success"],
            f"Score: {health_result.get('data', {}).get('score', 0)}/100 ({health_result.get('data', {}).get('health_level', 'N/A')})" if health_result["success"] else health_result.get("error", "")
        )

    def test_interest_calculation(self):
        """Test interest calculation for savings"""
        print("\n🧪 Testing Interest Calculation...")
        
        # Ensure there's money in savings
        if self.service.get_wallet_balance(self.test_user_id, WalletType.SAVINGS) == 0:
            self.service.transfer_between_wallets(self.test_user_id, {
                "from_wallet": WalletType.MAIN,
                "to_wallet": WalletType.SAVINGS,
                "amount": 5000,
                "description": "Transfer for interest test"
            })
        
        # Manually set last interest calculation to yesterday for testing
        if self.test_user_id in self.service.wallets and WalletType.SAVINGS in self.service.wallets[self.test_user_id]:
            yesterday = time.time() - (25 * 60 * 60)  # 25 hours ago
            self.service.wallets[self.test_user_id][WalletType.SAVINGS]["last_interest_calculation"] = yesterday
        
        # Calculate interest
        interest_result = self.service.calculate_interest(self.test_user_id)
        self.log_test(
            "Interest Calculation",
            interest_result["success"],
            f"Interest earned: ₦{interest_result.get('data', {}).get('interest_amount', 0):.2f}" if interest_result["success"] else interest_result.get("error", "")
        )

    def test_service_status(self):
        """Test service status and statistics"""
        print("\n🧪 Testing Service Status...")
        
        status = self.service.get_service_status()
        self.log_test(
            "Service Status",
            status["status"] == "active",
            f"Version: {status['version']}, Users: {status['statistics']['total_users']}"
        )
        
        # Test backup and restore
        backup = self.service.backup_user_data(self.test_user_id)
        self.log_test(
            "Data Backup",
            "wallets" in backup and "transactions" in backup,
            f"Backed up {len(backup.get('wallets', {}))} wallets and {len(backup.get('transactions', []))} transactions"
        )

    async def test_realtime_operations(self):
        """Test real-time operations (mock WebSocket)"""
        print("\n🧪 Testing Real-time Operations...")
        
        # Mock WebSocket class for testing
        class MockWebSocket:
            def __init__(self):
                self.messages = []
                self.closed = False
            
            async def accept(self):
                pass
            
            async def send_text(self, message):
                if not self.closed:
                    self.messages.append(message)
            
            def close(self):
                self.closed = True
        
        mock_ws = MockWebSocket()
        
        # Test connection
        try:
            await self.service.connect_user_realtime(mock_ws, self.test_user_id, ["balance", "transactions"])
            self.log_test(
                "Real-time Connection",
                True,
                "WebSocket connection established"
            )
        except Exception as e:
            self.log_test(
                "Real-time Connection",
                False,
                f"Connection failed: {str(e)}"
            )
        
        # Test broadcast
        try:
            await self.service.broadcast_wallet_update(self.test_user_id, "balance", {
                "wallet_type": WalletType.MAIN,
                "new_balance": 10000
            })
            
            self.log_test(
                "Real-time Broadcast",
                len(mock_ws.messages) > 0,
                f"Sent {len(mock_ws.messages)} message(s)"
            )
        except Exception as e:
            self.log_test(
                "Real-time Broadcast",
                False,
                f"Broadcast failed: {str(e)}"
            )
        
        # Test disconnection
        try:
            await self.service.disconnect_user_realtime(mock_ws)
            self.log_test(
                "Real-time Disconnection",
                True,
                "WebSocket disconnected successfully"
            )
        except Exception as e:
            self.log_test(
                "Real-time Disconnection",
                False,
                f"Disconnection failed: {str(e)}"
            )

    def cleanup_test_data(self):
        """Clean up test data"""
        print("\n🧹 Cleaning up test data...")
        self.service.clear_user_data(self.test_user_id)
        print("✅ Test data cleaned up")

    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*60)
        print("🧪 UNIFIED WALLET SERVICE TEST SUMMARY")
        print("="*60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests*100):.1f}%")
        
        if failed_tests > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  • {result['test']}: {result['message']}")
        
        print("\n" + "="*60)
        
        return failed_tests == 0

async def main():
    """Run all tests"""
    print("🚀 Starting Unified Wallet Service Tests...")
    print("="*60)
    
    tester = TestUnifiedWalletService()
    
    try:
        # Run all tests
        tester.test_wallet_initialization()
        tester.test_balance_operations()
        tester.test_wallet_transfers()
        tester.test_security_operations()
        tester.test_withdrawal_operations()
        tester.test_transaction_history()
        tester.test_analytics_operations()
        tester.test_interest_calculation()
        tester.test_service_status()
        await tester.test_realtime_operations()
        
        # Print summary
        success = tester.print_summary()
        
        # Cleanup
        tester.cleanup_test_data()
        
        if success:
            print("🎉 All tests passed! Unified Wallet Service is ready for deployment.")
            return 0
        else:
            print("⚠️  Some tests failed. Please review and fix issues before deployment.")
            return 1
            
    except Exception as e:
        print(f"\n💥 Test suite crashed: {str(e)}")
        tester.cleanup_test_data()
        return 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    exit(exit_code)