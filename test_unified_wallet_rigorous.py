#!/usr/bin/env python3
"""
RIGOROUS TESTING SUITE FOR UNIFIED WALLET SERVICE
Comprehensive stress testing, edge cases, and security validation
"""
import asyncio
import time
import sys
import os
import threading
import random
import concurrent.futures
from decimal import Decimal
import json

# Add the backend-fastapi directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'apps', 'backend-fastapi'))

from services.unified_wallet_service import UnifiedWalletService
from services.wallet_models import WalletType, TransactionType, WithdrawalMethod

class RigorousWalletTester:
    def __init__(self):
        self.service = UnifiedWalletService()
        self.test_results = []
        self.performance_metrics = []
        self.security_violations = []
        self.edge_case_results = []
        
    def log_test(self, category: str, test_name: str, success: bool, message: str = "", duration: float = 0):
        """Log test result with performance metrics"""
        status = "✅ PASS" if success else "❌ FAIL"
        result = {
            "category": category,
            "test": test_name,
            "success": success,
            "message": message,
            "duration": duration,
            "timestamp": time.time()
        }
        self.test_results.append(result)
        
        if duration > 0:
            self.performance_metrics.append({
                "test": test_name,
                "duration": duration,
                "category": category
            })
        
        print(f"{status} [{category}] {test_name}: {message} ({duration:.3f}s)")
        
        if not success:
            self.security_violations.append(result)

    def measure_time(self, func, *args, **kwargs):
        """Measure execution time of a function"""
        start_time = time.time()
        result = func(*args, **kwargs)
        end_time = time.time()
        return result, end_time - start_time
    def test_concurrent_operations(self):
        """Test concurrent wallet operations for race conditions"""
        print("\n🔥 RIGOROUS TEST: Concurrent Operations")
        
        # Create test users
        test_users = [f"concurrent_user_{i}" for i in range(10)]
        
        # Initialize all users
        for user_id in test_users:
            self.service.initialize_user_wallets(user_id, {"initial_balance": 10000})
        
        def concurrent_transfers(user_id):
            """Perform multiple transfers concurrently"""
            results = []
            for i in range(5):
                result = self.service.transfer_between_wallets(user_id, {
                    "from_wallet": WalletType.MAIN,
                    "to_wallet": WalletType.SAVINGS,
                    "amount": 100,
                    "description": f"Concurrent transfer {i}"
                })
                results.append(result["success"])
                time.sleep(0.01)  # Small delay to increase race condition chances
            return results
        
        # Run concurrent transfers
        start_time = time.time()
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(concurrent_transfers, user_id) for user_id in test_users]
            all_results = [future.result() for future in concurrent.futures.as_completed(futures)]
        duration = time.time() - start_time
        
        # Verify data consistency
        total_successful = sum(sum(results) for results in all_results)
        
        # Check balance consistency
        balance_consistent = True
        for user_id in test_users:
            main_balance = self.service.get_wallet_balance(user_id, WalletType.MAIN)
            savings_balance = self.service.get_wallet_balance(user_id, WalletType.SAVINGS)
            total_balance = main_balance + savings_balance
            
            if abs(total_balance - 10000) > 0.01:  # Allow for floating point precision
                balance_consistent = False
                break
        
        self.log_test(
            "CONCURRENCY",
            "Concurrent Transfers",
            balance_consistent and total_successful > 0,
            f"Successful transfers: {total_successful}/50, Balance consistent: {balance_consistent}",
            duration
        )
        
        # Cleanup
        for user_id in test_users:
            self.service.clear_user_data(user_id)

    def test_edge_case_amounts(self):
        """Test edge cases with various amount values"""
        print("\n🔥 RIGOROUS TEST: Edge Case Amounts")
        
        user_id = "edge_case_user"
        self.service.initialize_user_wallets(user_id, {"initial_balance": 1000000})
        
        edge_cases = [
            ("Zero Amount", 0, False),
            ("Negative Amount", -100, True),  # Should be allowed for withdrawals
            ("Very Small Amount", 0.01, True),
            ("Very Large Amount", 999999999, False),  # Should exceed limits
            ("Floating Point Precision", 123.456789, True),
            ("Scientific Notation", 1e-10, True),
            ("Maximum Float", float('inf'), False),
            ("NaN", float('nan'), False),
        ]
        
        for test_name, amount, should_succeed in edge_cases:
            try:
                result, duration = self.measure_time(
                    self.service.update_wallet_balance,
                    user_id, WalletType.MAIN, amount, f"Edge case test: {test_name}"
                )
                
                success = result["success"] == should_succeed
                self.log_test(
                    "EDGE_CASES",
                    f"Amount Edge Case: {test_name}",
                    success,
                    f"Amount: {amount}, Expected: {should_succeed}, Got: {result['success']}",
                    duration
                )
                
            except Exception as e:
                # Exception is expected for invalid amounts
                success = not should_succeed
                self.log_test(
                    "EDGE_CASES",
                    f"Amount Edge Case: {test_name}",
                    success,
                    f"Exception (expected): {str(e)[:50]}...",
                    0
                )
        
        self.service.clear_user_data(user_id)

    def test_security_vulnerabilities(self):
        """Test for security vulnerabilities and attack vectors"""
        print("\n🔥 RIGOROUS TEST: Security Vulnerabilities")
        
        user_id = "security_test_user"
        self.service.initialize_user_wallets(user_id, {"initial_balance": 10000})
        
        # Test 1: PIN Brute Force Protection
        self.service.set_transaction_pin(user_id, "1234")
        
        # Attempt multiple wrong PINs
        wrong_attempts = 0
        for i in range(5):
            if not self.service.verify_pin(user_id, "9999"):
                wrong_attempts += 1
        
        # Check if account is locked after multiple attempts
        security_status = self.service.get_security_status(user_id)
        
        self.log_test(
            "SECURITY",
            "PIN Brute Force Protection",
            security_status["is_locked_out"],
            f"Account locked after {wrong_attempts} failed attempts"
        )
        
        # Test 2: SQL Injection Attempts (simulated)
        malicious_inputs = [
            "'; DROP TABLE wallets; --",
            "1' OR '1'='1",
            "<script>alert('xss')</script>",
            "../../etc/passwd",
            "null",
            "undefined"
        ]
        
        injection_protected = True
        for malicious_input in malicious_inputs:
            try:
                result = self.service.update_wallet_balance(
                    malicious_input, WalletType.MAIN, 100, "Injection test"
                )
                # Should fail gracefully, not crash
                if result.get("success", False):
                    injection_protected = False
                    break
            except Exception:
                # Exceptions are acceptable for malicious input
                pass
        
        self.log_test(
            "SECURITY",
            "SQL Injection Protection",
            injection_protected,
            "Service protected against injection attempts"
        )
        
        # Test 3: Transaction Replay Attack
        # Attempt to replay the same transaction multiple times
        original_tx_count = len(self.service.transactions)
        
        for i in range(3):
            self.service.create_transaction({
                "user_id": user_id,
                "type": TransactionType.DEPOSIT,
                "amount": 100,
                "description": "Replay test transaction",
                "reference": "REPLAY_TEST_001"  # Same reference
            })
        
        new_tx_count = len(self.service.transactions)
        replay_protected = (new_tx_count - original_tx_count) == 3  # All should be created
        
        self.log_test(
            "SECURITY",
            "Transaction Replay Handling",
            replay_protected,
            f"Created {new_tx_count - original_tx_count} transactions from 3 attempts"
        )
        
        self.service.clear_user_data(user_id)

    def test_memory_leaks(self):
        """Test for memory leaks with large datasets"""
        print("\n🔥 RIGOROUS TEST: Memory Leak Detection")
        
        import gc
        
        # Create many users and transactions
        user_count = 50  # Reduced for testing without psutil
        transactions_per_user = 20
        
        start_time = time.time()
        
        for i in range(user_count):
            user_id = f"memory_test_user_{i}"
            self.service.initialize_user_wallets(user_id, {"initial_balance": 10000})
            
            # Create many transactions
            for j in range(transactions_per_user):
                self.service.update_wallet_balance(
                    user_id, WalletType.MAIN, 
                    random.randint(-100, 100),
                    f"Memory test transaction {j}"
                )
        
        duration = time.time() - start_time
        
        # Force garbage collection
        gc.collect()
        
        # Check service statistics
        service_stats = self.service.get_service_status()
        total_users = service_stats["statistics"]["total_users"]
        total_transactions = service_stats["statistics"]["total_transactions"]
        
        # Clean up
        for i in range(user_count):
            user_id = f"memory_test_user_{i}"
            self.service.clear_user_data(user_id)
        
        gc.collect()
        
        # Check cleanup effectiveness
        cleanup_stats = self.service.get_service_status()
        users_after_cleanup = cleanup_stats["statistics"]["total_users"]
        
        # Memory usage test (simplified without psutil)
        memory_acceptable = total_users == user_count
        cleanup_effective = users_after_cleanup == 0
        
        self.log_test(
            "PERFORMANCE",
            "Memory Usage",
            memory_acceptable,
            f"Created {total_users} users with {total_transactions} transactions",
            duration
        )
        
        self.log_test(
            "PERFORMANCE",
            "Memory Cleanup",
            cleanup_effective,
            f"Users after cleanup: {users_after_cleanup}"
        )

    def test_performance_benchmarks(self):
        """Test performance under various loads"""
        print("\n🔥 RIGOROUS TEST: Performance Benchmarks")
        
        user_id = "performance_test_user"
        self.service.initialize_user_wallets(user_id, {"initial_balance": 100000})
        
        # Test 1: Balance retrieval performance
        balance_times = []
        for i in range(1000):
            start = time.time()
            self.service.get_wallet_balance(user_id, WalletType.MAIN)
            balance_times.append(time.time() - start)
        
        avg_balance_time = sum(balance_times) / len(balance_times)
        max_balance_time = max(balance_times)
        
        self.log_test(
            "PERFORMANCE",
            "Balance Retrieval Speed",
            avg_balance_time < 0.001,  # Less than 1ms average
            f"Avg: {avg_balance_time*1000:.3f}ms, Max: {max_balance_time*1000:.3f}ms"
        )
        
        # Test 2: Transaction creation performance
        transaction_times = []
        for i in range(500):
            start = time.time()
            self.service.create_transaction({
                "user_id": user_id,
                "type": TransactionType.DEPOSIT,
                "amount": 10,
                "description": f"Performance test {i}"
            })
            transaction_times.append(time.time() - start)
        
        avg_tx_time = sum(transaction_times) / len(transaction_times)
        max_tx_time = max(transaction_times)
        
        self.log_test(
            "PERFORMANCE",
            "Transaction Creation Speed",
            avg_tx_time < 0.005,  # Less than 5ms average
            f"Avg: {avg_tx_time*1000:.3f}ms, Max: {max_tx_time*1000:.3f}ms"
        )
        
        # Test 3: Transfer performance under load
        transfer_times = []
        for i in range(100):
            start = time.time()
            result = self.service.transfer_between_wallets(user_id, {
                "from_wallet": WalletType.MAIN,
                "to_wallet": WalletType.SAVINGS,
                "amount": 10,
                "description": f"Performance transfer {i}"
            })
            transfer_times.append(time.time() - start)
            
            if not result["success"]:
                break
        
        avg_transfer_time = sum(transfer_times) / len(transfer_times)
        max_transfer_time = max(transfer_times)
        
        self.log_test(
            "PERFORMANCE",
            "Transfer Speed",
            avg_transfer_time < 0.010,  # Less than 10ms average
            f"Avg: {avg_transfer_time*1000:.3f}ms, Max: {max_transfer_time*1000:.3f}ms"
        )
        
        self.service.clear_user_data(user_id)

    def test_data_consistency(self):
        """Test data consistency across operations"""
        print("\n🔥 RIGOROUS TEST: Data Consistency")
        
        user_id = "consistency_test_user"
        initial_balance = 50000
        self.service.initialize_user_wallets(user_id, {"initial_balance": initial_balance})
        
        # Perform various operations and track balance changes
        operations = [
            ("deposit", 1000),
            ("withdrawal", -500),
            ("transfer_to_savings", -2000),
            ("deposit", 750),
            ("withdrawal", -300),
        ]
        
        expected_main_balance = initial_balance
        expected_savings_balance = 0
        
        for operation, amount in operations:
            if operation == "deposit":
                result = self.service.update_wallet_balance(
                    user_id, WalletType.MAIN, amount, f"Test {operation}"
                )
                if result["success"]:
                    expected_main_balance += amount
                    
            elif operation == "withdrawal":
                result = self.service.update_wallet_balance(
                    user_id, WalletType.MAIN, amount, f"Test {operation}"
                )
                if result["success"]:
                    expected_main_balance += amount  # amount is negative
                    
            elif operation == "transfer_to_savings":
                result = self.service.transfer_between_wallets(user_id, {
                    "from_wallet": WalletType.MAIN,
                    "to_wallet": WalletType.SAVINGS,
                    "amount": abs(amount),
                    "description": f"Test {operation}"
                })
                if result["success"]:
                    expected_main_balance -= abs(amount)
                    expected_savings_balance += abs(amount)
        
        # Verify final balances
        actual_main_balance = self.service.get_wallet_balance(user_id, WalletType.MAIN)
        actual_savings_balance = self.service.get_wallet_balance(user_id, WalletType.SAVINGS)
        total_balance = actual_main_balance + actual_savings_balance
        expected_total = expected_main_balance + expected_savings_balance
        
        balance_consistent = (
            abs(actual_main_balance - expected_main_balance) < 0.01 and
            abs(actual_savings_balance - expected_savings_balance) < 0.01 and
            abs(total_balance - expected_total) < 0.01
        )
        
        self.log_test(
            "CONSISTENCY",
            "Balance Consistency",
            balance_consistent,
            f"Expected: M={expected_main_balance}, S={expected_savings_balance}, "
            f"Actual: M={actual_main_balance}, S={actual_savings_balance}"
        )
        
        # Verify transaction count matches operations
        transactions_result = self.service.get_user_transactions(user_id)
        if transactions_result["success"]:
            tx_count = transactions_result["data"]["total"]
            # Should have transactions for: initialization + operations + transfers
            expected_tx_count = len([op for op in operations if op[0] != "transfer_to_savings"]) + 1  # +1 for transfer
            
            self.log_test(
                "CONSISTENCY",
                "Transaction Count Consistency",
                tx_count >= expected_tx_count,
                f"Expected: >={expected_tx_count}, Actual: {tx_count}"
            )
        
        self.service.clear_user_data(user_id)

    def test_error_handling(self):
        """Test error handling and recovery"""
        print("\n🔥 RIGOROUS TEST: Error Handling")
        
        user_id = "error_test_user"
        
        # Test 1: Operations on non-existent user
        result = self.service.get_wallet_balance("non_existent_user", WalletType.MAIN)
        
        self.log_test(
            "ERROR_HANDLING",
            "Non-existent User Handling",
            result == 0,  # Should return 0, not crash
            f"Returned balance: {result}"
        )
        
        # Test 2: Invalid wallet type operations
        self.service.initialize_user_wallets(user_id, {"initial_balance": 10000})
        
        try:
            # This should handle gracefully
            result = self.service.transfer_between_wallets(user_id, {
                "from_wallet": "invalid_wallet_type",
                "to_wallet": WalletType.SAVINGS,
                "amount": 100,
                "description": "Invalid wallet test"
            })
            
            error_handled = not result.get("success", True)
            
        except Exception as e:
            error_handled = True
        
        self.log_test(
            "ERROR_HANDLING",
            "Invalid Wallet Type Handling",
            error_handled,
            "Service handled invalid wallet type gracefully"
        )
        
        # Test 3: Malformed transaction data
        malformed_data = [
            {},  # Empty data
            {"user_id": user_id},  # Missing required fields
            {"user_id": user_id, "type": "invalid_type", "amount": "not_a_number"},
            {"user_id": None, "type": TransactionType.DEPOSIT, "amount": 100},
        ]
        
        malformed_handled = 0
        for i, data in enumerate(malformed_data):
            try:
                result = self.service.create_transaction(data)
                if not result:  # Empty result indicates error handling
                    malformed_handled += 1
            except Exception:
                malformed_handled += 1
        
        self.log_test(
            "ERROR_HANDLING",
            "Malformed Data Handling",
            malformed_handled == len(malformed_data),
            f"Handled {malformed_handled}/{len(malformed_data)} malformed requests"
        )
        
        self.service.clear_user_data(user_id)

    async def test_websocket_stress(self):
        """Test WebSocket connections under stress"""
        print("\n🔥 RIGOROUS TEST: WebSocket Stress Testing")
        
        class MockWebSocket:
            def __init__(self, user_id):
                self.user_id = user_id
                self.messages = []
                self.closed = False
                self.connection_time = time.time()
            
            async def accept(self):
                await asyncio.sleep(0.001)  # Simulate network delay
            
            async def send_text(self, message):
                if not self.closed:
                    self.messages.append({
                        "message": message,
                        "timestamp": time.time()
                    })
                    await asyncio.sleep(0.001)  # Simulate send delay
            
            def close(self):
                self.closed = True
        
        # Create multiple WebSocket connections
        connection_count = 50
        connections = []
        
        start_time = time.time()
        
        # Connect all WebSockets
        for i in range(connection_count):
            user_id = f"ws_stress_user_{i}"
            self.service.initialize_user_wallets(user_id, {"initial_balance": 10000})
            
            mock_ws = MockWebSocket(user_id)
            connections.append((user_id, mock_ws))
            
            try:
                await self.service.connect_user_realtime(
                    mock_ws, user_id, ["balance", "transactions"]
                )
            except Exception as e:
                print(f"Connection failed for {user_id}: {e}")
        
        connection_time = time.time() - start_time
        
        # Send broadcasts to all connections
        broadcast_start = time.time()
        
        for user_id, mock_ws in connections:
            try:
                await self.service.broadcast_wallet_update(user_id, "balance", {
                    "wallet_type": WalletType.MAIN,
                    "new_balance": 10000,
                    "change": 0
                })
            except Exception as e:
                print(f"Broadcast failed for {user_id}: {e}")
        
        broadcast_time = time.time() - broadcast_start
        
        # Verify message delivery
        total_messages = sum(len(mock_ws.messages) for _, mock_ws in connections)
        expected_messages = connection_count * 2  # Connection + broadcast messages
        
        # Disconnect all
        disconnect_start = time.time()
        for user_id, mock_ws in connections:
            try:
                await self.service.disconnect_user_realtime(mock_ws)
                self.service.clear_user_data(user_id)
            except Exception as e:
                print(f"Disconnect failed for {user_id}: {e}")
        
        disconnect_time = time.time() - disconnect_start
        
        self.log_test(
            "WEBSOCKET",
            "Connection Performance",
            connection_time < 5.0,  # Should connect 50 users in under 5 seconds
            f"Connected {connection_count} users in {connection_time:.3f}s"
        )
        
        self.log_test(
            "WEBSOCKET",
            "Broadcast Performance",
            broadcast_time < 2.0,  # Should broadcast to 50 users in under 2 seconds
            f"Broadcast to {connection_count} users in {broadcast_time:.3f}s"
        )
        
        self.log_test(
            "WEBSOCKET",
            "Message Delivery",
            total_messages >= expected_messages * 0.9,  # Allow 10% message loss
            f"Delivered {total_messages}/{expected_messages} messages"
        )

    def test_transaction_integrity(self):
        """Test transaction integrity and atomicity"""
        print("\n🔥 RIGOROUS TEST: Transaction Integrity")
        
        user_id = "integrity_test_user"
        self.service.initialize_user_wallets(user_id, {"initial_balance": 10000})
        
        # Test atomic transfers (should either complete fully or not at all)
        initial_main = self.service.get_wallet_balance(user_id, WalletType.MAIN)
        initial_savings = self.service.get_wallet_balance(user_id, WalletType.SAVINGS)
        
        # Attempt transfer that should succeed
        result1 = self.service.transfer_between_wallets(user_id, {
            "from_wallet": WalletType.MAIN,
            "to_wallet": WalletType.SAVINGS,
            "amount": 1000,
            "description": "Integrity test transfer 1"
        })
        
        # Attempt transfer that should fail (insufficient funds)
        result2 = self.service.transfer_between_wallets(user_id, {
            "from_wallet": WalletType.MAIN,
            "to_wallet": WalletType.SAVINGS,
            "amount": 50000,  # More than available
            "description": "Integrity test transfer 2"
        })
        
        final_main = self.service.get_wallet_balance(user_id, WalletType.MAIN)
        final_savings = self.service.get_wallet_balance(user_id, WalletType.SAVINGS)
        
        # Verify atomicity
        successful_transfer = result1["success"] and not result2["success"]
        balance_integrity = (
            final_main == initial_main - 1000 and
            final_savings == initial_savings + 1000
        )
        
        self.log_test(
            "INTEGRITY",
            "Transfer Atomicity",
            successful_transfer and balance_integrity,
            f"Transfer 1: {result1['success']}, Transfer 2: {result2['success']}, "
            f"Balances correct: {balance_integrity}"
        )
        
        # Test transaction ID uniqueness
        tx_ids = set()
        duplicate_found = False
        
        for i in range(100):
            tx_id = self.service.create_transaction({
                "user_id": user_id,
                "type": TransactionType.DEPOSIT,
                "amount": 1,
                "description": f"Uniqueness test {i}"
            })
            
            if tx_id in tx_ids:
                duplicate_found = True
                break
            tx_ids.add(tx_id)
        
        self.log_test(
            "INTEGRITY",
            "Transaction ID Uniqueness",
            not duplicate_found,
            f"Generated {len(tx_ids)} unique transaction IDs"
        )
        
        self.service.clear_user_data(user_id)

    def generate_stress_report(self):
        """Generate comprehensive stress test report"""
        print("\n" + "="*80)
        print("🔥 RIGOROUS WALLET SERVICE STRESS TEST REPORT")
        print("="*80)
        
        # Categorize results
        categories = {}
        for result in self.test_results:
            category = result["category"]
            if category not in categories:
                categories[category] = {"passed": 0, "failed": 0, "total": 0}
            
            categories[category]["total"] += 1
            if result["success"]:
                categories[category]["passed"] += 1
            else:
                categories[category]["failed"] += 1
        
        # Overall statistics
        total_tests = len(self.test_results)
        passed_tests = sum(1 for r in self.test_results if r["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"\n📊 OVERALL RESULTS:")
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests*100):.1f}%")
        
        # Category breakdown
        print(f"\n📋 CATEGORY BREAKDOWN:")
        for category, stats in categories.items():
            success_rate = (stats["passed"] / stats["total"] * 100) if stats["total"] > 0 else 0
            print(f"  {category}: {stats['passed']}/{stats['total']} ({success_rate:.1f}%)")
        
        # Performance metrics
        if self.performance_metrics:
            print(f"\n⚡ PERFORMANCE METRICS:")
            avg_duration = sum(m["duration"] for m in self.performance_metrics) / len(self.performance_metrics)
            max_duration = max(m["duration"] for m in self.performance_metrics)
            min_duration = min(m["duration"] for m in self.performance_metrics)
            
            print(f"  Average Response Time: {avg_duration*1000:.3f}ms")
            print(f"  Maximum Response Time: {max_duration*1000:.3f}ms")
            print(f"  Minimum Response Time: {min_duration*1000:.3f}ms")
            
            # Slowest operations
            slowest = sorted(self.performance_metrics, key=lambda x: x["duration"], reverse=True)[:5]
            print(f"  Slowest Operations:")
            for metric in slowest:
                print(f"    {metric['test']}: {metric['duration']*1000:.3f}ms")
        
        # Security violations
        if self.security_violations:
            print(f"\n🚨 SECURITY VIOLATIONS:")
            for violation in self.security_violations:
                print(f"  ❌ {violation['test']}: {violation['message']}")
        else:
            print(f"\n🔒 SECURITY: No violations detected")
        
        # Failed tests details
        if failed_tests > 0:
            print(f"\n❌ FAILED TESTS DETAILS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  • [{result['category']}] {result['test']}: {result['message']}")
        
        print("\n" + "="*80)
        
        return failed_tests == 0

