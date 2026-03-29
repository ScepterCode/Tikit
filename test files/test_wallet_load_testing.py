#!/usr/bin/env python3
"""
LOAD TESTING FOR UNIFIED WALLET SERVICE
Simulates high-traffic scenarios and measures performance under load
"""
import asyncio
import time
import sys
import os
import threading
import random
import statistics
from concurrent.futures import ThreadPoolExecutor, as_completed

sys.path.append(os.path.join(os.path.dirname(__file__), 'apps', 'backend-fastapi'))

from services.unified_wallet_service import UnifiedWalletService
from services.wallet_models import WalletType, TransactionType

class WalletLoadTester:
    def __init__(self):
        self.service = UnifiedWalletService()
        self.results = []
        self.errors = []
        
    def simulate_user_activity(self, user_id: str, operations_count: int = 50):
        """Simulate realistic user activity"""
        operation_times = []
        operation_results = []
        
        # Initialize user
        init_start = time.time()
        init_result = self.service.initialize_user_wallets(user_id, {
            "initial_balance": random.randint(5000, 50000),
            "role": random.choice(["attendee", "organizer"])
        })
        init_time = time.time() - init_start
        operation_times.append(("initialize", init_time))
        operation_results.append(init_result["success"])
        
        # Perform random operations
        operations = [
            ("balance_check", 0.3),
            ("deposit", 0.2),
            ("withdrawal", 0.15),
            ("transfer", 0.2),
            ("transaction_history", 0.1),
            ("analytics", 0.05)
        ]
        
        for _ in range(operations_count):
            # Choose random operation based on weights
            operation = random.choices(
                [op[0] for op in operations],
                weights=[op[1] for op in operations]
            )[0]
            
            start_time = time.time()
            success = True
            
            try:
                if operation == "balance_check":
                    balance = self.service.get_wallet_balance(user_id, WalletType.MAIN)
                    success = balance >= 0
                    
                elif operation == "deposit":
                    amount = random.randint(100, 5000)
                    result = self.service.update_wallet_balance(
                        user_id, WalletType.MAIN, amount, f"Load test deposit"
                    )
                    success = result["success"]
                    
                elif operation == "withdrawal":
                    amount = random.randint(50, 1000)
                    result = self.service.update_wallet_balance(
                        user_id, WalletType.MAIN, -amount, f"Load test withdrawal"
                    )
                    success = result["success"]
                    
                elif operation == "transfer":
                    amount = random.randint(100, 2000)
                    result = self.service.transfer_between_wallets(user_id, {
                        "from_wallet": WalletType.MAIN,
                        "to_wallet": WalletType.SAVINGS,
                        "amount": amount,
                        "description": "Load test transfer"
                    })
                    success = result["success"]
                    
                elif operation == "transaction_history":
                    result = self.service.get_user_transactions(user_id, {"limit": 20})
                    success = result["success"]
                    
                elif operation == "analytics":
                    result = self.service.get_wallet_analytics(user_id)
                    success = result["success"]
                    
            except Exception as e:
                success = False
                self.errors.append(f"{user_id}: {operation} failed - {str(e)}")
            
            operation_time = time.time() - start_time
            operation_times.append((operation, operation_time))
            operation_results.append(success)
            
            # Random delay between operations (0-100ms)
            time.sleep(random.uniform(0, 0.1))
        
        return {
            "user_id": user_id,
            "operation_times": operation_times,
            "operation_results": operation_results,
            "success_rate": sum(operation_results) / len(operation_results),
            "total_time": sum(t[1] for t in operation_times)
        }
    
    def run_load_test(self, concurrent_users: int = 100, operations_per_user: int = 50):
        """Run load test with specified parameters"""
        print(f"🔥 LOAD TEST: {concurrent_users} concurrent users, {operations_per_user} operations each")
        print(f"Total operations: {concurrent_users * operations_per_user}")
        
        start_time = time.time()
        
        # Create user IDs
        user_ids = [f"load_test_user_{i}" for i in range(concurrent_users)]
        
        # Run concurrent user simulations
        with ThreadPoolExecutor(max_workers=min(concurrent_users, 50)) as executor:
            futures = [
                executor.submit(self.simulate_user_activity, user_id, operations_per_user)
                for user_id in user_ids
            ]
            
            results = []
            completed = 0
            
            for future in as_completed(futures):
                try:
                    result = future.result()
                    results.append(result)
                    completed += 1
                    
                    if completed % 10 == 0:
                        print(f"  Completed: {completed}/{concurrent_users} users")
                        
                except Exception as e:
                    self.errors.append(f"User simulation failed: {str(e)}")
        
        total_time = time.time() - start_time
        
        # Analyze results
        self.analyze_load_test_results(results, total_time, concurrent_users, operations_per_user)
        
        # Cleanup
        for user_id in user_ids:
            self.service.clear_user_data(user_id)
        
        return results
    
    def analyze_load_test_results(self, results, total_time, concurrent_users, operations_per_user):
        """Analyze and report load test results"""
        print(f"\n📊 LOAD TEST RESULTS")
        print("="*60)
        
        if not results:
            print("❌ No results to analyze")
            return
        
        # Overall metrics
        total_operations = sum(len(r["operation_results"]) for r in results)
        successful_operations = sum(sum(r["operation_results"]) for r in results)
        overall_success_rate = successful_operations / total_operations if total_operations > 0 else 0
        
        print(f"Total Time: {total_time:.2f} seconds")
        print(f"Concurrent Users: {concurrent_users}")
        print(f"Operations per User: {operations_per_user}")
        print(f"Total Operations: {total_operations}")
        print(f"Successful Operations: {successful_operations}")
        print(f"Overall Success Rate: {overall_success_rate:.1%}")
        print(f"Operations per Second: {total_operations/total_time:.1f}")
        print(f"Errors: {len(self.errors)}")
        
        # Performance metrics
        all_operation_times = []
        operation_type_times = {}
        
        for result in results:
            for op_name, op_time in result["operation_times"]:
                all_operation_times.append(op_time)
                
                if op_name not in operation_type_times:
                    operation_type_times[op_name] = []
                operation_type_times[op_name].append(op_time)
        
        if all_operation_times:
            print(f"\n⚡ PERFORMANCE METRICS")
            print(f"Average Response Time: {statistics.mean(all_operation_times)*1000:.2f}ms")
            print(f"Median Response Time: {statistics.median(all_operation_times)*1000:.2f}ms")
            print(f"95th Percentile: {statistics.quantiles(all_operation_times, n=20)[18]*1000:.2f}ms")
            print(f"99th Percentile: {statistics.quantiles(all_operation_times, n=100)[98]*1000:.2f}ms")
            print(f"Max Response Time: {max(all_operation_times)*1000:.2f}ms")
            print(f"Min Response Time: {min(all_operation_times)*1000:.2f}ms")
        
        # Per-operation type metrics
        print(f"\n📋 OPERATION TYPE BREAKDOWN")
        for op_type, times in operation_type_times.items():
            if times:
                avg_time = statistics.mean(times)
                max_time = max(times)
                print(f"  {op_type}: avg={avg_time*1000:.2f}ms, max={max_time*1000:.2f}ms, count={len(times)}")
        
        # User performance distribution
        user_success_rates = [r["success_rate"] for r in results]
        user_total_times = [r["total_time"] for r in results]
        
        print(f"\n👥 USER PERFORMANCE DISTRIBUTION")
        print(f"Average User Success Rate: {statistics.mean(user_success_rates):.1%}")
        print(f"Worst User Success Rate: {min(user_success_rates):.1%}")
        print(f"Best User Success Rate: {max(user_success_rates):.1%}")
        print(f"Average User Total Time: {statistics.mean(user_total_times):.2f}s")
        
        # Error analysis
        if self.errors:
            print(f"\n🚨 ERROR ANALYSIS")
            error_types = {}
            for error in self.errors:
                error_type = error.split(":")[1].split(" ")[1] if ":" in error else "unknown"
                error_types[error_type] = error_types.get(error_type, 0) + 1
            
            for error_type, count in error_types.items():
                print(f"  {error_type}: {count} occurrences")
        
        # Performance assessment
        print(f"\n🎯 PERFORMANCE ASSESSMENT")
        
        avg_response_time = statistics.mean(all_operation_times) if all_operation_times else 0
        
        if overall_success_rate >= 0.99:
            print("✅ SUCCESS RATE: Excellent (≥99%)")
        elif overall_success_rate >= 0.95:
            print("⚠️  SUCCESS RATE: Good (≥95%)")
        else:
            print("❌ SUCCESS RATE: Poor (<95%)")
        
        if avg_response_time <= 0.01:  # 10ms
            print("✅ RESPONSE TIME: Excellent (≤10ms)")
        elif avg_response_time <= 0.05:  # 50ms
            print("⚠️  RESPONSE TIME: Good (≤50ms)")
        else:
            print("❌ RESPONSE TIME: Poor (>50ms)")
        
        ops_per_second = total_operations / total_time
        if ops_per_second >= 1000:
            print("✅ THROUGHPUT: Excellent (≥1000 ops/sec)")
        elif ops_per_second >= 500:
            print("⚠️  THROUGHPUT: Good (≥500 ops/sec)")
        else:
            print("❌ THROUGHPUT: Poor (<500 ops/sec)")

