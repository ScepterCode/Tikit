"""
Unified Wallet Service
Consolidates all wallet operations into a single, cohesive service
OPTIMIZED VERSION with performance enhancements and security improvements
"""
import uuid
import time
import asyncio
from typing import Dict, Any, List, Optional
from datetime import datetime

# Import modules
from .wallet_models import (
    Wallet, Transaction, WalletType, TransactionType, TransactionStatus,
    create_wallet_id, create_transaction_id, create_reference, get_current_timestamp,
    WALLET_LIMITS, INTEREST_RATES, TRANSFER_LIMITS, TRANSFER_FEES
)
from .wallet_security import WalletSecurityModule
from .wallet_realtime import WalletRealtimeModule
from .wallet_withdrawals import WalletWithdrawalsModule
from .wallet_analytics import WalletAnalyticsModule
from .wallet_performance import WalletPerformanceModule
from .wallet_validation import WalletValidationModule
from .wallet_rate_limiting import WalletRateLimitingModule

class UnifiedWalletService:
    """
    Unified wallet service consolidating all wallet operations
    Single source of truth for all wallet data and operations
    """
    
    def __init__(self):
        # Initialize specialized modules
        self.security = WalletSecurityModule(self)
        self.realtime = WalletRealtimeModule(self)
        self.withdrawals = WalletWithdrawalsModule(self)
        self.analytics = WalletAnalyticsModule(self)
        
        # Initialize optimization modules
        self.performance = WalletPerformanceModule()
        self.validation = WalletValidationModule()
        self.rate_limiting = WalletRateLimitingModule()
        
        # Unified data storage (will be replaced with database)
        self.wallets = {}  # user_id -> {wallet_type -> wallet_data}
        self.transactions = {}  # transaction_id -> transaction_data
        self.user_transactions = {}  # user_id -> [transaction_ids]
        
        # Multi-wallet features
        self.auto_save_rules = {}  # user_id -> [rules]
        self.savings_goals = {}  # user_id -> [goals]
        
        print("🏦 Unified Wallet Service initialized with optimization modules")
        print("   ✅ Performance optimization enabled")
        print("   ✅ Input validation and sanitization enabled") 
        print("   ✅ Advanced rate limiting enabled")

    # ============================================================================
    # CORE WALLET OPERATIONS - SINGLE SOURCE OF TRUTH
    # ============================================================================

    def get_user_wallets(self, user_id: str, ip_address: str = None) -> Dict[str, Any]:
        """Get all wallets for user - SINGLE SOURCE OF TRUTH"""
        try:
            # 1. Input validation
            user_validation = self.validation.validate_user_id(user_id)
            if not user_validation["valid"]:
                return {
                    "success": False,
                    "error": f"Invalid user ID: {user_validation['error']}"
                }
            user_id = user_validation["sanitized"]
            
            # 2. Rate limiting
            rate_check = self.rate_limiting.check_rate_limit(user_id, "balance_check", ip_address)
            if not rate_check["allowed"]:
                return {
                    "success": False,
                    "error": rate_check["reason"],
                    "retry_after": rate_check.get("retry_after", 60)
                }
            
            # 3. Check cache first for performance
            cached_data = self.performance.get_cached_balance(user_id, "all_wallets")
            if cached_data is not None:
                return {
                    "success": True,
                    "data": cached_data,
                    "cached": True
                }
            
            if user_id not in self.wallets:
                return {
                    "success": False,
                    "error": "No wallets found for user"
                }
            
            user_wallets = self.wallets[user_id]
            
            # Calculate total balance across all wallets
            total_balance = sum(wallet["balance"] for wallet in user_wallets.values())
            
            # Get wallet summaries
            wallet_summaries = []
            for wallet_type, wallet in user_wallets.items():
                summary = {
                    "id": wallet["id"],
                    "type": wallet["type"],
                    "name": wallet["name"],
                    "balance": wallet["balance"],
                    "currency": wallet["currency"],
                    "is_active": wallet["is_active"],
                    "is_default": wallet["is_default"],
                    "interest_rate": wallet.get("interest_rate", 0),
                    "restrictions": wallet["restrictions"],
                    "last_updated": wallet["updated_at"]
                }
                
                # Add type-specific information
                if wallet_type == WalletType.SAVINGS:
                    summary["total_interest_earned"] = wallet["metadata"].get("total_interest_earned", 0)
                    summary["next_interest_payment"] = self._calculate_next_interest_payment(wallet)
                elif wallet_type == WalletType.BUSINESS:
                    summary["business_info"] = wallet.get("business_info", {})
                
                wallet_summaries.append(summary)
            
            result_data = {
                "wallets": wallet_summaries,
                "total_balance": total_balance,
                "active_wallets": len([w for w in user_wallets.values() if w["is_active"]]),
                "default_wallet": next((w for w in user_wallets.values() if w["is_default"]), None)
            }
            
            # Cache the result
            self.performance.cache_balance(user_id, "all_wallets", result_data)
            
            return {
                "success": True,
                "data": result_data
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to get user wallets: {str(e)}"
            }

    def get_wallet_balance(self, user_id: str, wallet_type: WalletType = WalletType.MAIN, ip_address: str = None) -> float:
        """Get wallet balance - SINGLE SOURCE OF TRUTH"""
        try:
            # 1. Input validation
            user_validation = self.validation.validate_user_id(user_id)
            if not user_validation["valid"]:
                return 0.0
            user_id = user_validation["sanitized"]
            
            wallet_validation = self.validation.validate_wallet_type(wallet_type)
            if not wallet_validation["valid"]:
                return 0.0
            
            # 2. Rate limiting
            rate_check = self.rate_limiting.check_rate_limit(user_id, "balance_check", ip_address)
            if not rate_check["allowed"]:
                return 0.0
            
            # 3. Check cache first
            cached_balance = self.performance.get_cached_balance(user_id, wallet_type)
            if cached_balance is not None:
                return cached_balance
            
            if user_id not in self.wallets:
                return 0.0
            
            user_wallets = self.wallets[user_id]
            if wallet_type not in user_wallets:
                return 0.0
            
            balance = user_wallets[wallet_type]["balance"]
            
            # Cache the balance
            self.performance.cache_balance(user_id, wallet_type, balance)
            
            return balance
            
        except Exception as e:
            print(f"Error getting wallet balance: {e}")
            return 0.0

    def update_wallet_balance(self, user_id: str, wallet_type: WalletType, amount: float, description: str, ip_address: str = None) -> Dict[str, Any]:
        """Update wallet balance - SINGLE SOURCE OF TRUTH"""
        try:
            # 1. Comprehensive input validation
            user_validation = self.validation.validate_user_id(user_id)
            if not user_validation["valid"]:
                return {
                    "success": False,
                    "error": f"Invalid user ID: {user_validation['error']}"
                }
            user_id = user_validation["sanitized"]
            
            amount_validation = self.validation.validate_amount(amount)
            if not amount_validation["valid"]:
                return {
                    "success": False,
                    "error": f"Invalid amount: {amount_validation['error']}"
                }
            amount = amount_validation["sanitized"]
            
            description_validation = self.validation.validate_description(description)
            if not description_validation["valid"]:
                return {
                    "success": False,
                    "error": f"Invalid description: {description_validation['error']}"
                }
            description = description_validation["sanitized"]
            
            wallet_validation = self.validation.validate_wallet_type(wallet_type)
            if not wallet_validation["valid"]:
                return {
                    "success": False,
                    "error": f"Invalid wallet type: {wallet_validation['error']}"
                }
            
            # 2. Rate limiting
            operation = "withdrawal" if amount < 0 else "deposit"
            rate_check = self.rate_limiting.check_rate_limit(user_id, operation, ip_address)
            if not rate_check["allowed"]:
                return {
                    "success": False,
                    "error": rate_check["reason"],
                    "retry_after": rate_check.get("retry_after", 60)
                }
            
            # 3. Performance check
            if not self.performance.check_rate_limit(user_id):
                return {
                    "success": False,
                    "error": "Too many requests. Please slow down."
                }
            
            if user_id not in self.wallets:
                return {
                    "success": False,
                    "error": "User wallets not found"
                }
            
            user_wallets = self.wallets[user_id]
            if wallet_type not in user_wallets:
                return {
                    "success": False,
                    "error": f"Wallet type {wallet_type} not found"
                }
            
            wallet = user_wallets[wallet_type]
            old_balance = wallet["balance"]
            new_balance = old_balance + amount
            
            # Check for negative balance
            if new_balance < 0:
                return {
                    "success": False,
                    "error": f"Insufficient balance. Required: ₦{abs(amount):,.2f}, Available: ₦{old_balance:,.2f}"
                }
            
            # Update balance
            wallet["balance"] = new_balance
            wallet["updated_at"] = get_current_timestamp()
            
            # Update metadata
            if amount > 0:
                wallet["metadata"]["total_received"] = wallet["metadata"].get("total_received", 0) + amount
            else:
                wallet["metadata"]["total_spent"] = wallet["metadata"].get("total_spent", 0) + abs(amount)
            
            wallet["metadata"]["total_transactions"] = wallet["metadata"].get("total_transactions", 0) + 1
            wallet["metadata"]["last_transaction"] = get_current_timestamp()
            
            # Invalidate cache
            self.performance.invalidate_user_cache(user_id)
            
            # Create transaction record
            transaction_id = self.create_transaction({
                "user_id": user_id,
                "wallet_id": wallet["id"],
                "type": TransactionType.DEPOSIT if amount > 0 else TransactionType.WITHDRAWAL,
                "amount": abs(amount),
                "description": description,
                "status": TransactionStatus.COMPLETED,
                "metadata": {"wallet_type": wallet_type}
            })
            
            # Broadcast real-time update (skip in sync context)
            try:
                asyncio.create_task(self.realtime.broadcast_balance_update(user_id, {
                    "wallet_type": wallet_type,
                    "old_balance": old_balance,
                    "new_balance": new_balance,
                    "change": amount,
                    "transaction_id": transaction_id
                }))
            except RuntimeError:
                # No event loop running, skip real-time update
                pass
            
            return {
                "success": True,
                "old_balance": old_balance,
                "new_balance": new_balance,
                "change": amount,
                "transaction_id": transaction_id
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to update wallet balance: {str(e)}"
            }

    def create_transaction(self, transaction_data: Dict[str, Any]) -> str:
        """Create transaction record - SINGLE SOURCE OF TRUTH"""
        try:
            # 1. Comprehensive validation of transaction data
            validation_result = self.validation.validate_transaction_data(transaction_data)
            if not validation_result["valid"]:
                print(f"Transaction validation failed: {validation_result['errors']}")
                return ""
            
            # Use sanitized data
            sanitized_data = validation_result["sanitized_data"]
            
            transaction_id = create_transaction_id()
            current_time = get_current_timestamp()
            
            transaction = Transaction(
                id=transaction_id,
                user_id=sanitized_data["user_id"],
                wallet_id=transaction_data.get("wallet_id"),
                from_wallet_id=transaction_data.get("from_wallet_id"),
                to_wallet_id=transaction_data.get("to_wallet_id"),
                type=sanitized_data["type"],
                amount=sanitized_data["amount"],
                fee=transaction_data.get("fee", 0),
                description=sanitized_data["description"],
                reference=sanitized_data.get("reference", create_reference()),
                status=transaction_data.get("status", TransactionStatus.COMPLETED),
                metadata=transaction_data.get("metadata", {}),
                created_at=current_time,
                updated_at=current_time,
                event_id=transaction_data.get("event_id"),
                recipient_id=transaction_data.get("recipient_id"),
                external_reference=transaction_data.get("external_reference")
            )
            
            # Store transaction
            self.transactions[transaction_id] = transaction.dict()
            
            # Add to user's transaction list
            user_id = sanitized_data["user_id"]
            if user_id not in self.user_transactions:
                self.user_transactions[user_id] = []
            self.user_transactions[user_id].append(transaction_id)
            
            # Keep only last 1000 transactions per user
            if len(self.user_transactions[user_id]) > 1000:
                old_transaction_id = self.user_transactions[user_id].pop(0)
                self.transactions.pop(old_transaction_id, None)
            
            # Broadcast real-time update (skip in sync context)
            try:
                asyncio.create_task(self.realtime.broadcast_transaction_update(user_id, transaction.dict()))
            except RuntimeError:
                # No event loop running, skip real-time update
                pass
            
            return transaction_id
            
        except Exception as e:
            print(f"Error creating transaction: {e}")
            return ""

    def initialize_user_wallets(self, user_id: str, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Initialize default wallets for a new user"""
        try:
            if user_id in self.wallets:
                return {"success": False, "error": "User wallets already exist"}
            
            current_time = get_current_timestamp()
            self.wallets[user_id] = {}
            
            # Create main wallet (required)
            main_wallet = Wallet(
                id=create_wallet_id(),
                user_id=user_id,
                type=WalletType.MAIN,
                name="Main Wallet",
                balance=user_data.get("initial_balance", 0),
                currency="NGN",
                is_active=True,
                is_default=True,
                created_at=current_time,
                updated_at=current_time,
                restrictions=WALLET_LIMITS[WalletType.MAIN],
                metadata={
                    "last_transaction": None,
                    "total_transactions": 0,
                    "total_spent": 0,
                    "total_received": 0
                }
            )
            
            self.wallets[user_id][WalletType.MAIN] = main_wallet.dict()
            
            # Create savings wallet (optional, but recommended)
            savings_wallet = Wallet(
                id=create_wallet_id(),
                user_id=user_id,
                type=WalletType.SAVINGS,
                name="Savings Wallet",
                balance=0,
                currency="NGN",
                is_active=True,
                is_default=False,
                created_at=current_time,
                updated_at=current_time,
                interest_rate=INTEREST_RATES[WalletType.SAVINGS],
                last_interest_calculation=current_time,
                restrictions=WALLET_LIMITS[WalletType.SAVINGS],
                metadata={
                    "total_interest_earned": 0,
                    "interest_payments": [],
                    "last_transaction": None,
                    "total_transactions": 0,
                    "total_spent": 0,
                    "total_received": 0
                }
            )
            
            self.wallets[user_id][WalletType.SAVINGS] = savings_wallet.dict()
            
            # Create business wallet for organizers
            if user_data.get("role") == "organizer":
                business_wallet = Wallet(
                    id=create_wallet_id(),
                    user_id=user_id,
                    type=WalletType.BUSINESS,
                    name="Business Wallet",
                    balance=0,
                    currency="NGN",
                    is_active=True,
                    is_default=False,
                    created_at=current_time,
                    updated_at=current_time,
                    restrictions=WALLET_LIMITS[WalletType.BUSINESS],
                    business_info={
                        "business_name": user_data.get("organization_name", ""),
                        "business_type": user_data.get("organization_type", ""),
                        "tax_id": user_data.get("tax_id", "")
                    },
                    metadata={
                        "revenue_tracking": True,
                        "expense_tracking": True,
                        "tax_year_summary": {}
                    }
                )
                
                self.wallets[user_id][WalletType.BUSINESS] = business_wallet.dict()
            
            print(f"✅ Wallets initialized for user: {user_id}")
            
            return {
                "success": True,
                "message": "User wallets initialized successfully",
                "wallets": self.wallets[user_id]
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to initialize wallets: {str(e)}"
            }

    # ============================================================================
    # TRANSFER OPERATIONS (Consolidated from multi_wallet_service)
    # ============================================================================

    def transfer_between_wallets(self, user_id: str, transfer_data: Dict[str, Any], ip_address: str = None) -> Dict[str, Any]:
        """Internal wallet transfers"""
        try:
            # 1. Input validation
            user_validation = self.validation.validate_user_id(user_id)
            if not user_validation["valid"]:
                return {
                    "success": False,
                    "error": f"Invalid user ID: {user_validation['error']}"
                }
            user_id = user_validation["sanitized"]
            
            # Validate transfer data
            required_fields = ["from_wallet", "to_wallet", "amount"]
            for field in required_fields:
                if field not in transfer_data:
                    return {
                        "success": False,
                        "error": f"Missing required field: {field}"
                    }
            
            amount_validation = self.validation.validate_amount(transfer_data["amount"])
            if not amount_validation["valid"]:
                return {
                    "success": False,
                    "error": f"Invalid amount: {amount_validation['error']}"
                }
            amount = amount_validation["sanitized"]
            
            description_validation = self.validation.validate_description(
                transfer_data.get("description", "Internal wallet transfer")
            )
            if not description_validation["valid"]:
                return {
                    "success": False,
                    "error": f"Invalid description: {description_validation['error']}"
                }
            description = description_validation["sanitized"]
            
            # 2. Rate limiting
            rate_check = self.rate_limiting.check_rate_limit(user_id, "transfer", ip_address)
            if not rate_check["allowed"]:
                return {
                    "success": False,
                    "error": rate_check["reason"],
                    "retry_after": rate_check.get("retry_after", 60)
                }
            
            from_wallet_type = transfer_data["from_wallet"]
            to_wallet_type = transfer_data["to_wallet"]
            
            # 3. Security validation
            security_check = self.security.validate_transaction(user_id, {
                "amount": amount,
                "type": "transfer",
                "user_tier": transfer_data.get("user_tier", "basic")
            })
            
            if not security_check.is_valid:
                return {
                    "success": False,
                    "error": "Security validation failed",
                    "reasons": security_check.reasons,
                    "requires_pin": security_check.requires_pin,
                    "requires_otp": security_check.requires_otp
                }
            
            # 4. Validate wallets exist
            if user_id not in self.wallets:
                return {"success": False, "error": "User wallets not found"}
            
            user_wallets = self.wallets[user_id]
            
            if from_wallet_type not in user_wallets or to_wallet_type not in user_wallets:
                return {"success": False, "error": "Invalid wallet type"}
            
            from_wallet = user_wallets[from_wallet_type]
            to_wallet = user_wallets[to_wallet_type]
            
            # 5. Validate wallets are active
            if not from_wallet["is_active"] or not to_wallet["is_active"]:
                return {"success": False, "error": "One or both wallets are inactive"}
            
            # 6. Validate amount and limits
            if amount <= 0:
                return {"success": False, "error": "Transfer amount must be positive"}
            
            if amount < TRANSFER_LIMITS["min_transfer"]:
                return {"success": False, "error": f"Minimum transfer amount is ₦{TRANSFER_LIMITS['min_transfer']:,}"}
            
            # 7. Check sufficient balance
            if from_wallet["balance"] < amount:
                return {"success": False, "error": "Insufficient balance in source wallet"}
            
            # 8. Check savings wallet restrictions
            if from_wallet_type == WalletType.SAVINGS:
                min_balance = from_wallet["restrictions"]["min_balance"]
                if from_wallet["balance"] - amount < min_balance:
                    return {"success": False, "error": f"Transfer would violate minimum balance requirement (₦{min_balance:,})"}
            
            # 9. Calculate fees (internal transfers are free)
            fee = TRANSFER_FEES["internal"]
            
            # 10. Perform transfer
            current_time = get_current_timestamp()
            
            # Deduct from source wallet
            from_wallet["balance"] -= amount
            from_wallet["updated_at"] = current_time
            from_wallet["metadata"]["total_spent"] = from_wallet["metadata"].get("total_spent", 0) + amount
            from_wallet["metadata"]["total_transactions"] = from_wallet["metadata"].get("total_transactions", 0) + 1
            from_wallet["metadata"]["last_transaction"] = current_time
            
            # Add to destination wallet
            to_wallet["balance"] += amount
            to_wallet["updated_at"] = current_time
            to_wallet["metadata"]["total_received"] = to_wallet["metadata"].get("total_received", 0) + amount
            to_wallet["metadata"]["total_transactions"] = to_wallet["metadata"].get("total_transactions", 0) + 1
            to_wallet["metadata"]["last_transaction"] = current_time
            
            # Invalidate cache
            self.performance.invalidate_user_cache(user_id)
            
            # 11. Create transaction record
            transfer_id = create_reference("TRF")
            transaction_id = self.create_transaction({
                "user_id": user_id,
                "from_wallet_id": from_wallet["id"],
                "to_wallet_id": to_wallet["id"],
                "type": TransactionType.TRANSFER,
                "amount": amount,
                "fee": fee,
                "description": description,
                "reference": transfer_id,
                "status": TransactionStatus.COMPLETED,
                "metadata": {
                    "from_wallet_type": from_wallet_type,
                    "to_wallet_type": to_wallet_type,
                    "transfer_type": "internal"
                }
            })
            
            # 12. Real-time updates (skip in sync context)
            try:
                asyncio.create_task(self.realtime.broadcast_balance_update(user_id, {
                    "type": "transfer",
                    "from_wallet": from_wallet_type,
                    "to_wallet": to_wallet_type,
                    "amount": amount,
                    "from_balance": from_wallet["balance"],
                    "to_balance": to_wallet["balance"],
                    "transaction_id": transaction_id
                }))
            except RuntimeError:
                # No event loop running, skip real-time update
                pass
            
            return {
                "success": True,
                "message": "Transfer completed successfully",
                "data": {
                    "transaction_id": transaction_id,
                    "reference": transfer_id,
                    "from_wallet_balance": from_wallet["balance"],
                    "to_wallet_balance": to_wallet["balance"],
                    "amount": amount,
                    "fee": fee
                }
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Transfer failed: {str(e)}"
            }

    # ============================================================================
    # WITHDRAWAL OPERATIONS (Consolidated from withdrawal_service)
    # ============================================================================

    def initiate_withdrawal(self, user_id: str, withdrawal_data: Dict[str, Any], ip_address: str = None) -> Dict[str, Any]:
        """External withdrawals"""
        try:
            # 1. Input validation
            user_validation = self.validation.validate_user_id(user_id)
            if not user_validation["valid"]:
                return {
                    "success": False,
                    "error": f"Invalid user ID: {user_validation['error']}"
                }
            user_id = user_validation["sanitized"]
            
            # Validate withdrawal amount
            if "amount" not in withdrawal_data:
                return {
                    "success": False,
                    "error": "Missing withdrawal amount"
                }
            
            amount_validation = self.validation.validate_amount(withdrawal_data["amount"])
            if not amount_validation["valid"]:
                return {
                    "success": False,
                    "error": f"Invalid amount: {amount_validation['error']}"
                }
            withdrawal_data["amount"] = amount_validation["sanitized"]
            
            # 2. Rate limiting
            rate_check = self.rate_limiting.check_rate_limit(user_id, "withdrawal", ip_address)
            if not rate_check["allowed"]:
                return {
                    "success": False,
                    "error": rate_check["reason"],
                    "retry_after": rate_check.get("retry_after", 60)
                }
            
            # 3. Security validation
            security_check = self.security.validate_transaction(user_id, {
                "amount": withdrawal_data["amount"],
                "type": "withdrawal",
                "user_tier": withdrawal_data.get("user_tier", "basic")
            })
            
            if not security_check.is_valid:
                return {
                    "success": False,
                    "error": "Security validation failed",
                    "reasons": security_check.reasons,
                    "requires_pin": security_check.requires_pin,
                    "requires_otp": security_check.requires_otp
                }
            
            # 4. Delegate to withdrawals module
            result = self.withdrawals.initiate_withdrawal(user_id, withdrawal_data)
            
            # 5. If successful, invalidate cache and broadcast real-time update
            if result["success"]:
                self.performance.invalidate_user_cache(user_id)
                
                try:
                    asyncio.create_task(self.realtime.broadcast_withdrawal_update(user_id, {
                        "withdrawal_id": result["withdrawal"]["id"],
                        "amount": result["withdrawal"]["amount"],
                        "status": result["withdrawal"]["status"],
                        "method": result["withdrawal"]["method"]
                    }))
                except RuntimeError:
                    # No event loop running, skip real-time update
                    pass
            
            return result
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Withdrawal initiation failed: {str(e)}"
            }

    def process_withdrawal(self, withdrawal_id: str) -> Dict[str, Any]:
        """Process a pending withdrawal"""
        try:
            result = self.withdrawals.process_withdrawal(withdrawal_id)
            
            # Broadcast real-time update if successful (skip in sync context)
            if result["success"] and "withdrawal" in result:
                withdrawal = result["withdrawal"]
                try:
                    asyncio.create_task(self.realtime.broadcast_withdrawal_update(withdrawal["user_id"], {
                        "withdrawal_id": withdrawal["id"],
                        "status": withdrawal["status"],
                        "amount": withdrawal["amount"]
                    }))
                except RuntimeError:
                    # No event loop running, skip real-time update
                    pass
            
            return result
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Withdrawal processing failed: {str(e)}"
            }

    def get_user_withdrawals(self, user_id: str, limit: int = 50, offset: int = 0) -> Dict[str, Any]:
        """Get user's withdrawal history"""
        return self.withdrawals.get_user_withdrawals(user_id, limit, offset)

    def cancel_withdrawal(self, withdrawal_id: str, user_id: str) -> Dict[str, Any]:
        """Cancel a pending withdrawal"""
        try:
            result = self.withdrawals.cancel_withdrawal(withdrawal_id, user_id)
            
            # Broadcast real-time update if successful (skip in sync context)
            if result["success"]:
                try:
                    asyncio.create_task(self.realtime.broadcast_withdrawal_update(user_id, {
                        "withdrawal_id": withdrawal_id,
                        "status": "cancelled"
                    }))
                except RuntimeError:
                    # No event loop running, skip real-time update
                    pass
            
            return result
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Withdrawal cancellation failed: {str(e)}"
            }

    def add_bank_account(self, user_id: str, account_data: Dict[str, Any]) -> Dict[str, Any]:
        """Add bank account for withdrawals"""
        return self.withdrawals.add_bank_account(user_id, account_data)

    def get_user_bank_accounts(self, user_id: str) -> List[Dict[str, Any]]:
        """Get user's bank accounts"""
        return self.withdrawals.get_user_bank_accounts(user_id)

    # ============================================================================
    # SECURITY OPERATIONS (Consolidated from wallet_security_service)
    # ============================================================================

    def validate_transaction_security(self, user_id: str, transaction_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate transaction security"""
        try:
            security_check = self.security.validate_transaction(user_id, transaction_data)
            return {
                "success": True,
                "data": security_check.dict()
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Security validation failed: {str(e)}"
            }

    def set_transaction_pin(self, user_id: str, pin: str) -> Dict[str, Any]:
        """Set transaction PIN"""
        return self.security.set_transaction_pin(user_id, pin)

    def verify_pin(self, user_id: str, pin: str, ip_address: str = None) -> bool:
        """Verify transaction PIN with rate limiting"""
        try:
            # 1. Input validation
            user_validation = self.validation.validate_user_id(user_id)
            if not user_validation["valid"]:
                return False
            user_id = user_validation["sanitized"]
            
            pin_validation = self.validation.validate_pin(pin)
            if not pin_validation["valid"]:
                # Record failed attempt for invalid PIN format
                self.rate_limiting.record_failed_attempt(user_id, "pin_verify", ip_address)
                return False
            pin = pin_validation["sanitized"]
            
            # 2. Rate limiting check
            rate_check = self.rate_limiting.check_rate_limit(user_id, "pin_verify", ip_address)
            if not rate_check["allowed"]:
                return False
            
            # 3. Verify PIN
            is_valid = self.security.verify_pin(user_id, pin)
            
            if is_valid:
                # Reset failed attempts on successful verification
                self.rate_limiting.reset_failed_attempts(user_id, "pin_verify")
            else:
                # Record failed attempt
                self.rate_limiting.record_failed_attempt(user_id, "pin_verify", ip_address)
            
            return is_valid
            
        except Exception as e:
            print(f"Error verifying PIN: {e}")
            return False

    def generate_otp(self, user_id: str, purpose: str = "transaction", ip_address: str = None) -> Dict[str, Any]:
        """Generate OTP for verification with rate limiting"""
        try:
            # 1. Input validation
            user_validation = self.validation.validate_user_id(user_id)
            if not user_validation["valid"]:
                return {
                    "success": False,
                    "error": f"Invalid user ID: {user_validation['error']}"
                }
            user_id = user_validation["sanitized"]
            
            # 2. Rate limiting
            rate_check = self.rate_limiting.check_rate_limit(user_id, "otp_request", ip_address)
            if not rate_check["allowed"]:
                return {
                    "success": False,
                    "error": rate_check["reason"],
                    "retry_after": rate_check.get("retry_after", 300)
                }
            
            # 3. Generate OTP
            return self.security.generate_otp(user_id, purpose)
            
        except Exception as e:
            return {
                "success": False,
                "error": f"OTP generation failed: {str(e)}"
            }

    def verify_otp(self, user_id: str, otp_code: str, ip_address: str = None) -> Dict[str, Any]:
        """Verify OTP code with validation"""
        try:
            # 1. Input validation
            user_validation = self.validation.validate_user_id(user_id)
            if not user_validation["valid"]:
                return {
                    "success": False,
                    "error": f"Invalid user ID: {user_validation['error']}"
                }
            user_id = user_validation["sanitized"]
            
            otp_validation = self.validation.validate_otp(otp_code)
            if not otp_validation["valid"]:
                return {
                    "success": False,
                    "error": f"Invalid OTP: {otp_validation['error']}"
                }
            otp_code = otp_validation["sanitized"]
            
            # 2. Verify OTP
            result = self.security.verify_otp(user_id, otp_code)
            
            if not result.get("success", False):
                # Record failed attempt
                self.rate_limiting.record_failed_attempt(user_id, "otp_verify", ip_address)
            
            return result
            
        except Exception as e:
            return {
                "success": False,
                "error": f"OTP verification failed: {str(e)}"
            }

    def get_security_status(self, user_id: str) -> Dict[str, Any]:
        """Get user's security status"""
        return self.security.get_security_status(user_id)

    def reset_failed_attempts(self, user_id: str):
        """Reset failed authentication attempts"""
        self.security.reset_failed_attempts(user_id)

    # ============================================================================
    # REAL-TIME OPERATIONS (Consolidated from wallet_realtime_service)
    # ============================================================================

    async def connect_user_realtime(self, websocket, user_id: str, subscriptions: List[str]):
        """Connect user for real-time updates"""
        await self.realtime.connect_user(websocket, user_id, subscriptions)

    async def disconnect_user_realtime(self, websocket):
        """Disconnect user from real-time updates"""
        await self.realtime.disconnect_user(websocket)

    async def broadcast_wallet_update(self, user_id: str, update_type: str, data: Dict[str, Any]):
        """Broadcast wallet updates"""
        if update_type == "balance":
            await self.realtime.broadcast_balance_update(user_id, data)
        elif update_type == "transaction":
            await self.realtime.broadcast_transaction_update(user_id, data)
        elif update_type == "withdrawal":
            await self.realtime.broadcast_withdrawal_update(user_id, data)
        elif update_type == "security":
            await self.realtime.broadcast_security_alert(user_id, data)
        else:
            await self.realtime.broadcast_wallet_notification(user_id, data)

    async def subscribe_to_event(self, user_id: str, event_id: str):
        """Subscribe user to event updates"""
        await self.realtime.subscribe_to_event(user_id, event_id)

    async def get_connection_stats(self) -> Dict[str, Any]:
        """Get real-time connection statistics"""
        return await self.realtime.get_connection_stats()

    def get_user_connection_status(self, user_id: str) -> Dict[str, Any]:
        """Get user's connection status"""
        return self.realtime.get_user_connection_status(user_id)

    # ============================================================================
    # MULTI-WALLET FEATURES (Consolidated from multi_wallet_service)
    # ============================================================================

    def create_wallet(self, user_id: str, wallet_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new wallet for user"""
        try:
            wallet_type = wallet_data["type"]
            wallet_name = wallet_data.get("name", f"{wallet_type.title()} Wallet")
            
            # Validate wallet type
            if wallet_type not in [wt.value for wt in WalletType]:
                return {
                    "success": False,
                    "error": "Invalid wallet type"
                }
            
            # Check if user already has this wallet type
            if user_id in self.wallets and wallet_type in self.wallets[user_id]:
                return {
                    "success": False,
                    "error": f"User already has a {wallet_type} wallet"
                }
            
            # Initialize user wallets if not exists
            if user_id not in self.wallets:
                self.wallets[user_id] = {}
            
            # Create wallet
            current_time = get_current_timestamp()
            wallet = Wallet(
                id=create_wallet_id(),
                user_id=user_id,
                type=wallet_type,
                name=wallet_name,
                balance=0,
                currency="NGN",
                is_active=True,
                is_default=len(self.wallets[user_id]) == 0,
                created_at=current_time,
                updated_at=current_time,
                restrictions=WALLET_LIMITS.get(wallet_type, {}),
                metadata={
                    "last_transaction": None,
                    "total_transactions": 0,
                    "total_spent": 0,
                    "total_received": 0
                }
            )
            
            # Add type-specific fields
            if wallet_type == WalletType.SAVINGS:
                wallet.interest_rate = INTEREST_RATES[WalletType.SAVINGS]
                wallet.last_interest_calculation = current_time
                wallet.metadata["total_interest_earned"] = 0
                wallet.metadata["interest_payments"] = []
            elif wallet_type == WalletType.BUSINESS:
                wallet.business_info = wallet_data.get("business_info", {})
                wallet.metadata["revenue_tracking"] = True
                wallet.metadata["expense_tracking"] = True
            
            self.wallets[user_id][wallet_type] = wallet.dict()
            
            # Broadcast real-time update (skip in sync context)
            try:
                asyncio.create_task(self.realtime.broadcast_wallet_notification(user_id, {
                    "type": "wallet_created",
                    "wallet": wallet.dict()
                }))
            except RuntimeError:
                # No event loop running, skip real-time update
                pass
            
            return {
                "success": True,
                "message": f"{wallet_name} created successfully",
                "wallet": wallet.dict()
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to create wallet: {str(e)}"
            }

    def deactivate_wallet(self, user_id: str, wallet_type: WalletType) -> Dict[str, Any]:
        """Deactivate a wallet"""
        try:
            if user_id not in self.wallets or wallet_type not in self.wallets[user_id]:
                return {
                    "success": False,
                    "error": "Wallet not found"
                }
            
            wallet = self.wallets[user_id][wallet_type]
            
            # Cannot deactivate main wallet
            if wallet_type == WalletType.MAIN:
                return {
                    "success": False,
                    "error": "Cannot deactivate main wallet"
                }
            
            # Check if wallet has balance
            if wallet["balance"] > 0:
                return {
                    "success": False,
                    "error": "Cannot deactivate wallet with balance. Please transfer funds first."
                }
            
            wallet["is_active"] = False
            wallet["updated_at"] = get_current_timestamp()
            
            return {
                "success": True,
                "message": "Wallet deactivated successfully"
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to deactivate wallet: {str(e)}"
            }

    def set_default_wallet(self, user_id: str, wallet_type: WalletType) -> Dict[str, Any]:
        """Set default wallet for user"""
        try:
            if user_id not in self.wallets or wallet_type not in self.wallets[user_id]:
                return {
                    "success": False,
                    "error": "Wallet not found"
                }
            
            # Remove default from all wallets
            for wt, wallet in self.wallets[user_id].items():
                wallet["is_default"] = False
            
            # Set new default
            self.wallets[user_id][wallet_type]["is_default"] = True
            self.wallets[user_id][wallet_type]["updated_at"] = get_current_timestamp()
            
            return {
                "success": True,
                "message": f"{wallet_type.title()} wallet set as default"
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to set default wallet: {str(e)}"
            }

    def get_user_transactions(self, user_id: str, filters: Dict[str, Any] = None) -> Dict[str, Any]:
        """Get user's transaction history with filters"""
        try:
            if user_id not in self.user_transactions:
                return {
                    "success": True,
                    "data": {
                        "transactions": [],
                        "total": 0,
                        "limit": filters.get("limit", 50) if filters else 50,
                        "offset": filters.get("offset", 0) if filters else 0
                    }
                }
            
            transaction_ids = self.user_transactions[user_id]
            transactions = []
            
            for tx_id in transaction_ids:
                if tx_id in self.transactions:
                    transactions.append(self.transactions[tx_id])
            
            # Apply filters
            if filters:
                # Date range filter
                if "start_date" in filters:
                    transactions = [t for t in transactions if t["created_at"] >= filters["start_date"]]
                if "end_date" in filters:
                    transactions = [t for t in transactions if t["created_at"] <= filters["end_date"]]
                
                # Transaction type filter
                if "type" in filters:
                    transactions = [t for t in transactions if t["type"] == filters["type"]]
                
                # Amount range filter
                if "min_amount" in filters:
                    transactions = [t for t in transactions if t["amount"] >= filters["min_amount"]]
                if "max_amount" in filters:
                    transactions = [t for t in transactions if t["amount"] <= filters["max_amount"]]
            
            # Sort by creation time (newest first)
            transactions.sort(key=lambda x: x["created_at"], reverse=True)
            
            # Apply pagination
            limit = filters.get("limit", 50) if filters else 50
            offset = filters.get("offset", 0) if filters else 0
            total = len(transactions)
            paginated = transactions[offset:offset + limit]
            
            return {
                "success": True,
                "data": {
                    "transactions": paginated,
                    "total": total,
                    "limit": limit,
                    "offset": offset,
                    "has_more": offset + limit < total
                }
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to get transactions: {str(e)}"
            }

    def calculate_interest(self, user_id: str) -> Dict[str, Any]:
        """Calculate and apply interest to savings wallet"""
        try:
            if user_id not in self.wallets or WalletType.SAVINGS not in self.wallets[user_id]:
                return {
                    "success": False,
                    "error": "No savings wallet found"
                }
            
            savings_wallet = self.wallets[user_id][WalletType.SAVINGS]
            
            if not savings_wallet["is_active"] or savings_wallet["balance"] <= 0:
                return {
                    "success": False,
                    "error": "Savings wallet is inactive or has no balance"
                }
            
            current_time = get_current_timestamp()
            last_calculation = savings_wallet.get("last_interest_calculation", savings_wallet["created_at"])
            
            # Calculate time elapsed in days
            days_elapsed = (current_time - last_calculation) / (24 * 60 * 60)
            
            if days_elapsed < 1:
                return {
                    "success": False,
                    "error": "Interest can only be calculated once per day"
                }
            
            # Calculate interest
            annual_rate = savings_wallet.get("interest_rate", INTEREST_RATES[WalletType.SAVINGS])
            daily_rate = annual_rate / 365 / 100
            interest_amount = savings_wallet["balance"] * daily_rate * days_elapsed
            
            # Apply interest
            savings_wallet["balance"] += interest_amount
            savings_wallet["last_interest_calculation"] = current_time
            savings_wallet["updated_at"] = current_time
            
            # Update metadata
            savings_wallet["metadata"]["total_interest_earned"] = (
                savings_wallet["metadata"].get("total_interest_earned", 0) + interest_amount
            )
            
            if "interest_payments" not in savings_wallet["metadata"]:
                savings_wallet["metadata"]["interest_payments"] = []
            
            savings_wallet["metadata"]["interest_payments"].append({
                "amount": interest_amount,
                "date": current_time,
                "days": days_elapsed,
                "rate": annual_rate
            })
            
            # Create transaction record
            transaction_id = self.create_transaction({
                "user_id": user_id,
                "wallet_id": savings_wallet["id"],
                "type": TransactionType.INTEREST,
                "amount": interest_amount,
                "description": f"Interest payment ({annual_rate}% APY)",
                "status": TransactionStatus.COMPLETED,
                "metadata": {
                    "wallet_type": WalletType.SAVINGS,
                    "days_elapsed": days_elapsed,
                    "interest_rate": annual_rate
                }
            })
            
            # Broadcast real-time update (skip in sync context)
            try:
                asyncio.create_task(self.realtime.broadcast_balance_update(user_id, {
                    "wallet_type": WalletType.SAVINGS,
                    "new_balance": savings_wallet["balance"],
                    "interest_earned": interest_amount,
                    "transaction_id": transaction_id
                }))
            except RuntimeError:
                # No event loop running, skip real-time update
                pass
            
            return {
                "success": True,
                "message": "Interest calculated and applied",
                "data": {
                    "interest_amount": interest_amount,
                    "new_balance": savings_wallet["balance"],
                    "days_elapsed": days_elapsed,
                    "annual_rate": annual_rate,
                    "transaction_id": transaction_id
                }
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to calculate interest: {str(e)}"
            }

    def _calculate_next_interest_payment(self, wallet: Dict[str, Any]) -> Optional[float]:
        """Calculate when next interest payment is due"""
        if wallet["type"] != WalletType.SAVINGS or not wallet["is_active"]:
            return None
        
        last_calculation = wallet.get("last_interest_calculation", wallet["created_at"])
        next_payment = last_calculation + (24 * 60 * 60)  # Next day
        
        return next_payment

    # ============================================================================
    # ANALYTICS OPERATIONS (Consolidated from analytics)
    # ============================================================================

    def get_wallet_analytics(self, user_id: str) -> Dict[str, Any]:
        """Get comprehensive wallet analytics"""
        return self.analytics.get_wallet_analytics(user_id)

    def get_spending_analytics(self, user_id: str, period: str = "month") -> Dict[str, Any]:
        """Get spending analytics for period"""
        return self.analytics.get_spending_analytics(user_id, period)

    def get_savings_insights(self, user_id: str) -> Dict[str, Any]:
        """Get savings insights and recommendations"""
        return self.analytics.get_savings_insights(user_id)

    def get_financial_health_score(self, user_id: str) -> Dict[str, Any]:
        """Get user's financial health score"""
        return self.analytics.get_financial_health_score(user_id)

    def export_analytics_data(self, user_id: str, format: str = "json") -> Dict[str, Any]:
        """Export analytics data"""
        return self.analytics.export_analytics_data(user_id, format)

    # ============================================================================
    # PERFORMANCE AND OPTIMIZATION OPERATIONS
    # ============================================================================

    def get_performance_stats(self) -> Dict[str, Any]:
        """Get performance statistics"""
        return {
            "performance": self.performance.get_performance_stats(),
            "cache": self.performance.get_cache_stats(),
            "rate_limiting": self.rate_limiting.get_statistics()
        }

    def cleanup_expired_data(self):
        """Clean up expired data for performance"""
        self.performance.cleanup_expired_cache()
        self.rate_limiting.cleanup_expired_data()

    def get_rate_limit_status(self, user_id: str, ip_address: str = None) -> Dict[str, Any]:
        """Get rate limit status for user"""
        return self.rate_limiting.get_rate_limit_status(user_id, ip_address)

    def block_user(self, user_id: str, permanent: bool = False):
        """Block a user from making requests"""
        if permanent:
            self.rate_limiting.block_user_permanently(user_id)
        else:
            self.rate_limiting._block_entity(user_id, "user", 3600)  # 1 hour temporary block

    def unblock_user(self, user_id: str):
        """Unblock a user"""
        self.rate_limiting.unblock_user(user_id)

    def validate_input_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate input data for security"""
        if "transaction_data" in data:
            return self.validation.validate_transaction_data(data["transaction_data"])
        elif "batch_operations" in data:
            return self.validation.validate_batch_operations(data["batch_operations"])
        else:
            # Generic validation
            sanitized = {}
            errors = []
            
            for key, value in data.items():
                if key == "user_id":
                    result = self.validation.validate_user_id(value)
                elif key == "amount":
                    result = self.validation.validate_amount(value)
                elif key == "description":
                    result = self.validation.validate_description(value)
                elif key == "pin":
                    result = self.validation.validate_pin(value)
                elif key == "otp":
                    result = self.validation.validate_otp(value)
                else:
                    # Basic sanitization for unknown fields
                    if isinstance(value, str):
                        sanitized[key] = self.validation._sanitize_text(value)
                    else:
                        sanitized[key] = value
                    continue
                
                if result["valid"]:
                    sanitized[key] = result["sanitized"]
                else:
                    errors.append(f"{key}: {result['error']}")
            
            if errors:
                return {"valid": False, "errors": errors}
            
            return {"valid": True, "sanitized_data": sanitized}

    # ============================================================================
    # UTILITY AND MAINTENANCE OPERATIONS
    # ============================================================================

    def get_service_status(self) -> Dict[str, Any]:
        """Get unified wallet service status"""
        return {
            "service": "UnifiedWalletService",
            "status": "active",
            "version": "2.0.0-optimized",
            "modules": {
                "security": "active",
                "realtime": "active", 
                "withdrawals": "active",
                "analytics": "active",
                "performance": "active",
                "validation": "active",
                "rate_limiting": "active"
            },
            "statistics": {
                "total_users": len(self.wallets),
                "total_wallets": sum(len(wallets) for wallets in self.wallets.values()),
                "total_transactions": len(self.transactions),
                "active_connections": len(self.realtime.active_connections)
            },
            "performance": self.performance.get_performance_stats(),
            "security": {
                "blocked_users": len(self.rate_limiting.blocked_users),
                "blocked_ips": len(self.rate_limiting.blocked_ips),
                "cache_hit_ratio": self.performance._calculate_cache_hit_ratio()
            },
            "timestamp": get_current_timestamp()
        }

    def clear_user_data(self, user_id: str):
        """Clear all data for a user (for testing/cleanup)"""
        # Clear wallet data
        self.wallets.pop(user_id, None)
        
        # Clear transaction data
        if user_id in self.user_transactions:
            transaction_ids = self.user_transactions[user_id]
            for tx_id in transaction_ids:
                self.transactions.pop(tx_id, None)
            del self.user_transactions[user_id]
        
        # Clear multi-wallet features
        self.auto_save_rules.pop(user_id, None)
        self.savings_goals.pop(user_id, None)
        
        # Clear module data
        self.security.clear_user_security_data(user_id)
        self.realtime.clear_user_data(user_id)
        self.withdrawals.clear_user_data(user_id)
        
        # Clear optimization module data
        self.performance.invalidate_user_cache(user_id)
        self.rate_limiting.unblock_user(user_id)

    def backup_user_data(self, user_id: str) -> Dict[str, Any]:
        """Backup all user data"""
        backup = {
            "user_id": user_id,
            "wallets": self.wallets.get(user_id, {}),
            "transactions": [],
            "auto_save_rules": self.auto_save_rules.get(user_id, []),
            "savings_goals": self.savings_goals.get(user_id, []),
            "backup_timestamp": get_current_timestamp()
        }
        
        # Get user transactions
        if user_id in self.user_transactions:
            for tx_id in self.user_transactions[user_id]:
                if tx_id in self.transactions:
                    backup["transactions"].append(self.transactions[tx_id])
        
        return backup

    def restore_user_data(self, backup_data: Dict[str, Any]) -> Dict[str, Any]:
        """Restore user data from backup"""
        try:
            user_id = backup_data["user_id"]
            
            # Restore wallets
            if "wallets" in backup_data:
                self.wallets[user_id] = backup_data["wallets"]
            
            # Restore transactions
            if "transactions" in backup_data:
                if user_id not in self.user_transactions:
                    self.user_transactions[user_id] = []
                
                for transaction in backup_data["transactions"]:
                    tx_id = transaction["id"]
                    self.transactions[tx_id] = transaction
                    if tx_id not in self.user_transactions[user_id]:
                        self.user_transactions[user_id].append(tx_id)
            
            # Restore multi-wallet features
            if "auto_save_rules" in backup_data:
                self.auto_save_rules[user_id] = backup_data["auto_save_rules"]
            
            if "savings_goals" in backup_data:
                self.savings_goals[user_id] = backup_data["savings_goals"]
            
            return {
                "success": True,
                "message": "User data restored successfully",
                "restored_at": get_current_timestamp()
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to restore user data: {str(e)}"
            }

# Global instance (will be replaced with dependency injection)
unified_wallet_service = UnifiedWalletService()