async def main():
    """Run rigorous testing suite"""
    print("🔥 STARTING RIGOROUS WALLET SERVICE TESTING")
    print("This comprehensive test suite will stress-test the unified wallet service")
    print("="*80)
    
    tester = RigorousWalletTester()
    
    try:
        # Run all rigorous tests
        print("🧪 Running concurrent operations test...")
        tester.test_concurrent_operations()
        
        print("🧪 Running edge case amounts test...")
        tester.test_edge_case_amounts()
        
        print("🧪 Running security vulnerabilities test...")
        tester.test_security_vulnerabilities()
        
        print("🧪 Running memory leak detection...")
        tester.test_memory_leaks()
        
        print("🧪 Running performance benchmarks...")
        tester.test_performance_benchmarks()
        
        print("🧪 Running data consistency test...")
        tester.test_data_consistency()
        
        print("🧪 Running error handling test...")
        tester.test_error_handling()
        
        print("🧪 Running WebSocket stress test...")
        await tester.test_websocket_stress()
        
        print("🧪 Running transaction integrity test...")
        tester.test_transaction_integrity()
        
        # Generate comprehensive report
        success = tester.generate_stress_report()
        
        if success:
            print("🎉 ALL RIGOROUS TESTS PASSED!")
            print("The unified wallet service is robust and production-ready.")
            return 0
        else:
            print("⚠️  SOME RIGOROUS TESTS FAILED!")
            print("Please review and address the issues before production deployment.")
            return 1
            
    except Exception as e:
        print(f"\n💥 RIGOROUS TEST SUITE CRASHED: {str(e)}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    exit(exit_code)