def main():
    """Run load testing scenarios"""
    print("🔥 WALLET SERVICE LOAD TESTING")
    print("="*60)
    
    tester = WalletLoadTester()
    
    # Test scenarios
    scenarios = [
        {"name": "Light Load", "users": 10, "operations": 20},
        {"name": "Medium Load", "users": 50, "operations": 30},
        {"name": "Heavy Load", "users": 100, "operations": 50},
        {"name": "Stress Test", "users": 200, "operations": 25},
    ]
    
    all_passed = True
    
    for scenario in scenarios:
        print(f"\n🧪 SCENARIO: {scenario['name']}")
        print("-" * 40)
        
        try:
            results = tester.run_load_test(
                concurrent_users=scenario["users"],
                operations_per_user=scenario["operations"]
            )
            
            # Check if scenario passed (basic criteria)
            if results:
                success_rates = [r["success_rate"] for r in results]
                avg_success_rate = statistics.mean(success_rates)
                
                if avg_success_rate < 0.95:  # Less than 95% success rate
                    all_passed = False
                    print(f"❌ SCENARIO FAILED: Success rate {avg_success_rate:.1%} < 95%")
                else:
                    print(f"✅ SCENARIO PASSED: Success rate {avg_success_rate:.1%}")
            else:
                all_passed = False
                print("❌ SCENARIO FAILED: No results")
                
        except Exception as e:
            all_passed = False
            print(f"❌ SCENARIO CRASHED: {str(e)}")
        
        # Clear any remaining data
        tester.errors.clear()
    
    print(f"\n{'='*60}")
    if all_passed:
        print("🎉 ALL LOAD TEST SCENARIOS PASSED!")
        print("The unified wallet service can handle production load.")
    else:
        print("⚠️  SOME LOAD TEST SCENARIOS FAILED!")
        print("Performance optimization may be needed before production.")
    
    return 0 if all_passed else 1

if __name__ == "__main__":
    exit(main())